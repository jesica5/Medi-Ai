import crypto from 'crypto';
import { UserRole, AcuityCategory, TriageAssessmentRecord } from '@/shared/types/triage';

export interface QueueItemView {
  id: string;
  patient_id_display: string;
  mrn_display: string;
  patient_name_display: string;
  calculated_risk_score: number;
  calculated_category: AcuityCategory;
  priority_code: 'P1' | 'P2' | 'P3' | 'P4';
  hard_red_flag_triggered: boolean;
  red_flag_details: string[];
  chief_complaint: string;
  status: string;
  created_at: string;
  alert_status?: string;
}

export class QueueService {
  private static priorityWeight: Record<AcuityCategory, number> = {
    CRITICAL: 1,
    HIGH: 2,
    MODERATE: 3,
    LOW: 4,
  };

  private static getPriorityCode(category: AcuityCategory): 'P1' | 'P2' | 'P3' | 'P4' {
    switch (category) {
      case 'CRITICAL':
        return 'P1';
      case 'HIGH':
        return 'P2';
      case 'MODERATE':
        return 'P3';
      case 'LOW':
        return 'P4';
    }
  }

  static maskIdentifier(id: string): string {
    return crypto.createHash('sha256').update(id).digest('hex').substring(0, 16) + '...';
  }

  static formatQueueItem(
    assessment: TriageAssessmentRecord,
    role: UserRole,
    patientMRN = 'MRN-99482',
    patientName = 'John Doe',
    alertStatus = 'DISPATCHED'
  ): QueueItemView {
    const isAdmin = role === 'admin';

    return {
      id: assessment.id,
      patient_id_display: isAdmin ? this.maskIdentifier(assessment.patient_id) : assessment.patient_id,
      mrn_display: isAdmin ? this.maskIdentifier(patientMRN) : patientMRN,
      patient_name_display: isAdmin ? '[MASKED_ADMIN_VIEW]' : patientName,
      calculated_risk_score: assessment.calculated_risk_score,
      calculated_category: assessment.calculated_category,
      priority_code: this.getPriorityCode(assessment.calculated_category),
      hard_red_flag_triggered: assessment.hard_red_flag_triggered,
      red_flag_details: assessment.red_flag_details,
      chief_complaint: assessment.chief_complaint,
      status: assessment.status,
      created_at: assessment.created_at,
      alert_status: alertStatus,
    };
  }

  static sortQueue(items: QueueItemView[]): QueueItemView[] {
    return [...items].sort((a, b) => {
      const weightA = this.priorityWeight[a.calculated_category];
      const weightB = this.priorityWeight[b.calculated_category];
      if (weightA !== weightB) {
        return weightA - weightB; // P1 first
      }
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  }
}
