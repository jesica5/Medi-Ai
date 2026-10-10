import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateRespiratoryRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  // SpO2 < 90% on room air (room_air defaults to true if unrecorded)
  const isRoomAir = vitals.room_air !== false;
  if (isRoomAir && vitals.oxygen_saturation !== undefined && vitals.oxygen_saturation !== null && vitals.oxygen_saturation < 90) {
    flags.push({
      domain: 'Respiratory',
      ruleCode: 'RESP_SPO2_LT_90',
      observed: `SpO2 = ${vitals.oxygen_saturation}% (room air)`,
      threshold: 'SpO2 < 90% on room air',
    });
  }

  // Cyanosis
  if (symptoms.cyanosis === true) {
    flags.push({
      domain: 'Respiratory',
      ruleCode: 'RESP_CYANOSIS',
      observed: 'Cyanosis observed',
      threshold: 'cyanosis == true',
    });
  }

  // Audible stridor
  if (symptoms.audible_stridor === true) {
    flags.push({
      domain: 'Respiratory',
      ruleCode: 'RESP_STRIDOR',
      observed: 'Audible stridor observed',
      threshold: 'audible_stridor == true',
    });
  }

  // RR > 32 or < 8
  if (vitals.respiratory_rate !== undefined && vitals.respiratory_rate !== null) {
    if (vitals.respiratory_rate > 32 || vitals.respiratory_rate < 8) {
      flags.push({
        domain: 'Respiratory',
        ruleCode: 'RESP_RR_EXTREME',
        observed: `Respiratory Rate = ${vitals.respiratory_rate} bpm`,
        threshold: 'RR > 32 or RR < 8 bpm',
      });
    }
  }

  return flags;
}
