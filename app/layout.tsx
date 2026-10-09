import type { Metadata } from 'next';
import '../modules/patient_intake/styles/tokens.css';

export const metadata: Metadata = {
  title: 'MediAI - Emergency Triage & Health Assessment',
  description: 'AI-assisted emergency triage and risk prediction decision-support prototype.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'var(--font-family-base)', backgroundColor: 'var(--color-surface-bg)' }}>
        {children}
      </body>
    </html>
  );
}
