import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Program schedule generator.
 *
 * Generates the full set of `sessions` rows for a patient's 8-week program,
 * based on their program_tier. Source of truth for the weekly patterns is
 * the NeuroHome Plans & Kits doc (v2.2.0) calendar views.
 *
 * Design notes:
 * - Concierge-led live blocks map to session_type 'zoom_session'.
 * - OT/PT and MD touchpoints ride on the SAME day's session row via
 *   clinician_user_id (they don't get their own row).
 * - zoom_link is left null; GHL populates it later.
 * - Default start time is 3:30 PM. TIMEZONE DEBT: patients table has no tz
 *   column, so all times are generated in the server/local tz. Treat as ET
 *   until a per-patient tz is added.
 * - Generation must run with a SERVICE-ROLE client. RLS blocks parent inserts
 *   on sessions by design.
 */

export type ProgramTier = 'plan_a_full' | 'plan_b_lite' | 'pre_intensive';

type SessionType =
  | 'zoom_session'
  | 'home_day'
  | 'atec_check'
  | 'concierge_call'
  | 'discovery';

// Weekday index: 0=Mon ... 4=Fri (we never schedule Sat/Sun).
type Weekday = 0 | 1 | 2 | 3 | 4;

type DaySpec = {
  weekday: Weekday;
  sessionType: SessionType;
  durationMin: number;
  hasOtPt: boolean; // attach clinician (OT/PT) to this day
  hasMd: boolean;   // attach MD to this day
};

type WeekSpec = { week: number; days: DaySpec[] };

const DEFAULT_HOUR = 15; // 3:30 PM
const DEFAULT_MIN = 30;

// ---- helpers to build a day spec compactly -------------------------------

const zoom = (weekday: Weekday, opts: { ot?: boolean; md?: boolean; dur?: number } = {}): DaySpec => ({
  weekday,
  sessionType: 'zoom_session',
  durationMin: opts.dur ?? 120,
  hasOtPt: !!opts.ot,
  hasMd: !!opts.md,
});

// Pre-Intensive concierge check-ins are short calls, not 2-hr blocks.
const call = (weekday: Weekday, opts: { ot?: boolean; md?: boolean } = {}): DaySpec => ({
  weekday,
  sessionType: 'concierge_call',
  durationMin: 30,
  hasOtPt: !!opts.ot,
  hasMd: !!opts.md,
});

// A Friday that is ONLY an OT/PT or MD touchpoint (no concierge block that day).
const touchpoint = (weekday: Weekday, opts: { ot?: boolean; md?: boolean }): DaySpec => ({
  weekday,
  sessionType: 'concierge_call',
  durationMin: 30,
  hasOtPt: !!opts.ot,
  hasMd: !!opts.md,
});

// ---- the three tier patterns (from Plans & Kits v2.2.0 calendars) --------

// Mon=0 Tue=1 Wed=2 Thu=3 Fri=4
const PLAN_A: WeekSpec[] = [
  { week: 1, days: [zoom(0), zoom(1), zoom(2), zoom(3), zoom(4, { ot: true })] },
  { week: 2, days: [zoom(0), zoom(1), zoom(2), zoom(3), zoom(4, { ot: true })] },
  { week: 3, days: [zoom(0), zoom(1), zoom(2), zoom(3), zoom(4, { ot: true })] },
  { week: 4, days: [zoom(0), zoom(1), zoom(2), zoom(3), zoom(4, { ot: true, md: true })] },
  { week: 5, days: [zoom(0), zoom(1), zoom(3), zoom(4, { ot: true })] },
  { week: 6, days: [zoom(0), zoom(1), zoom(3), zoom(4, { ot: true })] },
  { week: 7, days: [zoom(0), zoom(2), zoom(4, { ot: true })] },
  { week: 8, days: [zoom(0), zoom(2), zoom(4, { ot: true, md: true })] },
];

const PLAN_B: WeekSpec[] = [
  { week: 1, days: [zoom(0), zoom(1), zoom(2), zoom(3), zoom(4)] },
  { week: 2, days: [zoom(0), zoom(1), zoom(2), zoom(3), touchpoint(4, { ot: true })] },
  { week: 3, days: [zoom(1), zoom(3)] },
  { week: 4, days: [zoom(1), zoom(3), touchpoint(4, { ot: true })] },
  { week: 5, days: [zoom(1), zoom(3)] },
  { week: 6, days: [zoom(1), zoom(3), touchpoint(4, { ot: true })] },
  { week: 7, days: [zoom(1, { dur: 60 }), zoom(3, { dur: 60 })] },
  { week: 8, days: [zoom(1, { dur: 60 }), zoom(3, { dur: 60 }), touchpoint(4, { ot: true })] },
];

const PRE_INTENSIVE: WeekSpec[] = [
  { week: 1, days: [call(0), call(2), call(4)] },
  { week: 2, days: [call(0), call(2), call(4, { ot: true })] },
  { week: 3, days: [call(1), call(3)] },
  { week: 4, days: [call(1), call(3)] },
  { week: 5, days: [call(1), call(3), touchpoint(4, { md: true })] },
  { week: 6, days: [call(1), call(3)] },
  { week: 7, days: [call(0), call(2), call(4)] },
  { week: 8, days: [call(0), call(2), call(4, { ot: true })] },
];

const PATTERNS: Record<ProgramTier, WeekSpec[]> = {
  plan_a_full: PLAN_A,
  plan_b_lite: PLAN_B,
  pre_intensive: PRE_INTENSIVE,
};

// ---- date math -----------------------------------------------------------

/** Returns the Monday on/before the given date, at 00:00 local. */
function mondayOf(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift back to Monday
  d.setDate(d.getDate() + diff);
  return d;
}

/** scheduled_at for a given program week (1-based) and weekday (0=Mon). */
function scheduledAt(programStart: Date, week: number, weekday: Weekday): Date {
  const week1Monday = mondayOf(programStart);
  const d = new Date(week1Monday);
  d.setDate(d.getDate() + (week - 1) * 7 + weekday);
  d.setHours(DEFAULT_HOUR, DEFAULT_MIN, 0, 0);
  return d;
}

// ---- row shape -----------------------------------------------------------

export type GeneratedSession = {
  patient_id: string;
  session_type: SessionType;
  scheduled_at: string; // ISO
  duration_min: number;
  clinician_user_id: string | null; // OT/PT or MD on this day
  concierge_user_id: string | null;
  status: 'scheduled';
  week_number: number;
  zoom_link: null;
};

/**
 * Pure function: tier + start date + care-team ids -> session rows.
 * No DB access — fully testable.
 */
export function buildSchedule(
  patientId: string,
  tier: ProgramTier,
  programStartDate: string,
  careTeam: { conciergeUserId: string | null; clinicianUserId: string | null },
): GeneratedSession[] {
  const pattern = PATTERNS[tier];
  if (!pattern) throw new Error(`Unknown program_tier: ${tier}`);

  const start = new Date(programStartDate);
  if (isNaN(start.getTime())) throw new Error(`Invalid programStartDate: ${programStartDate}`);

  const rows: GeneratedSession[] = [];
  for (const wk of pattern) {
    for (const day of wk.days) {
      rows.push({
        patient_id: patientId,
        session_type: day.sessionType,
        scheduled_at: scheduledAt(start, wk.week, day.weekday).toISOString(),
        duration_min: day.durationMin,
        clinician_user_id: day.hasOtPt || day.hasMd ? careTeam.clinicianUserId : null,
        concierge_user_id:
          day.sessionType === 'zoom_session' || day.sessionType === 'concierge_call'
            ? careTeam.conciergeUserId
            : null,
        status: 'scheduled',
        week_number: wk.week,
        zoom_link: null,
      });
    }
  }
  return rows;
}

/**
 * Generates and inserts the schedule for a patient.
 * MUST be called with a service-role Supabase client (RLS blocks parent inserts).
 *
 * Reads the patient's tier, start date, and care team, builds the rows,
 * and inserts them. Returns the inserted count.
 *
 * Safe to call once per enrollment. If sessions already exist for the patient,
 * pass `force: true` only if you intend to duplicate — there is no dedupe here.
 */
export async function generateProgramSchedule(
  supabase: SupabaseClient,
  patientId: string,
): Promise<{ inserted: number }> {
  const { data: patient, error: pErr } = await supabase
    .from('patients')
    .select('id, program_tier, program_start_date, concierge_user_id, clinician_user_id')
    .eq('id', patientId)
    .single();

  if (pErr || !patient) throw new Error(`Patient not found: ${patientId}`);
  if (!patient.program_start_date) {
    throw new Error(`Patient ${patientId} has no program_start_date; set it before generating.`);
  }

  // Dedupe guard: never double-generate. If this patient already has any
  // sessions, refuse rather than duplicate the whole 8-week schedule.
  const { count: existing } = await supabase
    .from('sessions')
    .select('id', { count: 'exact', head: true })
    .eq('patient_id', patientId);

  if ((existing ?? 0) > 0) {
    throw new Error(
      `Patient ${patientId} already has ${existing} session(s); refusing to regenerate. ` +
      `Delete existing sessions first if you intend to rebuild.`,
    );
  }

  const rows = buildSchedule(
    patient.id,
    patient.program_tier as ProgramTier,
    patient.program_start_date,
    {
      conciergeUserId: patient.concierge_user_id ?? null,
      clinicianUserId: patient.clinician_user_id ?? null,
    },
  );

  const { error: insErr, count } = await supabase
    .from('sessions')
    .insert(rows, { count: 'exact' });

  if (insErr) throw new Error(`Failed to insert sessions: ${insErr.message}`);

  return { inserted: count ?? rows.length };
}
