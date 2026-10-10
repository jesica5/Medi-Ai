import { describe, it, expect } from 'vitest';
import { ImputationEngine } from '@/ml/pipelines/imputation_engine';
import { M3PredictionService } from '@/modules/triage_engine/services/m3_prediction_service';

describe('M3 Missing Data & Imputation Protocol Tests', () => {
  it('1. Triggers LOW confidence and uncertainty warning when essential vitals are missing', async () => {
    // Missing SpO2, SBP, and HR
    const intakeMissingVitals = {
      chief_complaint: 'Fever and malaise',
      symptom_vector: {},
      vitals: { respiratory_rate: 20 }, // Essential vitals missing
      demographics: { age: 40, gender: 'male' as const },
    };

    const res = await M3PredictionService.predictRisk(intakeMissingVitals);

    expect(res.confidence_score).toBe(0.50);
    expect(res.uncertainty_metadata.confidence_level).toBe('LOW');
    expect(res.uncertainty_metadata.missing_essential_vitals).toContain('heart_rate');
    expect(res.uncertainty_metadata.missing_essential_vitals).toContain('systolic_bp');
    expect(res.uncertainty_metadata.missing_essential_vitals).toContain('oxygen_saturation');
    expect(res.uncertainty_metadata.warning_prompt).toBeDefined();
  });

  it('2. Imputes missing non-essential demographics using age/gender-stratified medians', () => {
    const rawDemo = { immunosuppressed: false }; // Missing age, gender, symptom duration
    const { imputedDemographics, imputedVariablesLog } = ImputationEngine.processNonEssentialImputation(rawDemo);

    expect(imputedDemographics.age).toBe(40);
    expect(imputedDemographics.gender).toBe('female');
    expect(imputedDemographics.symptom_duration_hours).toBe(4);

    expect(imputedVariablesLog.length).toBe(3);
    expect(imputedVariablesLog[0].variable_name).toBe('demographics.age');
    expect(imputedVariablesLog[0].method).toBe('AGE_GENDER_STRATIFIED_MEDIAN');
  });

  it('3. Records every imputed variable with metadata and strata', () => {
    const rawDemo = { age: 75, gender: 'male' as const }; // Geriatric male missing symptom_duration
    const { imputedDemographics, imputedVariablesLog } = ImputationEngine.processNonEssentialImputation(rawDemo);

    expect(imputedDemographics.symptom_duration_hours).toBe(5); // Geriatric male median is 5
    expect(imputedVariablesLog.length).toBe(1);
    expect(imputedVariablesLog[0].variable_name).toBe('demographics.symptom_duration_hours');
    expect(imputedVariablesLog[0].strata).toBe('GERIATRIC_male');
  });

  it('4. NEVER silently imputes essential vitals (SpO2, SBP, HR)', async () => {
    const intake = {
      chief_complaint: 'Cough',
      symptom_vector: {},
      vitals: { heart_rate: null, systolic_bp: null, oxygen_saturation: null },
      demographics: { age: 30, gender: 'female' as const },
    };

    const res = await M3PredictionService.predictRisk(intake);
    expect(res.uncertainty_metadata.missing_essential_vitals.length).toBe(3);
    // Ensure essential vitals were not given fake imputed values in metadata log
    const imputedNames = res.uncertainty_metadata.imputed_variables.map(v => v.variable_name);
    expect(imputedNames).not.toContain('vitals.oxygen_saturation');
    expect(imputedNames).not.toContain('vitals.systolic_bp');
    expect(imputedNames).not.toContain('vitals.heart_rate');
  });
});
