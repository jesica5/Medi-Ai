import { VitalSignsInput, RedFlagDetail } from '@/shared/types/triage';

export interface VitalWarningBand {
  parameter: string;
  observed: string;
  normalRange: string;
}

export function evaluateVitalStandaloneCritical(vitals: VitalSignsInput): RedFlagDetail[] {
  const flags: RedFlagDetail[] = [];

  const hr = vitals.heart_rate ?? null;
  const rr = vitals.respiratory_rate ?? null;
  const sbp = vitals.systolic_bp ?? null;
  const dbp = vitals.diastolic_bp ?? null;
  const spo2 = vitals.oxygen_saturation ?? null;
  const temp = vitals.temperature_celsius ?? null;
  const cbg = vitals.capillary_blood_glucose ?? null;
  const isRoomAir = vitals.room_air !== false;

  // HR < 40 or > 150
  if (hr !== null && (hr < 40 || hr > 150)) {
    flags.push({
      domain: 'Vital Safety Baseline',
      ruleCode: 'VITAL_HR_CRITICAL',
      observed: `Heart Rate = ${hr} bpm`,
      threshold: 'HR < 40 or > 150 bpm',
    });
  }

  // RR < 8 or > 32
  if (rr !== null && (rr < 8 || rr > 32)) {
    flags.push({
      domain: 'Vital Safety Baseline',
      ruleCode: 'VITAL_RR_CRITICAL',
      observed: `Respiratory Rate = ${rr} bpm`,
      threshold: 'RR < 8 or > 32 bpm',
    });
  }

  // SBP < 85 or > 180
  if (sbp !== null && (sbp < 85 || sbp > 180)) {
    flags.push({
      domain: 'Vital Safety Baseline',
      ruleCode: 'VITAL_SBP_CRITICAL',
      observed: `Systolic BP = ${sbp} mmHg`,
      threshold: 'SBP < 85 or > 180 mmHg',
    });
  }

  // DBP > 120
  if (dbp !== null && dbp > 120) {
    flags.push({
      domain: 'Vital Safety Baseline',
      ruleCode: 'VITAL_DBP_CRITICAL',
      observed: `Diastolic BP = ${dbp} mmHg`,
      threshold: 'DBP > 120 mmHg',
    });
  }

  // SpO2 < 90%
  if (isRoomAir && spo2 !== null && spo2 < 90) {
    flags.push({
      domain: 'Vital Safety Baseline',
      ruleCode: 'VITAL_SPO2_CRITICAL',
      observed: `SpO2 = ${spo2}%`,
      threshold: 'SpO2 < 90% on room air',
    });
  }

  // Temp < 35.0 or > 40.0 C
  if (temp !== null && (temp < 35.0 || temp > 40.0)) {
    flags.push({
      domain: 'Vital Safety Baseline',
      ruleCode: 'VITAL_TEMP_CRITICAL',
      observed: `Body Temperature = ${temp}°C`,
      threshold: 'Temp < 35.0°C or > 40.0°C',
    });
  }

  // CBG < 60 or > 400
  if (cbg !== null && (cbg < 60 || cbg > 400)) {
    flags.push({
      domain: 'Vital Safety Baseline',
      ruleCode: 'VITAL_CBG_CRITICAL',
      observed: `Capillary Glucose = ${cbg} mg/dL`,
      threshold: 'CBG < 60 or > 400 mg/dL',
    });
  }

  return flags;
}

export function evaluateVitalWarnings(vitals: VitalSignsInput): VitalWarningBand[] {
  const warnings: VitalWarningBand[] = [];
  const hr = vitals.heart_rate ?? null;
  const rr = vitals.respiratory_rate ?? null;
  const sbp = vitals.systolic_bp ?? null;
  const dbp = vitals.diastolic_bp ?? null;
  const spo2 = vitals.oxygen_saturation ?? null;
  const temp = vitals.temperature_celsius ?? null;
  const cbg = vitals.capillary_blood_glucose ?? null;

  if (hr !== null && ((hr >= 40 && hr <= 49) || (hr >= 110 && hr <= 149))) {
    warnings.push({ parameter: 'Heart Rate', observed: `${hr} bpm`, normalRange: '50-100 bpm' });
  }

  if (rr !== null && rr >= 22 && rr <= 32) {
    warnings.push({ parameter: 'Respiratory Rate', observed: `${rr} bpm`, normalRange: '12-20 bpm' });
  }

  if (sbp !== null && ((sbp >= 85 && sbp <= 89) || (sbp >= 140 && sbp <= 179))) {
    warnings.push({ parameter: 'Systolic BP', observed: `${sbp} mmHg`, normalRange: '90-120 mmHg' });
  }

  if (dbp !== null && dbp >= 90 && dbp <= 119) {
    warnings.push({ parameter: 'Diastolic BP', observed: `${dbp} mmHg`, normalRange: '60-80 mmHg' });
  }

  if (spo2 !== null && spo2 >= 90 && spo2 <= 93) {
    warnings.push({ parameter: 'Oxygen Saturation', observed: `${spo2}%`, normalRange: '95-100%' });
  }

  if (temp !== null && ((temp >= 35.0 && temp <= 35.9) || (temp >= 38.3 && temp <= 39.9))) {
    warnings.push({ parameter: 'Body Temperature', observed: `${temp}°C`, normalRange: '36.5-37.5°C' });
  }

  if (cbg !== null && ((cbg >= 60 && cbg <= 69) || (cbg >= 200 && cbg <= 399))) {
    warnings.push({ parameter: 'Capillary Glucose', observed: `${cbg} mg/dL`, normalRange: '70-140 mg/dL' });
  }

  return warnings;
}

export function checkMissingEssentialVitals(vitals: VitalSignsInput): {
  isMissingEssential: boolean;
  missingFields: string[];
} {
  const missingFields: string[] = [];

  if (vitals.oxygen_saturation === undefined || vitals.oxygen_saturation === null) {
    missingFields.push('SpO2');
  }
  if (vitals.systolic_bp === undefined || vitals.systolic_bp === null) {
    missingFields.push('SBP');
  }
  if (vitals.heart_rate === undefined || vitals.heart_rate === null) {
    missingFields.push('Heart Rate');
  }

  return {
    isMissingEssential: missingFields.length > 0,
    missingFields,
  };
}
