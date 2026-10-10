import { describe, it, expect } from 'vitest';
import { RiskScoringEngine } from '@/ml/pipelines/risk_scoring_engine';

describe('M3 Risk Scoring Engine & Category Boundary Tests', () => {
  it('1. Enforces strict lower (0) and upper (100) score bounds', () => {
    // Perfect normal vitals, low symptoms, low demographics
    const normalVitals = { heart_rate: 72, systolic_bp: 115, oxygen_saturation: 98 };
    const normalDemo = { age: 30, gender: 'male' as const, immunosuppressed: false, chronic_comorbidities: [], symptom_duration_hours: 2 };
    const { components: lowComponents } = RiskScoringEngine.calculateMasterScore(normalVitals, 'mild cough', {}, normalDemo, 0);
    expect(lowComponents.final_score).toBeGreaterThanOrEqual(0);
    expect(lowComponents.final_score).toBeLessThanOrEqual(29);

    // Extreme abnormal vitals & trajectory
    const extremeVitals = { heart_rate: 180, systolic_bp: 210, oxygen_saturation: 80 };
    const highDemo = { age: 78, gender: 'female' as const, immunosuppressed: true, chronic_comorbidities: ['CAD', 'CKD', 'Diabetes'], symptom_duration_hours: 12 };
    const { components: highComponents } = RiskScoringEngine.calculateMasterScore(extremeVitals, 'severe chest pain radiating to jaw', { chest_pain_radiating: true }, highDemo, 25);
    expect(highComponents.final_score).toBe(100);
    expect(highComponents.final_score).toBeGreaterThanOrEqual(85);
  });

  it('2. Correctly maps every category boundary: 0, 29, 30, 59, 60, 84, 85, 100', () => {
    expect(RiskScoringEngine.mapScoreToCategory(0)).toBe('LOW');
    expect(RiskScoringEngine.mapScoreToCategory(29)).toBe('LOW');
    expect(RiskScoringEngine.mapScoreToCategory(30)).toBe('MODERATE');
    expect(RiskScoringEngine.mapScoreToCategory(59)).toBe('MODERATE');
    expect(RiskScoringEngine.mapScoreToCategory(60)).toBe('HIGH');
    expect(RiskScoringEngine.mapScoreToCategory(84)).toBe('HIGH');
    expect(RiskScoringEngine.mapScoreToCategory(85)).toBe('CRITICAL');
    expect(RiskScoringEngine.mapScoreToCategory(100)).toBe('CRITICAL');
  });

  it('3. Handles out-of-range and invalid numeric inputs safely', () => {
    const s_delta = RiskScoringEngine.calculateSDelta(-50);
    expect(s_delta).toBe(0);

    const s_deltaExcessive = RiskScoringEngine.calculateSDelta(999);
    expect(s_deltaExcessive).toBe(20);

    const mappedNeg = RiskScoringEngine.mapScoreToCategory(-15);
    expect(mappedNeg).toBe('LOW');

    const mappedOver = RiskScoringEngine.mapScoreToCategory(150);
    expect(mappedOver).toBe('CRITICAL');
  });

  it('4. Provides deterministic and reproducible scores for identical fixtures', () => {
    const vitals = { heart_rate: 115, systolic_bp: 145, oxygen_saturation: 92 };
    const demo = { age: 68, gender: 'female' as const, immunosuppressed: false, chronic_comorbidities: ['Hypertension'], symptom_duration_hours: 4 };

    const run1 = RiskScoringEngine.calculateMasterScore(vitals, 'Severe chest pain', {}, demo, 8);
    const run2 = RiskScoringEngine.calculateMasterScore(vitals, 'Severe chest pain', {}, demo, 8);

    expect(run1.components.final_score).toEqual(run2.components.final_score);
    expect(run1.components.s_vitals).toEqual(run2.components.s_vitals);
  });
});
