'use client';

import { useStore } from '@nanostores/react';
import { $visualBuilderState } from '@/stores/visualBuilderStore';

interface RenderDashboardCodeProps {
  success: boolean;
}

export default function renderDashboardCode({ success }: RenderDashboardCodeProps) {
  const visualBuilderState = useStore($visualBuilderState);

  if (!success) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-red-700">Failed to get dashboard info</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-medium mb-3">Dashboard Widgets</h3>
      <div className="space-y-2">
        {visualBuilderState.widgets.map((widget) => (
          <div key={widget.id} className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-600">{widget.id}</span>
            <span className="text-sm">{widget.title}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-500 mt-3">
        Total: {visualBuilderState.widgets.length} widgets
      </p>
    </div>
  );
}