'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, Play } from 'lucide-react';
import type { Widget } from '@/components/visual-builder/ConfigParser';

interface UpdateItem {
  id: string;
  changes: Partial<Widget>;
}

interface UpdatesData {
  updates?: UpdateItem[];
  newWidgets?: Widget[];
}

interface UpdateDashboardToolProps {
  success: boolean;
  updateJson: string;
  description: string;
  message?: string;
}

export default function UpdateDashboardTool({
  success,
  updateJson,
  description,
  message
}: UpdateDashboardToolProps) {
  const [editableUpdateJson, setEditableUpdateJson] = useState(updateJson);
  const [isApplied, setIsApplied] = useState(false);
  const visualBuilderState = useStore($visualBuilderState);

  const applyUpdates = () => {
    try {
      // Parse do JSON de updates/newWidgets
      const updatesData = JSON.parse(editableUpdateJson) as UpdatesData;

      // Adiciona novos widgets (se houver)
      if (updatesData.newWidgets && updatesData.newWidgets.length > 0) {
        visualBuilderActions.addWidgets(updatesData.newWidgets);
      }

      setIsApplied(true);
      setTimeout(() => setIsApplied(false), 3000);

    } catch (error) {
      alert('Invalid JSON or update format. Please fix the syntax errors.');
      console.error('Update error:', error);
    }
  };

  if (!success) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-red-700">Failed to generate widget updates</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-orange-50 border-b border-orange-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <RefreshCw className="w-5 h-5 text-orange-600" />
          <h3 className="font-medium text-orange-900">Add New Widgets to Dashboard</h3>
        </div>
        <p className="text-sm text-orange-700">{description}</p>
        {message && (
          <p className="text-xs text-orange-600 mt-1">{message}</p>
        )}
      </div>

      {/* Current State Info */}
      <div className="bg-gray-50 border-b border-gray-200 p-3">
        <div className="text-sm text-gray-600">
          <span className="font-medium">Current Dashboard:</span> {visualBuilderState.widgets.length} widgets
          {visualBuilderState.widgets.length > 0 && (
            <span className="ml-2">
              IDs: {visualBuilderState.widgets.map(w => w.id).join(', ')}
            </span>
          )}
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="h-80">
        <MonacoEditor
          value={editableUpdateJson}
          onChange={setEditableUpdateJson}
          language="json"
          height="100%"
        />
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            New widgets will be added to the dashboard or existing widgets updated by ID
          </div>

          <Button
            onClick={applyUpdates}
            disabled={isApplied}
            className={`flex items-center gap-2 ${
              isApplied
                ? 'bg-green-600 hover:bg-green-600'
                : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {isApplied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Widgets Added!
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Add Widgets
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}