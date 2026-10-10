import { AcuityCategory, PriorityMapping } from '@/shared/types/triage';

export function mapScoreToPriority(score: number): PriorityMapping {
  // Clamp score between 0 and 100
  const clampedScore = Math.max(0, Math.min(100, Math.round(score)));

  if (clampedScore >= 85) {
    return {
      category: 'CRITICAL',
      priorityLabel: 'Critical',
      priorityCode: 'P1',
      colorHex: '#E53E3E',
      timeGuidance: 'Immediate life threat. Continuous monitoring. Physician evaluation required immediately (0 min, immediate bay allocation).',
      targetResponseMinutes: 0,
    };
  }

  if (clampedScore >= 60) {
    return {
      category: 'HIGH',
      priorityLabel: 'High',
      priorityCode: 'P2',
      colorHex: '#ED8936',
      timeGuidance: 'Emergent condition. High deterioration probability. Physician assessment required within 15-30 minutes.',
      targetResponseMinutes: 30,
    };
  }

  if (clampedScore >= 30) {
    return {
      category: 'MODERATE',
      priorityLabel: 'Moderate',
      priorityCode: 'P3',
      colorHex: '#ECC94B',
      timeGuidance: 'Urgent condition requiring diagnostic investigation. Evaluation within 60 minutes.',
      targetResponseMinutes: 60,
    };
  }

  return {
    category: 'LOW',
    priorityLabel: 'Low',
    priorityCode: 'P4',
    colorHex: '#38A169',
    timeGuidance: 'Non-urgent ambulatory condition. Routine clinic assessment within 120 minutes.',
    targetResponseMinutes: 120,
  };
}

export function getCriticalRedFlagPriority(): PriorityMapping {
  return {
    category: 'CRITICAL',
    priorityLabel: 'Critical',
    priorityCode: 'P1',
    colorHex: '#E53E3E',
    timeGuidance: 'Immediate life threat. Continuous monitoring. Physician evaluation required immediately (0 min, immediate bay allocation).',
    targetResponseMinutes: 0,
  };
}
