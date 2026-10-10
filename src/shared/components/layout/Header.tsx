'use client';

import React from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { useLanguage } from '@/shared/context/LanguageContext';
import { Globe, LogOut, Bell, User, Activity } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between shadow-2xs">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-xs">
          <Activity className="w-5 h-5 text-teal-400" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
            MediAI <span className="text-teal-700 font-normal text-xs ml-1 px-2 py-0.5 bg-teal-50 border border-teal-200 rounded-md">Doctor Workstation</span>
          </h1>
          <p className="text-[11px] text-slate-500 font-medium">Emergency Triage & Clinical Decision Support System</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Switcher (EN / TA) */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
          <button
            onClick={() => setLanguage('en')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              language === 'en' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage('ta')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
              language === 'ta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            தமிழ் (TA)
          </button>
        </div>

        {/* Emergency Alerts Notification Badge */}
        <button
          className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus:outline-none"
          title="Emergency Alerts Counter"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-600 ring-2 ring-white animate-pulse" />
        </button>

        {/* Doctor Profile & Role Indicator */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="w-9 h-9 rounded-full bg-teal-700 text-white font-semibold flex items-center justify-center text-sm shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DR'}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-bold text-slate-900">{user?.name || 'Dr. Attending'}</p>
            <span className="inline-block text-[10px] font-semibold text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
              {user?.department || 'Emergency Medicine'}
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={logout}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1 focus:outline-none"
          title="Logout of Doctor Workstation"
          aria-label="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
