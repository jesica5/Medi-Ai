import { describe, it, expect } from 'vitest';
import { M3PredictionService } from '@/modules/triage_engine/services/m3_prediction_service';

describe('M3 Safety Gate Integration & Contract Tests', () => {
  it('1. Bypasses ML inference and forces CRITICAL/P1 when M4 Tier-1 Red Flag is triggered', async () => {
    const intake = {
      chief_complaint: 'Unresponsive patient',
      symptom_vector: { unconscious: true },
      vitals: { heart_rate: 165, systolic_bp: 75, oxygen_saturation: 84 },
      demographics: { age: 55, gender: 'male' as const },
    };

    const redFlagOptions = {
      hard_red_flag_triggered: true,
      red_flag_details: ['Tier-1 Red Flag: Profound Hypotension SBP < 85 mmHg', 'Severe Hypoxia SpO2 < 90%'],
    };

    const res = await M3PredictionService.predictRisk(intake, redFlagOptions);

    expect(res.hard_red_flag_triggered).toBe(true);
    expect(res.calculated_category).toBe('CRITICAL');
    expect(res.calculated_risk_score).toBe(100);
    expect(res.confidence_score).toBe(1.0);
    expect(res.red_flag_details).toContain('Tier-1 Red Flag: Profound Hypotension SBP < 85 mmHg');
    expect(res.explainability_payload.explanation_summary).toContain('Safety Pre-Check Alert');
  });

  it('2. Does NOT downgrade or suppress M4 Tier-1 safety decision under any circumstance', async () => {
    // Even if vitals were somehow low-risk or missing, hard_red_flag_triggered must remain CRITICAL/P1
    const intake = {
      chief_complaint: 'Routine follow-up',
      symptom_vector: {},
      vitals: { heart_rate: 70, systolic_bp: 120, oxygen_saturation: 98 },
      demographics: { age: 25, gender: 'female' as const },
    };

    const res = await M3PredictionService.predictRisk(intake, {
      hard_red_flag_triggered: true,
      red_flag_details: ['Pre-Check Escalation Trigger'],
    });

    expect(res.calculated_category).toBe('CRITICAL');
    expect(res.calculated_risk_score).toBe(100);
    expect(res.hard_red_flag_triggered).toBe(true);
  });

  it('3. Returns correct standard contract fields in RiskAssessmentResult', async () => {
    const intake = {
      patient_id: '123e4567-e89b-12d3-a456-426614174000',
      chief_complaint: 'Moderate fever',
      symptom_vector: { fever: true },
      vitals: { heart_rate: 95, systolic_bp: 125, oxygen_saturation: 96, temperature_celsius: 38.5 },
      demographics: { age: 35, gender: 'female' as const },
    };

    const res = await M3PredictionService.predictRisk(intake);

    expect(res.patient_id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(res.status).toBe('PENDING_REVIEW');
    expect(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).toContain(res.calculated_category);
    expect(res.explainability_payload.top_features).toBeDefined();
    expect(res.uncertainty_metadata).toBeDefined();
  });
});
