import { describe, it, expect, beforeEach } from 'vitest';
import { TriageOrchestrator } from '@/modules/triage_engine/application/triage_orchestrator';
import { MockPredictionService } from '@/modules/triage_engine/application/prediction_service';
import { ConsoleAlertProvider } from '@/modules/triage_engine/application/alert_provider';
import { AuditService, AuditContext } from '@/modules/triage_engine/application/audit_service';
import { QueueService } from '@/modules/triage_engine/application/queue_service';
import { OverrideService } from '@/modules/triage_engine/application/override_service';
import { DoctorOverrideRequest, TriageAssessmentRecord } from '@/shared/types/triage';

describe('Application Services & Orchestration', () => {
  const sampleAuditContext: AuditContext = {
    userId: 'usr_doc_01',
    patientId: 'pat_1001',
    actorRole: 'nurse',
    ipAddress: '192.168.1.10',
    userAgent: 'Mozilla/5.0 Test',
  };

  beforeEach(() => {
    AuditService.clearAuditLogs();
    TriageOrchestrator.clearStore();
  });

  describe('TriageOrchestrator', () => {
    it('validates vital sign range limits strictly', () => {
      expect(TriageOrchestrator.validateVitalsRange({ heart_rate: 10 }).isValid).toBe(false);
      expect(TriageOrchestrator.validateVitalsRange({ heart_rate: 350 }).isValid).toBe(false);
      expect(TriageOrchestrator.validateVitalsRange({ respiratory_rate: 2 }).isValid).toBe(false);
      expect(TriageOrchestrator.validateVitalsRange({ systolic_bp: 350 }).isValid).toBe(false);
      expect(TriageOrchestrator.validateVitalsRange({ diastolic_bp: 10 }).isValid).toBe(false);
      expect(TriageOrchestrator.validateVitalsRange({ oxygen_saturation: 105 }).isValid).toBe(false);
      expect(TriageOrchestrator.validateVitalsRange({ temperature_celsius: 25 }).isValid).toBe(false);
      expect(TriageOrchestrator.validateVitalsRange({ heart_rate: 80 }).isValid).toBe(true);
    });

    it('pre-check forces CRITICAL P1 and bypasses ML on red flag', async () => {
      const orchestrator = new TriageOrchestrator();
      const result = await orchestrator.assess(
        {
          patient_id: 'pat_1001',
          chief_complaint: 'Severe chest pain radiating to jaw',
          vital_signs: { heart_rate: 160 },
          symptom_vector: { retrosternal_chest_pain: true, pain_radiating_jaw_left_arm: true },
        },
        sampleAuditContext
      );

      expect(result.assessment.calculated_category).toBe('CRITICAL');
      expect(result.assessment.calculated_risk_score).toBe(100);
      expect(result.assessment.hard_red_flag_triggered).toBe(true);
      expect(result.assessment.explainability_payload.rule_engine).toBe(true);
      expect(result.priority.priorityCode).toBe('P1');
      expect(result.alertDispatched).toBe(true);
    });

    it('invokes prediction service when no red flag is present', async () => {
      const orchestrator = new TriageOrchestrator();
      const result = await orchestrator.assess(
        {
          patient_id: 'pat_1002',
          chief_complaint: 'Mild headache',
          vital_signs: { heart_rate: 72, systolic_bp: 120, oxygen_saturation: 98 },
          symptom_vector: {},
        },
        sampleAuditContext
      );

      expect(result.assessment.hard_red_flag_triggered).toBe(false);
      expect(result.assessment.explainability_payload.rule_engine).toBe(false);
      expect(result.confidenceLevel).toBe('HIGH');
    });

    it('flags confidence as LOW when essential vitals (SpO2, SBP, HR) are missing', async () => {
      const orchestrator = new TriageOrchestrator();
      const result = await orchestrator.assess(
        {
          patient_id: 'pat_1003',
          chief_complaint: 'Joint pain',
          vital_signs: { heart_rate: 75 }, // SBP and SpO2 missing
          symptom_vector: {},
        },
        sampleAuditContext
      );

      expect(result.confidenceLevel).toBe('LOW');
      expect(result.missingVitalsWarning).toContain('Essential vitals missing');
      expect(result.assessment.confidence_score).toBe(0.50);
    });

    it('persists assessment even if alert provider fails', async () => {
      const failingAlertProvider = new ConsoleAlertProvider(true); // simulate failure
      const orchestrator = new TriageOrchestrator(new MockPredictionService(), failingAlertProvider);

      const result = await orchestrator.assess(
        {
          patient_id: 'pat_1004',
          chief_complaint: 'Anuria',
          vital_signs: { heart_rate: 80, systolic_bp: 110, oxygen_saturation: 97 },
          symptom_vector: { anuria_over_12h: true },
        },
        sampleAuditContext
      );

      expect(result.alertDispatched).toBe(false);
      expect(result.alertError).toBeDefined();
      // Assessment is still saved!
      expect(TriageOrchestrator.getAssessmentById(result.assessment.id)).toBeDefined();
    });
  });

  describe('AuditService', () => {
    it('records append-only redacted audit events with SHA-256 payload hash', async () => {
      const entry = await AuditService.recordEvent('TRIAGE_ASSESSMENT_CREATED', sampleAuditContext, {
        patient_name: 'John Smith', // sensitive PHI
        score: 85,
        token: 'secret_token_123',
      });

      expect(entry.ip_address).toBe('192.168.1.10');
      expect(entry.payload.details.patient_name).toBe('[REDACTED_PHI]');
      expect(entry.payload.details.token).toBe('[REDACTED_PHI]');
      expect(entry.payload._hash).toHaveLength(64);
    });
  });

  describe('QueueService', () => {
    it('sorts queue by priority (P1 first), then created_at', () => {
      const p3Item = QueueService.formatQueueItem(
        { id: '1', patient_id: 'p3', chief_complaint: 'c3', symptom_vector: {}, calculated_risk_score: 40, calculated_category: 'MODERATE', hard_red_flag_triggered: false, red_flag_details: [], confidence_score: 0.9, explainability_payload: { rule_engine: false, reason: '' }, status: 'PENDING_REVIEW', created_at: '2026-10-09T10:00:00Z' },
        'doctor'
      );
      const p1Item = QueueService.formatQueueItem(
        { id: '2', patient_id: 'p1', chief_complaint: 'c1', symptom_vector: {}, calculated_risk_score: 100, calculated_category: 'CRITICAL', hard_red_flag_triggered: true, red_flag_details: ['RESP_SPO2_LT_90'], confidence_score: 1.0, explainability_payload: { rule_engine: true, reason: '' }, status: 'PENDING_REVIEW', created_at: '2026-10-09T10:05:00Z' },
        'doctor'
      );

      const sorted = QueueService.sortQueue([p3Item, p1Item]);
      expect(sorted[0].id).toBe('2'); // P1 first
    });

    it('masks patient identifiers for admin role', () => {
      const assessment: TriageAssessmentRecord = {
        id: '1',
        patient_id: 'pat_secret_uuid',
        chief_complaint: 'fever',
        symptom_vector: {},
        calculated_risk_score: 20,
        calculated_category: 'LOW',
        hard_red_flag_triggered: false,
        red_flag_details: [],
        confidence_score: 0.9,
        explainability_payload: { rule_engine: false, reason: '' },
        status: 'PENDING_REVIEW',
        created_at: new Date().toISOString(),
      };

      const doctorView = QueueService.formatQueueItem(assessment, 'doctor', 'MRN-1234', 'Jane Doe');
      expect(doctorView.patient_name_display).toBe('Jane Doe');

      const adminView = QueueService.formatQueueItem(assessment, 'admin', 'MRN-1234', 'Jane Doe');
      expect(adminView.patient_name_display).toBe('[MASKED_ADMIN_VIEW]');
      expect(adminView.mrn_display).not.toBe('MRN-1234');
    });
  });

  describe('OverrideService', () => {
    it('denies non-doctor role from overriding', () => {
      const req: DoctorOverrideRequest = {
        assessment_id: 'ast_1',
        final_category: 'MODERATE',
        override_reason: 'Patient re-evaluated',
      };
      const check = OverrideService.validateOverrideRequest(req, 'CRITICAL', 'nurse');
      expect(check.isValid).toBe(false);
      expect(check.error).toContain('Unauthorized');
    });

    it('requires mandatory rationale when category is modified', () => {
      const req: DoctorOverrideRequest = {
        assessment_id: 'ast_1',
        final_category: 'MODERATE',
        override_reason: '  ', // empty whitespace
      };
      const check = OverrideService.validateOverrideRequest(req, 'CRITICAL', 'doctor');
      expect(check.isValid).toBe(false);
      expect(check.error).toContain('rationale is mandatory');
    });

    it('allows valid override with rationale by doctor', () => {
      const req: DoctorOverrideRequest = {
        assessment_id: 'ast_1',
        final_category: 'MODERATE',
        override_reason: 'Patient vital signs stabilized following immediate oxygen therapy.',
      };
      const check = OverrideService.validateOverrideRequest(req, 'CRITICAL', 'doctor');
      expect(check.isValid).toBe(true);
    });
  });
});
