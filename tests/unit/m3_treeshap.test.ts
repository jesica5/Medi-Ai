import { describe, it, expect } from 'vitest';
import { TreeSHAPExplainer } from '@/ml/models/tree_shap_explainer';
import { RiskScoringEngine } from '@/ml/pipelines/risk_scoring_engine';

describe('M3 TreeSHAP Feature Attribution Explainer Tests', () => {
  it('1. Generates actual feature attribution values matching input vectors', () => {
    const vitals = { heart_rate: 130, systolic_bp: 160, oxygen_saturation: 88 };
    const demo = { age: 70, gender: 'female' as const, immunosuppressed: true, chronic_comorbidities: ['CAD'], symptom_duration_hours: 3 };
    const chiefComplaint = 'Severe chest pain and dyspnea';
    const symptomVector = { chest_pain: true, dyspnea: true };

    const { components } = RiskScoringEngine.calculateMasterScore(vitals, chiefComplaint, symptomVector, demo, 12);

    const payload = TreeSHAPExplainer.generateExplanation({
      vitals,
      demographics: demo,
      chiefComplaint,
      symptomVector,
      components,
      previousVitalsDelta: 12,
    });

    expect(payload.top_features).toBeDefined();
    expect(payload.top_features.length).toBeGreaterThan(0);
    expect(payload.model_version).toBe(TreeSHAPExplainer.MODEL_VERSION);
    expect(payload.explanation_summary).toContain('Primary clinical risk driver');

    // SpO2 88% should produce RISK_INCREASE SHAP contribution
    const spo2Feat = payload.top_features.find(f => f.feature_id === 'vitals_spo2');
    expect(spo2Feat).toBeDefined();
    expect(spo2Feat?.contribution).toBe('RISK_INCREASE');
    expect(spo2Feat?.importance_value).toBeGreaterThan(0);
  });

  it('2. Meets under-100-ms TreeSHAP latency target', () => {
    const vitals = { heart_rate: 80, systolic_bp: 120, oxygen_saturation: 99 };
    const demo = { age: 25, gender: 'male' as const, immunosuppressed: false, chronic_comorbidities: [], symptom_duration_hours: 1 };
    const { components } = RiskScoringEngine.calculateMasterScore(vitals, 'routine checkup', {}, demo, 0);

    const payload = TreeSHAPExplainer.generateExplanation({
      vitals,
      demographics: demo,
      chiefComplaint: 'routine checkup',
      symptomVector: {},
      components,
    });

    expect(payload.shap_latency_ms).toBeLessThan(100.0);
  });

  it('3. Ranks top contributing features by magnitude of SHAP importance', () => {
    const vitals = { heart_rate: 70, systolic_bp: 120, oxygen_saturation: 85 }; // Extreme SpO2 deviation
    const demo = { age: 30, gender: 'male' as const, immunosuppressed: false, chronic_comorbidities: [], symptom_duration_hours: 1 };
    const { components } = RiskScoringEngine.calculateMasterScore(vitals, 'cough', {}, demo, 0);

    const payload = TreeSHAPExplainer.generateExplanation({
      vitals,
      demographics: demo,
      chiefComplaint: 'cough',
      symptomVector: {},
      components,
    });

    // Highest magnitude feature must be first
    const top1 = payload.top_features[0];
    expect(top1.feature_id).toBe('vitals_spo2');
  });
});
