'use client';
import React, { useState } from 'react';
import { RiskResultPanel } from '@/modules/triage_engine/components/RiskResultPanel';
import { ExplainabilityPanel } from '@/modules/triage_engine/components/ExplainabilityPanel';
import { RiskAssessmentResult } from '@/shared/types/triage';

export default function M3TriageDemoPage() {
  const [chiefComplaint, setChiefComplaint] = useState('Severe chest pain radiating to left arm');
  const [heartRate, setHeartRate] = useState<number | ''>(115);
  const [sysBp, setSysBp] = useState<number | ''>(145);
  const [spo2, setSpo2] = useState<number | ''>(92);
  const [respRate, setRespRate] = useState<number | ''>(24);
  const [temp, setTemp] = useState<number | ''>(37.2);
  const [age, setAge] = useState<number | ''>(68);
  const [gender, setGender] = useState<string>('female');
  const [hardRedFlag, setHardRedFlag] = useState<boolean>(false);
  const [previousDelta, setPreviousDelta] = useState<number>(8);

  const [result, setResult] = useState<RiskAssessmentResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleAssess = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        chief_complaint: chiefComplaint,
        vitals: {
          heart_rate: heartRate === '' ? null : Number(heartRate),
          systolic_bp: sysBp === '' ? null : Number(sysBp),
          oxygen_saturation: spo2 === '' ? null : Number(spo2),
          respiratory_rate: respRate === '' ? null : Number(respRate),
          temperature_celsius: temp === '' ? null : Number(temp),
        },
        demographics: {
          age: age === '' ? null : Number(age),
          gender,
          immunosuppressed: false,
          chronic_comorbidities: ['Hypertension', 'Type 2 Diabetes'],
        },
        previous_vitals_delta: previousDelta,
        hard_red_flag_triggered: hardRedFlag,
        red_flag_details: hardRedFlag ? ['SpO2 < 90% on room air', 'qSOFA >= 2'] : [],
      };

      const res = await fetch('/api/v1/triage/assess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to process triage risk assessment');
      }

      setResult(json.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to triage assessment service');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem 1rem', maxWidth: '1100px', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ marginBottom: '2rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1A365D', fontSize: '1.75rem' }}>
            🏥 MediAI Smart Patient Triage System
          </h1>
          <p style={{ margin: '0.35rem 0 0 0', color: '#4A5568', fontSize: '0.95rem' }}>
            <strong>Module M3 — AI Risk Prediction & Explainability</strong> (Assigned Developer: Madhu Mitha)
          </p>
        </div>

        <a
          href="/dashboard/admin/model-quality"
          style={{ background: '#3182CE', color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem' }}
        >
          ⚙️ Admin Model Quality
        </a>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        {/* Left Column: Intake Form */}
        <section className="triage-card" aria-label="Intake Inputs Form">
          <h2 style={{ marginTop: 0, fontSize: '1.2rem', color: '#2D3748', borderBottom: '1px solid #EDF2F7', paddingBottom: '0.5rem' }}>
            📋 Clinical Assessment Inputs (M2/M4 Contract)
          </h2>

          <form onSubmit={handleAssess}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#4A5568', marginBottom: '0.25rem' }}>
                Chief Complaint
              </label>
              <input
                type="text"
                value={chiefComplaint}
                onChange={(e) => setChiefComplaint(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E0' }}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#4A5568' }}>Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={heartRate}
                  onChange={(e) => setHeartRate(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Essential vital"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E0' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#4A5568' }}>Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={sysBp}
                  onChange={(e) => setSysBp(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Essential vital"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E0' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#4A5568' }}>SpO2 (%)</label>
                <input
                  type="number"
                  value={spo2}
                  onChange={(e) => setSpo2(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Essential vital"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E0' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#4A5568' }}>Resp Rate (bpm)</label>
                <input
                  type="number"
                  value={respRate}
                  onChange={(e) => setRespRate(e.target.value === '' ? '' : Number(e.target.value))}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E0' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#4A5568' }}>Age (years)</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Leave empty to test imputation"
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E0' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', color: '#4A5568' }}>Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #CBD5E0' }}
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '1rem', padding: '0.75rem', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#C53030', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="checkbox"
                  checked={hardRedFlag}
                  onChange={(e) => setHardRedFlag(e.target.checked)}
                />
                Simulate M4 Hard Red-Flag Trigger (Bypasses ML & forces CRITICAL/P1)
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#2B6CB0',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              {isLoading ? 'Processing Triage Inference...' : '⚡ Run AI Risk Assessment'}
            </button>
          </form>
        </section>

        {/* Right Column: Output Panels */}
        <section aria-label="Risk and Explainability Outputs">
          <RiskResultPanel result={result} isLoading={isLoading} error={error} onRetry={handleAssess} />
          {result && <ExplainabilityPanel explainabilityPayload={result.explainability_payload} />}
        </section>
      </div>
    </main>
  );
}
