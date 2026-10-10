import crypto from 'crypto';
import { AuditEventType, TriageUserRole, TriageAuditLogEntry, AuditLogPayload } from '@/shared/types/triage';

export interface AuditContext {
  userId?: string | null;
  patientId?: string | null;
  actorRole: TriageUserRole;
  ipAddress: string;
  userAgent?: string | null;
}

export class AuditService {
  private static inMemoryLogs: TriageAuditLogEntry[] = [];

  static computePayloadHash(payloadData: Record<string, unknown>): string {
    const jsonStr = JSON.stringify(payloadData);
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
  }

  static redactPayload(payloadData: Record<string, unknown>): Record<string, unknown> {
    const redacted = { ...payloadData };
    // Redact PHI or secret keys
    const sensitiveKeys = ['patient_name', 'name', 'password', 'token', 'auth_token', 'secret', 'ssn', 'mrn'];
    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        redacted[key] = '[REDACTED_PHI]';
      }
    }
    return redacted;
  }

  static async recordEvent(
    eventType: AuditEventType,
    context: AuditContext,
    payloadData: Record<string, unknown>
  ): Promise<TriageAuditLogEntry> {
    const safePayload = this.redactPayload(payloadData);
    const hash = this.computePayloadHash(safePayload);

    const fullPayload: AuditLogPayload = {
      event_name: eventType,
      actor_role: context.actorRole,
      details: safePayload,
      _hash: hash,
    };

    const entry: TriageAuditLogEntry = {
      id: this.inMemoryLogs.length + 1,
      event_type: eventType,
      user_id: context.userId ?? null,
      patient_id: context.patientId ?? null,
      ip_address: context.ipAddress || '127.0.0.1',
      user_agent: context.userAgent ?? 'MediAI-Server/1.0',
      payload: fullPayload,
      created_at: new Date().toISOString(),
    };

    this.inMemoryLogs.push(entry);
    return entry;
  }

  static getAuditLogs(): TriageAuditLogEntry[] {
    return [...this.inMemoryLogs];
  }

  static clearAuditLogs(): void {
    this.inMemoryLogs = [];
  }
}
