import { VitalSignsInput, SymptomVector, RedFlagDetail } from '@/shared/types/triage';

export function evaluateTraumaRules(
  vitals: VitalSignsInput,
  symptoms: SymptomVector
): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  // Pulsatile arterial hemorrhage
  if (symptoms.pulsatile_arterial_hemorrhage === true) {
    flags.push({
      domain: 'Trauma',
      ruleCode: 'TRAUMA_HEMORRHAGE',
      observed: 'Pulsatile arterial hemorrhage observed',
      threshold: 'pulsatile_arterial_hemorrhage == true',
    });
  }

  // Flail chest
  if (symptoms.flail_chest === true) {
    flags.push({
      domain: 'Trauma',
      ruleCode: 'TRAUMA_FLAIL_CHEST',
      observed: 'Flail chest observed',
      threshold: 'flail_chest == true',
    });
  }

  // Suspected acute spinal cord injury
  if (symptoms.suspected_acute_spinal_cord_injury === true) {
    flags.push({
      domain: 'Trauma',
      ruleCode: 'TRAUMA_SPINAL',
      observed: 'Suspected acute spinal cord injury',
      threshold: 'suspected_acute_spinal_cord_injury == true',
    });
  }

  // Traumatic amputation
  if (symptoms.traumatic_amputation === true) {
    flags.push({
      domain: 'Trauma',
      ruleCode: 'TRAUMA_AMPUTATION',
      observed: 'Traumatic amputation observed',
      threshold: 'traumatic_amputation == true',
    });
  }

  return flags;
}
