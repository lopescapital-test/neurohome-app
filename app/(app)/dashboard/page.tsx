import { createClient } from '@/lib/supabase/server';
import { NextSessionCard } from '@/components/family/NextSessionCard';
import { ProgressRing } from '@/components/family/ProgressRing';
import { ATECSparkline } from '@/components/family/ATECSparkline';
import { ConciergeCard } from '@/components/family/ConciergeCard';
import { HubLaunchCard } from '@/components/family/HubLaunchCard';
import { WeekSchedule } from '@/components/family/WeekSchedule';
import { TodaysProtocol } from '@/components/family/TodaysProtocol';
import { FamilyResourcesNav } from '@/components/family/FamilyResourcesNav';

// Maps the program_tier enum to a display label
function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    plan_a_full: 'Plan A · Full Intensive',
    plan_b_lite: 'Plan B · Lite Intensive',
    pre_intensive: 'Pre-Intensive',
  };
  return map[tier] ?? tier.replace(/_/g, ' ');
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('parent_user_id', user!.id)
    .single();

  if (!patient) {
    return (
      <main style={{ padding: 32 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, marginBottom: 8 }}>No patient record found</h1>
        <p style={{ fontSize: 14, color: 'var(--text-3)' }}>
          If you just enrolled, check back in a few minutes. Otherwise contact your concierge.
        </p>
      </main>
    );
  }

  const { data: nextSession } = await supabase
    .from('sessions')
    .select(`
      *,
      clinician:profiles!sessions_clinician_user_id_fkey ( first_name, last_name, credentials ),
      concierge:profiles!sessions_concierge_user_id_fkey ( first_name, last_name )
    `)
    .eq('patient_id', patient.id)
    .eq('status', 'scheduled')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: atecHistory } = await supabase
    .from('atec_assessments')
    .select('id, assessment_date, total_score, assessment_type')
    .eq('patient_id', patient.id)
    .order('assessment_date', { ascending: true });

  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data: concierge } = patient.concierge_user_id
    ? await supabase
        .from('profiles')
        .select('first_name, last_name, last_active_at')
        .eq('id', patient.concierge_user_id)
        .single()
    : { data: null };

  const { data: latestConciergeMsg } = patient.concierge_user_id
    ? await supabase
        .from('messages')
        .select('body, sent_at')
        .eq('sender_user_id', patient.concierge_user_id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  // Week schedule sessions
  const { data: weekSessions } = await supabase
    .from('sessions')
    .select('id, session_type, scheduled_at, duration_min')
    .eq('patient_id', patient.id)
    .gte('scheduled_at', weekStart.toISOString())
    .lt('scheduled_at', weekEnd.toISOString())
    .order('scheduled_at', { ascending: true });

  return (
    <main style={{ padding: '32px max(32px, calc((100vw - 1320px) / 2))', minHeight: 'calc(100vh - 64px)' }}>
      <header style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 800, letterSpacing: '-0.8px', marginBottom: 6 }}>
          Welcome back 👋
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
          <strong style={{ color: 'var(--text-2)' }}>{patient.first_name}</strong> is in{' '}
          <strong style={{ color: 'var(--text-2)' }}>Week {patient.week_current} of {patient.week_total}</strong> ·{' '}
          {tierLabel(patient.program_tier)}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {nextSession && <NextSessionCard session={nextSession} />}
        <ConciergeCard
          concierge={concierge}
          latestMessage={latestConciergeMsg}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ATECSparkline history={atecHistory ?? []} />
        <ProgressRing
          weekCurrent={patient.week_current}
          weekTotal={patient.week_total}
          tier={patient.program_tier}
          phase={patient.phase}
        />
        <HubLaunchCard tierLabel={tierLabel(patient.program_tier)} weekCurrent={patient.week_current} />
      </div>

      <div style={{ marginBottom: 16 }}>
        <WeekSchedule
          sessions={weekSessions ?? []}
          weekStart={weekStart}
          tier={patient.program_tier}
          phase={patient.phase}
        />
      </div>

      <TodaysProtocol patientId={patient.id} />

      <div style={{ marginTop: 16 }}>
        <FamilyResourcesNav />
      </div>
    </main>
  );
}