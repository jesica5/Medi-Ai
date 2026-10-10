import { VitalSignsInput, SymptomVector } from '@/shared/types/triage';

export interface PredictionResult {
  score: number;
  confidence: number;
  topDrivers: Array<{ feature: string; weight: number }>;
  isAvailable: boolean;
}

export interface PredictionService {
  predict(vitals: VitalSignsInput, symptoms: SymptomVector): Promise<PredictionResult>;
}

export class MockPredictionService implements PredictionService {
  private shouldFail: boolean;

  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
  }

  async predict(vitals: VitalSignsInput, symptoms: SymptomVector): Promise<PredictionResult> {
    if (this.shouldFail) {
      return {
        score: 0,
        confidence: 0,
        topDrivers: [],
        isAvailable: false,
      };
    }

    // Simple deterministic score calculation for fallback mock
    let score = 20;
    const drivers: Array<{ feature: string; weight: number }> = [];

    if (vitals.heart_rate && (vitals.heart_rate > 100 || vitals.heart_rate < 60)) {
      score += 15;
      drivers.push({ feature: 'heart_rate_abnormal', weight: 0.15 });
    }

    if (vitals.systolic_bp && (vitals.systolic_bp > 140 || vitals.systolic_bp < 90)) {
      score += 20;
      drivers.push({ feature: 'systolic_bp_abnormal', weight: 0.20 });
    }

    if (vitals.oxygen_saturation && vitals.oxygen_saturation < 95) {
      score += 25;
      drivers.push({ feature: 'oxygen_saturation_low', weight: 0.25 });
    }

    if (symptoms.retrosternal_chest_pain) {
      score += 20;
      drivers.push({ feature: 'chest_pain', weight: 0.20 });
    }

    return {
      score: Math.min(100, score),
      confidence: 0.92,
      topDrivers: drivers,
      isAvailable: true,
    };
  }
}
