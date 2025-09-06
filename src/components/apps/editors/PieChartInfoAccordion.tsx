'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { PieChartConfig } from '@/stores/apps/pieChartStore'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface PieChartInfoAccordionProps {
  selectedWidget: DroppedWidget
  chartConfig: PieChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function PieChartInfoAccordion({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: PieChartInfoAccordionProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-pie') {
    return null
  }

  return (
    <AccordionItem value="chart-info" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>🥧</span>
          <span className="text-sm font-medium">Chart Information</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
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
                    {chartConfig.styling?.innerRadius || 0}% (0 = pie, &gt;0 = donut)
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
      </AccordionContent>
    </AccordionItem>
  )
}