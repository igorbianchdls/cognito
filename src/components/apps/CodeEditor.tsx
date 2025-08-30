'use client'

import { useStore } from '@nanostores/react'
import { useState, useEffect, useCallback } from 'react'
import { $widgets, widgetActions } from '@/stores/apps/widgetStore'
import type { DroppedWidget, ChartConfig, WidgetConfig } from '@/types/widget'

interface JsonWidget {
  i: string
  name: string
  type: string
  position: { x: number; y: number }
  size: { w: number; h: number }
  style?: { color?: string }
  icon?: string
  description?: string
  id?: string
  config?: WidgetConfig      // New unified config structure
  chartConfig?: ChartConfig  // Deprecated: for backward compatibility
}

interface JsonData {
  meta?: {
    title?: string
    created?: string
    totalWidgets?: number
  }
  widgets: JsonWidget[]
}

interface CodeEditorState {
  code: string
  error: string | null
  isValidJson: boolean
  lastSync: number
}

interface ChartResult {
  success: boolean
  message: string
}

interface CreateChartConfig {
  project: string
  dataset: string
  table: string
  x: string
  y: string
  type: 'bar' | 'line' | 'pie' | 'area'
}

export default function CodeEditor() {
  const widgets = useStore($widgets)
  const [state, setState] = useState<CodeEditorState>({
    code: '',
    error: null,
    isValidJson: true,
    lastSync: Date.now()
  })
  const [isChartMode, setIsChartMode] = useState(false)
  const [chartResult, setChartResult] = useState<ChartResult | null>(null)

  // Parse createChart code
  const parseCreateChart = (code: string): CreateChartConfig => {
    try {
      const match = code.match(/createChart\s*\(\s*({[\s\S]*?})\s*\)/);
      if (!match) {
        throw new Error('No createChart() function found');
      }
      
      const configStr = match[1];
      const config = eval(`(${configStr})`) as CreateChartConfig;
      
      if (!config.project || !config.dataset || !config.table || !config.x || !config.y || !config.type) {
        throw new Error('Missing required fields: project, dataset, table, x, y, type');
      }
      
      return config;
    } catch (error) {
      throw new Error(`Invalid createChart format: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Generate SQL from parsed config (simplified version)
  const generateSQLFromConfig = (config: CreateChartConfig): string => {
    const aggregation = 'SUM'; // Simplified - always use SUM
    
    return `
SELECT ${config.x}, ${aggregation}(${config.y}) as ${config.y}_agg
FROM \`${config.project}.${config.dataset}.${config.table}\`
GROUP BY ${config.x}
ORDER BY ${config.y}_agg DESC
LIMIT 50
    `.trim();
  };

  // Get chart icon based on type
  const getChartIcon = (chartType: string) => {
    switch (chartType) {
      case 'bar': return '📊';
      case 'line': return '📈';
      case 'pie': return '🥧';
      case 'area': return '📊';
      default: return '📊';
    }
  };

  // Execute createChart code
  const executeCreateChart = async (code: string): Promise<ChartResult> => {
    try {
      // 1. Parse código
      const config = parseCreateChart(code);
      
      // 2. Gerar SQL
      const sql = generateSQLFromConfig(config);
      
      // 3. Executar BigQuery
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: sql
        })
      });
      
      const result = await response.json();
      
      if (!result.success || !result.data?.data) {
        throw new Error(result.error || 'No data returned from BigQuery');
      }
      
      // 4. Processar dados
      const rawData = result.data.data;
      const chartData = rawData.map((row: Record<string, unknown>) => ({
        x: String(row[config.x] || 'Unknown'),
        y: Number(row[`${config.y}_agg`] || 0),
        label: String(row[config.x] || 'Unknown'),
        value: Number(row[`${config.y}_agg`] || 0)
      }));
      
      // 5. Criar widget
      const widgetConfig = {
        id: `chart-${Date.now()}`,
        name: `${config.table} - ${config.type} Chart`,
        type: `chart-${config.type}` as const,
        icon: getChartIcon(config.type),
        description: `Chart from ${config.table}`,
        defaultWidth: 4,
        defaultHeight: 3,
        i: `widget-${Date.now()}`,
        x: 0,
        y: 0,
        w: 4,
        h: 3,
        config: {
          chartConfig: {
            title: `${config.x} por ${config.y}`,
            colors: ['#2563eb'],
            enableGridX: false,
            enableGridY: true,
            margin: { top: 12, right: 12, bottom: 60, left: 50 }
          }
        },
        bigqueryData: {
          chartType: config.type,
          data: chartData,
          xColumn: config.x,
          yColumn: config.y,
          query: sql,
          source: 'bigquery',
          table: config.table,
          lastUpdated: new Date().toISOString()
        }
      };
      
      // 6. Adicionar ao canvas
      widgetActions.addWidget(widgetConfig);
      
      return { success: true, message: 'Chart created successfully!' };
      
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  // Handle create chart button
  const handleCreateChart = async () => {
    const result = await executeCreateChart(state.code);
    setChartResult(result);
    
    if (result.success) {
      // Clear code after success
      setState(prev => ({ ...prev, code: '', error: null }));
    }
  };

  // Generate initial JSON from current widgets
  const generateJsonFromWidgets = useCallback((widgetList: DroppedWidget[]) => {
    const jsonData = {
      meta: {
        title: 'My Dashboard',
        created: new Date().toISOString().split('T')[0],
        totalWidgets: widgetList.length
      },
      widgets: widgetList.map(widget => {
        const jsonWidget: JsonWidget = {
          i: widget.i,
          name: widget.name,
          type: widget.type,
          position: {
            x: widget.x,
            y: widget.y
          },
          size: {
            w: widget.w,
            h: widget.h
          },
          style: {
            color: widget.color || '#3B82F6'
          }
        }
        
        // Include new config structure if it exists, otherwise fall back to chartConfig
        if (widget.config) {
          jsonWidget.config = widget.config
        } else if (widget.chartConfig) {
          // Backward compatibility: include chartConfig
          jsonWidget.chartConfig = widget.chartConfig
        }
        
        return jsonWidget
      })
    }
    
    return JSON.stringify(jsonData, null, 2)
  }, [])

  // Sync widgets to JSON when widgets change
  useEffect(() => {
    const newCode = generateJsonFromWidgets(widgets)
    setState(prev => ({
      ...prev,
      code: newCode,
      lastSync: Date.now()
    }))
  }, [widgets, generateJsonFromWidgets])

  // Validate JSON as user types
  const handleCodeChange = (newCode: string) => {
    setState(prev => ({ ...prev, code: newCode }))
    
    // Debounced validation
    setTimeout(() => {
      try {
        JSON.parse(newCode)
        setState(prev => ({ ...prev, error: null, isValidJson: true }))
      } catch (error) {
        setState(prev => ({ 
          ...prev, 
          error: error instanceof Error ? error.message : 'Invalid JSON',
          isValidJson: false 
        }))
      }
    }, 300)
  }

  // Apply JSON changes to widgets
  const handleApplyChanges = () => {
    try {
      const parsed = JSON.parse(state.code) as JsonData
      
      if (!parsed || !parsed.widgets || !Array.isArray(parsed.widgets)) {
        setState(prev => ({ ...prev, error: 'JSON must contain a "widgets" array' }))
        return
      }

      // Transform JSON widgets back to DroppedWidget format
      const newWidgets: DroppedWidget[] = parsed.widgets.map((widget: JsonWidget, index: number) => {
        if (!widget.i) {
          widget.i = `widget-${Date.now()}-${index}`
        }
        
        const droppedWidget: DroppedWidget = {
          id: widget.id || widget.i,
          i: widget.i,
          name: widget.name || 'Unnamed Widget',
          type: widget.type || 'chart',
          icon: widget.icon || '📊',
          description: widget.description || '',
          defaultWidth: widget.size?.w || 2,
          defaultHeight: widget.size?.h || 2,
          x: widget.position?.x || 0,
          y: widget.position?.y || 0,
          w: widget.size?.w || 2,
          h: widget.size?.h || 2,
          color: widget.style?.color || '#3B82F6'
        }
        
        // Include new config structure if it exists, otherwise fall back to chartConfig
        if (widget.config) {
          droppedWidget.config = widget.config
        } else if (widget.chartConfig) {
          // Backward compatibility: convert chartConfig to new structure
          droppedWidget.chartConfig = widget.chartConfig
        }
        
        return droppedWidget
      })

      widgetActions.setWidgets(newWidgets)
      setState(prev => ({ ...prev, error: null, lastSync: Date.now() }))
      
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to parse JSON' 
      }))
    }
  }

  // Reset to current widgets state
  const handleReset = () => {
    const newCode = generateJsonFromWidgets(widgets)
    setState(prev => ({
      ...prev,
      code: newCode,
      error: null,
      isValidJson: true,
      lastSync: Date.now()
    }))
  }

  // Format JSON
  const handleFormat = () => {
    try {
      const parsed = JSON.parse(state.code)
      const formatted = JSON.stringify(parsed, null, 2)
      setState(prev => ({ ...prev, code: formatted }))
    } catch (formatError) {
      setState(prev => ({ 
        ...prev, 
        error: 'Cannot format invalid JSON' 
      }))
    }
  }

  // Export JSON
  const handleExport = () => {
    const blob = new Blob([state.code], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'dashboard-config.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Import JSON
  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const content = e.target?.result as string
          handleCodeChange(content)
        }
        reader.readAsText(file)
      }
    }
    input.click()
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-[0.5px] border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700">Code Editor</h2>
        <p className="text-sm text-gray-600 mt-1">
          Edit your dashboard using JSON code
        </p>
      </div>

      {/* Actions Bar */}
      <div className="p-3 border-b border-[0.5px] border-gray-200 bg-gray-50">
        <div className="flex gap-2 flex-wrap items-center">
          {/* Mode Toggle */}
          <button
            onClick={() => setIsChartMode(!isChartMode)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              isChartMode ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
            }`}
          >
            {isChartMode ? 'Chart Mode' : 'JSON Mode'}
          </button>

          {/* Mode-specific buttons */}
          {isChartMode ? (
            <button
              onClick={handleCreateChart}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
            >
              Create Chart
            </button>
          ) : (
            <>
              <button
                onClick={handleApplyChanges}
                disabled={!state.isValidJson}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply Changes
              </button>
              <button
                onClick={handleReset}
                className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleFormat}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
              >
                Format
              </button>
              <div className="flex gap-1">
                <button
                  onClick={handleExport}
                  className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                >
                  Export
                </button>
                <button
                  onClick={handleImport}
                  className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                >
                  Import
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 border-b border-[0.5px] border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className={`flex items-center gap-1 ${state.isValidJson ? 'text-green-600' : 'text-red-600'}`}>
              <span className={`w-2 h-2 rounded-full ${state.isValidJson ? 'bg-green-500' : 'bg-red-500'}`}></span>
              {state.isValidJson ? 'Valid JSON' : 'Invalid JSON'}
            </span>
            <span className="text-gray-600">
              Lines: {state.code.split('\n').length}
            </span>
            <span className="text-gray-600">
              Widgets: {widgets.length}
            </span>
          </div>
          <span className="text-gray-500">
            Last sync: {new Date(state.lastSync).toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {state.error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center gap-2 text-red-700">
            <span>❌</span>
            <span className="text-sm font-medium">Error:</span>
          </div>
          <p className="text-sm text-red-600 mt-1">{state.error}</p>
        </div>
      )}

      {/* Chart Result Feedback */}
      {chartResult && (
        <div className={`p-3 border-b ${
          chartResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className={`flex items-center gap-2 ${
            chartResult.success ? 'text-green-700' : 'text-red-700'
          }`}>
            <span>{chartResult.success ? '✅' : '❌'}</span>
            <span className="text-sm font-medium">
              {chartResult.success ? 'Success:' : 'Error:'}
            </span>
            <button
              onClick={() => setChartResult(null)}
              className="ml-auto text-xs opacity-50 hover:opacity-100"
            >
              ✕
            </button>
          </div>
          <p className={`text-sm mt-1 ${
            chartResult.success ? 'text-green-600' : 'text-red-600'
          }`}>
            {chartResult.message}
          </p>
        </div>
      )}

      {/* Code Editor */}
      <div className="flex-1 relative">
        <textarea
          value={state.code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="w-full h-full p-4 font-mono text-sm resize-none focus:outline-none border-none bg-gray-900 text-gray-100"
          placeholder={isChartMode ? `createChart({
  project: "creatto-463117",
  dataset: "biquery_data",
  table: "ecommerce",
  x: "categoria",
  y: "receita",
  type: "bar"
})` : `{
  "meta": {
    "title": "My Dashboard",
    "created": "2024-01-15"
  },
  "widgets": [
    {
      "i": "widget-1",
      "name": "Sample Chart",
      "type": "chart",
      "position": { "x": 0, "y": 0 },
      "size": { "w": 3, "h": 2 },
      "style": { "color": "#3B82F6" }
    }
  ]
}`}
          style={{
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            lineHeight: '1.5',
            tabSize: 2
          }}
        />
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[0.5px] border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="mb-2">💡 <strong>Quick Tips:</strong></p>
          <ul className="space-y-1 text-xs">
            <li>• Use proper JSON syntax with quotes and commas</li>
            <li>• Widgets need: i, name, type, position, size</li>
            <li>• Changes apply to canvas when you click &quot;Apply&quot;</li>
            <li>• Export/Import to save configurations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}