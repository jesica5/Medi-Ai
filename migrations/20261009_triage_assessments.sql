-- Migration: 20261009_triage_assessments.sql
-- Module M3: AI Risk Prediction & Explainability Database Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table: triage_assessments (Core Decision-Support Output)
CREATE TABLE IF NOT EXISTS triage_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  vital_id UUID,
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

-- Index for rapid doctor workstation queue queries
CREATE INDEX IF NOT EXISTS idx_triage_assessments_status ON triage_assessments(status);
CREATE INDEX IF NOT EXISTS idx_triage_assessments_patient_id ON triage_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_triage_assessments_category ON triage_assessments(calculated_category);

-- Row Level Security (RLS) policies for defense in depth
ALTER TABLE triage_assessments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated clinicians/nurses read/write access
CREATE POLICY triage_assessments_clinician_policy ON triage_assessments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
