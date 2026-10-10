import { describe, it, expect } from 'vitest';
import { evaluateRedFlags } from '@/modules/triage_engine/domain/red_flag_engine';
import { evaluateVitalWarnings, checkMissingEssentialVitals } from '@/modules/triage_engine/domain/vitals_baseline';
import { mapScoreToPriority, getCriticalRedFlagPriority } from '@/modules/triage_engine/domain/priority_mapper';

describe('Deterministic Red-Flag Safety Engine (100% Branch Coverage)', () => {
  it('handles empty/null inputs gracefully without throwing', () => {
    const res1 = evaluateRedFlags(null, null);
    expect(res1.hardRedFlagTriggered).toBe(false);
    expect(res1.flags).toHaveLength(0);

    const res2 = evaluateRedFlags({}, {});
    expect(res2.hardRedFlagTriggered).toBe(false);
    expect(res2.flags).toHaveLength(0);
  });

  describe('Domain 1: Infection/Sepsis', () => {
    it('triggers qSOFA >= 2 when RR >= 22 and SBP <= 100', () => {
      const res = evaluateRedFlags(
        { respiratory_rate: 24, systolic_bp: 95 },
        { altered_mentation: false }
      );
      expect(res.hardRedFlagTriggered).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'INF_QSOFA_GE_2')).toBe(true);
    });

    it('triggers qSOFA >= 2 with altered mentation and RR >= 22 (SBP unrecorded or normal)', () => {
      const res = evaluateRedFlags(
        { respiratory_rate: 24, systolic_bp: 120 },
        { altered_mentation: true }
      );
      expect(res.flags.some((f) => f.ruleCode === 'INF_QSOFA_GE_2')).toBe(true);
    });

    it('does NOT trigger qSOFA when score < 2', () => {
      const res = evaluateRedFlags(
        { respiratory_rate: 18, systolic_bp: 120 },
        { altered_mentation: false }
      );
      expect(res.flags.some((f) => f.ruleCode === 'INF_QSOFA_GE_2')).toBe(false);
    });

    it('triggers hypothermia when Temp < 35.0°C', () => {
      const res = evaluateRedFlags({ temperature_celsius: 34.5 }, {});
      expect(res.hardRedFlagTriggered).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'INF_HYPOTHERMIA')).toBe(true);
    });
  });

  describe('Domain 2: Respiratory', () => {
    it('triggers SpO2 < 90% on room air', () => {
      const res = evaluateRedFlags({ oxygen_saturation: 88, room_air: true }, {});
      expect(res.hardRedFlagTriggered).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'RESP_SPO2_LT_90')).toBe(true);
    });

    it('does NOT trigger SpO2 < 90% when on supplemental oxygen (room_air = false)', () => {
      const res = evaluateRedFlags({ oxygen_saturation: 88, room_air: false }, {});
      expect(res.flags.some((f) => f.ruleCode === 'RESP_SPO2_LT_90')).toBe(false);
    });

    it('triggers cyanosis, stridor, RR > 32, and RR < 8', () => {
      const res1 = evaluateRedFlags({}, { cyanosis: true });
      expect(res1.flags.some((f) => f.ruleCode === 'RESP_CYANOSIS')).toBe(true);

      const res2 = evaluateRedFlags({}, { audible_stridor: true });
      expect(res2.flags.some((f) => f.ruleCode === 'RESP_STRIDOR')).toBe(true);

      const res3 = evaluateRedFlags({ respiratory_rate: 34 }, {});
      expect(res3.flags.some((f) => f.ruleCode === 'RESP_RR_EXTREME')).toBe(true);

      const res4 = evaluateRedFlags({ respiratory_rate: 7 }, {});
      expect(res4.flags.some((f) => f.ruleCode === 'RESP_RR_EXTREME')).toBe(true);
    });
  });

  describe('Domain 3: Cardiac', () => {
    it('triggers crushing retrosternal pain radiating to jaw/left arm', () => {
      const res = evaluateRedFlags({}, { retrosternal_chest_pain: true, pain_radiating_jaw_left_arm: true });
      expect(res.hardRedFlagTriggered).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'CARD_CHEST_PAIN')).toBe(true);
    });

    it('triggers syncope with chest pressure', () => {
      const res = evaluateRedFlags({}, { syncope_with_chest_pressure: true });
      expect(res.flags.some((f) => f.ruleCode === 'CARD_SYNCOPE')).toBe(true);
    });

    it('triggers extreme HR (> 150 or < 40)', () => {
      const resHigh = evaluateRedFlags({ heart_rate: 155 }, {});
      expect(resHigh.flags.some((f) => f.ruleCode === 'CARD_HR_EXTREME')).toBe(true);

      const resLow = evaluateRedFlags({ heart_rate: 38 }, {});
      expect(resLow.flags.some((f) => f.ruleCode === 'CARD_HR_EXTREME')).toBe(true);

      // Boundary tests
      const res150 = evaluateRedFlags({ heart_rate: 150 }, {});
      expect(res150.flags.some((f) => f.ruleCode === 'CARD_HR_EXTREME')).toBe(false);

      const res40 = evaluateRedFlags({ heart_rate: 40 }, {});
      expect(res40.flags.some((f) => f.ruleCode === 'CARD_HR_EXTREME')).toBe(false);
    });
  });

  describe('Domain 4: Neurological', () => {
    it('triggers focal neurological deficits (facial droop, arm drift, slurred speech)', () => {
      const res1 = evaluateRedFlags({}, { facial_droop: true });
      expect(res1.flags.some((f) => f.ruleCode === 'NEURO_FOCAL_DEFICIT')).toBe(true);

      const res2 = evaluateRedFlags({}, { arm_drift: true });
      expect(res2.flags.some((f) => f.ruleCode === 'NEURO_FOCAL_DEFICIT')).toBe(true);

      const res3 = evaluateRedFlags({}, { slurred_speech: true });
      expect(res3.flags.some((f) => f.ruleCode === 'NEURO_FOCAL_DEFICIT')).toBe(true);
    });

    it('triggers GCS < 12 and status epilepticus', () => {
      const resGCS = evaluateRedFlags({}, { gcs_score: 10 });
      expect(resGCS.flags.some((f) => f.ruleCode === 'NEURO_GCS_LT_12')).toBe(true);

      const resEpi = evaluateRedFlags({}, { status_epilepticus: true });
      expect(resEpi.flags.some((f) => f.ruleCode === 'NEURO_STATUS_EPILEPTICUS')).toBe(true);
    });
  });

  describe('Domain 5: Blood Pressure Abnormalities', () => {
    it('triggers hypertensive crisis (SBP > 180 or DBP > 120) with headache/chest pain', () => {
      const res1 = evaluateRedFlags({ systolic_bp: 190, diastolic_bp: 100 }, { hypertensive_headache_or_chest_pain: true });
      expect(res1.flags.some((f) => f.ruleCode === 'BP_HYPERTENSIVE_CRISIS')).toBe(true);

      const res2 = evaluateRedFlags({ systolic_bp: 140, diastolic_bp: 125 }, { hypertensive_headache_or_chest_pain: true });
      expect(res2.flags.some((f) => f.ruleCode === 'BP_HYPERTENSIVE_CRISIS')).toBe(true);

      // Without headache/chest pain
      const resNoSymptoms = evaluateRedFlags({ systolic_bp: 190 }, { hypertensive_headache_or_chest_pain: false });
      expect(resNoSymptoms.flags.some((f) => f.ruleCode === 'BP_HYPERTENSIVE_CRISIS')).toBe(false);

      // With DBP > 120 without headache/chest pain
      const resDBPNoSymptoms = evaluateRedFlags({ diastolic_bp: 125 }, { hypertensive_headache_or_chest_pain: false });
      expect(resDBPNoSymptoms.flags.some((f) => f.ruleCode === 'BP_HYPERTENSIVE_CRISIS')).toBe(false);

      // Normal BP with headache/chest pain
      const resNormalBP = evaluateRedFlags({ systolic_bp: 120, diastolic_bp: 80 }, { hypertensive_headache_or_chest_pain: true });
      expect(resNormalBP.flags.some((f) => f.ruleCode === 'BP_HYPERTENSIVE_CRISIS')).toBe(false);
    });

    it('triggers profound shock when SBP < 85 mmHg', () => {
      const res = evaluateRedFlags({ systolic_bp: 80 }, {});
      expect(res.flags.some((f) => f.ruleCode === 'BP_PROFOUND_SHOCK')).toBe(true);
    });
  });

  describe('Domain 6: Diabetes-Related Risks', () => {
    it('triggers hypoglycemia (CBG < 60 with altered consciousness)', () => {
      const res = evaluateRedFlags({ capillary_blood_glucose: 50 }, { altered_consciousness: true });
      expect(res.flags.some((f) => f.ruleCode === 'DIAB_HYPOGLYCEMIA')).toBe(true);
    });

    it('triggers DKA (CBG > 400 with ketotic breathing)', () => {
      const res = evaluateRedFlags({ capillary_blood_glucose: 450 }, { ketotic_breathing: true });
      expect(res.flags.some((f) => f.ruleCode === 'DIAB_DKA')).toBe(true);
    });
  });

  describe('Domain 7: GI Issues', () => {
    it('triggers massive hematemesis, guarding, and melena with instability', () => {
      const res1 = evaluateRedFlags({}, { massive_hematemesis: true });
      expect(res1.flags.some((f) => f.ruleCode === 'GI_HEMATEMESIS')).toBe(true);

      const res2 = evaluateRedFlags({}, { involuntary_abdominal_guarding: true });
      expect(res2.flags.some((f) => f.ruleCode === 'GI_GUARDING')).toBe(true);

      const res3 = evaluateRedFlags({}, { melena_present: true, hemodynamic_instability: true });
      expect(res3.flags.some((f) => f.ruleCode === 'GI_MELENA_INSTABILITY')).toBe(true);
    });
  });

  describe('Domain 8: Injury & Trauma', () => {
    it('triggers trauma red flags', () => {
      const res1 = evaluateRedFlags({}, { pulsatile_arterial_hemorrhage: true });
      expect(res1.flags.some((f) => f.ruleCode === 'TRAUMA_HEMORRHAGE')).toBe(true);

      const res2 = evaluateRedFlags({}, { flail_chest: true });
      expect(res2.flags.some((f) => f.ruleCode === 'TRAUMA_FLAIL_CHEST')).toBe(true);

      const res3 = evaluateRedFlags({}, { suspected_acute_spinal_cord_injury: true });
      expect(res3.flags.some((f) => f.ruleCode === 'TRAUMA_SPINAL')).toBe(true);

      const res4 = evaluateRedFlags({}, { traumatic_amputation: true });
      expect(res4.flags.some((f) => f.ruleCode === 'TRAUMA_AMPUTATION')).toBe(true);
    });
  });

  describe('Domain 9: Pregnancy-Related Risks', () => {
    it('triggers pregnancy flags only when gestational_age > 20 wks', () => {
      const resValid = evaluateRedFlags({}, { gestational_age_weeks: 24, third_trimester_vaginal_hemorrhage: true });
      expect(resValid.flags.some((f) => f.ruleCode === 'PREG_HEMORRHAGE')).toBe(true);

      const resEarly = evaluateRedFlags({}, { gestational_age_weeks: 16, third_trimester_vaginal_hemorrhage: true });
      expect(resEarly.flags.some((f) => f.ruleCode === 'PREG_HEMORRHAGE')).toBe(false);

      const resEclampsia = evaluateRedFlags({}, { gestational_age_weeks: 32, severe_epigastric_pain_with_aura: true, eclamptic_convulsions: true });
      expect(resEclampsia.flags.some((f) => f.ruleCode === 'PREG_ECLAMPSIA_AURA')).toBe(true);
      expect(resEclampsia.flags.some((f) => f.ruleCode === 'PREG_ECLAMPSIA_CONVULSION')).toBe(true);
    });
  });

  describe('Domain 10: Allergic Reactions', () => {
    it('triggers allergy flags', () => {
      const res1 = evaluateRedFlags({}, { angioedema_tongue_pharynx: true });
      expect(res1.flags.some((f) => f.ruleCode === 'ALLERGY_ANGIOEDEMA')).toBe(true);

      const res2 = evaluateRedFlags({}, { acute_stridor: true });
      expect(res2.flags.some((f) => f.ruleCode === 'ALLERGY_STRIDOR')).toBe(true);

      const res3 = evaluateRedFlags({ systolic_bp: 80 }, { wheezing_present: true });
      expect(res3.flags.some((f) => f.ruleCode === 'ALLERGY_WHEEZE_HYPOTENSION')).toBe(true);

      const res4 = evaluateRedFlags({}, { wheezing_present: true, systemic_hypotension: true });
      expect(res4.flags.some((f) => f.ruleCode === 'ALLERGY_WHEEZE_HYPOTENSION')).toBe(true);
    });
  });

  describe('Domain 11: Dehydration & Fluid Balance', () => {
    it('triggers dehydration flags', () => {
      const res1 = evaluateRedFlags({}, { anuria_over_12h: true });
      expect(res1.flags.some((f) => f.ruleCode === 'DEHYD_ANURIA')).toBe(true);

      const res2 = evaluateRedFlags({}, { severe_skin_tenting: true });
      expect(res2.flags.some((f) => f.ruleCode === 'DEHYD_SKIN_TENTING')).toBe(true);

      const res3 = evaluateRedFlags({}, { cold_extremities: true, capillary_refill_seconds: 5 });
      expect(res3.flags.some((f) => f.ruleCode === 'DEHYD_COLD_EXT_CAP_REFILL')).toBe(true);

      // Cold extremities with cap refill <= 4s
      const res4 = evaluateRedFlags({}, { cold_extremities: true, capillary_refill_seconds: 3 });
      expect(res4.flags.some((f) => f.ruleCode === 'DEHYD_COLD_EXT_CAP_REFILL')).toBe(false);

      // Warm extremities with cap refill > 4s
      const res5 = evaluateRedFlags({}, { cold_extremities: false, capillary_refill_seconds: 5 });
      expect(res5.flags.some((f) => f.ruleCode === 'DEHYD_COLD_EXT_CAP_REFILL')).toBe(false);
    });
  });

  describe('Domain 12: Multi-System / Toxic Exposure', () => {
    it('triggers organophosphate and venomous bite flags', () => {
      const res1 = evaluateRedFlags({}, { sludge_signs: true });
      expect(res1.flags.some((f) => f.ruleCode === 'TOXIC_SLUDGE')).toBe(true);

      const res2 = evaluateRedFlags({}, { venomous_bite_with_ptosis: true });
      expect(res2.flags.some((f) => f.ruleCode === 'TOXIC_VENOM_PTOSIS')).toBe(true);
    });
  });

  describe('Standalone Vital Baseline Critical Triggers', () => {
    it('triggers standalone critical vital flags', () => {
      const res = evaluateRedFlags({
        heart_rate: 160,
        respiratory_rate: 35,
        systolic_bp: 190,
        diastolic_bp: 125,
        oxygen_saturation: 85,
        temperature_celsius: 40.5,
        capillary_blood_glucose: 450,
      });

      expect(res.hardRedFlagTriggered).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'VITAL_HR_CRITICAL')).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'VITAL_RR_CRITICAL')).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'VITAL_SBP_CRITICAL')).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'VITAL_DBP_CRITICAL')).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'VITAL_SPO2_CRITICAL')).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'VITAL_TEMP_CRITICAL')).toBe(true);
      expect(res.flags.some((f) => f.ruleCode === 'VITAL_CBG_CRITICAL')).toBe(true);
    });
  });
});

describe('Vital Warnings & Missing Vitals Utility', () => {
  it('correctly detects warning band values including CBG upper warning', () => {
    const warnings = evaluateVitalWarnings({
      heart_rate: 45,
      respiratory_rate: 25,
      systolic_bp: 150,
      diastolic_bp: 95,
      oxygen_saturation: 92,
      temperature_celsius: 38.5,
      capillary_blood_glucose: 250,
    });
    expect(warnings).toHaveLength(7);
  });

  it('handles normal/unrecorded vitals without warnings', () => {
    const warnings = evaluateVitalWarnings({
      heart_rate: 75,
      respiratory_rate: 16,
      systolic_bp: 115,
      diastolic_bp: 75,
      oxygen_saturation: 98,
      temperature_celsius: 36.8,
      capillary_blood_glucose: 90,
    });
    expect(warnings).toHaveLength(0);
  });

  it('identifies missing essential vitals individually', () => {
    const check1 = checkMissingEssentialVitals({ heart_rate: 80 });
    expect(check1.isMissingEssential).toBe(true);
    expect(check1.missingFields).toContain('SpO2');
    expect(check1.missingFields).toContain('SBP');

    const check2 = checkMissingEssentialVitals({ systolic_bp: 120 });
    expect(check2.missingFields).toContain('SpO2');
    expect(check2.missingFields).toContain('Heart Rate');

    const check3 = checkMissingEssentialVitals({ oxygen_saturation: 98 });
    expect(check3.missingFields).toContain('SBP');
    expect(check3.missingFields).toContain('Heart Rate');

    const checkFull = checkMissingEssentialVitals({ heart_rate: 80, systolic_bp: 120, oxygen_saturation: 98 });
    expect(checkFull.isMissingEssential).toBe(false);
  });
});

describe('Priority Mapper', () => {
  it('correctly maps scores to priority categories', () => {
    expect(mapScoreToPriority(90).category).toBe('CRITICAL');
    expect(mapScoreToPriority(70).category).toBe('HIGH');
    expect(mapScoreToPriority(45).category).toBe('MODERATE');
    expect(mapScoreToPriority(15).category).toBe('LOW');
  });

  it('returns Critical Priority 1 for red-flag override', () => {
    const p1 = getCriticalRedFlagPriority();
    expect(p1.category).toBe('CRITICAL');
    expect(p1.priorityCode).toBe('P1');
  });
});
