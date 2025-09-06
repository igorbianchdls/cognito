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
import ChartInfoAccordion from './ChartInfoAccordion'

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

          </div>
        </div>


        {/* Advanced Options - Accordions */}
        <div className="mt-6">
          <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
          <Accordion type="multiple" className="w-full space-y-2">
            
            <ChartInfoAccordion 
              selectedWidget={selectedWidget}
              chartConfig={chartConfig}
              onChartConfigChange={onChartConfigChange}
            />
            
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