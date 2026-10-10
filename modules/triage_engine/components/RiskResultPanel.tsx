'use client';
import React from 'react';
import { RiskAssessmentResult } from '@/shared/types/m3';

interface RiskResultPanelProps {
  result: RiskAssessmentResult | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const RiskResultPanel: React.FC<RiskResultPanelProps> = ({
  result,
  isLoading,
  error,
  onRetry,
}) => {
  if (isLoading) {
    return (
      <div className="triage-card" aria-busy="true" aria-live="polite">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="spinner" style={{ width: 24, height: 24, border: '3px solid #CBD5E0', borderTopColor: '#3182CE', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Computing AI Risk Prediction & Feature Attributions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="triage-card" style={{ borderColor: '#FEB2B2', background: '#FFF5F5' }} role="alert">
        <h4 style={{ color: '#E53E3E', margin: '0 0 0.5rem 0' }}>Risk Assessment Unavailable</h4>
        <p style={{ margin: '0 0 0.75rem 0', color: '#742A2A', fontSize: '0.9rem' }}>{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              padding: '0.4rem 0.8rem',
              background: '#E53E3E',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Retry Triage Assessment
          </button>
        )}
      </div>
    );
  }

  if (!result) {
    return (
      <div className="triage-card">
        <p style={{ color: '#718096', fontStyle: 'italic', margin: 0 }}>
          No triage assessment generated yet. Please enter vital signs and chief complaint to assess patient risk.
        </p>
      </div>
    );
  }

  const {
    calculated_risk_score,
    calculated_category,
    confidence_score,
    hard_red_flag_triggered,
    red_flag_details,
    uncertainty_metadata,
    explainability_payload,
    created_at,
  } = result;

  return (
    <div className="triage-card" aria-label="Risk Assessment Results">
      {/* Header Banner for Safety Red Flag */}
      {hard_red_flag_triggered && (
        <div className="warning-banner" style={{ background: '#FFF5F5', borderColor: '#E53E3E', color: '#C53030', marginBottom: '1rem' }} role="alert">
          <strong>⚠️ TIER-1 HARD RED FLAG TRIGGERED:</strong>
          <span>{red_flag_details.join('; ')}. Bypassed ML inference to force Emergency CRITICAL (Priority 1).</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Calculated Acuity Category
          </span>
          <div style={{ marginTop: '0.35rem' }}>
            <span className={`acuity-badge acuity-${calculated_category}`} aria-label={`Category ${calculated_category}`}>
              {calculated_category} (Priority {calculated_category === 'CRITICAL' ? 1 : calculated_category === 'HIGH' ? 2 : calculated_category === 'MODERATE' ? 3 : 4})
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.85rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Emergency Risk Score
          </span>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#1A202C', lineHeight: 1.1 }}>
            {calculated_risk_score}<span style={{ fontSize: '1rem', color: '#A0AEC0' }}>/100</span>
          </div>
        </div>
      </div>

      {/* Metadata Row */}
      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #EDF2F7', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.85rem' }}>
        <div>
          <span style={{ color: '#718096' }}>Confidence Level: </span>
          <span className={`confidence-indicator confidence-${uncertainty_metadata.confidence_level}`}>
            {uncertainty_metadata.confidence_level} ({Math.round(confidence_score * 100)}%)
          </span>
        </div>

        <div style={{ color: '#718096' }}>
          <span>Model: <strong>{explainability_payload?.model_version || 'v2.0'}</strong></span>
          <span style={{ margin: '0 0.5rem' }}>|</span>
          <span>Time: <strong>{new Date(created_at).toLocaleTimeString()}</strong></span>
        </div>
      </div>

      {/* Warning prompt for missing essential vitals */}
      {uncertainty_metadata.warning_prompt && (
        <div className="warning-banner" role="alert">
          <span>⚠️ {uncertainty_metadata.warning_prompt}</span>
        </div>
      )}

      {/* Imputed variables metadata notice */}
      {uncertainty_metadata.imputed_variables.length > 0 && (
        <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#4A5568', background: '#EDF2F7', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
          ℹ️ Imputed Non-Essential Features ({uncertainty_metadata.imputed_variables.length}):{' '}
          {uncertainty_metadata.imputed_variables.map(v => `${v.variable_name} = ${v.imputed_value} (${v.strata})`).join(', ')}
        </div>
      )}
    </div>
  );
};
