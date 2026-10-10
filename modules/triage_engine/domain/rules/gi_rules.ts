import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateGIRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  // Massive hematemesis
  if (symptoms.massive_hematemesis === true) {
    flags.push({
      domain: 'GI',
      ruleCode: 'GI_HEMATEMESIS',
      observed: 'Massive hematemesis observed',
      threshold: 'massive_hematemesis == true',
    });
  }

  // Involuntary guarding/rigidity
  if (symptoms.involuntary_abdominal_guarding === true) {
    flags.push({
      domain: 'GI',
      ruleCode: 'GI_GUARDING',
      observed: 'Involuntary abdominal guarding/rigidity observed',
      threshold: 'involuntary_abdominal_guarding == true',
    });
  }

  // Melena with hemodynamic instability
  if (symptoms.melena_present === true && symptoms.hemodynamic_instability === true) {
    flags.push({
      domain: 'GI',
      ruleCode: 'GI_MELENA_INSTABILITY',
      observed: 'Melena with hemodynamic instability',
      threshold: 'melena_present AND hemodynamic_instability',
    });
  }

  return flags;
}
