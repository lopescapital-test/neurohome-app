/**
 * Placeholder types matching the v1 schema.
 *
 * Replace with auto-generated types once Supabase project is set up:
 *   npx supabase gen types typescript --project-id <id> > lib/types/database.ts
 */

export type UserRole = 'parent' | 'clinician' | 'concierge' | 'md' | 'admin';
export type ProgramTier = 'foundation' | 'accelerated' | 'immersive' | 'continuing_care';
export type ProgramPhase = 'onboarding' | 'phase_1' | 'phase_2' | 'phase_3' | 'continuing_care' | 'graduated';
export type PatientStatus = 'onboarding' | 'active' | 'paused' | 'graduated' | 'withdrawn';
export type AssessmentType = 'baseline' | 'weekly_check' | 'mid_check' | 'final' | 'monthly_cc';
export type SoapStatus = 'draft' | 'signed';
export type SessionType = 'zoom_session' | 'home_day' | 'atec_check' | 'concierge_call' | 'discovery';
export type SessionStatus = 'scheduled' | 'completed' | 'missed' | 'rescheduled' | 'cancelled';
export type ExerciseCategory = 'brainstem' | 'vestibular' | 'cortex' | 'reflex' | 'laser' | 'oculomotor';
export type SupplementTiming = 'am' | 'midday' | 'pm' | 'with_food' | 'before_bed';
export type DeviceType = 'laser_pbm' | 'sound_therapy' | 'supplements_kit' | 'lab_kit' | 'reflex_kit';
export type DeviceStatus = 'connected' | 'low' | 'offline' | 'shipped' | 'pending' | 'returned';
export type DocumentType = 'intake_packet' | 'baseline_atec_report' | 'week_summary' | 'mid_check_report' | 'final_report' | 'soap_signed' | 'lab_result';
export type DocumentStatus = 'pending' | 'ready' | 'signed' | 'archived';

export interface Profile {
  id: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  credentials: string | null;
  ghl_contact_id: string | null;
  ghl_user_id: string | null;
  phone: string | null;
  timezone: string;
  last_active_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Patient {
  id: string;
  parent_user_id: string;
  ghl_contact_id: string;
  first_name: string;
  last_name_initial: string | null;
  age: number;
  program_tier: ProgramTier;
  phase: ProgramPhase;
  week_current: number;
  week_total: number;
  program_start_date: string | null;
  clinician_user_id: string | null;
  concierge_user_id: string | null;
  status: PatientStatus;
  created_at: string;
  updated_at: string;
}

export interface ATECAssessment {
  id: string;
  patient_id: string;
  assessment_date: string;
  assessment_type: AssessmentType;
  week_number: number;
  speech_score: number;
  sociability_score: number;
  sensory_score: number;
  health_score: number;
  total_score: number;
  administered_by_user_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  patient_id: string;
  ghl_appointment_id: string | null;
  session_type: SessionType;
  scheduled_at: string;
  duration_min: number;
  clinician_user_id: string | null;
  concierge_user_id: string | null;
  zoom_link: string | null;
  zoom_meeting_id: string | null;
  status: SessionStatus;
  week_number: number | null;
}
