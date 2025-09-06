'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { HorizontalBarChartConfig } from '@/stores/apps/horizontalBarChartStore'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface HorizontalBarChartInfoAccordionProps {
  selectedWidget: DroppedWidget
  chartConfig: HorizontalBarChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function HorizontalBarChartInfoAccordion({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: HorizontalBarChartInfoAccordionProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-horizontal-bar') {
    return null
  }

  return (
    <AccordionItem value="chart-info" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span className="text-sm font-medium">Chart Information</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
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
                    console.log('📊 HorizontalBarChartEditor: Chart title changed to:', e.target.value)
                    onChartConfigChange('styling.title', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sales by Category"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Chart Name</label>
                <input
                  type="text"
                  value={chartConfig.name || ''}
                  onChange={(e) => {
                    console.log('📊 HorizontalBarChartEditor: Chart name changed to:', e.target.value)
                    onChartConfigChange('name', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Horizontal Bar Chart"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Chart Type</label>
                <input
                  type="text"
                  value="Horizontal Bar Chart"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Chart Style */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3">🎨 Chart Style</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Style</label>
                <div className="flex gap-2">
                  {[
                    { value: 'default', label: 'Default', icon: '📊' },
                    { value: 'modern', label: 'Modern', icon: '🔵' },
                    { value: 'minimal', label: 'Minimal', icon: '⚪' }
                  ].map((style) => (
                    <button
                      key={style.value}
                      onClick={() => {
                        console.log('📊 HorizontalBarChartEditor: Chart style changed to:', style.value)
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
                      console.log('📊 HorizontalBarChartEditor: X-axis title changed to:', e.target.value)
                      onChartConfigChange('styling.xAxisTitle', e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Values"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Y-Axis Title</label>
                  <input
                    type="text"
                    value={chartConfig.styling?.yAxisTitle || ''}
                    onChange={(e) => {
                      console.log('📊 HorizontalBarChartEditor: Y-axis title changed to:', e.target.value)
                      onChartConfigChange('styling.yAxisTitle', e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Categories"
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