-- Migration: 20261010000000_m4_triage_tables.sql
-- Description: Schema for M4 Smart Triage, Safety Rules & Alerts (additive over M1 schema)

-- Table: vital_signs (Snapshot of clinical observations)
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

-- Table: triage_assessments (Core Decision-Support Output)
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

-- Table: triage_reviews (Doctor Review & Clinical Override Audit Ledger)
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

-- Table: triage_alerts (M4/M5 Alert status tracking)
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
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE triage_alerts ENABLE ROW LEVEL SECURITY;

-- Service role full access policies
CREATE POLICY "Service role full access on vital_signs"
  ON vital_signs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on triage_assessments"
  ON triage_assessments FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on triage_reviews"
  ON triage_reviews FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on triage_alerts"
  ON triage_alerts FOR ALL
  USING (true)
  WITH CHECK (true);
