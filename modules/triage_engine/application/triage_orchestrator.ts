import {
  VitalSignsInput,
  SymptomVector,
  TriageAssessmentRecord,
  PriorityMapping,
  RedFlagDetail,
} from '@/shared/types/triage';
import { evaluateRedFlags } from '../domain/red_flag_engine';
import { checkMissingEssentialVitals, evaluateVitalWarnings, VitalWarningBand } from '../domain/vitals_baseline';
import { mapScoreToPriority, getCriticalRedFlagPriority } from '../domain/priority_mapper';
import { PredictionService, MockPredictionService } from './prediction_service';
import { AlertProvider, ConsoleAlertProvider } from './alert_provider';
import { AuditService, AuditContext } from './audit_service';

export interface AssessmentRequestInput {
  patient_id: string;
  chief_complaint: string;
  vital_signs?: VitalSignsInput | null;
  symptom_vector?: SymptomVector | null;
}

export interface AssessmentOrchestrationResult {
  assessment: TriageAssessmentRecord;
  priority: PriorityMapping;
  redFlags: RedFlagDetail[];
  vitalWarnings: VitalWarningBand[];
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  missingVitalsWarning?: string;
  alertDispatched: boolean;
  alertError?: string;
}

export class TriageOrchestrator {
  private predictionService: PredictionService;
  private alertProvider: AlertProvider;
  private static assessmentStore: Map<string, TriageAssessmentRecord> = new Map();

  constructor(predictionService?: PredictionService, alertProvider?: AlertProvider) {
    this.predictionService = predictionService ?? new MockPredictionService();
    this.alertProvider = alertProvider ?? new ConsoleAlertProvider();
  }

  static validateVitalsRange(vitals?: VitalSignsInput | null): { isValid: boolean; error?: string } {
    if (!vitals) return { isValid: true };

    if (vitals.heart_rate !== undefined && vitals.heart_rate !== null) {
      if (vitals.heart_rate < 20 || vitals.heart_rate > 300) {
        return { isValid: false, error: 'heart_rate out of valid physiological range (20-300 bpm)' };
      }
    }

    if (vitals.respiratory_rate !== undefined && vitals.respiratory_rate !== null) {
      if (vitals.respiratory_rate < 4 || vitals.respiratory_rate > 80) {
        return { isValid: false, error: 'respiratory_rate out of valid physiological range (4-80 bpm)' };
      }
    }

    if (vitals.systolic_bp !== undefined && vitals.systolic_bp !== null) {
      if (vitals.systolic_bp < 40 || vitals.systolic_bp > 300) {
        return { isValid: false, error: 'systolic_bp out of valid physiological range (40-300 mmHg)' };
      }
    }

    if (vitals.diastolic_bp !== undefined && vitals.diastolic_bp !== null) {
      if (vitals.diastolic_bp < 20 || vitals.diastolic_bp > 200) {
        return { isValid: false, error: 'diastolic_bp out of valid physiological range (20-200 mmHg)' };
      }
    }

    if (vitals.oxygen_saturation !== undefined && vitals.oxygen_saturation !== null) {
      if (vitals.oxygen_saturation < 40.0 || vitals.oxygen_saturation > 100.0) {
        return { isValid: false, error: 'oxygen_saturation out of valid physiological range (40.0-100.0%)' };
      }
    }

    if (vitals.temperature_celsius !== undefined && vitals.temperature_celsius !== null) {
      if (vitals.temperature_celsius < 30.0 || vitals.temperature_celsius > 45.0) {
        return { isValid: false, error: 'temperature_celsius out of valid physiological range (30.0-45.0°C)' };
      }
    }

    return { isValid: true };
  }

  async assess(
    input: AssessmentRequestInput,
    auditContext: AuditContext
  ): Promise<AssessmentOrchestrationResult> {
    const vitals = input.vital_signs ?? {};
    const symptoms = input.symptom_vector ?? {};

    // 1. Validate vitals range
    const rangeCheck = TriageOrchestrator.validateVitalsRange(vitals);
    if (!rangeCheck.isValid) {
      throw new Error(`Invalid vital sign input: ${rangeCheck.error}`);
    }

    // 2. Run safety pre-check FIRST
    const redFlagResult = evaluateRedFlags(vitals, symptoms);
    const vitalWarnings = evaluateVitalWarnings(vitals);
    const missingVitalsCheck = checkMissingEssentialVitals(vitals);

    const assessmentId = `tsg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    let priority: PriorityMapping;
    let riskScore: number;
    let confidenceScore: number;
    let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    let explainabilityPayload: TriageAssessmentRecord['explainability_payload'];
    let missingVitalsWarningText: string | undefined = undefined;

    if (redFlagResult.hardRedFlagTriggered) {
      // Tier-1 Red Flag -> Force CRITICAL/P1, Bypass ML
      priority = getCriticalRedFlagPriority();
      riskScore = 100;
      confidenceScore = 1.00;
      confidenceLevel = 'HIGH';
      explainabilityPayload = {
        rule_engine: true,
        reason: 'Deterministic Tier-1 Red Flag hard override triggered. ML inference bypassed for safety.',
        triggered_flags: redFlagResult.flags,
      };

      await AuditService.recordEvent(
        'RED_FLAG_TRIGGERED',
        auditContext,
        {
          assessment_id: assessmentId,
          patient_id: input.patient_id,
          flags: redFlagResult.flags.map((f) => f.ruleCode),
        }
      );
    } else {
      // No Red Flag -> Invoke M3 Prediction Service
      const prediction = await this.predictionService.predict(vitals, symptoms);
      riskScore = prediction.score;
      priority = mapScoreToPriority(riskScore);

      if (missingVitalsCheck.isMissingEssential) {
        confidenceLevel = 'LOW';
        confidenceScore = 0.50;
        missingVitalsWarningText = `Essential vitals missing: ${missingVitalsCheck.missingFields.join(', ')}. Assessment confidence flagged as LOW.`;
      } else {
        confidenceLevel = 'HIGH';
        confidenceScore = prediction.confidence || 0.92;
      }

      explainabilityPayload = {
        rule_engine: false,
        reason: prediction.isAvailable ? 'ML Ensemble Acuity Classifier Risk Prediction' : 'Safe Failure Fallback Rule',
        top_risk_drivers: prediction.topDrivers,
      };
    }

    const redFlagStrings = redFlagResult.flags.map(
      (f) => `${f.ruleCode}: ${f.observed} (Threshold: ${f.threshold})`
    );

    const assessmentRecord: TriageAssessmentRecord = {
      id: assessmentId,
      patient_id: input.patient_id,
      vital_id: null,
      chief_complaint: input.chief_complaint,
      symptom_vector: symptoms,
      calculated_risk_score: riskScore,
      calculated_category: priority.category,
      hard_red_flag_triggered: redFlagResult.hardRedFlagTriggered,
      red_flag_details: redFlagStrings,
      confidence_score: confidenceScore,
      explainability_payload: explainabilityPayload,
      status: 'PENDING_REVIEW',
      created_at: new Date().toISOString(),
    };

    // Save assessment to store
    TriageOrchestrator.assessmentStore.set(assessmentId, assessmentRecord);

    // Audit triage creation
    await AuditService.recordEvent(
      'TRIAGE_ASSESSMENT_CREATED',
      auditContext,
      {
        assessment_id: assessmentId,
        patient_id: input.patient_id,
        category: priority.category,
        score: riskScore,
        red_flag: redFlagResult.hardRedFlagTriggered,
      }
    );

    // Alert dispatch attempt (Failures do not block persistence)
    let alertDispatched = false;
    let alertError: string | undefined = undefined;

    try {
      const dispatchResult = await this.alertProvider.dispatch(
        assessmentId,
        priority.priorityCode,
        redFlagStrings.length > 0 ? redFlagStrings : [priority.timeGuidance]
      );
      if (dispatchResult.success) {
        alertDispatched = true;
        await AuditService.recordEvent('ALERT_DISPATCHED', auditContext, {
          assessment_id: assessmentId,
          alert_id: dispatchResult.alertId,
        });
      } else {
        alertError = dispatchResult.error;
        await AuditService.recordEvent('ALERT_DISPATCH_FAILED', auditContext, {
          assessment_id: assessmentId,
          error: alertError,
        });
      }
    } catch (err: unknown) {
      alertError = err instanceof Error ? err.message : 'Unknown alert provider error';
      await AuditService.recordEvent('ALERT_DISPATCH_FAILED', auditContext, {
        assessment_id: assessmentId,
        error: alertError,
      });
    }

    return {
      assessment: assessmentRecord,
      priority,
      redFlags: redFlagResult.flags,
      vitalWarnings,
      confidenceLevel,
      missingVitalsWarning: missingVitalsWarningText,
      alertDispatched,
      alertError,
    };
  }

  static getAssessmentById(id: string): TriageAssessmentRecord | undefined {
    return this.assessmentStore.get(id);
  }

  static updateAssessmentRecord(assessment: TriageAssessmentRecord): void {
    this.assessmentStore.set(assessment.id, assessment);
  }

  static getAllAssessments(): TriageAssessmentRecord[] {
    return Array.from(this.assessmentStore.values());
  }

  static clearStore(): void {
    this.assessmentStore.clear();
  }
}
