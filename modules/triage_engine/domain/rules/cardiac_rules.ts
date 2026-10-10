import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateCardiacRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  // Crushing retrosternal pain radiating to jaw/left arm
  if (symptoms.retrosternal_chest_pain === true && symptoms.pain_radiating_jaw_left_arm === true) {
    flags.push({
      domain: 'Cardiac',
      ruleCode: 'CARD_CHEST_PAIN',
      observed: 'Crushing retrosternal chest pain radiating to jaw/left arm',
      threshold: 'retrosternal_chest_pain AND pain_radiating_jaw_left_arm',
    });
  }

  // Syncope with chest pressure
  if (symptoms.syncope_with_chest_pressure === true) {
    flags.push({
      domain: 'Cardiac',
      ruleCode: 'CARD_SYNCOPE',
      observed: 'Syncope with chest pressure observed',
      threshold: 'syncope_with_chest_pressure == true',
    });
  }

  // HR > 150 or < 40
  if (vitals.heart_rate !== undefined && vitals.heart_rate !== null) {
    if (vitals.heart_rate > 150 || vitals.heart_rate < 40) {
      flags.push({
        domain: 'Cardiac',
        ruleCode: 'CARD_HR_EXTREME',
        observed: `Heart Rate = ${vitals.heart_rate} bpm`,
        threshold: 'HR > 150 or HR < 40 bpm',
      });
    }
  }

  return flags;
}
