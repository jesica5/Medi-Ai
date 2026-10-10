import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateToxicRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  // Organophosphate (SLUDGE) signs
  if (symptoms.sludge_signs === true) {
    flags.push({
      domain: 'Multi-system/Toxic',
      ruleCode: 'TOXIC_SLUDGE',
      observed: 'Organophosphate (SLUDGE) poisoning signs observed',
      threshold: 'sludge_signs == true',
    });
  }

  // Venomous bite with ptosis
  if (symptoms.venomous_bite_with_ptosis === true) {
    flags.push({
      domain: 'Multi-system/Toxic',
      ruleCode: 'TOXIC_VENOM_PTOSIS',
      observed: 'Venomous bite with ptosis observed',
      threshold: 'venomous_bite_with_ptosis == true',
    });
  }

  return flags;
}
