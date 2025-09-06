'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { BarChartConfig } from '@/stores/apps/barChartStore'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import LegendAccordion from './LegendAccordion'
import GridAccordion from './GridAccordion'
import ColorsAccordion from './ColorsAccordion'

interface BarChartEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: BarChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function BarChartEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: BarChartEditorProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-bar') {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📊 Bar Chart Configuration</h4>
      
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


        {/* Display Options */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 mb-3">👁️ Display Options</h5>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3">
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={chartConfig.styling?.showLegend !== false}
                  onChange={(e) => {
                    console.log('📊 BarChartEditor: Show legend changed to:', e.target.checked)
                    onChartConfigChange('styling.showLegend', e.target.checked)
                  }}
                  className="rounded"
                />
                <span className="font-medium text-gray-600">Show Legend</span>
              </label>
            </div>

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

        {/* Advanced Options - Accordions */}
        <div className="mt-6">
          <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
          <Accordion type="multiple" className="w-full space-y-2">
            
            <ColorsAccordion 
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />
            
            <LegendAccordion 
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />

            <GridAccordion 
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />

          </Accordion>
        </div>
      </div>
    </div>
  )
}