import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Composite endpoint for the Family Dashboard view.
 * One request → one response with everything the dashboard needs.
 *
 * Why: minimizes round trips, reduces P95 latency.
 * Tradeoff: returns a larger payload. Acceptable at pilot scale.
 *
 * RLS gates every individual query — auth.uid() is enforced by Supabase.
 */
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('parent_user_id', user.id)
    .single();

  if (!patient) return NextResponse.json({ error: 'No patient record' }, { status: 404 });

  // Parallel queries
  const [
    nextSession,
    weekSessions,
    atecHistory,
    devices,
    supplements,
    todaysLogs,
    documents,
    concierge,
    clinician
  ] = await Promise.all([
    supabase.from('sessions').select('*').eq('patient_id', patient.id).eq('status', 'scheduled').gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(1).maybeSingle(),
    supabase.from('sessions').select('*').eq('patient_id', patient.id).gte('scheduled_at', startOfWeek()).lt('scheduled_at', endOfWeek()),
    supabase.from('atec_assessments').select('*').eq('patient_id', patient.id).order('assessment_date', { ascending: false }).limit(10),
    supabase.from('devices').select('*').eq('patient_id', patient.id),
    supabase.from('supplement_protocols').select('*').eq('patient_id', patient.id).eq('active', true),
    supabase.from('supplement_logs').select('*').eq('patient_id', patient.id).eq('taken_date', today()),
    supabase.from('documents').select('*').eq('patient_id', patient.id).eq('parent_visible', true).order('generated_at', { ascending: false }),
    patient.concierge_user_id
      ? supabase.from('profiles').select('first_name, last_name, last_active_at').eq('id', patient.concierge_user_id).single()
      : Promise.resolve({ data: null }),
    patient.clinician_user_id
      ? supabase.from('profiles').select('first_name, last_name, credentials').eq('id', patient.clinician_user_id).single()
      : Promise.resolve({ data: null })
  ]);

  return NextResponse.json({
    patient,
    next_session: nextSession.data,
    week_sessions: weekSessions.data ?? [],
    atec_history: atecHistory.data ?? [],
    devices: devices.data ?? [],
    supplements: supplements.data ?? [],
    todays_logs: todaysLogs.data ?? [],
    documents: documents.data ?? [],
    concierge: concierge.data,
    clinician: clinician.data
  });
}

function today() { return new Date().toISOString().split('T')[0]; }
function startOfWeek() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}
function endOfWeek() {
  const d = new Date(startOfWeek());
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}
