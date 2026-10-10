import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluatePregnancyRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  const gestAge = symptoms.gestational_age_weeks;
  // Rule gate: gestational-age input > 20 wks
  const isAfter20Wks = gestAge !== undefined && gestAge !== null && gestAge > 20;

  // Third-trimester vaginal hemorrhage
  if (isAfter20Wks && symptoms.third_trimester_vaginal_hemorrhage === true) {
    flags.push({
      domain: 'Pregnancy',
      ruleCode: 'PREG_HEMORRHAGE',
      observed: `Third-trimester vaginal hemorrhage observed (Gestational age = ${gestAge} wks)`,
      threshold: 'gestational_age > 20 wks AND third_trimester_vaginal_hemorrhage',
    });
  }

  // Severe epigastric pain with visual aura (pre-eclampsia)
  if (isAfter20Wks && symptoms.severe_epigastric_pain_with_aura === true) {
    flags.push({
      domain: 'Pregnancy',
      ruleCode: 'PREG_ECLAMPSIA_AURA',
      observed: `Severe epigastric pain with visual aura observed (Gestational age = ${gestAge} wks)`,
      threshold: 'gestational_age > 20 wks AND severe_epigastric_pain_with_aura',
    });
  }

  // Eclamptic convulsions
  if (isAfter20Wks && symptoms.eclamptic_convulsions === true) {
    flags.push({
      domain: 'Pregnancy',
      ruleCode: 'PREG_ECLAMPSIA_CONVULSION',
      observed: `Eclamptic convulsions observed (Gestational age = ${gestAge} wks)`,
      threshold: 'gestational_age > 20 wks AND eclamptic_convulsions',
    });
  }

  return flags;
}
