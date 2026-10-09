export type AcuityCategory = 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';

export type AssessmentStatus = 'PENDING_REVIEW' | 'CONFIRMED' | 'OVERRIDDEN' | 'DISCHARGED';

export interface VitalSignsInput {
  heart_rate?: number | null;
  respiratory_rate?: number | null;
  systolic_bp?: number | null;
  diastolic_bp?: number | null;
  oxygen_saturation?: number | null;
  temperature_celsius?: number | null;
  capillary_blood_glucose?: number | null;
}

export interface PatientDemographicsInput {
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  immunosuppressed?: boolean;
  chronic_comorbidities?: string[];
  symptom_duration_hours?: number | null;
}

export interface ImputedPatientDemographics {
  age: number;
  gender: 'male' | 'female' | 'other';
  immunosuppressed: boolean;
  chronic_comorbidities: string[];
  symptom_duration_hours: number;
}

export interface ClinicalIntakePayload {
  patient_id?: string;
  chief_complaint: string;
  symptom_vector: Record<string, any>;
  vitals: VitalSignsInput;
  demographics: PatientDemographicsInput;
  previous_vitals_delta?: number;
}

export interface FeatureContribution {
  feature_id: string;
  feature_name: string;
  importance_value: number; // SHAP value (positive = increases risk, negative = decreases risk)
  contribution: 'RISK_INCREASE' | 'RISK_DECREASE' | 'NEUTRAL';
  human_readable_summary: string;
}

export interface ExplainabilityPayload {
  top_features: FeatureContribution[];
  model_version: string;
  prediction_timestamp: string;
  shap_latency_ms: number;
  explanation_summary?: string;
}

export interface ImputedVariableMeta {
  variable_name: string;
  imputed_value: any;
  strata: string;
  method: string;
}

export interface UncertaintyMetadata {
  missing_essential_vitals: string[];
  imputed_variables: ImputedVariableMeta[];
  confidence_level: 'HIGH' | 'MEDIUM' | 'LOW';
  warning_prompt?: string;
}

export interface RiskAssessmentResult {
  id?: string;
  patient_id?: string;
  calculated_risk_score: number; // 0-100 integer
  calculated_category: AcuityCategory;
  hard_red_flag_triggered: boolean;
  red_flag_details: string[];
  confidence_score: number; // 0.00 - 1.00
  explainability_payload: ExplainabilityPayload;
  uncertainty_metadata: UncertaintyMetadata;
  status: AssessmentStatus;
  created_at: string;
}

export interface ModelMetadata {
  model_id: string;
  model_name: string;
  version: string;
  algorithm: string;
  accuracy: number;
  auc_roc: number;
  f1_score: number;
  trained_at: string;
  sample_count: number;
  features_list: string[];
}
