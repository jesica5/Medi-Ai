export type AcuityCategory = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type TriageStatus = 'PENDING_REVIEW' | 'CONFIRMED' | 'OVERRIDDEN' | 'DISCHARGED';

export interface Patient {
  id: string;
  mrn_hash: string;
  display_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  primary_language: 'en' | 'ta';
  medical_history?: string[];
  allergies?: string[];
  created_at: string;
  updated_at: string;
}

export interface VitalSigns {
  id: string;
  patient_id: string;
  heart_rate: number | null; // 20 - 300 bpm
  respiratory_rate: number | null; // 4 - 80 bpm
  systolic_bp: number | null; // 40 - 300 mmHg
  diastolic_bp: number | null; // 20 - 200 mmHg
  oxygen_saturation: number | null; // 40.0 - 100.0 %
  temperature_celsius: number | null; // 30.0 - 45.0 °C
  capillary_blood_glucose: number | null; // mg/dL
  recorded_by: string;
  recorded_at: string;
}

export interface ShapFeatureAttribution {
  feature: string;
  contribution_percent: number;
  direction: 'positive' | 'negative';
  description: string;
}

export interface ExplainabilityPayload {
  top_risk_drivers: ShapFeatureAttribution[];
  model_version: string;
  latency_ms: number;
  missing_vitals_warning?: boolean;
  missing_vitals_list?: string[];
}

export interface TriageAssessment {
  id: string;
  patient_id: string;
  vital_id: string;
  chief_complaint: string;
  symptom_vector: Record<string, boolean | string | number>;
  calculated_risk_score: number; // 0 - 100
  calculated_category: AcuityCategory;
  hard_red_flag_triggered: boolean;
  red_flag_details: string[];
  confidence_score: number; // 0.00 - 1.00
  explainability_payload: ExplainabilityPayload;
  status: TriageStatus;
  created_at: string;

  // Joined entity details for UI rendering
  patient?: Patient;
  vitals?: VitalSigns;
  vitals_history?: VitalSigns[];
}

export interface TriageReview {
  id: string;
  assessment_id: string;
  doctor_id: string;
  doctor_name?: string;
  original_category: AcuityCategory;
  final_category: AcuityCategory;
  is_overridden: boolean;
  override_reason?: string;
  clinical_notes?: string;
  reviewed_at: string;
}

export interface MedicationRecord {
  id: string;
  patient_id: string;
  medication_name: string;
  reported_dosage: string;
  frequency: string;
  route?: string;
  status: 'ACTIVE' | 'RECONCILED' | 'DISCONTINUED';
  reconciliation_notes?: string;
  reconciled_by?: string;
  updated_at: string;
}

// -------------------------------------------------------------
// MODULE M4 EXTENSIONS (Smart Triage Engine & Decision Support)
// -------------------------------------------------------------

export type AssessmentStatus = TriageStatus;
export type TriageUserRole = 'patient' | 'nurse' | 'doctor' | 'admin';

export interface VitalSignsInput {
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  oxygen_saturation?: number | null;
  temperature_celsius?: number | null;
  capillary_blood_glucose?: number | null;
  room_air?: boolean;
}

export interface SymptomVector {
  // Sepsis / Infection
  altered_mentation?: boolean;
  rigors?: boolean;
  diaphoresis?: boolean;

  // Respiratory
  cyanosis?: boolean;
  audible_stridor?: boolean;
  accessory_muscle_use?: boolean;

  // Cardiac
  retrosternal_chest_pain?: boolean;
  pain_radiating_jaw_left_arm?: boolean;
  syncope_with_chest_pressure?: boolean;

  // Neurological
  facial_droop?: boolean;
  arm_drift?: boolean;
  slurred_speech?: boolean;
  gcs_score?: number;
  status_epilepticus?: boolean;

  // Blood Pressure / End-Organ
  hypertensive_headache_or_chest_pain?: boolean;

  // Diabetes
  altered_consciousness?: boolean;
  ketotic_breathing?: boolean;

  // GI
  massive_hematemesis?: boolean;
  involuntary_abdominal_guarding?: boolean;
  melena_present?: boolean;
  hemodynamic_instability?: boolean;

  // Trauma
  pulsatile_arterial_hemorrhage?: boolean;
  flail_chest?: boolean;
  suspected_acute_spinal_cord_injury?: boolean;
  traumatic_amputation?: boolean;

  // Pregnancy
  gestational_age_weeks?: number;
  third_trimester_vaginal_hemorrhage?: boolean;
  severe_epigastric_pain_with_aura?: boolean;
  eclamptic_convulsions?: boolean;

  // Allergy
  angioedema_tongue_pharynx?: boolean;
  acute_stridor?: boolean;
  wheezing_present?: boolean;
  systemic_hypotension?: boolean;

  // Dehydration
  anuria_over_12h?: boolean;
  severe_skin_tenting?: boolean;
  cold_extremities?: boolean;
  capillary_refill_seconds?: number;

  // Multi-System / Toxic
  sludge_signs?: boolean;
  venomous_bite_with_ptosis?: boolean;
}

export interface RedFlagDetail {
  domain: string;
  ruleCode: string;
  observed: string;
  threshold: string;
}

export interface RedFlagEvaluationResult {
  hardRedFlagTriggered: boolean;
  flags: RedFlagDetail[];
}

export interface PriorityMapping {
  category: AcuityCategory;
  priorityLabel: string;
  priorityCode: 'P1' | 'P2' | 'P3' | 'P4';
  colorHex: string;
  timeGuidance: string;
  targetResponseMinutes: number;
}

export interface TriageExplainabilityPayload {
  rule_engine: boolean;
  reason: string;
  triggered_flags?: RedFlagDetail[];
  top_risk_drivers?: Array<{ feature: string; weight: number }>;
}

export interface TriageAssessmentRecord {
  id: string;
  patient_id: string;
  vital_id?: string | null;
  chief_complaint: string;
  symptom_vector: SymptomVector;
  calculated_risk_score: number;
  calculated_category: AcuityCategory;
  hard_red_flag_triggered: boolean;
  red_flag_details: string[];
  confidence_score: number;
  explainability_payload: TriageExplainabilityPayload;
  status: AssessmentStatus;
  created_at: string;
}

export interface DoctorOverrideRequest {
  assessment_id: string;
  final_category: AcuityCategory;
  override_reason: string;
  clinical_notes?: string;
}

export interface TriageReviewRecord {
  id: string;
  assessment_id: string;
  doctor_id: string;
  original_category: AcuityCategory;
  final_category: AcuityCategory;
  is_overridden: boolean;
  override_reason?: string | null;
  clinical_notes?: string | null;
  reviewed_at: string;
}

export type AuditEventType =
  | 'TRIAGE_ASSESSMENT_CREATED'
  | 'RED_FLAG_TRIGGERED'
  | 'ALERT_DISPATCHED'
  | 'ALERT_DISPATCH_FAILED'
  | 'DOCTOR_OVERRIDE_SUBMITTED'
  | 'DOCTOR_ASSESSMENT_CONFIRMED';

export interface AuditLogPayload {
  event_name: string;
  actor_role: TriageUserRole;
  details: Record<string, unknown>;
  _hash: string;
}

export interface TriageAuditLogEntry {
  id: number;
  event_type: AuditEventType;
  user_id?: string | null;
  patient_id?: string | null;
  ip_address: string;
  user_agent?: string | null;
  payload: AuditLogPayload;
  created_at: string;
}

export interface ApiSuccessEnvelope<T> {
  data: T;
  meta: Record<string, unknown>;
  error: null;
}

export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiErrorEnvelope {
  data: null;
  meta: Record<string, unknown>;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type ApiResponse<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;
