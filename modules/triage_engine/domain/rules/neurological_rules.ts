import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateNeurologicalRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  // Acute focal deficit (facial droop, arm drift, slurred speech)
  if (symptoms.facial_droop === true || symptoms.arm_drift === true || symptoms.slurred_speech === true) {
    flags.push({
      domain: 'Neurological',
      ruleCode: 'NEURO_FOCAL_DEFICIT',
      observed: `Acute focal neurological deficit (facial_droop=${Boolean(symptoms.facial_droop)}, arm_drift=${Boolean(symptoms.arm_drift)}, slurred_speech=${Boolean(symptoms.slurred_speech)})`,
      threshold: 'facial_droop OR arm_drift OR slurred_speech',
    });
  }

  // GCS < 12
  if (symptoms.gcs_score !== undefined && symptoms.gcs_score !== null && symptoms.gcs_score < 12) {
    flags.push({
      domain: 'Neurological',
      ruleCode: 'NEURO_GCS_LT_12',
      observed: `GCS score = ${symptoms.gcs_score}`,
      threshold: 'GCS < 12',
    });
  }

  // Status epilepticus
  if (symptoms.status_epilepticus === true) {
    flags.push({
      domain: 'Neurological',
      ruleCode: 'NEURO_STATUS_EPILEPTICUS',
      observed: 'Status epilepticus observed',
      threshold: 'status_epilepticus == true',
    });
  }

  return flags;
}
