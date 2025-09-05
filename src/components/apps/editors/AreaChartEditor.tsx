'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { AreaChartConfig } from '@/stores/apps/areaChartStore'

interface AreaChartEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: AreaChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function AreaChartEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: AreaChartEditorProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-area') {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📊 Area Chart Configuration</h4>
      
      <div className="space-y-6">
        {/* Chart Info */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📊 Chart Info</h5>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Title</label>
              <input
                type="text"
                value={chartConfig.styling?.title || ''}
                onChange={(e) => {
                  console.log('📊 AreaChartEditor: Chart title changed to:', e.target.value)
                  onChartConfigChange('styling.title', e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Revenue Over Time"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Name</label>
              <input
                type="text"
                value={chartConfig.name || ''}
                onChange={(e) => {
                  console.log('📊 AreaChartEditor: Chart name changed to:', e.target.value)
                  onChartConfigChange('name', e.target.value)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="My Area Chart"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Chart Type</label>
              <input
                type="text"
                value="Area Chart"
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
                  console.log('📊 AreaChartEditor: Primary color changed to:', e.target.value)
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
                  { colors: ['#2563eb', '#3b82f6', '#60a5fa'], name: 'Blue' },
                  { colors: ['#dc2626', '#ef4444', '#f87171'], name: 'Red' },
                  { colors: ['#16a34a', '#22c55e', '#4ade80'], name: 'Green' },
                  { colors: ['#ca8a04', '#eab308', '#facc15'], name: 'Yellow' },
                  { colors: ['#9333ea', '#a855f7', '#c084fc'], name: 'Purple' }
                ].map((palette) => (
                  <button
                    key={palette.name}
                    onClick={() => {
                      console.log('📊 AreaChartEditor: Color palette changed to:', palette.name)
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
                        console.log(`📊 AreaChartEditor: Color ${index + 2} changed to:`, e.target.value)
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

        {/* Area Chart Specific Options */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📊 Area Options</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Fill Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={chartConfig.styling?.fillOpacity || 30}
                  onChange={(e) => {
                    console.log('📊 AreaChartEditor: Fill opacity changed to:', e.target.value)
                    onChartConfigChange('styling.fillOpacity', parseInt(e.target.value))
                  }}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {chartConfig.styling?.fillOpacity || 30}%
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Stroke Width</label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={chartConfig.styling?.strokeWidth || 2}
                  onChange={(e) => {
                    console.log('📊 AreaChartEditor: Stroke width changed to:', e.target.value)
                    onChartConfigChange('styling.strokeWidth', parseInt(e.target.value))
                  }}
                  className="w-full"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {chartConfig.styling?.strokeWidth || 2}px
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.styling?.curved !== false}
                  onChange={(e) => {
                    console.log('📊 AreaChartEditor: Curved changed to:', e.target.checked)
                    onChartConfigChange('styling.curved', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Smooth Curves</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.styling?.gradient !== false}
                  onChange={(e) => {
                    console.log('📊 AreaChartEditor: Gradient changed to:', e.target.checked)
                    onChartConfigChange('styling.gradient', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Gradient Fill</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Chart Style</label>
              <div className="flex gap-2">
                {[
                  { value: 'default', label: 'Default', icon: '📊' },
                  { value: 'stacked', label: 'Stacked', icon: '📈' },
                  { value: 'minimal', label: 'Minimal', icon: '📋' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => {
                      console.log('📊 AreaChartEditor: Chart style changed to:', style.value)
                      onChartConfigChange('styling.style', style.value)
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
                    console.log('📊 AreaChartEditor: Show legend changed to:', e.target.checked)
                    onChartConfigChange('styling.showLegend', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Show Legend</span>
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.styling?.showGrid !== false}
                  onChange={(e) => {
                    console.log('📊 AreaChartEditor: Show grid changed to:', e.target.checked)
                    onChartConfigChange('styling.showGrid', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Show Grid</span>
              </label>
            </div>
          </div>
        </div>

        {/* Data & Axes */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">📊 Data & Axes</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">X-Axis Title</label>
                <input
                  type="text"
                  value={chartConfig.styling?.xAxisTitle || ''}
                  onChange={(e) => {
                    console.log('📊 AreaChartEditor: X-axis title changed to:', e.target.value)
                    onChartConfigChange('styling.xAxisTitle', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Time Period"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Y-Axis Title</label>
                <input
                  type="text"
                  value={chartConfig.styling?.yAxisTitle || ''}
                  onChange={(e) => {
                    console.log('📊 AreaChartEditor: Y-axis title changed to:', e.target.value)
                    onChartConfigChange('styling.yAxisTitle', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Values"
                />
              </div>
            </div>

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
                  <label className="block text-xs text-gray-500 mb-1">X-Axis Fields</label>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                    {chartConfig.bigqueryData?.columns?.xAxis?.map(field => field.name).join(', ') || 'No fields'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Y-Axis Fields</label>
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded border">
                    {chartConfig.bigqueryData?.columns?.yAxis?.map(field => `${field.name} (${field.aggregation || 'SUM'})`).join(', ') || 'No fields'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}