'use client';

import { useState } from 'react';
import { visualBuilderActions } from '@/stores/visualBuilderStore';

interface CreateDashboardResultProps {
  success: boolean;
  description?: string;
  totalWidgets?: number;
  dashboardConfig?: {
    config: {
      maxRows: number;
      rowHeight: number;
      cols: number;
    };
    widgets: Array<{
      id: string;
      type: string;
      position: { x: number; y: number; w: number; h: number };
      title: string;
      dataSource: {
        table: string;
        x?: string;
        y?: string;
        aggregation?: string;
      };
    }>;
  };
  generatedJson?: string;
  message?: string;
  error?: string;
}

export default function CreateDashboardResult({
  success,
  description,
  totalWidgets,
  dashboardConfig,
  generatedJson,
  message,
  error
}: CreateDashboardResultProps) {
  const [isApplying, setIsApplying] = useState(false);
  const [isApplied, setIsApplied] = useState(false);

  const handleApplyToDashboard = async () => {
    if (!generatedJson || !dashboardConfig) return;

    setIsApplying(true);
    try {
      // Apply the generated JSON to the visual builder store
      visualBuilderActions.updateCode(generatedJson);

      setIsApplied(true);
      console.log('🎨 Dashboard applied to Visual Builder successfully');
    } catch (error) {
      console.error('❌ Error applying dashboard:', error);
    } finally {
      setIsApplying(false);
    }
  };
  if (!success) {
    return (
      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-red-500">❌</span>
          <span className="text-red-700 font-medium">Failed to create dashboard</span>
        </div>
        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🎨</span>
        <span className="font-medium text-green-800">Dashboard Created</span>
        <span className="bg-green-200 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
          {totalWidgets || 0} widget{(totalWidgets || 0) !== 1 ? 's' : ''}
        </span>
        {dashboardConfig && (
          <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
            {dashboardConfig.config.cols}×{dashboardConfig.config.maxRows} Grid
          </span>
        )}
      </div>

      {description && (
        <p className="text-green-700 mb-3">
          <strong>Description:</strong> {description}
        </p>
      )}

      {message && (
        <p className="text-green-700 mb-3 text-sm">{message}</p>
      )}

      {/* Success notification when applied */}
      {isApplied && (
        <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-purple-500">✨</span>
            <span className="text-purple-800 font-medium">Dashboard Applied Successfully!</span>
          </div>
          <p className="text-purple-700 text-sm mt-1">
            Your dashboard has been applied to the Visual Builder. You can now view it in the dashboard panel.
          </p>
        </div>
      )}

      {/* Widget Summary */}
      {dashboardConfig && dashboardConfig.widgets.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-green-800 mb-2">Created Widgets:</h4>
          <div className="space-y-2">
            {dashboardConfig.widgets.map((widget, index) => (
              <div key={widget.id} className="bg-white p-2 rounded border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{widget.title}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {widget.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-600">
                  <span>📊 Table: {widget.dataSource.table}</span>
                  {widget.dataSource.x && <span> | X: {widget.dataSource.x}</span>}
                  {widget.dataSource.y && <span> | Y: {widget.dataSource.y}</span>}
                  {widget.dataSource.aggregation && <span> | Agg: {widget.dataSource.aggregation}</span>}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Position: ({widget.position.x}, {widget.position.y}) | Size: {widget.position.w}×{widget.position.h}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {generatedJson && (
        <div className="bg-white rounded-lg border border-green-200 p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Dashboard JSON</h4>
          <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(JSON.parse(generatedJson), null, 2)}
          </pre>
          <div className="mt-2 flex gap-2 flex-wrap">
            <button
              onClick={handleApplyToDashboard}
              disabled={isApplying || isApplied || !dashboardConfig}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                isApplied
                  ? 'bg-green-100 text-green-800 border border-green-300'
                  : isApplying
                  ? 'bg-orange-100 text-orange-800 border border-orange-300'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              {isApplying ? '⏳ Applying...' : isApplied ? '✅ Applied to Dashboard' : '🎨 Apply to Dashboard'}
            </button>

            {isApplied && (
              <a
                href="/nexus"
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                👁️ View Dashboard
              </a>
            )}

            <button
              onClick={() => navigator.clipboard.writeText(generatedJson)}
              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
            >
              📋 Copy JSON
            </button>
            <button
              onClick={() => {
                const blob = new Blob([generatedJson], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'dashboard.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
            >
              💾 Download JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}