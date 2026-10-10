import { NextRequest, NextResponse } from 'next/server';
import { TriageOrchestrator } from '@/modules/triage_engine/application/triage_orchestrator';
import { AuditContext } from '@/modules/triage_engine/application/audit_service';
import { ApiSuccessEnvelope, ApiErrorEnvelope, UserRole } from '@/shared/types/triage';

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const userRole = (req.headers.get('x-user-role') || 'nurse') as UserRole;
    const userId = req.headers.get('x-user-id') || 'usr_intake_system';
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'MediAI-Client/1.0';

    // RBAC: Patient cannot invoke full triage assessment API directly with arbitrary patient_id
    if (userRole === 'patient') {
      const errorResp: ApiErrorEnvelope = {
        data: null,
        meta: { timestamp: new Date().toISOString() },
        error: {
          code: 'FORBIDDEN',
          message: 'Access Denied: Patients cannot invoke triage assessment directly.',
        },
      };
      return NextResponse.json(errorResp, { status: 403 });
    }

    const body = await req.json();

    if (!body || !body.patient_id || !body.chief_complaint) {
      const errorResp: ApiErrorEnvelope = {
        data: null,
        meta: { timestamp: new Date().toISOString() },
        error: {
          code: 'INVALID_INPUT',
          message: 'Validation failed: patient_id and chief_complaint are required.',
          details: [{ field: 'chief_complaint', issue: 'Missing required field' }],
        },
      };
      return NextResponse.json(errorResp, { status: 400 });
    }

    // Check vitals range
    const rangeCheck = TriageOrchestrator.validateVitalsRange(body.vital_signs);
    if (!rangeCheck.isValid) {
      const errorResp: ApiErrorEnvelope = {
        data: null,
        meta: { timestamp: new Date().toISOString() },
        error: {
          code: 'INVALID_VITAL_RANGE',
          message: rangeCheck.error || 'Vital sign out of physiological bounds',
        },
      };
      return NextResponse.json(errorResp, { status: 400 });
    }

    const auditContext: AuditContext = {
      userId,
      patientId: body.patient_id,
      actorRole: userRole,
      ipAddress: clientIp,
      userAgent,
    };

    const orchestrator = new TriageOrchestrator();
    const result = await orchestrator.assess(body, auditContext);

    const successResp: ApiSuccessEnvelope<typeof result> = {
      data: result,
      meta: { timestamp: new Date().toISOString() },
      error: null,
    };

    return NextResponse.json(successResp, { status: 200 });
  } catch (err: unknown) {
    const errorResp: ApiErrorEnvelope = {
      data: null,
      meta: { timestamp: new Date().toISOString() },
      error: {
        code: 'INTERNAL_SAFETY_ERROR',
        message: 'A critical internal error occurred during triage safety evaluation.',
      },
    };
    return NextResponse.json(errorResp, { status: 500 });
  }
}
