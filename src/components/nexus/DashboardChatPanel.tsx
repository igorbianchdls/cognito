'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import GridCanvas from '@/components/visual-builder/GridCanvas';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import type { Widget } from '@/stores/visualBuilderStore';

export default function DashboardChatPanel() {
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const visualBuilderState = useStore($visualBuilderState);

  // Initialize store on mount
  useEffect(() => {
    visualBuilderActions.initialize();
  }, []);

  const handleCodeChange = (newCode: string) => {
    visualBuilderActions.updateCode(newCode);
  };

  const handleLayoutChange = (updatedWidgets: Widget[]) => {
    visualBuilderActions.updateWidgets(updatedWidgets);
  };

  return (
    <div className="h-full bg-white rounded-lg border border-gray-200 flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('editor')}
          >
            📝 Editor
          </button>
          <button
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'dashboard'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="h-full">
            <MonacoEditor
              value={visualBuilderState.code}
              onChange={handleCodeChange}
              language="json"
              errors={visualBuilderState.parseErrors}
            />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="h-full bg-gray-50 p-4">
            <GridCanvas
              widgets={visualBuilderState.widgets}
              gridConfig={visualBuilderState.gridConfig}
              onLayoutChange={handleLayoutChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}