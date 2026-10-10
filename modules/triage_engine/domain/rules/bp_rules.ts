import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateBloodPressureRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  const sbp = vitals.systolic_bp ?? null;
  const dbp = vitals.diastolic_bp ?? null;

  // (SBP > 180 OR DBP > 120) WITH headache/chest pain
  const isSevereHypertension = (sbp !== null && sbp > 180) || (dbp !== null && dbp > 120);
  if (isSevereHypertension && symptoms.hypertensive_headache_or_chest_pain === true) {
    flags.push({
      domain: 'Blood pressure',
      ruleCode: 'BP_HYPERTENSIVE_CRISIS',
      observed: `Hypertensive crisis (SBP=${sbp ?? 'N/A'}, DBP=${dbp ?? 'N/A'}, headache/chest pain=true)`,
      threshold: '(SBP > 180 OR DBP > 120) WITH headache/chest pain',
    });
  }

  // SBP < 85 (Profound shock)
  if (sbp !== null && sbp < 85) {
    flags.push({
      domain: 'Blood pressure',
      ruleCode: 'BP_PROFOUND_SHOCK',
      observed: `Profound shock (SBP = ${sbp} mmHg)`,
      threshold: 'SBP < 85 mmHg',
    });
  }

  return flags;
}
