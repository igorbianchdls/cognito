'use client';

import { useState } from 'react';
import { useStore } from '@nanostores/react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import { visualBuilderActions } from '@/stores/visualBuilderStore';
import { Button } from '@/components/ui/button';
import { CheckCircle, Code, Play } from 'lucide-react';

interface CreateDashboardToolProps {
  success: boolean;
  generatedJson: string;
  description: string;
  message?: string;
}

export default function CreateDashboardTool({
  success,
  generatedJson,
  description,
  message
}: CreateDashboardToolProps) {
  const [editableJson, setEditableJson] = useState(generatedJson);
  const [isApplied, setIsApplied] = useState(false);

  const handleApplyDashboard = () => {
    // Aplica o código (DSL) ao Visual Builder
    visualBuilderActions.updateCode(editableJson);
    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 3000);
  };

  if (!success) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <span className="text-red-700">Failed to generate dashboard</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-blue-50 border-b border-blue-200 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Code className="w-5 h-5 text-blue-600" />
          <h3 className="font-medium text-blue-900">Código do Dashboard (Draft)</h3>
        </div>
        <p className="text-sm text-blue-700">{description}</p>
        {message && (
          <p className="text-xs text-blue-600 mt-1">{message}</p>
        )}
      </div>

      {/* Monaco Editor */}
      <div className="h-80">
        <MonacoEditor value={editableJson} onChange={setEditableJson} language="html" height="100%" />
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Você pode editar o código acima antes de aplicar no editor
          </div>

          <Button
            onClick={handleApplyDashboard}
            disabled={isApplied}
            className={`flex items-center gap-2 ${
              isApplied
                ? 'bg-green-600 hover:bg-green-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isApplied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Aplicado!
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Aplicar ao Editor
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
