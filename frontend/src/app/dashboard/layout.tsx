'use client';

import DashboardLayout from '@/components/ui/DashboardLayout';
import { AuthGuard } from '@/components/AuthGuard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AITutor } from '@/components/AITutor';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <DashboardLayout>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <AITutor />
      </DashboardLayout>
    </AuthGuard>
  );
}
