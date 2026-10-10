import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as assessPOST } from '@/app/api/v1/triage/assess/route';
import { GET as queueGET } from '@/app/api/v1/doctor/queue/route';
import { POST as overridePOST } from '@/app/api/v1/doctor/override/route';
import { AuditService } from '@/modules/triage_engine/application/audit_service';
import { TriageOrchestrator } from '@/modules/triage_engine/application/triage_orchestrator';

describe('E2E Full Workflow: Intake -> Safety -> Queue -> Alert -> Override -> Audit', () => {
  beforeEach(() => {
    AuditService.clearAuditLogs();
    TriageOrchestrator.clearStore();
  });

  it('runs complete lifecycle from patient intake to doctor override with audit trail', async () => {
    // 1. Nurse submits intake with Sepsis qSOFA criteria (RR=24, SBP=95, altered_mentation=true)
    const assessReq = new NextRequest('http://localhost:3000/api/v1/triage/assess', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-role': 'nurse',
        'x-user-id': 'nurse_intake_101',
        'x-forwarded-for': '192.168.1.50',
      },
      body: JSON.stringify({
        patient_id: 'pat_e2e_001',
        chief_complaint: 'High fever, confusion, and tachypnea',
        vital_signs: {
          respiratory_rate: 24,
          systolic_bp: 95,
          heart_rate: 110,
          temperature_celsius: 38.8,
        },
        symptom_vector: {
          altered_mentation: true,
        },
      }),
    });

    const assessRes = await assessPOST(assessReq);
    expect(assessRes.status).toBe(200);

    const assessJson = await assessRes.json();
    const assessmentId = assessJson.data.assessment.id;

    // Verify Red Flag triggered & CRITICAL P1 assigned
    expect(assessJson.data.assessment.calculated_category).toBe('CRITICAL');
    expect(assessJson.data.assessment.hard_red_flag_triggered).toBe(true);
    expect(assessJson.data.alertDispatched).toBe(true);

    // 2. Doctor retrieves priority queue
    const queueReq = new NextRequest('http://localhost:3000/api/v1/doctor/queue?status=PENDING_REVIEW', {
      method: 'GET',
      headers: {
        'x-user-role': 'doctor',
      },
    });

    const queueRes = await queueGET(queueReq);
    expect(queueRes.status).toBe(200);
    const queueJson = await queueRes.json();
    expect(queueJson.data.totalPending).toBe(1);
    expect(queueJson.data.queue[0].id).toBe(assessmentId);

    // 3. Attending Doctor reviews and overrides acuity category to HIGH (P2) after IV fluids stabilize SBP
    const overrideReq = new NextRequest('http://localhost:3000/api/v1/doctor/override', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-user-role': 'doctor',
        'x-user-id': 'doc_attending_99',
        'x-forwarded-for': '192.168.1.60',
      },
      body: JSON.stringify({
        assessment_id: assessmentId,
        final_category: 'HIGH',
        override_reason: 'BP and mentation rapidly restored post 1L normal saline bolus; transfer to step-down unit.',
        clinical_notes: 'Continuous pulse oximetry monitoring ordered.',
      }),
    });

    const overrideRes = await overridePOST(overrideReq);
    expect(overrideRes.status).toBe(200);
    const overrideJson = await overrideRes.json();

    expect(overrideJson.data.updatedAssessment.status).toBe('OVERRIDDEN');
    expect(overrideJson.data.review.is_overridden).toBe(true);
    expect(overrideJson.data.review.final_category).toBe('HIGH');

    // 4. Verify immutable audit journal entries were created
    const auditLogs = AuditService.getAuditLogs();
    expect(auditLogs.length).toBeGreaterThanOrEqual(3);

    const eventTypes = auditLogs.map((l) => l.event_type);
    expect(eventTypes).toContain('RED_FLAG_TRIGGERED');
    expect(eventTypes).toContain('TRIAGE_ASSESSMENT_CREATED');
    expect(eventTypes).toContain('ALERT_DISPATCHED');
    expect(eventTypes).toContain('DOCTOR_OVERRIDE_SUBMITTED');

    // Verify SHA-256 hashes exist on all logs
    for (const log of auditLogs) {
      expect(log.payload._hash).toBeDefined();
      expect(log.payload._hash).toHaveLength(64);
    }
  });
});
