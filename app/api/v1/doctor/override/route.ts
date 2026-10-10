import { NextRequest, NextResponse } from 'next/server';
import { OverrideService } from '@/modules/triage_engine/application/override_service';
import { TriageOrchestrator } from '@/modules/triage_engine/application/triage_orchestrator';
import { AuditService, AuditContext } from '@/modules/triage_engine/application/audit_service';
import { DoctorOverrideRequest, ApiSuccessEnvelope, ApiErrorEnvelope, UserRole } from '@/shared/types/triage';

export async function POST(req: NextRequest) {
  try {
    const userRole = (req.headers.get('x-user-role') || 'doctor') as UserRole;
    const doctorId = req.headers.get('x-user-id') || 'usr_doctor_01';
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'MediAI-Client/1.0';

    // RBAC: Attending Doctor ONLY
    if (userRole !== 'doctor') {
      const errorResp: ApiErrorEnvelope = {
        data: null,
        meta: { timestamp: new Date().toISOString() },
        error: {
          code: 'FORBIDDEN',
          message: 'Unauthorized: Only an Attending Doctor can perform clinical overrides or review confirmations.',
        },
      };
      return NextResponse.json(errorResp, { status: 403 });
    }

    const body: DoctorOverrideRequest = await req.json();

    if (!body || !body.assessment_id || !body.final_category) {
      const errorResp: ApiErrorEnvelope = {
        data: null,
        meta: { timestamp: new Date().toISOString() },
        error: {
          code: 'INVALID_INPUT',
          message: 'assessment_id and final_category are required.',
        },
      };
      return NextResponse.json(errorResp, { status: 400 });
    }

    const assessment = TriageOrchestrator.getAssessmentById(body.assessment_id);
    if (!assessment) {
      const errorResp: ApiErrorEnvelope = {
        data: null,
        meta: { timestamp: new Date().toISOString() },
        error: {
          code: 'NOT_FOUND',
          message: `Triage assessment with ID ${body.assessment_id} was not found.`,
        },
      };
      return NextResponse.json(errorResp, { status: 404 });
    }

    const validation = OverrideService.validateOverrideRequest(body, assessment.calculated_category, userRole);
    if (!validation.isValid) {
      const errorResp: ApiErrorEnvelope = {
        data: null,
        meta: { timestamp: new Date().toISOString() },
        error: {
          code: 'INVALID_OVERRIDE_RATIONALE',
          message: validation.error || 'Invalid override request.',
        },
      };
      return NextResponse.json(errorResp, { status: 400 });
    }

    const reviewRecord = OverrideService.createReviewRecord(assessment, body, doctorId);

    // Update assessment status in transaction
    assessment.status = reviewRecord.is_overridden ? 'OVERRIDDEN' : 'CONFIRMED';
    TriageOrchestrator.updateAssessmentRecord(assessment);

    const auditContext: AuditContext = {
      userId: doctorId,
      patientId: assessment.patient_id,
      actorRole: userRole,
      ipAddress: clientIp,
      userAgent,
    };

    const eventName = reviewRecord.is_overridden ? 'DOCTOR_OVERRIDE_SUBMITTED' : 'DOCTOR_ASSESSMENT_CONFIRMED';
    await AuditService.recordEvent(eventName, auditContext, {
      assessment_id: assessment.id,
      original_category: reviewRecord.original_category,
      final_category: reviewRecord.final_category,
      is_overridden: reviewRecord.is_overridden,
      override_reason: reviewRecord.override_reason,
    });

    const successResp: ApiSuccessEnvelope<{ review: typeof reviewRecord; updatedAssessment: typeof assessment }> = {
      data: {
        review: reviewRecord,
        updatedAssessment: assessment,
      },
      meta: { timestamp: new Date().toISOString() },
      error: null,
    };

    return NextResponse.json(successResp, { status: 200 });
  } catch (err: unknown) {
    const errorResp: ApiErrorEnvelope = {
      data: null,
      meta: { timestamp: new Date().toISOString() },
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An error occurred while processing doctor override.',
      },
    };
    return NextResponse.json(errorResp, { status: 500 });
  }
}
