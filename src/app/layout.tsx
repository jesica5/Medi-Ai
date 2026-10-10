import React from 'react';
import './globals.css';
import { AuthProvider } from '@/shared/context/AuthContext';
import { LanguageProvider } from '@/shared/context/LanguageContext';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MediAI — Doctor Emergency Workstation',
  description: 'Smart Patient Triage & Emergency Risk Prediction System Doctor Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50">
        <AuthProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
