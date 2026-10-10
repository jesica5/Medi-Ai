'use client';

import React from 'react';
import { TriageAuditLogEntry } from '@/shared/types/triage';

interface Props {
  logs: TriageAuditLogEntry[];
}

export const AuditLogViewer: React.FC<Props> = ({ logs }) => {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', color: '#1A202C', margin: 0 }}>
          📋 System Audit Journal (Immutable Append-Only Ledger)
        </h2>
        <span style={{ fontSize: '0.875rem', backgroundColor: '#EDF2F7', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontWeight: 600 }}>
          Total Events: {logs.length}
        </span>
      </div>

      {logs.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', backgroundColor: '#F7FAFC', border: '1px dashed #CBD5E0', borderRadius: '8px', color: '#718096' }}>
          No audit log entries recorded yet.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid #E2E8F0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ backgroundColor: '#EDF2F7', borderBottom: '2px solid #CBD5E0', color: '#2D3748' }}>
                <th style={{ padding: '0.75rem 1rem' }}>ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Event Type</th>
                <th style={{ padding: '0.75rem 1rem' }}>Actor Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>IP Address</th>
                <th style={{ padding: '0.75rem 1rem' }}>Timestamp</th>
                <th style={{ padding: '0.75rem 1rem' }}>SHA-256 Payload Hash</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid #E2E8F0', backgroundColor: '#FFFFFF' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>#{log.id}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span
                      style={{
                        backgroundColor: log.event_type.includes('RED_FLAG') ? '#FED7D7' : '#EBF8FF',
                        color: log.event_type.includes('RED_FLAG') ? '#9B2C2C' : '#2B6CB0',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      {log.event_type}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', textTransform: 'capitalize', fontWeight: 500 }}>
                    {log.payload.actor_role || 'System'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace' }}>{log.ip_address}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#4A5568' }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', color: '#2D3748', fontSize: '0.75rem' }}>
                    <code>{log.payload._hash || 'N/A'}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
