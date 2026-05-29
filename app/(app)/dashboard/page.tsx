import { createClient } from '@/lib/supabase/server';
import { NextSessionCard } from '@/components/family/NextSessionCard';
import { ProgressRing } from '@/components/family/ProgressRing';
import { ATECSparkline } from '@/components/family/ATECSparkline';
import { DeviceCompliance } from '@/components/family/DeviceCompliance';
import { ConciergeCard } from '@/components/family/ConciergeCard';
import { WeekSchedule } from '@/components/family/WeekSchedule';

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

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { count: completedThisWeek } = await supabase
    .from('exercise_completions')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patient.id)
    .eq('completed', true)
    .gte('completed_date', sevenDaysAgo.toISOString().split('T')[0]);

  const { count: assignmentCount } = await supabase
    .from('exercise_assignments')
    .select('*', { count: 'exact', head: true })
    .eq('patient_id', patient.id)
    .eq('active', true);

  const totalThisWeek = (assignmentCount ?? 0) * 7;

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
          <strong style={{ color: 'var(--text-2)' }}>Week {patient.week_current}</strong> ·{' '}
          {patient.program_tier} · {patient.phase.replace(/_/g, ' ')}
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {nextSession && <NextSessionCard session={nextSession} />}
        <ProgressRing
          weekCurrent={patient.week_current}
          weekTotal={patient.week_total}
          tier={patient.program_tier}
          phase={patient.phase}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
        <ATECSparkline history={atecHistory ?? []} />
        <DeviceCompliance
          completedThisWeek={completedThisWeek ?? 0}
          totalThisWeek={totalThisWeek}
        />
        <ConciergeCard
          concierge={concierge}
          latestMessage={latestConciergeMsg}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <WeekSchedule
          sessions={weekSessions ?? []}
          weekStart={weekStart}
          tier={patient.program_tier}
          phase={patient.phase}
        />
      </div>

      <div style={{ marginTop: 24, padding: 24, background: 'var(--bg-card)', border: '1px dashed var(--border-hover)', borderRadius: 18, color: 'var(--text-3)', fontSize: 13, lineHeight: 1.6 }}>
        <strong style={{ color: 'var(--text)' }}>Scaffold note:</strong> remaining sections to port from{' '}
        <code style={{ background: 'var(--bg-warm)', padding: '2px 6px', borderRadius: 4 }}>family_dashboard_v6.html</code>:{' '}
        Supplement Tracker · Documents · Resources.
      </div>
    </main>
  );
}