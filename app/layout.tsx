import React from 'react';
import '@/shared/styles/triage.css';

export const metadata = {
  title: 'MediAI Smart Patient Triage & Emergency Risk Prediction',
  description: 'AI Risk Prediction & Explainability Module (M3)',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#F7FAFC' }}>
        {children}
      </body>
    </html>
  );
}
