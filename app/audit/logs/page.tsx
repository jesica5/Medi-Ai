'use client';

import React, { useEffect, useState } from 'react';
import { AuditLogViewer } from '@/modules/triage_engine/components/AuditLogViewer';
import { TriageAuditLogEntry } from '@/shared/types/triage';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<TriageAuditLogEntry[]>([]);

  useEffect(() => {
    // Import sample logs from AuditService in memory
    import('@/modules/triage_engine/application/audit_service').then(({ AuditService }) => {
      setLogs(AuditService.getAuditLogs());
    });
  }, []);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem' }}>
      <AuditLogViewer logs={logs} />
    </div>
  );
}
