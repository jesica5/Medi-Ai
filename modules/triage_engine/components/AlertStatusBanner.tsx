'use client';

import React from 'react';

interface Props {
  alertDispatched: boolean;
  alertError?: string;
  alertStatus?: string;
}

export const AlertStatusBanner: React.FC<Props> = ({ alertDispatched, alertError, alertStatus }) => {
  if (alertError) {
    return (
      <div
        role="alert"
        style={{
          backgroundColor: '#FFF5F5',
          borderLeft: '4px solid #E53E3E',
          color: '#9B2C2C',
          padding: '0.875rem 1rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          margin: '0.75rem 0',
        }}
      >
        <strong>⚠️ Safe-Failure Notice:</strong> Notification dispatch failed ({alertError}). Triage assessment and priority queue placement were completed safely.
      </div>
    );
  }

  if (alertDispatched) {
    return (
      <div
        role="status"
        style={{
          backgroundColor: '#F0FFF4',
          borderLeft: '4px solid #38A169',
          color: '#22543D',
          padding: '0.875rem 1rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          margin: '0.75rem 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>
          ✅ <strong>Emergency Alert Dispatched:</strong> Workstation priority queue notified successfully.
        </span>
        <span
          style={{
            backgroundColor: '#C6F6D5',
            color: '#22543D',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}
        >
          {alertStatus || 'DISPATCHED'}
        </span>
      </div>
    );
  }

  return null;
};
