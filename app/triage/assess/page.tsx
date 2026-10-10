'use client';

import React, { useState } from 'react';
import { TriageStatusBadge } from '@/modules/triage_engine/components/TriageStatusBadge';
import { AlertStatusBanner } from '@/modules/triage_engine/components/AlertStatusBanner';
import { AssessmentOrchestrationResult } from '@/modules/triage_engine/application/triage_orchestrator';

export default function TriageAssessPage() {
  const [patientId, setPatientId] = useState('PAT-88492');
  const [chiefComplaint, setChiefComplaint] = useState('Sudden shortness of breath and chest tightness');
  const [heartRate, setHeartRate] = useState<number | ''>(115);
  const [respiratoryRate, setRespiratoryRate] = useState<number | ''>(26);
  const [systolicBp, setSystolicBp] = useState<number | ''>(145);
  const [diastolicBp, setDiastolicBp] = useState<number | ''>(92);
  const [oxygenSaturation, setOxygenSaturation] = useState<number | ''>(88);
  const [temperatureCelsius, setTemperatureCelsius] = useState<number | ''>(38.4);
  const [capillaryBloodGlucose, setCapillaryBloodGlucose] = useState<number | ''>(120);

  // Symptoms
  const [cyanosis, setCyanosis] = useState(false);
  const [audibleStridor, setAudibleStridor] = useState(false);
  const [retrosternalChestPain, setRetrosternalChestPain] = useState(true);
  const [painRadiatingJawLeftArm, setPainRadiatingJawLeftArm] = useState(true);
  const [alteredMentation, setAlteredMentation] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [assessmentResult, setAssessmentResult] = useState<AssessmentOrchestrationResult | null>(null);

  const handleAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const payload = {
        patient_id: patientId,
        chief_complaint: chiefComplaint,
        vital_signs: {
          heart_rate: heartRate === '' ? null : Number(heartRate),
          respiratory_rate: respiratoryRate === '' ? null : Number(respiratoryRate),
          systolic_bp: systolicBp === '' ? null : Number(systolicBp),
          diastolic_bp: diastolicBp === '' ? null : Number(diastolicBp),
          oxygen_saturation: oxygenSaturation === '' ? null : Number(oxygenSaturation),
          temperature_celsius: temperatureCelsius === '' ? null : Number(temperatureCelsius),
          capillary_blood_glucose: capillaryBloodGlucose === '' ? null : Number(capillaryBloodGlucose),
        },
        symptom_vector: {
          cyanosis,
          audible_stridor: audibleStridor,
          retrosternal_chest_pain: retrosternalChestPain,
          pain_radiating_jaw_left_arm: painRadiatingJawLeftArm,
          altered_mentation: alteredMentation,
        },
      };

      const res = await fetch('/api/v1/triage/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-role': 'nurse',
          'x-user-id': 'nurse_intake_01',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to process triage assessment.');
      }

      setAssessmentResult(json.data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error during assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', color: '#1A202C', margin: 0 }}>⚡ Nurse Triage Intake & Safety Pre-Check</h1>
        <p style={{ color: '#718096', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
          Capture vitals and symptoms. Deterministic red-flag safety rules run prior to machine learning inference.
        </p>
      </header>

      {errorMsg && (
        <div role="alert" style={{ backgroundColor: '#FFF5F5', borderLeft: '4px solid #E53E3E', color: '#C53030', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleAssessment} style={{ backgroundColor: '#FFFFFF', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.125rem', color: '#2D3748', margin: '0 0 1rem 0' }}>1. Patient & Chief Complaint</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label htmlFor="patient-id-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4A5568', marginBottom: '0.25rem' }}>Patient ID / MRN</label>
            <input
              id="patient-id-input"
              type="text"
              required
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E0', borderRadius: '6px', fontSize: '0.875rem' }}
            />
          </div>
          <div>
            <label htmlFor="chief-complaint-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4A5568', marginBottom: '0.25rem' }}>Chief Complaint</label>
            <input
              id="chief-complaint-input"
              type="text"
              required
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', border: '1px solid #CBD5E0', borderRadius: '6px', fontSize: '0.875rem' }}
            />
          </div>
        </div>

        <h2 style={{ fontSize: '1.125rem', color: '#2D3748', margin: '0 0 1rem 0' }}>2. Physiological Vital Signs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div>
            <label htmlFor="hr-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4A5568' }}>HR (bpm)</label>
            <input id="hr-input" type="number" value={heartRate} onChange={(e) => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '0.4rem', border: '1px solid #CBD5E0', borderRadius: '6px' }} />
          </div>
          <div>
            <label htmlFor="rr-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4A5568' }}>RR (bpm)</label>
            <input id="rr-input" type="number" value={respiratoryRate} onChange={(e) => setRespiratoryRate(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '0.4rem', border: '1px solid #CBD5E0', borderRadius: '6px' }} />
          </div>
          <div>
            <label htmlFor="sbp-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4A5568' }}>SBP (mmHg)</label>
            <input id="sbp-input" type="number" value={systolicBp} onChange={(e) => setSystolicBp(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '0.4rem', border: '1px solid #CBD5E0', borderRadius: '6px' }} />
          </div>
          <div>
            <label htmlFor="dbp-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4A5568' }}>DBP (mmHg)</label>
            <input id="dbp-input" type="number" value={diastolicBp} onChange={(e) => setDiastolicBp(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '0.4rem', border: '1px solid #CBD5E0', borderRadius: '6px' }} />
          </div>
          <div>
            <label htmlFor="spo2-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4A5568' }}>SpO2 (%)</label>
            <input id="spo2-input" type="number" value={oxygenSaturation} onChange={(e) => setOxygenSaturation(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '0.4rem', border: '1px solid #CBD5E0', borderRadius: '6px' }} />
          </div>
          <div>
            <label htmlFor="temp-input" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#4A5568' }}>Temp (°C)</label>
            <input id="temp-input" type="number" step="0.1" value={temperatureCelsius} onChange={(e) => setTemperatureCelsius(e.target.value === '' ? '' : Number(e.target.value))} style={{ width: '100%', padding: '0.4rem', border: '1px solid #CBD5E0', borderRadius: '6px' }} />
          </div>
        </div>

        <h2 style={{ fontSize: '1.125rem', color: '#2D3748', margin: '0 0 0.75rem 0' }}>3. Key Clinical Symptom Checklist</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={cyanosis} onChange={(e) => setCyanosis(e.target.checked)} /> Cyanosis
          </label>
          <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={audibleStridor} onChange={(e) => setAudibleStridor(e.target.checked)} /> Audible Stridor
          </label>
          <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={retrosternalChestPain} onChange={(e) => setRetrosternalChestPain(e.target.checked)} /> Retrosternal Chest Pain
          </label>
          <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={painRadiatingJawLeftArm} onChange={(e) => setPainRadiatingJawLeftArm(e.target.checked)} /> Pain Radiating to Jaw/Left Arm
          </label>
          <label style={{ fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={alteredMentation} onChange={(e) => setAlteredMentation(e.target.checked)} /> Altered Mentation
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3182CE',
            color: '#FFFFFF',
            fontWeight: 700,
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          {loading ? 'Evaluating Safety Rules...' : 'Run Triage Safety Check & Stratify'}
        </button>
      </form>

      {assessmentResult && (
        <section style={{ marginTop: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', color: '#1A202C', marginBottom: '1rem' }}>Triage Safety Result Output</h2>

          <AlertStatusBanner
            alertDispatched={assessmentResult.alertDispatched}
            alertError={assessmentResult.alertError}
          />

          <TriageStatusBadge
            category={assessmentResult.assessment.calculated_category}
            score={assessmentResult.assessment.calculated_risk_score}
            redFlags={assessmentResult.redFlags}
            timestamp={assessmentResult.assessment.created_at}
          />

          {assessmentResult.missingVitalsWarning && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#FEFCBF', borderLeft: '4px solid #D69E2E', borderRadius: '6px', color: '#744210', fontSize: '0.875rem' }}>
              ⚠️ {assessmentResult.missingVitalsWarning}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
