'use client';

import { useStore } from '@nanostores/react';
import { $visualBuilderState } from '@/stores/visualBuilderStore';

interface RenderDashboardCodeProps {
  success: boolean;
}

const getWidgetIcon = (type: string) => {
  switch (type) {
    case 'bar': return '📊';
    case 'line': return '📈';
    case 'pie': return '🥧';
    case 'area': return '📉';
    case 'kpi': return '🎯';
    case 'table': return '📋';
    default: return '📊';
  }
};

const getWidgetTypeLabel = (type: string) => {
  switch (type) {
    case 'bar': return 'Bar Chart';
    case 'line': return 'Line Chart';
    case 'pie': return 'Pie Chart';
    case 'area': return 'Area Chart';
    case 'kpi': return 'KPI';
    case 'table': return 'Table';
    default: return type.toUpperCase();
  }
};

export default function RenderDashboardCode({ success }: RenderDashboardCodeProps) {
  const visualBuilderState = useStore($visualBuilderState);

  console.log('🎨 RenderDashboardCode: Renderizando com state:', {
    widgetsCount: visualBuilderState.widgets.length,
    isValid: visualBuilderState.isValid,
    success
  });

  if (!success) {
    return (
      <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-red-500">❌</span>
          <span className="text-red-700 font-medium">Failed to get dashboard info</span>
        </div>
      </div>
    );
  }

  if (visualBuilderState.widgets.length === 0) {
    return (
      <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">📊</span>
          <span className="font-medium text-gray-700">Dashboard Status</span>
        </div>
        <p className="text-gray-600">No widgets configured in the dashboard. Use the editor to add widgets!</p>
      </div>
    );
  }

  return (
    <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📊</span>
        <span className="font-medium text-blue-800">Dashboard Widgets</span>
        <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
          {visualBuilderState.widgets.length} widget{visualBuilderState.widgets.length !== 1 ? 's' : ''}
        </span>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          visualBuilderState.isValid
            ? 'bg-green-200 text-green-800'
            : 'bg-yellow-200 text-yellow-800'
        }`}>
          {visualBuilderState.isValid ? '✅ Valid' : '⚠️ Errors'}
        </span>
      </div>

      <p className="text-blue-700 mb-3">
        {visualBuilderState.widgets.length} widget(s) configured: {visualBuilderState.widgets.map(w => w.title || w.id).join(', ')}
      </p>

      {/* Grid Configuration */}
      <div className="mb-3 p-2 bg-white rounded border border-blue-200">
        <h4 className="text-xs font-medium text-gray-700 mb-1">Grid Configuration</h4>
        <div className="flex gap-4 text-xs text-gray-600">
          <span>📏 Columns: {visualBuilderState.gridConfig.cols}</span>
          <span>📐 Max Rows: {visualBuilderState.gridConfig.maxRows}</span>
          <span>⬆️ Row Height: {visualBuilderState.gridConfig.rowHeight}px</span>
        </div>
      </div>

      {/* Parse Errors */}
      {visualBuilderState.parseErrors.length > 0 && (
        <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="text-xs font-medium text-yellow-700 mb-1">Configuration Issues</h4>
          {visualBuilderState.parseErrors.map((error, index) => (
            <div key={index} className="text-xs text-yellow-600">
              {error.line && `Line ${error.line}: `}{error.message}
            </div>
          ))}
        </div>
      )}

      {/* Widgets List */}
      <div className="space-y-2">
        {visualBuilderState.widgets.map((widget, index) => (
          <div key={widget.id} className="bg-white p-3 rounded-lg border border-blue-200">
            <div className="flex items-start gap-3">
              <span className="text-xl">{getWidgetIcon(widget.type)}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-gray-900">{widget.title || widget.id}</h4>
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                    {getWidgetTypeLabel(widget.type)}
                  </span>
                </div>
                {widget.dataSource && (
                  <p className="text-sm text-gray-600 mb-2">
                    {widget.dataSource.table && `Table: ${widget.dataSource.table}`}
                    {widget.dataSource.x && ` | X: ${widget.dataSource.x}`}
                    {widget.dataSource.y && ` | Y: ${widget.dataSource.y}`}
                    {widget.dataSource.aggregation && ` | Agg: ${widget.dataSource.aggregation}`}
                  </p>
                )}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>🆔 ID: {widget.id}</span>
                  <span>📍 Position: ({widget.position.x}, {widget.position.y})</span>
                  <span>📏 Size: {widget.position.w}×{widget.position.h}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}