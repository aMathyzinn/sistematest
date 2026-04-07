'use client';

import { useUIStore } from '@/stores/uiStore';
import Widget from './Widget';

export default function DashboardGrid() {
  const { sections } = useUIStore();
  const visibleSections = sections
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-3 px-4 py-3">
      {visibleSections.map((section, index) => (
        <div key={section.id} className="animate-slide-up" style={{ animationDelay: `${index * 60}ms` }}>
          <Widget section={section} />
        </div>
      ))}
    </div>
  );
}
