import { PatientDemographicsInput, ImputedPatientDemographics, ImputedVariableMeta } from '@/shared/types/triage';

/**
 * Age/Gender Stratified Median Reference Dataset (Approved Baseline Artifact)
 * Strata definition:
 * - Age groups: 'PEDIATRIC' (<18), 'ADULT' (18-64), 'GERIATRIC' (>=65)
 * - Genders: 'male', 'female', 'other'
 */
export interface StratifiedMedians {
  age: number;
  gender: 'male' | 'female' | 'other';
  symptom_duration_hours: number;
}

const STRATIFIED_REFERENCE_DATASET: Record<string, StratifiedMedians> = {
  'GERIATRIC_female': { age: 72, gender: 'female', symptom_duration_hours: 6 },
  'GERIATRIC_male': { age: 74, gender: 'male', symptom_duration_hours: 5 },
  'GERIATRIC_other': { age: 70, gender: 'female', symptom_duration_hours: 6 },
  'ADULT_female': { age: 42, gender: 'female', symptom_duration_hours: 4 },
  'ADULT_male': { age: 44, gender: 'male', symptom_duration_hours: 3 },
  'ADULT_other': { age: 40, gender: 'female', symptom_duration_hours: 4 },
  'PEDIATRIC_female': { age: 10, gender: 'female', symptom_duration_hours: 2 },
  'PEDIATRIC_male': { age: 10, gender: 'male', symptom_duration_hours: 2 },
  'PEDIATRIC_other': { age: 10, gender: 'female', symptom_duration_hours: 2 },
  'DEFAULT': { age: 45, gender: 'female', symptom_duration_hours: 4 },
};

function getStratumKey(age?: number | null, gender?: string | null): string {
  let ageGroup = 'ADULT';
  if (age !== undefined && age !== null) {
    if (age < 18) ageGroup = 'PEDIATRIC';
    else if (age >= 65) ageGroup = 'GERIATRIC';
  }
  const normGender = (gender?.toLowerCase() === 'male' || gender?.toLowerCase() === 'female')
    ? gender.toLowerCase()
    : 'other';

  return `${ageGroup}_${normGender}`;
}

export interface ImputationResult {
  imputedDemographics: ImputedPatientDemographics;
  imputedVariablesLog: ImputedVariableMeta[];
}

export class ImputationEngine {
  /**
   * Impute ONLY approved non-essential demographic & symptom duration fields.
   * NEVER impute essential vitals (SpO2, SBP, HR).
   */
  public static processNonEssentialImputation(demographics?: PatientDemographicsInput): ImputationResult {
    const raw = demographics || {};
    const stratumKey = getStratumKey(raw.age, raw.gender);
    const reference = STRATIFIED_REFERENCE_DATASET[stratumKey] || STRATIFIED_REFERENCE_DATASET['DEFAULT'];

    const imputedVariablesLog: ImputedVariableMeta[] = [];

    // 1. Age
    let age = raw.age;
    if (age === undefined || age === null || isNaN(age)) {
      age = reference.age;
      imputedVariablesLog.push({
        variable_name: 'demographics.age',
        imputed_value: age,
        strata: stratumKey,
        method: 'AGE_GENDER_STRATIFIED_MEDIAN',
      });
    }

    // 2. Gender
    let gender = raw.gender;
    if (!gender) {
      gender = reference.gender;
      imputedVariablesLog.push({
        variable_name: 'demographics.gender',
        imputed_value: gender,
        strata: stratumKey,
        method: 'AGE_GENDER_STRATIFIED_MEDIAN',
      });
    }

    // 3. Symptom duration
    let symptom_duration_hours = raw.symptom_duration_hours;
    if (symptom_duration_hours === undefined || symptom_duration_hours === null || isNaN(symptom_duration_hours)) {
      symptom_duration_hours = reference.symptom_duration_hours;
      imputedVariablesLog.push({
        variable_name: 'demographics.symptom_duration_hours',
        imputed_value: symptom_duration_hours,
        strata: stratumKey,
        method: 'AGE_GENDER_STRATIFIED_MEDIAN',
      });
    }

    const imputedDemographics: ImputedPatientDemographics = {
      age,
      gender: gender as 'male' | 'female' | 'other',
      immunosuppressed: Boolean(raw.immunosuppressed),
      chronic_comorbidities: Array.isArray(raw.chronic_comorbidities) ? raw.chronic_comorbidities : [],
      symptom_duration_hours,
    };

    return {
      imputedDemographics,
      imputedVariablesLog,
    };
  }
}
