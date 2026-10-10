'use client';

import React from 'react';
import { AcuityCategory, RedFlagDetail } from '@/shared/types/triage';
import enUS from '@/shared/locales/en-US.json';
import taIN from '@/shared/locales/ta-IN.json';

interface Props {
  category: AcuityCategory;
  score: number;
  redFlags?: RedFlagDetail[] | string[];
  timestamp?: string;
  lang?: 'en' | 'ta';
}

export const TriageStatusBadge: React.FC<Props> = ({
  category,
  score,
  redFlags = [],
  timestamp,
  lang = 'en',
}) => {
  const dict = lang === 'ta' ? taIN : enUS;

  const colorStyles: Record<AcuityCategory, { border: string; bg: string; text: string; badgeBg: string }> = {
    CRITICAL: { border: '#E53E3E', bg: '#FFF5F5', text: '#9B2C2C', badgeBg: '#E53E3E' },
    HIGH: { border: '#ED8936', bg: '#FFFAF0', text: '#9C4221', badgeBg: '#ED8936' },
    MODERATE: { border: '#ECC94B', bg: '#FFFFF0', text: '#744210', badgeBg: '#D69E2E' }, // Darker gold for AA contrast (>4.5:1)
    LOW: { border: '#38A169', bg: '#F0FFF4', text: '#22543D', badgeBg: '#38A169' },
  };

  const currentStyle = colorStyles[category] || colorStyles.LOW;
  const label = dict.acuity[category] || category;
  const guidance = dict.guidance[category] || '';

  return (
    <div
      aria-label={`Triage status: ${label}`}
      style={{
        borderLeft: `6px solid ${currentStyle.border}`,
        backgroundColor: currentStyle.bg,
        padding: '1.25rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <span
            style={{
              backgroundColor: currentStyle.badgeBg,
              color: '#FFFFFF',
              fontWeight: 700,
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              display: 'inline-block',
            }}
          >
            {label}
          </span>
          <span style={{ marginLeft: '0.75rem', fontWeight: 600, color: '#2D3748', fontSize: '1rem' }}>
            {dict.ui.scoreLabel}: <strong>{score} / 100</strong>
          </span>
        </div>
        {timestamp && (
          <span style={{ fontSize: '0.8125rem', color: '#718096' }}>
            {new Date(timestamp).toLocaleString()}
          </span>
        )}
      </div>

      <p style={{ marginTop: '0.75rem', color: currentStyle.text, fontSize: '0.9375rem', lineHeight: 1.5, fontWeight: 500 }}>
        {guidance}
      </p>

      {redFlags.length > 0 && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '0.75rem' }}>
          <h4 style={{ margin: 0, fontSize: '0.875rem', color: '#C53030', fontWeight: 700 }}>
            ⚠️ {dict.ui.redFlagsDetected}:
          </h4>
          <ul style={{ margin: '0.5rem 0 0 1.25rem', padding: 0, color: '#742A2A', fontSize: '0.875rem' }}>
            {redFlags.map((flag, idx) => (
              <li key={idx} style={{ marginBottom: '0.25rem' }}>
                {typeof flag === 'string' ? flag : `${flag.ruleCode}: ${flag.observed} (Threshold: ${flag.threshold})`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
