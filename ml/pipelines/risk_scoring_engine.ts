import { AcuityCategory } from '@/shared/types/triage';
import { VitalSignsInput, ImputedPatientDemographics } from '@/shared/types/m3';

export interface ScoreComponents {
  s_vitals: number;
  s_symptoms: number;
  s_demographics: number;
  s_delta: number;
  final_score: number;
}

export class RiskScoringEngine {
  /**
   * Calculate S_vitals (0-100) based on physiological deviations.
   */
  public static calculateSVitals(vitals: VitalSignsInput): { s_vitals: number; missingEssential: string[] } {
    const missingEssential: string[] = [];
    const subScores: number[] = [];

    // Essential 1: Heart Rate
    if (vitals.heart_rate === undefined || vitals.heart_rate === null || isNaN(vitals.heart_rate)) {
      missingEssential.push('heart_rate');
    } else {
      const hr = vitals.heart_rate;
      if (hr < 40 || hr > 150) subScores.push(100);
      else if ((hr >= 40 && hr <= 49) || (hr >= 110 && hr <= 149)) subScores.push(50);
      else subScores.push(0);
    }

    // Essential 2: Systolic BP
    if (vitals.systolic_bp === undefined || vitals.systolic_bp === null || isNaN(vitals.systolic_bp)) {
      missingEssential.push('systolic_bp');
    } else {
      const sbp = vitals.systolic_bp;
      if (sbp < 85 || sbp > 180) subScores.push(100);
      else if ((sbp >= 85 && sbp <= 89) || (sbp >= 140 && sbp <= 179)) subScores.push(50);
      else subScores.push(0);
    }

    // Essential 3: SpO2
    if (vitals.oxygen_saturation === undefined || vitals.oxygen_saturation === null || isNaN(vitals.oxygen_saturation)) {
      missingEssential.push('oxygen_saturation');
    } else {
      const spo2 = vitals.oxygen_saturation;
      if (spo2 < 90) subScores.push(100);
      else if (spo2 >= 90 && spo2 <= 93) subScores.push(60);
      else subScores.push(0);
    }

    // Non-essential 4: Respiratory Rate
    if (vitals.respiratory_rate !== undefined && vitals.respiratory_rate !== null && !isNaN(vitals.respiratory_rate)) {
      const rr = vitals.respiratory_rate;
      if (rr < 8 || rr > 32) subScores.push(100);
      else if (rr >= 22 && rr <= 32) subScores.push(50);
      else subScores.push(0);
    }

    // Non-essential 5: Diastolic BP
    if (vitals.diastolic_bp !== undefined && vitals.diastolic_bp !== null && !isNaN(vitals.diastolic_bp)) {
      const dbp = vitals.diastolic_bp;
      if (dbp > 120) subScores.push(90);
      else if (dbp >= 90 && dbp <= 119) subScores.push(40);
      else subScores.push(0);
    }

    // Non-essential 6: Temperature
    if (vitals.temperature_celsius !== undefined && vitals.temperature_celsius !== null && !isNaN(vitals.temperature_celsius)) {
      const temp = vitals.temperature_celsius;
      if (temp < 35.0 || temp > 40.0) subScores.push(90);
      else if ((temp >= 35.0 && temp <= 35.9) || (temp >= 38.3 && temp <= 39.9)) subScores.push(40);
      else subScores.push(0);
    }

    // Non-essential 7: Capillary Blood Glucose
    if (vitals.capillary_blood_glucose !== undefined && vitals.capillary_blood_glucose !== null && !isNaN(vitals.capillary_blood_glucose)) {
      const cbg = vitals.capillary_blood_glucose;
      if (cbg < 60 || cbg > 400) subScores.push(90);
      else if ((cbg >= 60 && cbg <= 69) || (cbg >= 200 && cbg <= 399)) subScores.push(40);
      else subScores.push(0);
    }

    if (subScores.length === 0) {
      return { s_vitals: 0, missingEssential };
    }

    // Calculate maximum & weighted average for physiological deviation
    const maxSub = Math.max(...subScores);
    const avgSub = subScores.reduce((acc, curr) => acc + curr, 0) / subScores.length;
    const s_vitals = Math.min(100, Math.round(0.7 * maxSub + 0.3 * avgSub));

    return { s_vitals, missingEssential };
  }

  /**
   * Calculate S_symptoms (0-100) based on symptom vector & chief complaint.
   */
  public static calculateSSymptoms(chiefComplaint: string, symptomVector: Record<string, any>): number {
    let score = 0;
    const text = (chiefComplaint + ' ' + JSON.stringify(symptomVector)).toLowerCase();

    // Critical high-risk keywords
    if (
      text.includes('chest pain') ||
      text.includes('shortness of breath') ||
      text.includes('stridor') ||
      text.includes('facial droop') ||
      text.includes('slurred speech') ||
      text.includes('unconscious') ||
      text.includes('severe bleeding') ||
      text.includes('anaphylaxis')
    ) {
      score += 75;
    } else if (
      text.includes('dyspnea') ||
      text.includes('palpitations') ||
      text.includes('abdominal pain') ||
      text.includes('high fever') ||
      text.includes('altered mentation')
    ) {
      score += 50;
    } else if (
      text.includes('dizziness') ||
      text.includes('vomiting') ||
      text.includes('cough') ||
      text.includes('headache')
    ) {
      score += 25;
    } else {
      score += 10;
    }

    // Check specific flags in symptom vector
    if (symptomVector.chest_pain_radiating) score += 15;
    if (symptomVector.diaphoresis) score += 10;
    if (symptomVector.cyanosis) score += 20;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate S_demographics (0-100) based on age, immunosuppression, comorbidities.
   */
  public static calculateSDemographics(demographics: ImputedPatientDemographics): number {
    let score = 0;

    // Age factor
    if (demographics.age >= 65) score += 40;
    else if (demographics.age < 2) score += 20;
    else if (demographics.age >= 50) score += 15;

    // Immunosuppression
    if (demographics.immunosuppressed) score += 40;

    // Chronic comorbidities
    const comorbCount = demographics.chronic_comorbidities ? demographics.chronic_comorbidities.length : 0;
    score += Math.min(40, comorbCount * 20);

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate S_delta (0-20) trajectory index.
   */
  public static calculateSDelta(rawDelta?: number): number {
    if (rawDelta === undefined || rawDelta === null || isNaN(rawDelta)) return 0;
    return Math.min(20, Math.max(0, Math.round(rawDelta)));
  }

  /**
   * Calculate full composite risk score:
   * Score = 0.50 * S_vitals + 0.35 * S_symptoms + 0.15 * S_demographics + S_delta
   */
  public static calculateMasterScore(
    vitals: VitalSignsInput,
    chiefComplaint: string,
    symptomVector: Record<string, any>,
    demographics: ImputedPatientDemographics,
    previousVitalsDelta?: number
  ): { components: ScoreComponents; missingEssential: string[] } {
    const { s_vitals, missingEssential } = this.calculateSVitals(vitals);
    const s_symptoms = this.calculateSSymptoms(chiefComplaint, symptomVector);
    const s_demographics = this.calculateSDemographics(demographics);
    const s_delta = this.calculateSDelta(previousVitalsDelta);

    const rawScore = 0.50 * s_vitals + 0.35 * s_symptoms + 0.15 * s_demographics + s_delta;
    const final_score = Math.min(100, Math.max(0, Math.round(rawScore)));

    return {
      components: {
        s_vitals,
        s_symptoms,
        s_demographics,
        s_delta,
        final_score,
      },
      missingEssential,
    };
  }

  /**
   * Map numeric score (0-100) to Acuity Category:
   * - CRITICAL: 85-100
   * - HIGH: 60-84
   * - MODERATE: 30-59
   * - LOW: 0-29
   */
  public static mapScoreToCategory(score: number): AcuityCategory {
    const rounded = Math.min(100, Math.max(0, Math.round(score)));
    if (rounded >= 85) return 'CRITICAL';
    if (rounded >= 60) return 'HIGH';
    if (rounded >= 30) return 'MODERATE';
    return 'LOW';
  }
}
