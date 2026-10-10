import { NextRequest, NextResponse } from 'next/server';
import { QueueService } from '@/modules/triage_engine/application/queue_service';
import { TriageOrchestrator } from '@/modules/triage_engine/application/triage_orchestrator';
import { ApiSuccessEnvelope, ApiErrorEnvelope, UserRole } from '@/shared/types/triage';

export async function GET(req: NextRequest) {
  try {
    const userRole = (req.headers.get('x-user-role') || 'doctor') as UserRole;

    // RBAC: Only Attending Doctor & Triage Nurse can access doctor queue
    if (userRole !== 'doctor' && userRole !== 'nurse' && userRole !== 'admin') {
      const errorResp: ApiErrorEnvelope = {
        data: null,
        meta: { timestamp: new Date().toISOString() },
        error: {
          code: 'FORBIDDEN',
          message: 'Access Denied: Only attending doctors and triage nurses may access the priority queue.',
        },
      };
      return NextResponse.json(errorResp, { status: 403 });
    }

    const assessments = TriageOrchestrator.getAllAssessments();
    const pendingAssessments = assessments.filter((a) => a.status === 'PENDING_REVIEW');

    const formattedItems = pendingAssessments.map((a) => QueueService.formatQueueItem(a, userRole));
    const sortedQueue = QueueService.sortQueue(formattedItems);

    const responseEnvelope: ApiSuccessEnvelope<{ queue: typeof sortedQueue; totalPending: number }> = {
      data: {
        queue: sortedQueue,
        totalPending: sortedQueue.length,
      },
      meta: { timestamp: new Date().toISOString() },
      error: null,
    };

    return NextResponse.json(responseEnvelope, { status: 200 });
  } catch (err: unknown) {
    const errorResp: ApiErrorEnvelope = {
      data: null,
      meta: { timestamp: new Date().toISOString() },
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve doctor triage queue.',
      },
    };
    return NextResponse.json(errorResp, { status: 500 });
  }
}
