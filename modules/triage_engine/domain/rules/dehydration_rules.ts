import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateDehydrationRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  // Anuria > 12 h
  if (symptoms.anuria_over_12h === true) {
    flags.push({
      domain: 'Dehydration',
      ruleCode: 'DEHYD_ANURIA',
      observed: 'Anuria > 12 hours observed',
      threshold: 'anuria_over_12h == true',
    });
  }

  // Severe skin tenting
  if (symptoms.severe_skin_tenting === true) {
    flags.push({
      domain: 'Dehydration',
      ruleCode: 'DEHYD_SKIN_TENTING',
      observed: 'Severe skin tenting observed',
      threshold: 'severe_skin_tenting == true',
    });
  }

  // Cold extremities WITH cap refill > 4 s
  const capRefill = symptoms.capillary_refill_seconds ?? null;
  if (symptoms.cold_extremities === true && capRefill !== null && capRefill > 4) {
    flags.push({
      domain: 'Dehydration',
      ruleCode: 'DEHYD_COLD_EXT_CAP_REFILL',
      observed: `Cold extremities with capillary refill time = ${capRefill} s`,
      threshold: 'cold_extremities AND cap_refill > 4 s',
    });
  }

  return flags;
}
