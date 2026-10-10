import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateAllergyRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  // Angioedema of tongue/pharynx
  if (symptoms.angioedema_tongue_pharynx === true) {
    flags.push({
      domain: 'Allergy',
      ruleCode: 'ALLERGY_ANGIOEDEMA',
      observed: 'Angioedema of tongue/pharynx observed',
      threshold: 'angioedema_tongue_pharynx == true',
    });
  }

  // Acute stridor
  if (symptoms.acute_stridor === true) {
    flags.push({
      domain: 'Allergy',
      ruleCode: 'ALLERGY_STRIDOR',
      observed: 'Acute stridor observed',
      threshold: 'acute_stridor == true',
    });
  }

  // Wheezing WITH systemic hypotension
  const sbp = vitals.systolic_bp;
  const isHypotensive = (sbp !== undefined && sbp !== null && sbp < 90) || symptoms.systemic_hypotension === true;
  if (symptoms.wheezing_present === true && isHypotensive) {
    flags.push({
      domain: 'Allergy',
      ruleCode: 'ALLERGY_WHEEZE_HYPOTENSION',
      observed: `Wheezing with systemic hypotension (SBP = ${sbp ?? 'hypotensive_flag'})`,
      threshold: 'wheezing_present AND systemic_hypotension',
    });
  }

  return flags;
}
