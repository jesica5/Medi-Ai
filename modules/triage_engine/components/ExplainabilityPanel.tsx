'use client';
import React from 'react';
import { ExplainabilityPayload } from '@/shared/types/triage';
import '@/shared/styles/triage.css';

interface ExplainabilityPanelProps {
  explainabilityPayload: ExplainabilityPayload | null;
}

export const ExplainabilityPanel: React.FC<ExplainabilityPanelProps> = ({ explainabilityPayload }) => {
  if (!explainabilityPayload || !explainabilityPayload.top_features) {
    return null;
  }

  const { top_features, shap_latency_ms, explanation_summary } = explainabilityPayload;

  return (
    <div className="triage-card" aria-label="Explainable AI Panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2D3748', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🧠 TreeSHAP Feature Attribution & Key Risk Drivers
        </h3>
        <span style={{ fontSize: '0.75rem', color: '#718096', background: '#EDF2F7', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
          SHAP Latency: <strong>{shap_latency_ms} ms</strong> (Target &lt;100 ms)
        </span>
      </div>

      {explanation_summary && (
        <p style={{ fontSize: '0.9rem', color: '#4A5568', background: '#F7FAFC', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid #3182CE', marginTop: 0, marginBottom: '1rem' }}>
          {explanation_summary}
        </p>
      )}

      {(explainabilityPayload as any).gemini_clinical_summary && (
        <div style={{ fontSize: '0.9rem', color: '#1A365D', background: '#EBF8FF', padding: '0.75rem 1rem', borderRadius: '6px', borderLeft: '4px solid #3182CE', marginBottom: '1rem' }}>
          <strong style={{ display: 'block', color: '#2B6CB0', marginBottom: '0.25rem' }}>✨ Google Gemini AI Symptom & Risk Summary:</strong>
          {(explainabilityPayload as any).gemini_clinical_summary}
        </div>
      )}

      <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#718096', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Ranked Contributing Features
      </h4>

      <div>
        {top_features.map((item, idx) => (
          <div key={item.feature_id || idx} className="shap-item">
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#2D3748' }}>
                {idx + 1}. {item.feature_name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '0.15rem' }}>
                {item.human_readable_summary}
              </div>
            </div>

            <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
              <span className={`contribution-tag contrib-${item.contribution}`}>
                {item.contribution === 'RISK_INCREASE' ? `+${item.importance_value} SHAP` : `${item.importance_value} SHAP`}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem', padding: '0.5rem 0.75rem', background: '#FFF5F5', border: '1px solid #FEB2B2', borderRadius: '6px', fontSize: '0.75rem', color: '#C53030' }}>
        🚨 <strong>Clinical Safety Disclaimer:</strong> Feature attributions reflect mathematical decision weights of the triage ensemble model only. They do not constitute a definitive medical diagnosis, etiology, or prescription recommendation.
      </div>
    </div>
  );
};
