'use client';

import React, { useEffect, useState } from 'react';
import { QueueItemView } from '@/modules/triage_engine/application/queue_service';
import { OverrideModal } from '@/modules/triage_engine/components/OverrideModal';
import { AcuityCategory } from '@/shared/types/triage';

export default function DoctorPriorityQueuePage() {
  const [role, setRole] = useState<'doctor' | 'nurse' | 'admin'>('doctor');
  const [queue, setQueue] = useState<QueueItemView[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Override modal state
  const [selectedAssessment, setSelectedAssessment] = useState<{ id: string; category: AcuityCategory } | null>(null);

  const fetchQueue = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/doctor/queue?status=PENDING_REVIEW', {
        headers: {
          'x-user-role': role,
        },
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || 'Failed to fetch doctor queue.');
      }
      setQueue(json.data.queue);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [role]);

  const handleOverrideSubmit = async (finalCategory: AcuityCategory, rationale: string, clinicalNotes: string) => {
    if (!selectedAssessment) return;

    const res = await fetch('/api/v1/doctor/override', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'doctor',
        'x-user-id': 'usr_doc_attending_01',
      },
      body: JSON.stringify({
        assessment_id: selectedAssessment.id,
        final_category: finalCategory,
        override_reason: rationale,
        clinical_notes: clinicalNotes,
      }),
    });

    const json = await res.json();
    if (!res.ok || json.error) {
      throw new Error(json.error?.message || 'Failed to apply clinical override.');
    }

    // Refresh queue after override
    fetchQueue();
  };

  const priorityColors: Record<string, { bg: string; text: string }> = {
    P1: { bg: '#E53E3E', text: '#FFFFFF' },
    P2: { bg: '#ED8936', text: '#FFFFFF' },
    P3: { bg: '#ECC94B', text: '#1A202C' },
    P4: { bg: '#38A169', text: '#FFFFFF' },
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', color: '#1A202C', margin: 0 }}>🚨 Emergency Workstation Priority Queue</h1>
          <p style={{ color: '#718096', fontSize: '0.9375rem', marginTop: '0.25rem' }}>
            Sorted by clinical urgency (P1 Immediate Bay Allocation &rarr; P4 Routine Clinic).
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#EDF2F7', padding: '0.35rem 0.75rem', borderRadius: '8px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#4A5568' }}>View Role:</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'doctor' | 'nurse' | 'admin')}
            style={{ padding: '0.35rem 0.5rem', borderRadius: '6px', border: '1px solid #CBD5E0', fontSize: '0.875rem', fontWeight: 600 }}
          >
            <option value="doctor">Attending Doctor (Full PHI)</option>
            <option value="nurse">Triage Nurse (Full PHI)</option>
            <option value="admin">Administrator (SHA-256 Masked)</option>
          </select>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" style={{ backgroundColor: '#FFF5F5', borderLeft: '4px solid #E53E3E', color: '#C53030', padding: '1rem', borderRadius: '6px', marginBottom: '1.5rem' }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#718096' }}>Loading priority queue...</div>
      ) : queue.length === 0 ? (
        <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: '#F7FAFC', border: '1px dashed #CBD5E0', borderRadius: '8px', color: '#718096' }}>
          No pending triage assessments in the queue.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {queue.map((item) => {
            const pStyle = priorityColors[item.priority_code] || priorityColors.P4;
            return (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1.25rem',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ backgroundColor: pStyle.bg, color: pStyle.text, padding: '0.5rem 0.85rem', borderRadius: '8px', fontWeight: 800, fontSize: '1rem' }}>
                    {item.priority_code}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#1A202C' }}>
                      {item.patient_name_display} <span style={{ fontSize: '0.85rem', color: '#718096', fontWeight: 400 }}>(MRN: {item.mrn_display})</span>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#4A5568', marginTop: '0.25rem' }}>
                      <strong>Complaint:</strong> {item.chief_complaint}
                    </div>
                    {item.hard_red_flag_triggered && (
                      <div style={{ fontSize: '0.8125rem', color: '#C53030', fontWeight: 600, marginTop: '0.25rem' }}>
                        ⚠️ Red-Flag Triggered: {item.red_flag_details.join('; ')}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#2D3748' }}>Score: {item.calculated_risk_score}/100</div>
                    <div style={{ fontSize: '0.75rem', color: '#718096' }}>{new Date(item.created_at).toLocaleTimeString()}</div>
                  </div>

                  {role === 'doctor' && (
                    <button
                      onClick={() => setSelectedAssessment({ id: item.id, category: item.calculated_category })}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#3182CE',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Review / Override
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAssessment && (
        <OverrideModal
          isOpen={Boolean(selectedAssessment)}
          assessmentId={selectedAssessment.id}
          originalCategory={selectedAssessment.category}
          onClose={() => setSelectedAssessment(null)}
          onSubmit={handleOverrideSubmit}
        />
      )}
    </div>
  );
}
