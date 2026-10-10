-- MediAI Module M4 Database Schema Migration Proposal
-- Target DB: Supabase PostgreSQL with RLS and Audit Triggers

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table 1: patients
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mrn_hash VARCHAR(64) UNIQUE NOT NULL,
  encrypted_name BYTEA NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(16) NOT NULL,
  primary_language VARCHAR(8) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 2: vital_signs
CREATE TABLE IF NOT EXISTS vital_signs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  heart_rate INT CHECK (heart_rate BETWEEN 20 AND 300),
  respiratory_rate INT CHECK (respiratory_rate BETWEEN 4 AND 80),
  systolic_bp INT CHECK (systolic_bp BETWEEN 40 AND 300),
  diastolic_bp INT CHECK (diastolic_bp BETWEEN 20 AND 200),
  oxygen_saturation NUMERIC(4,1) CHECK (oxygen_saturation BETWEEN 40.0 AND 100.0),
  temperature_celsius NUMERIC(4,2) CHECK (temperature_celsius BETWEEN 30.0 AND 45.0),
  capillary_blood_glucose NUMERIC(5,1),
  recorded_by UUID NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 3: triage_assessments
CREATE TABLE IF NOT EXISTS triage_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  vital_id UUID REFERENCES vital_signs(id),
  chief_complaint TEXT NOT NULL,
  symptom_vector JSONB NOT NULL,
  calculated_risk_score INT NOT NULL CHECK (calculated_risk_score BETWEEN 0 AND 100),
  calculated_category VARCHAR(16) NOT NULL CHECK (calculated_category IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
  hard_red_flag_triggered BOOLEAN NOT NULL DEFAULT FALSE,
  red_flag_details TEXT[],
  confidence_score NUMERIC(3,2) NOT NULL,
  explainability_payload JSONB NOT NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'CONFIRMED', 'OVERRIDDEN', 'DISCHARGED')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 4: triage_reviews
CREATE TABLE IF NOT EXISTS triage_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES triage_assessments(id) ON DELETE RESTRICT,
  doctor_id UUID NOT NULL,
  original_category VARCHAR(16) NOT NULL,
  final_category VARCHAR(16) NOT NULL,
  is_overridden BOOLEAN GENERATED ALWAYS AS (original_category != final_category) STORED,
  override_reason TEXT,
  clinical_notes TEXT,
  reviewed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 5: triage_audit_log (Immutable, Append-Only)
CREATE TABLE IF NOT EXISTS triage_audit_log (
  id BIGSERIAL PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  user_id UUID,
  patient_id UUID,
  ip_address INET NOT NULL,
  user_agent TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Table 6: triage_alerts (M4/M5 Alert status tracking)
CREATE TABLE IF NOT EXISTS triage_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES triage_assessments(id) ON DELETE CASCADE,
  priority VARCHAR(16) NOT NULL,
  alert_status VARCHAR(24) NOT NULL DEFAULT 'PENDING' CHECK (alert_status IN ('PENDING', 'DISPATCHED', 'ACKNOWLEDGED', 'FAILED')),
  dispatched_at TIMESTAMPTZ,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Trigger function to enforce append-only immutability on triage_audit_log
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'triage_audit_log is append-only. UPDATE and DELETE operations are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_audit_log_modification ON triage_audit_log;
CREATE TRIGGER trg_prevent_audit_log_modification
BEFORE UPDATE OR DELETE ON triage_audit_log
FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- Enable Row Level Security (RLS)
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_alerts ENABLE ROW LEVEL SECURITY;
