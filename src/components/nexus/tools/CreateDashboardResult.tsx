'use client';

import { useState } from 'react';
import { visualBuilderActions } from '@/stores/visualBuilderStore';
import {
  LayoutDashboard,
  CheckCircle,
  XCircle,
  Database,
  Eye,
  Copy,
  Download,
  Loader2,
  Sparkles
} from 'lucide-react';

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
          <XCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700 font-medium">Failed to create dashboard</span>
        </div>
        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <LayoutDashboard className="w-5 h-5 text-gray-700" />
        <span className="font-medium text-gray-800">Dashboard Created</span>
        <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded-full text-xs font-medium">
          {totalWidgets || 0} widget{(totalWidgets || 0) !== 1 ? 's' : ''}
        </span>
        {dashboardConfig && (
          <span className="bg-gray-300 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
            {dashboardConfig.config.cols}×{dashboardConfig.config.maxRows} Grid
          </span>
        )}
      </div>

      {description && (
        <p className="text-gray-700 mb-3">
          <strong>Description:</strong> {description}
        </p>
      )}

      {message && (
        <p className="text-gray-700 mb-3 text-sm">{message}</p>
      )}

      {/* Success notification when applied */}
      {isApplied && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-500" />
            <span className="text-blue-800 font-medium">Dashboard Applied Successfully!</span>
          </div>
          <p className="text-blue-700 text-sm mt-1">
            Your dashboard has been applied to the Visual Builder. You can now view it in the dashboard panel.
          </p>
        </div>
      )}

      {/* Widget Summary */}
      {dashboardConfig && dashboardConfig.widgets.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-800 mb-2">Created Widgets:</h4>
          <div className="space-y-2">
            {dashboardConfig.widgets.map((widget, index) => (
              <div key={widget.id} className="bg-white p-2 rounded border border-gray-200">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{widget.title}</span>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {widget.type.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-gray-600 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  <span>Table: {widget.dataSource.table}</span>
                  {widget.dataSource.x && <span> | X: {widget.dataSource.x}</span>}
                  {widget.dataSource.y && <span> | Y: {widget.dataSource.y}</span>}
                  {widget.dataSource.aggregation && <span> | Agg: {widget.dataSource.aggregation}</span>}
                </div>
                {widget.position && (
                  <div className="text-xs text-gray-500 mt-1">
                    Position: ({widget.position.x}, {widget.position.y}) | Size: {widget.position.w}×{widget.position.h}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {generatedJson && (
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Generated Dashboard JSON</h4>
          <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto max-h-96 overflow-y-auto">
            {JSON.stringify(JSON.parse(generatedJson), null, 2)}
          </pre>
          <div className="mt-2 flex gap-2 flex-wrap">
            <button
              onClick={handleApplyToDashboard}
              disabled={isApplying || isApplied || !dashboardConfig}
              className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
                isApplied
                  ? 'bg-gray-100 text-gray-700 border border-gray-300'
                  : isApplying
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-700 text-white hover:bg-gray-800'
              }`}
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Applying...
                </>
              ) : isApplied ? (
                <>
                  <CheckCircle className="w-3 h-3" />
                  Applied to Dashboard
                </>
              ) : (
                <>
                  <LayoutDashboard className="w-3 h-3" />
                  Apply to Dashboard
                </>
              )}
            </button>

            {isApplied && (
              <a
                href="/nexus"
                className="px-3 py-1 bg-gray-700 text-white text-xs rounded hover:bg-gray-800 transition-colors flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                View Dashboard
              </a>
            )}

            <button
              onClick={() => navigator.clipboard.writeText(generatedJson)}
              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy JSON
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
              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              Download JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
