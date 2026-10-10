import {
  ClinicalIntakePayload,
  RiskAssessmentResult,
  UncertaintyMetadata,
} from '@/shared/types/m3';
import { AcuityCategory } from '@/shared/types/triage';
import { ImputationEngine } from '@/ml/pipelines/imputation_engine';
import { RiskScoringEngine } from '@/ml/pipelines/risk_scoring_engine';
import { TreeSHAPExplainer } from '@/ml/models/tree_shap_explainer';
import { GeminiService } from './m3_gemini_explainer';
import { saveM3TriageAssessment } from '@/shared/services/firestoreService';

export interface AssessOptions {
  hard_red_flag_triggered?: boolean;
  red_flag_details?: string[];
}

export class M3PredictionService {
  /**
   * Main M3 Entry Point for AI Risk Prediction, TreeSHAP & Gemini Explainability.
   * Runs under strict server-side protection.
   */
  public static async predictRisk(
    intake: ClinicalIntakePayload,
    options: AssessOptions = {}
  ): Promise<RiskAssessmentResult> {
    const timestamp = new Date().toISOString();

    // PHASE 3 MANDATE: Check M4 Hard Red-Flag Override first.
    // If a Tier-1 Red Flag is triggered, ML inference MUST be bypassed or overridden to CRITICAL (P1).
    if (options.hard_red_flag_triggered || (options.red_flag_details && options.red_flag_details.length > 0)) {
      const redFlagDetails = options.red_flag_details && options.red_flag_details.length > 0
        ? options.red_flag_details
        : ['Deterministic Safety Pre-Check: Tier-1 Physiological Red Flag Detected'];

      const bypassExplanation = {
        top_features: [
          {
            feature_id: 'm4_tier1_red_flag',
            feature_name: 'Tier-1 Emergency Red Flag',
            importance_value: 100.0,
            contribution: 'RISK_INCREASE' as const,
            human_readable_summary: `Hard Red-Flag Triggered: ${redFlagDetails.join('; ')}. Bypassed ML inference. Immediate emergency escalation.`,
          },
        ],
        model_version: TreeSHAPExplainer.MODEL_VERSION,
        prediction_timestamp: timestamp,
        shap_latency_ms: 0.0,
        explanation_summary: `Safety Pre-Check Alert: Patient triggered hard red flag criteria (${redFlagDetails.join(', ')}). Immediate physician evaluation required.`,
      };

      const bypassUncertainty: UncertaintyMetadata = {
        missing_essential_vitals: [],
        imputed_variables: [],
        confidence_level: 'HIGH',
      };

      const bypassResult: RiskAssessmentResult = {
        patient_id: intake.patient_id,
        calculated_risk_score: 100,
        calculated_category: 'CRITICAL',
        hard_red_flag_triggered: true,
        red_flag_details: redFlagDetails,
        confidence_score: 1.0,
        explainability_payload: bypassExplanation,
        uncertainty_metadata: bypassUncertainty,
        status: 'PENDING_REVIEW',
        created_at: timestamp,
      };

      // Persist to Cloud Firestore
      await saveM3TriageAssessment(bypassResult as unknown as Record<string, unknown>);

      return bypassResult;
    }

    // PHASE 4: Imputation & Missing Data Protocols
    const { imputedDemographics, imputedVariablesLog } = ImputationEngine.processNonEssentialImputation(intake.demographics);

    // PHASE 2: ML Risk Scoring
    const { components, missingEssential } = RiskScoringEngine.calculateMasterScore(
      intake.vitals,
      intake.chief_complaint,
      intake.symptom_vector,
      imputedDemographics,
      intake.previous_vitals_delta
    );

    const calculated_category: AcuityCategory = RiskScoringEngine.mapScoreToCategory(components.final_score);

    // Confidence & Uncertainty Assessment
    const isEssentialMissing = missingEssential.length > 0;
    const confidence_score = isEssentialMissing ? 0.50 : 0.95;
    const confidence_level = isEssentialMissing ? 'LOW' : 'HIGH';

    const uncertainty_metadata: UncertaintyMetadata = {
      missing_essential_vitals: missingEssential,
      imputed_variables: imputedVariablesLog,
      confidence_level,
      warning_prompt: isEssentialMissing
        ? `WARNING: Essential vital sign(s) missing (${missingEssential.join(', ')}). Prediction confidence is LOW. Manual clinical measurement mandatory.`
        : undefined,
    };

    // PHASE 5: TreeSHAP Feature Attribution Explainability
    const explainability_payload = TreeSHAPExplainer.generateExplanation({
      vitals: intake.vitals,
      demographics: imputedDemographics,
      chiefComplaint: intake.chief_complaint,
      symptomVector: intake.symptom_vector,
      components,
      previousVitalsDelta: intake.previous_vitals_delta,
    });

    // Server-Side Google Gemini AI Clinical Analysis
    const geminiSummary = await GeminiService.generateClinicalExplanation({
      chiefComplaint: intake.chief_complaint,
      symptomVector: intake.symptom_vector,
      vitals: intake.vitals,
      calculatedScore: components.final_score,
      calculatedCategory: calculated_category,
      topFeatures: explainability_payload.top_features,
    });

    if (geminiSummary) {
      (explainability_payload as any).gemini_clinical_summary = geminiSummary;
    }

    const finalResult: RiskAssessmentResult = {
      patient_id: intake.patient_id,
      calculated_risk_score: components.final_score,
      calculated_category,
      hard_red_flag_triggered: false,
      red_flag_details: [],
      confidence_score,
      explainability_payload,
      uncertainty_metadata,
      status: 'PENDING_REVIEW',
      created_at: timestamp,
    };

    // Persist to Cloud Firestore
    await saveM3TriageAssessment(finalResult as unknown as Record<string, unknown>);

    return finalResult;
  }
}
