'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { PieChartConfig } from '@/stores/apps/pieChartStore'

interface PieChartEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: PieChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function PieChartEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: PieChartEditorProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-pie') {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">🥧 Pie Chart Configuration</h4>
      
      <div className="space-y-6">
        {/* Chart Info */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">🥧 Chart Info</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Title</label>
              <input
                type="text"
                value={chartConfig.styling?.title || ''}
                onChange={(e) => {
                  console.log('🥧 PieChartEditor: Chart title changed to:', e.target.value)
                  onChartConfigChange('styling.title', e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Sales Distribution"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Name</label>
              <input
                type="text"
                value={chartConfig.name || ''}
                onChange={(e) => {
                  console.log('🥧 PieChartEditor: Chart name changed to:', e.target.value)
                  onChartConfigChange('name', e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Pie Chart"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Type</label>
              <input
                type="text"
                value="Pie Chart"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>

        {/* Colors & Styling */}
        <div>
          <h5 className="text-lg font-bold text-gray-700 mb-3 mt-2">🎨 Colors & Styling</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Primary Color</label>
              <input
                type="color"
                value={chartConfig.styling?.colors?.[0] || '#2563eb'}
                onChange={(e) => {
                  console.log('🥧 PieChartEditor: Primary color changed to:', e.target.value)
                  const newColors = [...(chartConfig.styling?.colors || ['#2563eb'])]
                  newColors[0] = e.target.value
                  onChartConfigChange('styling.colors', newColors)
                }}
                className="w-full h-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Color Palette</label>
              <div className="flex gap-2">
                {[
                  { colors: ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe'], name: 'Blue' },
                  { colors: ['#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fed7d7'], name: 'Red' },
                  { colors: ['#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0'], name: 'Green' },
                  { colors: ['#ca8a04', '#eab308', '#facc15', '#fde047', '#fef3c7'], name: 'Yellow' },
                  { colors: ['#9333ea', '#a855f7', '#c084fc', '#d8b4fe', '#ede9fe'], name: 'Purple' }
                ].map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => {
                      console.log('🥧 PieChartEditor: Color palette changed to:', palette.name)
                      onChartConfigChange('styling.colors', palette.colors)
                    }}
                    className={`px-3 py-2 text-xs border rounded-md transition-colors ${
                      JSON.stringify(chartConfig.styling?.colors) === JSON.stringify(palette.colors)
                        ? 'bg-blue-900 border-blue-300 text-blue-300'
                        : 'bg-[#333333] border-gray-700 text-[#888888] hover:bg-gray-700'
                    }`}
                  >
                    <div className="flex gap-1 mb-1">
                      {palette.colors.slice(0, 3).map((color, i) => (
                        <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                      ))}
                    </div>
                    {palette.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Additional Colors</label>
              <div className="grid grid-cols-4 gap-2">
                {(chartConfig.styling?.colors || ['#2563eb']).slice(1, 5).map((color, index) => (
                  <div key={index}>
                    <label className="block text-xs text-gray-500 mb-1">Color {index + 2}</label>
                    <input
                      type="color"
                      value={color || '#2563eb'}
                      onChange={(e) => {
                        console.log(`🥧 PieChartEditor: Color ${index + 2} changed to:`, e.target.value)
                        const newColors = [...(chartConfig.styling?.colors || ['#2563eb'])]
                        newColors[index + 1] = e.target.value
                        onChartConfigChange('styling.colors', newColors)
                      }}
                      className="w-full h-8 border border-gray-300 rounded"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pie Chart Specific Options */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">🥧 Pie Chart Options</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Inner Radius</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={chartConfig.styling?.innerRadius || 0}
                  onChange={(e) => {
                    console.log('🥧 PieChartEditor: Inner radius changed to:', e.target.value)
                    onChartConfigChange('styling.innerRadius', parseInt(e.target.value))
                  }}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {chartConfig.styling?.innerRadius || 0}% (0 = pie, >0 = donut)
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Outer Radius</label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={chartConfig.styling?.outerRadius || 100}
                  onChange={(e) => {
                    console.log('🥧 PieChartEditor: Outer radius changed to:', e.target.value)
                    onChartConfigChange('styling.outerRadius', parseInt(e.target.value))
                  }}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {chartConfig.styling?.outerRadius || 100}%
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Chart Style</label>
              <div className="flex gap-2">
                {[
                  { value: 'default', label: 'Default', icon: '🥧' },
                  { value: 'donut', label: 'Donut', icon: '🍩' },
                  { value: 'minimal', label: 'Minimal', icon: '⚪' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => {
                      console.log('🥧 PieChartEditor: Chart style changed to:', style.value)
                      onChartConfigChange('styling.style', style.value)
                      // Auto-set inner radius for donut style
                      if (style.value === 'donut' && !chartConfig.styling?.innerRadius) {
                        onChartConfigChange('styling.innerRadius', 50)
                      } else if (style.value === 'default') {
                        onChartConfigChange('styling.innerRadius', 0)
                      }
                    }}
                    className={`px-3 py-2 text-xs border rounded-md transition-colors ${
                      chartConfig.styling?.style === style.value
                        ? 'bg-blue-900 border-blue-300 text-blue-300'
                        : 'bg-[#333333] border-gray-700 text-[#888888] hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-1">{style.icon}</span>
                    {style.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Display Options */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">👁️ Display Options</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.styling?.showLegend !== false}
                  onChange={(e) => {
                    console.log('🥧 PieChartEditor: Show legend changed to:', e.target.checked)
                    onChartConfigChange('styling.showLegend', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Show Legend</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.styling?.enableLabels !== false}
                  onChange={(e) => {
                    console.log('🥧 PieChartEditor: Enable labels changed to:', e.target.checked)
                    onChartConfigChange('styling.enableLabels', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Show Labels</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Label Format</label>
              <div className="flex gap-2">
                {[
                  { value: 'percentage', label: 'Percentage', icon: '%' },
                  { value: 'value', label: 'Value', icon: '#' },
                  { value: 'both', label: 'Both', icon: '#%' }
                ].map((format) => (
                  <button
                    key={format.value}
                    onClick={() => {
                      console.log('🥧 PieChartEditor: Label format changed to:', format.value)
                      onChartConfigChange('styling.labelFormat', format.value)
                    }}
                    className={`px-3 py-2 text-xs border rounded-md transition-colors ${
                      chartConfig.styling?.labelFormat === format.value
                        ? 'bg-blue-900 border-blue-300 text-blue-300'
                        : 'bg-[#333333] border-gray-700 text-[#888888] hover:bg-gray-700'
                    }`}
                  >
                    <span className="mr-1">{format.icon}</span>
                    {format.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data & Source */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📊 Data & Source</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data Source</label>
              <input
                type="text"
                value="BigQuery"
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Fields Info</label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category Fields</label>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                    {chartConfig.bigqueryData?.columns?.xAxis?.map(field => field.name).join(', ') || 'No fields'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Value Fields</label>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                    {chartConfig.bigqueryData?.columns?.yAxis?.map(field => `${field.name} (${field.aggregation || 'SUM'})`).join(', ') || 'No fields'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Selected Table</label>
              <input
                type="text"
                value={chartConfig.bigqueryData?.selectedTable || 'No table selected'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}