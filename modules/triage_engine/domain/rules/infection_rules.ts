import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateInfectionRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  // qSOFA: RR >= 22, SBP <= 100, altered mentation
  let qsofaScore = 0;
  if (vitals.respiratory_rate !== undefined && vitals.respiratory_rate !== null && vitals.respiratory_rate >= 22) {
    qsofaScore += 1;
  }
  if (vitals.systolic_bp !== undefined && vitals.systolic_bp !== null && vitals.systolic_bp <= 100) {
    qsofaScore += 1;
  }
  if (symptoms.altered_mentation === true) {
    qsofaScore += 1;
  }

  if (qsofaScore >= 2) {
    flags.push({
      domain: 'Infection/Sepsis',
      ruleCode: 'INF_QSOFA_GE_2',
      observed: `qSOFA score = ${qsofaScore} (RR=${vitals.respiratory_rate ?? 'N/A'}, SBP=${vitals.systolic_bp ?? 'N/A'}, altered_mentation=${Boolean(symptoms.altered_mentation)})`,
      threshold: 'qSOFA >= 2 of {RR >= 22, SBP <= 100, altered mentation}',
    });
  }

  // Hypothermia: Temp < 35.0 C
  if (vitals.temperature_celsius !== undefined && vitals.temperature_celsius !== null && vitals.temperature_celsius < 35.0) {
    flags.push({
      domain: 'Infection/Sepsis',
      ruleCode: 'INF_HYPOTHERMIA',
      observed: `Core Temp = ${vitals.temperature_celsius}°C`,
      threshold: 'Temp < 35.0°C',
    });
  }

  return flags;
}
