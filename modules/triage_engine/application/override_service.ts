import { TriageUserRole, AcuityCategory, DoctorOverrideRequest, TriageReviewRecord, TriageAssessmentRecord } from '@/shared/types/triage';

export class OverrideService {
  private static validCategories: AcuityCategory[] = ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'];

  static validateOverrideRequest(req: DoctorOverrideRequest, originalCategory: AcuityCategory, role: TriageUserRole): {
    isValid: boolean;
    error?: string;
  } {
    // Only Attending Doctor may perform an override/confirmation
    if (role !== 'doctor') {
      return { isValid: false, error: 'Unauthorized: Only an Attending Doctor can review or override triage acuity.' };
    }

    if (!this.validCategories.includes(req.final_category)) {
      return { isValid: false, error: `Invalid category: final_category must be one of ${this.validCategories.join(', ')}` };
    }

    // Require rationale if category is modified
    const isCategoryChanged = req.final_category !== originalCategory;
    if (isCategoryChanged && (!req.override_reason || req.override_reason.trim() === '')) {
      return { isValid: false, error: 'Clinical override rationale is mandatory when changing the triage category.' };
    }

    return { isValid: true };
  }

  static createReviewRecord(
    assessment: TriageAssessmentRecord,
    req: DoctorOverrideRequest,
    doctorId: string
  ): TriageReviewRecord {
    const isOverridden = req.final_category !== assessment.calculated_category;

    return {
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      assessment_id: assessment.id,
      doctor_id: doctorId,
      original_category: assessment.calculated_category,
      final_category: req.final_category,
      is_overridden: isOverridden,
      override_reason: req.override_reason || null,
      clinical_notes: req.clinical_notes || null,
      reviewed_at: new Date().toISOString(),
    };
  }
}
