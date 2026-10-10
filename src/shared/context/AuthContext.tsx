'use client';

import React, { createContext, useContext, useState } from 'react';

export interface DoctorUser {
  id: string;
  name: string;
  role: 'ATTENDING_DOCTOR' | 'TRIAGE_NURSE' | 'SYSTEM_ADMIN';
  email: string;
  department: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: DoctorUser | null;
  isAuthenticated: boolean;
  isDoctor: boolean;
  logout: () => void;
}

const DEFAULT_DOCTOR: DoctorUser = {
  id: 'doc-bhuvana-9982-uuid',
  name: 'Dr. Bhuvana M.V.',
  role: 'ATTENDING_DOCTOR',
  email: 'bhuvana.doctor@hospital.org',
  department: 'Emergency Medicine',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<DoctorUser | null>(DEFAULT_DOCTOR);

  const logout = () => {
    setUser(null);
  };

  const isDoctor = user?.role === 'ATTENDING_DOCTOR';

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isDoctor, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
