'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import GridCanvas from '@/components/visual-builder/GridCanvas';
import { $visualBuilderState, visualBuilderActions } from '@/stores/visualBuilderStore';
import type { Widget } from '@/stores/visualBuilderStore';

export default function VisualBuilderPage() {
  const visualBuilderState = useStore($visualBuilderState);
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

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

  // Configuração de preview modes
  const previewSizes = {
    desktop: { width: '100%', label: '🖥️ Desktop' },
    tablet: { width: '768px', label: '📱 Tablet' },
    mobile: { width: '375px', label: '📱 Mobile' }
  };

  // Configurações responsivas para gridConfig
  const responsiveConfigs = {
    desktop: { cols: 12, rowHeight: 30, maxRows: 12 },
    tablet: { cols: 8, rowHeight: 40, maxRows: 10 },
    mobile: { cols: 4, rowHeight: 50, maxRows: 8 }
  };

  // GridConfig responsivo baseado no preview mode
  const responsiveGridConfig = {
    ...visualBuilderState.gridConfig,
    ...responsiveConfigs[previewMode],
    // containerHeight calculado automaticamente: rowHeight * maxRows + padding
    containerHeight: responsiveConfigs[previewMode].rowHeight * responsiveConfigs[previewMode].maxRows + 32
  };

  // Função para ajustar posições dos widgets baseado no número de colunas
  const adjustWidgetPositions = (widgets: Widget[], targetCols: number, originalCols: number = 12) => {
    if (targetCols >= originalCols) return widgets; // Não precisa ajustar se tem mais colunas

    const scale = targetCols / originalCols;

    return widgets.map(widget => ({
      ...widget,
      position: {
        ...widget.position,
        x: Math.floor(widget.position.x * scale),
        w: Math.max(1, Math.floor(widget.position.w * scale)),
        // Manter height e y inalterados para preservar layout vertical
      }
    }));
  };

  // Widgets responsivos com posições ajustadas
  const responsiveWidgets = adjustWidgetPositions(
    visualBuilderState.widgets,
    responsiveGridConfig.cols
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Visual Builder</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create charts and KPIs with coordinates •
              <span className={`ml-2 ${
                visualBuilderState.isValid ? 'text-green-600' : 'text-red-600'
              }`}>
                {visualBuilderState.isValid ? `${visualBuilderState.widgets.length} widgets` :
                 `${visualBuilderState.parseErrors.filter(e => e.type !== 'warning').length} errors`}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Export Config
            </button>
            <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Import Config
            </button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex">
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'editor'
                ? 'border-blue-500 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            onClick={() => setActiveTab('editor')}
          >
            📝 Editor
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
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

      {/* Main Content - Tab Based */}
      <div className="h-[calc(100vh-81px-49px)]">
        {/* Editor Tab */}
        {activeTab === 'editor' && (
          <div className="h-full bg-white">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Configuration Editor</h2>
              <p className="text-sm text-gray-600">Define your widgets with JSON coordinates</p>
            </div>
            <div className="h-[calc(100%-73px)]">
              <MonacoEditor
                value={visualBuilderState.code}
                onChange={handleCodeChange}
                language="json"
                errors={visualBuilderState.parseErrors}
              />
            </div>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="h-full bg-gray-50">
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Live Dashboard</h2>
                  <p className="text-sm text-gray-600">Real-time visualization with BigQuery data</p>
                </div>
                {/* Preview Mode Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Preview:</span>
                  {Object.entries(previewSizes).map(([mode, config]) => (
                    <button
                      key={mode}
                      onClick={() => setPreviewMode(mode as 'desktop' | 'tablet' | 'mobile')}
                      className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                        previewMode === mode
                          ? 'bg-blue-100 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="h-[800px] p-6 overflow-auto">
              {/* Dashboard Content with Preview */}
              <div
                className="mx-auto transition-all duration-300"
                style={{
                  width: previewSizes[previewMode].width,
                  maxWidth: previewSizes[previewMode].width
                }}
              >
                <GridCanvas
                  widgets={responsiveWidgets}
                  gridConfig={responsiveGridConfig}
                  onLayoutChange={handleLayoutChange}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}