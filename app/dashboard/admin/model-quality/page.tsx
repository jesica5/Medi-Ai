import React from 'react';
import '@/shared/styles/triage.css';
import { ModelQualityView } from '@/modules/triage_engine/components/ModelQualityView';

export const metadata = {
  title: 'AI Model Quality & Registry | MediAI Triage',
  description: 'System administrator dashboard for AI risk prediction model metrics, versioning, and TreeSHAP telemetry.',
};

export default function AdminModelQualityPage() {
  return <ModelQualityView />;
}
