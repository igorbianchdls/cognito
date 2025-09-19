'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import GridCanvas from '@/components/visual-builder/GridCanvas';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import type { Widget } from '@/stores/visualBuilderStore';
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactActions,
  ArtifactAction,
  ArtifactContent
} from '@/components/ai-elements/artifact';
import { FileText, BarChart3 } from 'lucide-react';

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
    <Artifact className="h-full">
      <ArtifactHeader className="bg-white">
        <div>
          <ArtifactTitle>Dashboard Builder</ArtifactTitle>
          <ArtifactDescription>Visual dashboard creation tool</ArtifactDescription>
        </div>
        <ArtifactActions>
          <ArtifactAction
            icon={FileText}
            onClick={() => setActiveTab('editor')}
            tooltip="Editor"
            variant={activeTab === 'editor' ? 'outline' : 'ghost'}
          />
          <ArtifactAction
            icon={BarChart3}
            onClick={() => setActiveTab('dashboard')}
            tooltip="Dashboard"
            variant={activeTab === 'dashboard' ? 'outline' : 'ghost'}
          />
        </ArtifactActions>
      </ArtifactHeader>

      <ArtifactContent className="p-0 overflow-auto">
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
          <div className="h-full bg-gray-50 p-4 overflow-auto">
            <GridCanvas
              widgets={visualBuilderState.widgets}
              gridConfig={visualBuilderState.gridConfig}
              onLayoutChange={handleLayoutChange}
            />
          </div>
        )}
      </ArtifactContent>
    </Artifact>
  );
}