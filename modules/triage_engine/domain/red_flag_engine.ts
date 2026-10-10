import { VitalSignsInput, SymptomVector, RedFlagDetail, RedFlagEvaluationResult } from '@/shared/types/triage';
import { evaluateInfectionRules } from './rules/infection_rules';
import { evaluateRespiratoryRules } from './rules/respiratory_rules';
import { evaluateCardiacRules } from './rules/cardiac_rules';
import { evaluateNeurologicalRules } from './rules/neurological_rules';
import { evaluateBloodPressureRules } from './rules/bp_rules';
import { evaluateDiabetesRules } from './rules/diabetes_rules';
import { evaluateGIRules } from './rules/gi_rules';
import { evaluateTraumaRules } from './rules/trauma_rules';
import { evaluatePregnancyRules } from './rules/pregnancy_rules';
import { evaluateAllergyRules } from './rules/allergy_rules';
import { evaluateDehydrationRules } from './rules/dehydration_rules';
import { evaluateToxicRules } from './rules/toxic_rules';
import { evaluateVitalStandaloneCritical } from './vitals_baseline';

/**
 * Pure deterministic Tier-1 Red-Flag Safety Engine.
 * Evaluates all 12 clinical domains + cross-category vital baselines synchronously.
 * Zero external dependencies (no DB, no Network, no ML/Gemini).
 */
export function evaluateRedFlags(
  vitals?: VitalSignsInput | null,
  symptoms?: SymptomVector | null
): RedFlagEvaluationResult {
  const safeVitals: VitalSignsInput = vitals ?? {};
  const safeSymptoms: SymptomVector = symptoms ?? {};

  const allFlags: RedFlagDetail[] = [
    ...evaluateInfectionRules(safeVitals, safeSymptoms),
    ...evaluateRespiratoryRules(safeVitals, safeSymptoms),
    ...evaluateCardiacRules(safeVitals, safeSymptoms),
    ...evaluateNeurologicalRules(safeVitals, safeSymptoms),
    ...evaluateBloodPressureRules(safeVitals, safeSymptoms),
    ...evaluateDiabetesRules(safeVitals, safeSymptoms),
    ...evaluateGIRules(safeVitals, safeSymptoms),
    ...evaluateTraumaRules(safeVitals, safeSymptoms),
    ...evaluatePregnancyRules(safeVitals, safeSymptoms),
    ...evaluateAllergyRules(safeVitals, safeSymptoms),
    ...evaluateDehydrationRules(safeVitals, safeSymptoms),
    ...evaluateToxicRules(safeVitals, safeSymptoms),
    ...evaluateVitalStandaloneCritical(safeVitals),
  ];

  return {
    hardRedFlagTriggered: allFlags.length > 0,
    flags: allFlags,
  };
}
