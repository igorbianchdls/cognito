'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { BarChartConfig } from '@/stores/apps/barChartStore'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ChartInfoAccordionProps {
  selectedWidget: DroppedWidget
  chartConfig: BarChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function ChartInfoAccordion({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: ChartInfoAccordionProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-bar') {
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
            <h5 className="text-sm font-medium text-gray-700 mb-3">📈 Chart Info</h5>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Chart Title</label>
                <input
                  type="text"
                  value={chartConfig.styling?.title || ''}
                  onChange={(e) => {
                    console.log('📊 BarChartEditor: Chart title changed to:', e.target.value)
                    onChartConfigChange('styling.title', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Sales by Region"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Chart Name</label>
                <input
                  type="text"
                  value={chartConfig.name || ''}
                  onChange={(e) => {
                    console.log('📊 BarChartEditor: Chart name changed to:', e.target.value)
                    onChartConfigChange('name', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="My Bar Chart"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Chart Type</label>
                <input
                  type="text"
                  value="Bar Chart"
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-500"
                />
              </div>
            </div>
          </div>

          {/* Chart Style */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Chart Style</label>
            <div className="flex gap-2">
              {[
                { value: 'default', label: 'Default', icon: '📊' },
                { value: 'modern', label: 'Modern', icon: '✨' },
                { value: 'minimal', label: 'Minimal', icon: '📋' }
              ].map((style) => (
                <button
                  key={style.value}
                  onClick={() => {
                    console.log('📊 BarChartEditor: Chart style changed to:', style.value)
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
                      console.log('📊 BarChartEditor: X-axis title changed to:', e.target.value)
                      onChartConfigChange('styling.xAxisTitle', e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Categories"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Y-Axis Title</label>
                  <input
                    type="text"
                    value={chartConfig.styling?.yAxisTitle || ''}
                    onChange={(e) => {
                      console.log('📊 BarChartEditor: Y-axis title changed to:', e.target.value)
                      onChartConfigChange('styling.yAxisTitle', e.target.value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Values"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Grid Position & Size */}
          <div>
            <h5 className="text-sm font-medium text-gray-700 mb-3">📐 Grid Position & Size</h5>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">X Position</label>
                  <input
                    type="number"
                    min="0"
                    value={chartConfig.position?.x ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      console.log('📊 BarChartEditor: X position changed to:', value)
                      onChartConfigChange('position.x', value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Y Position</label>
                  <input
                    type="number"
                    min="0"
                    value={chartConfig.position?.y ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      console.log('📊 BarChartEditor: Y position changed to:', value)
                      onChartConfigChange('position.y', value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Width (grid units)</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={chartConfig.position?.w ?? 4}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      console.log('📊 BarChartEditor: Width changed to:', value)
                      onChartConfigChange('position.w', value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Height (grid units)</label>
                  <input
                    type="number"
                    min="1"
                    value={chartConfig.position?.h ?? 3}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 1
                      console.log('📊 BarChartEditor: Height changed to:', value)
                      onChartConfigChange('position.h', value)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}