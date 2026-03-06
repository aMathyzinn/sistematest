'use client';

import AppShell from '@/components/layout/AppShell';
import DashboardGrid from '@/components/dashboard/DashboardGrid';

export default function DashboardPage() {
  return (
    <AppShell>
      <DashboardGrid />
    </AppShell>
  );
}
