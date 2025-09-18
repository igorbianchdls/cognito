'use client';

import { useState } from 'react';
import MonacoEditor from '@/components/visual-builder/MonacoEditor';
import GridCanvas from '@/components/visual-builder/GridCanvas';
import { ConfigParser } from '@/components/visual-builder/ConfigParser';
import type { Widget, GridConfig, ParseResult } from '@/components/visual-builder/ConfigParser';

export default function DashboardChatPanel() {
  const [activeTab, setActiveTab] = useState<'editor' | 'dashboard'>('editor');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Estado local para gerenciar código e widgets
  const [code, setCode] = useState(`{
  "config": {
    "maxRows": 8,
    "rowHeight": 40,
    "cols": 8,
    "containerHeight": 400
  },
  "widgets": [
    {
      "id": "kpi1",
      "type": "kpi",
      "position": { "x": 0, "y": 0, "w": 2, "h": 2 },
      "title": "Total Revenue",
      "dataSource": {
        "table": "ecommerce",
        "x": "revenue",
        "aggregation": "SUM"
      },
      "kpiConfig": {
        "unit": "USD",
        "kpiValueColor": "#10b981",
        "kpiContainerBackgroundColor": "#f0fdf4"
      }
    },
    {
      "id": "chart1",
      "type": "bar",
      "position": { "x": 2, "y": 0, "w": 6, "h": 4 },
      "title": "Sales by Product",
      "dataSource": {
        "table": "ecommerce",
        "x": "product_name",
        "y": "quantity",
        "aggregation": "SUM"
      },
      "barConfig": {
        "styling": {
          "colors": ["#3b82f6", "#10b981"],
          "backgroundColor": "#fafafa"
        }
      }
    }
  ]
}`);

  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [gridConfig, setGridConfig] = useState<GridConfig>({ maxRows: 8, rowHeight: 40, cols: 8, containerHeight: 400 });
  const [parseErrors, setParseErrors] = useState<ParseResult['errors']>([]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    const parseResult = ConfigParser.parse(newCode);
    setWidgets(parseResult.widgets);
    setGridConfig(parseResult.gridConfig);
    setParseErrors(parseResult.errors);
  };

  const handleLayoutChange = (updatedWidgets: Widget[]) => {
    setWidgets(updatedWidgets);
    const newCode = JSON.stringify({
      config: gridConfig,
      widgets: updatedWidgets
    }, null, 2);
    setCode(newCode);
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
    ...gridConfig,
    ...responsiveConfigs[previewMode],
    // containerHeight calculado automaticamente: rowHeight * maxRows + padding
    containerHeight: responsiveConfigs[previewMode].rowHeight * responsiveConfigs[previewMode].maxRows + 32
  };

  // Função para ajustar posições dos widgets baseado no número de colunas
  const adjustWidgetPositions = (widgets: Widget[], targetCols: number, originalCols: number = 12) => {
    if (targetCols >= originalCols) return widgets;

    const scale = targetCols / originalCols;

    return widgets.map(widget => ({
      ...widget,
      position: {
        ...widget.position,
        x: Math.floor(widget.position.x * scale),
        w: Math.max(1, Math.floor(widget.position.w * scale)),
      }
    }));
  };

  // Widgets responsivos com posições ajustadas
  const responsiveWidgets = adjustWidgetPositions(widgets, responsiveGridConfig.cols);

  // Inicializar com código padrão
  useState(() => {
    const parseResult = ConfigParser.parse(code);
    setWidgets(parseResult.widgets);
    setGridConfig(parseResult.gridConfig);
    setParseErrors(parseResult.errors);
  });

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
              value={code}
              onChange={handleCodeChange}
              language="json"
              errors={parseErrors}
            />
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="h-full bg-gray-50 flex flex-col">
            {/* Preview Mode Selector */}
            <div className="p-4 border-b border-gray-200 bg-white">
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

            {/* Dashboard Content with Preview */}
            <div className="flex-1 p-4 overflow-auto">
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