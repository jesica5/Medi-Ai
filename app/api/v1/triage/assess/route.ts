import { NextRequest, NextResponse } from 'next/server';
import { createSuccessEnvelope, createErrorEnvelope } from '@/shared/utils/envelope';
import { logAuditEvent } from '@/shared/utils/auditLogger';
import { ClinicalIntakePayload } from '@/shared/types/m3';
import { M3PredictionService } from '@/modules/triage_engine/services/m3_prediction_service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Input Validation
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        createErrorEnvelope('INVALID_INPUT', 'Request payload must be a valid JSON object'),
        { status: 400 }
      );
    }

    if (!body.chief_complaint || typeof body.chief_complaint !== 'string') {
      return NextResponse.json(
        createErrorEnvelope('MISSING_FIELD', 'chief_complaint is required and must be a string', [
          { field: 'chief_complaint', issue: 'Field missing or invalid' },
        ]),
        { status: 400 }
      );
    }

    const vitals = body.vitals || {};
    const demographics = body.demographics || {};
    const symptom_vector = body.symptom_vector || {};

    const intake: ClinicalIntakePayload = {
      patient_id: body.patient_id,
      chief_complaint: body.chief_complaint,
      symptom_vector,
      vitals: {
        heart_rate: typeof vitals.heart_rate === 'number' ? vitals.heart_rate : null,
        respiratory_rate: typeof vitals.respiratory_rate === 'number' ? vitals.respiratory_rate : null,
        systolic_bp: typeof vitals.systolic_bp === 'number' ? vitals.systolic_bp : null,
        diastolic_bp: typeof vitals.diastolic_bp === 'number' ? vitals.diastolic_bp : null,
        oxygen_saturation: typeof vitals.oxygen_saturation === 'number' ? vitals.oxygen_saturation : null,
        temperature_celsius: typeof vitals.temperature_celsius === 'number' ? vitals.temperature_celsius : null,
        capillary_blood_glucose: typeof vitals.capillary_blood_glucose === 'number' ? vitals.capillary_blood_glucose : null,
      },
      demographics: {
        age: typeof demographics.age === 'number' ? demographics.age : null,
        gender: demographics.gender || null,
        immunosuppressed: Boolean(demographics.immunosuppressed),
        chronic_comorbidities: Array.isArray(demographics.chronic_comorbidities) ? demographics.chronic_comorbidities : [],
        symptom_duration_hours: typeof demographics.symptom_duration_hours === 'number' ? demographics.symptom_duration_hours : null,
      },
      previous_vitals_delta: typeof body.previous_vitals_delta === 'number' ? body.previous_vitals_delta : 0,
    };

    // Execute M3 Risk Prediction & TreeSHAP Explainability
    const result = await M3PredictionService.predictRisk(intake, {
      hard_red_flag_triggered: Boolean(body.hard_red_flag_triggered),
      red_flag_details: Array.isArray(body.red_flag_details) ? body.red_flag_details : [],
    });

    // Zero-PHI Audit Logging
    await logAuditEvent({
      eventType: 'M3_RISK_ASSESSMENT_GENERATED',
      ipAddress: req.headers.get('x-forwarded-for') || '127.0.0.1',
      userAgent: req.headers.get('user-agent') || 'Browser',
      payload: {
        category: result.calculated_category,
        score: result.calculated_risk_score,
      },
    });

    return NextResponse.json(createSuccessEnvelope(result, { module: 'M3-AI-Prediction' }), { status: 200 });
  } catch (error: any) {
    console.error('[M3 API Error]:', error?.message || error);
    return NextResponse.json(
      createErrorEnvelope('INTERNAL_ERROR', 'An unexpected error occurred during triage risk assessment.', [
        { issue: error?.message || 'Server-side inference exception' },
      ]),
      { status: 500 }
    );
  }
}
