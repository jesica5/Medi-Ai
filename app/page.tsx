'use client';

import React from 'react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header style={{ borderBottom: '2px solid #E2E8F0', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.25rem', color: '#1A202C', margin: 0, fontWeight: 800 }}>
          🏥 MediAI — Module M4: Smart Triage, Safety Rules & Alerts
        </h1>
        <p style={{ color: '#4A5568', fontSize: '1.125rem', marginTop: '0.5rem' }}>
          Deterministic Clinical Safety Engine, Tier-1 Red-Flag Pre-Check, and Emergency Workstation Console
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        <Link href="/triage/assess" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '1.5rem', border: '1px solid #E2E8F0', borderRadius: '12px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#2B6CB0', margin: '0 0 0.5rem 0' }}>⚡ Patient Triage Intake</h2>
            <p style={{ color: '#4A5568', fontSize: '0.9375rem', margin: 0 }}>
              Capture vital signs, symptom vectors, and run the pure deterministic safety pre-check engine.
            </p>
          </div>
        </Link>

        <Link href="/doctor/queue" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '1.5rem', border: '1px solid #E2E8F0', borderRadius: '12px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#DD6B20', margin: '0 0 0.5rem 0' }}>🚨 Doctor Priority Queue</h2>
            <p style={{ color: '#4A5568', fontSize: '0.9375rem', margin: 0 }}>
              View emergency department queue sorted by acuity priority (P1 to P4) with alert status.
            </p>
          </div>
        </Link>

        <Link href="/doctor/override" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '1.5rem', border: '1px solid #E2E8F0', borderRadius: '12px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#319795', margin: '0 0 0.5rem 0' }}>🩺 Physician Override Console</h2>
            <p style={{ color: '#4A5568', fontSize: '0.9375rem', margin: 0 }}>
              Attending doctor review workflow for acuity category override with mandatory written rationale.
            </p>
          </div>
        </Link>

        <Link href="/audit/logs" style={{ textDecoration: 'none' }}>
          <div style={{ padding: '1.5rem', border: '1px solid #E2E8F0', borderRadius: '12px', backgroundColor: '#FFFFFF', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', transition: 'all 0.2s' }}>
            <h2 style={{ fontSize: '1.25rem', color: '#805AD5', margin: '0 0 0.5rem 0' }}>📋 Audit & Compliance Journal</h2>
            <p style={{ color: '#4A5568', fontSize: '0.9375rem', margin: 0 }}>
              Read-only immutable audit trail displaying SHA-256 payload hashes and IP address records.
            </p>
          </div>
        </Link>
      </div>

      <div style={{ marginTop: '3rem', padding: '1.25rem', backgroundColor: '#EDF2F7', borderRadius: '8px', borderLeft: '4px solid #4A5568' }}>
        <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#2D3748' }}>🛡️ Clinical Safety Disclaimer</h3>
        <p style={{ margin: 0, fontSize: '0.875rem', color: '#4A5568' }}>
          MediAI is an AI-assisted clinical decision-support prototype. It must never independently diagnose conditions, prescribe medications, or replace certified clinical judgment. Deterministic red-flag safety rules strictly override machine learning predictions.
        </p>
      </div>
    </div>
  );
}
