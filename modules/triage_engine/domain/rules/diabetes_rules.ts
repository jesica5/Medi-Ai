import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateDiabetesRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  const cbg = vitals.capillary_blood_glucose;

  // CBG < 60 mg/dL WITH altered consciousness
  if (cbg !== undefined && cbg !== null && cbg < 60 && symptoms.altered_consciousness === true) {
    flags.push({
      domain: 'Diabetes',
      ruleCode: 'DIAB_HYPOGLYCEMIA',
      observed: `Severe hypoglycemia (CBG = ${cbg} mg/dL with altered consciousness)`,
      threshold: 'CBG < 60 mg/dL WITH altered consciousness',
    });
  }

  // CBG > 400 mg/dL WITH ketotic breathing
  if (cbg !== undefined && cbg !== null && cbg > 400 && symptoms.ketotic_breathing === true) {
    flags.push({
      domain: 'Diabetes',
      ruleCode: 'DIAB_DKA',
      observed: `Severe hyperglycemia / DKA (CBG = ${cbg} mg/dL with ketotic breathing)`,
      threshold: 'CBG > 400 mg/dL WITH ketotic breathing',
    });
  }

  return flags;
}
