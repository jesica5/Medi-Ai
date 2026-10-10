'use client';

import React, { useState } from 'react';
import { AcuityCategory } from '@/shared/types/triage';

interface Props {
  isOpen: boolean;
  assessmentId: string;
  originalCategory: AcuityCategory;
  onClose: () => void;
  onSubmit: (finalCategory: AcuityCategory, rationale: string, clinicalNotes: string) => Promise<void>;
}

export const OverrideModal: React.FC<Props> = ({
  isOpen,
  assessmentId,
  originalCategory,
  onClose,
  onSubmit,
}) => {
  const [proposedCategory, setProposedCategory] = useState<AcuityCategory>(originalCategory);
  const [rationale, setRationale] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const isChanged = proposedCategory !== originalCategory;
    if (isChanged && !rationale.trim()) {
      setErrorMsg('Mandatory clinical rationale is required when overriding triage priority category.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(proposedCategory, rationale.trim(), clinicalNotes.trim());
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit override.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        zIndex: 999,
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          maxWidth: '550px',
          width: '100%',
          padding: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
        }}
      >
        <h2 id="modal-title" style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', color: '#1A202C' }}>
          🩺 Attending Physician Clinical Override
        </h2>

        {errorMsg && (
          <div
            role="alert"
            style={{
              backgroundColor: '#FFF5F5',
              borderLeft: '4px solid #E53E3E',
              color: '#C53030',
              padding: '0.75rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              marginBottom: '1rem',
            }}
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4A5568', marginBottom: '0.35rem' }}>
              Assessment ID
            </label>
            <input
              type="text"
              readOnly
              value={assessmentId}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #CBD5E0',
                borderRadius: '6px',
                backgroundColor: '#EDF2F7',
                fontSize: '0.875rem',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4A5568', marginBottom: '0.35rem' }}>
                Original Acuity
              </label>
              <input
                type="text"
                readOnly
                value={originalCategory}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #CBD5E0',
                  borderRadius: '6px',
                  backgroundColor: '#EDF2F7',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: originalCategory === 'CRITICAL' ? '#C53030' : '#2D3748',
                }}
              />
            </div>

            <div>
              <label htmlFor="final-category-select" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4A5568', marginBottom: '0.35rem' }}>
                Proposed Final Acuity
              </label>
              <select
                id="final-category-select"
                value={proposedCategory}
                onChange={(e) => setProposedCategory(e.target.value as AcuityCategory)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  border: '1px solid #CBD5E0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <option value="CRITICAL">CRITICAL (P1)</option>
                <option value="HIGH">HIGH (P2)</option>
                <option value="MODERATE">MODERATE (P3)</option>
                <option value="LOW">LOW (P4)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="override-rationale-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4A5568', marginBottom: '0.35rem' }}>
              Mandatory Clinical Rationale {proposedCategory !== originalCategory && <span style={{ color: '#E53E3E' }}>*</span>}
            </label>
            <textarea
              id="override-rationale-input"
              rows={3}
              placeholder="Specify medical justification for category modification..."
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #CBD5E0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="clinical-notes-input" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#4A5568', marginBottom: '0.35rem' }}>
              Additional Clinical Notes (Optional)
            </label>
            <textarea
              id="clinical-notes-input"
              rows={2}
              placeholder="Treatment bay allocation or diagnostic orders..."
              value={clinicalNotes}
              onChange={(e) => setClinicalNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #CBD5E0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: '1px solid #CBD5E0',
                backgroundColor: '#FFFFFF',
                color: '#4A5568',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: '#3182CE',
                color: '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Saving Review...' : 'Confirm Clinical Override & Update Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
