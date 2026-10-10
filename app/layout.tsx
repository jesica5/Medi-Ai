import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'MediAI — M4 Smart Triage Engine',
  description: 'Deterministic Safety Pre-Check, Smart Triage Priority Stratification, and Doctor Override Ledger',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#F7FAFC', color: '#1A202C', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <nav style={{ backgroundColor: '#2B6CB0', color: '#FFFFFF', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Link href="/" style={{ color: '#FFFFFF', textDecoration: 'none', fontWeight: 800, fontSize: '1.25rem' }}>
            MediAI <span style={{ fontWeight: 400, fontSize: '1rem', opacity: 0.9 }}>| M4 Smart Triage</span>
          </Link>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9375rem', fontWeight: 600 }}>
            <Link href="/triage/assess" style={{ color: '#FFFFFF', textDecoration: 'none' }}>Intake Terminal</Link>
            <Link href="/doctor/queue" style={{ color: '#FFFFFF', textDecoration: 'none' }}>Doctor Queue</Link>
            <Link href="/audit/logs" style={{ color: '#FFFFFF', textDecoration: 'none' }}>Audit Log</Link>
          </div>
        </nav>

        <main style={{ minHeight: 'calc(100vh - 120px)' }}>{children}</main>

        <footer style={{ backgroundColor: '#EDF2F7', borderTop: '1px solid #E2E8F0', padding: '1rem', textAlign: 'center', fontSize: '0.8125rem', color: '#718096' }}>
          MediAI Decision-Support System M4 • Clinical Safety Pre-Check Active • 100% Deterministic Override Enabled
        </footer>
      </body>
    </html>
  );
}
