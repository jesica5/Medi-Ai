import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as assessPOST } from '@/app/api/v1/triage/assess/route';
import { GET as queueGET } from '@/app/api/v1/doctor/queue/route';
import { POST as overridePOST } from '@/app/api/v1/doctor/override/route';
import { TriageOrchestrator } from '@/modules/triage_engine/application/triage_orchestrator';
import { AuditService } from '@/modules/triage_engine/application/audit_service';

describe('M4 REST API Endpoints Integration Tests', () => {
  beforeEach(() => {
    AuditService.clearAuditLogs();
    TriageOrchestrator.clearStore();
  });

  describe('POST /api/v1/triage/assess', () => {
    it('executes triage assessment with red-flag bypass to CRITICAL P1', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/triage/assess', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-role': 'nurse',
          'x-user-id': 'nurse_01',
        },
        body: JSON.stringify({
          patient_id: 'pat_test_100',
          chief_complaint: 'Severe dyspnea and cyanosis',
          vital_signs: { respiratory_rate: 36, oxygen_saturation: 85 },
          symptom_vector: { cyanosis: true },
        }),
      });

      const res = await assessPOST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.error).toBeNull();
      expect(json.data.assessment.calculated_category).toBe('CRITICAL');
      expect(json.data.assessment.hard_red_flag_triggered).toBe(true);
      expect(json.data.assessment.explainability_payload.rule_engine).toBe(true);
    });

    it('rejects invalid inputs with 400 error envelope', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/triage/assess', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-role': 'nurse' },
        body: JSON.stringify({ patient_id: '' }), // missing chief_complaint
      });

      const res = await assessPOST(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.data).toBeNull();
      expect(json.error.code).toBe('INVALID_INPUT');
    });

    it('rejects direct triage execution by patient role with 403 envelope', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/triage/assess', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-role': 'patient' },
        body: JSON.stringify({ patient_id: 'pat_1', chief_complaint: 'headache' }),
      });

      const res = await assessPOST(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /api/v1/doctor/queue', () => {
    it('retrieves priority sorted queue for doctor', async () => {
      // First populate store with 2 assessments
      const orchestrator = new TriageOrchestrator();
      await orchestrator.assess(
        { patient_id: 'p_low', chief_complaint: 'mild cold', vital_signs: { heart_rate: 70 } },
        { actorRole: 'nurse', ipAddress: '127.0.0.1' }
      );
      await orchestrator.assess(
        { patient_id: 'p_crit', chief_complaint: 'cyanosis', vital_signs: { oxygen_saturation: 85 } },
        { actorRole: 'nurse', ipAddress: '127.0.0.1' }
      );

      const req = new NextRequest('http://localhost:3000/api/v1/doctor/queue?status=PENDING_REVIEW', {
        method: 'GET',
        headers: { 'x-user-role': 'doctor' },
      });

      const res = await queueGET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.totalPending).toBe(2);
      expect(json.data.queue[0].calculated_category).toBe('CRITICAL'); // P1 first
    });

    it('masks patient identity for system administrator role', async () => {
      const orchestrator = new TriageOrchestrator();
      await orchestrator.assess(
        { patient_id: 'pat_secret_999', chief_complaint: 'fever' },
        { actorRole: 'nurse', ipAddress: '127.0.0.1' }
      );

      const req = new NextRequest('http://localhost:3000/api/v1/doctor/queue', {
        method: 'GET',
        headers: { 'x-user-role': 'admin' },
      });

      const res = await queueGET(req);
      const json = await res.json();
      expect(json.data.queue[0].patient_name_display).toBe('[MASKED_ADMIN_VIEW]');
    });
  });

  describe('POST /api/v1/doctor/override', () => {
    it('rejects override attempt by nurse role with 403', async () => {
      const req = new NextRequest('http://localhost:3000/api/v1/doctor/override', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-role': 'nurse' },
        body: JSON.stringify({ assessment_id: 'ast_1', final_category: 'LOW' }),
      });

      const res = await overridePOST(req);
      expect(res.status).toBe(403);
    });

    it('rejects override without rationale when category changes with 400', async () => {
      const orchestrator = new TriageOrchestrator();
      const created = await orchestrator.assess(
        { patient_id: 'pat_1', chief_complaint: 'stridor', vital_signs: {}, symptom_vector: { acute_stridor: true } },
        { actorRole: 'nurse', ipAddress: '127.0.0.1' }
      );

      const req = new NextRequest('http://localhost:3000/api/v1/doctor/override', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-role': 'doctor', 'x-user-id': 'doc_1' },
        body: JSON.stringify({
          assessment_id: created.assessment.id,
          final_category: 'MODERATE',
          override_reason: '', // empty rationale
        }),
      });

      const res = await overridePOST(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe('INVALID_OVERRIDE_RATIONALE');
    });

    it('successfully updates assessment to OVERRIDDEN with rationale by doctor', async () => {
      const orchestrator = new TriageOrchestrator();
      const created = await orchestrator.assess(
        { patient_id: 'pat_1', chief_complaint: 'stridor', vital_signs: {}, symptom_vector: { acute_stridor: true } },
        { actorRole: 'nurse', ipAddress: '127.0.0.1' }
      );

      const req = new NextRequest('http://localhost:3000/api/v1/doctor/override', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-user-role': 'doctor', 'x-user-id': 'doc_1' },
        body: JSON.stringify({
          assessment_id: created.assessment.id,
          final_category: 'HIGH',
          override_reason: 'Airway edema resolved rapidly post nebulized epinephrine.',
        }),
      });

      const res = await overridePOST(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.data.updatedAssessment.status).toBe('OVERRIDDEN');
      expect(json.data.review.is_overridden).toBe(true);

      // Verify audit log entry created
      const logs = AuditService.getAuditLogs();
      expect(logs.some((l) => l.event_type === 'DOCTOR_OVERRIDE_SUBMITTED')).toBe(true);
    });
  });
});
