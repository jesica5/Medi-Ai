'use client';
import React from 'react';
import { ModelMetadata } from '@/shared/types/triage';
import '@/shared/styles/triage.css';

const SAMPLE_MODEL_METADATA: ModelMetadata = {
  model_id: 'mod_xgboost_triage_v2',
  model_name: 'MediAI Gradient Boosted Acuity Ensemble',
  version: 'v2.0.0-ensemble-xgboost-shap',
  algorithm: 'XGBoost Regressor + TreeSHAP Explainer Engine',
  accuracy: 0.942,
  auc_roc: 0.968,
  f1_score: 0.935,
  trained_at: '2026-09-15T10:00:00Z',
  sample_count: 25480,
  features_list: [
    'heart_rate',
    'systolic_bp',
    'diastolic_bp',
    'oxygen_saturation',
    'respiratory_rate',
    'temperature_celsius',
    'capillary_blood_glucose',
    'chief_complaint_embeddings',
    'age',
    'gender_strata',
    'immunosuppressed_flag',
    'comorbidities_count',
    'vitals_delta_index',
  ],
};

export const ModelQualityView: React.FC = () => {
  const model = SAMPLE_MODEL_METADATA;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1A202C' }}>⚙️ System Admin — AI Model Quality & Registry</h2>
          <p style={{ margin: '0.25rem 0 0 0', color: '#718096', fontSize: '0.9rem' }}>
            Model evaluation performance, versioning details, and TreeSHAP telemetry. (Zero PHI Access)
          </p>
        </div>
        <span style={{ background: '#E2E8F0', color: '#2D3748', padding: '0.4rem 0.8rem', borderRadius: '6px', fontWeight: 600, fontSize: '0.85rem' }}>
          Role: System Administrator
        </span>
      </div>

      {/* Model Overview Card */}
      <div className="triage-card">
        <h3 style={{ marginTop: 0, color: '#2B6CB0' }}>{model.model_name}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
          <div style={{ background: '#F7FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase' }}>Model Version</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2D3748', marginTop: '0.25rem' }}>{model.version}</div>
          </div>

          <div style={{ background: '#F7FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase' }}>Algorithm</span>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#2D3748', marginTop: '0.25rem' }}>{model.algorithm}</div>
          </div>

          <div style={{ background: '#F7FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.8rem', color: '#718096', textTransform: 'uppercase' }}>Training Dataset</span>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2D3748', marginTop: '0.25rem' }}>
              {model.sample_count.toLocaleString()} samples
            </div>
          </div>
        </div>
      </div>

      {/* Evaluation Metrics Card */}
      <div className="triage-card">
        <h4 style={{ marginTop: 0, color: '#2D3748' }}>Validation Performance Metrics</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', textAlign: 'center' }}>
          <div style={{ background: '#F0FFF4', border: '1px solid #9AE6B4', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#22543D', fontWeight: 600 }}>Accuracy</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38A169', marginTop: '0.25rem' }}>
              {(model.accuracy * 100).toFixed(1)}%
            </div>
          </div>

          <div style={{ background: '#EBF8FF', border: '1px solid #90CDF4', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#2C5282', fontWeight: 600 }}>AUC-ROC</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3182CE', marginTop: '0.25rem' }}>
              {model.auc_roc.toFixed(3)}
            </div>
          </div>

          <div style={{ background: '#FAF5FF', border: '1px solid #D6BCFA', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.85rem', color: '#553C9A', fontWeight: 600 }}>F1-Score</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#805AD5', marginTop: '0.25rem' }}>
              {model.f1_score.toFixed(3)}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Inventory & Privacy Notice */}
      <div className="triage-card">
        <h4 style={{ marginTop: 0, color: '#2D3748' }}>De-identified Feature Matrix ({model.features_list.length} features)</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {model.features_list.map((feat) => (
            <span key={feat} style={{ background: '#EDF2F7', color: '#4A5568', padding: '0.25rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontFamily: 'monospace' }}>
              {feat}
            </span>
          ))}
        </div>

        <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: '#EDF2F7', borderRadius: '6px', fontSize: '0.8rem', color: '#4A5568' }}>
          🔒 <strong>Privacy & Security Enforcement:</strong> System Administrator role possesses zero visibility into Protected Health Information (PHI). All patient identifiers are cryptographically hashed using SHA-256 before model logging.
        </div>
      </div>
    </div>
  );
};
