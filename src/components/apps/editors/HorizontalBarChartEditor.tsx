'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { HorizontalBarChartConfig } from '@/stores/apps/horizontalBarChartStore'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import LegendAccordion from './LegendAccordion'
import GridAccordion from './GridAccordion'
import ColorsAccordion from './ColorsAccordion'
import LabelsAccordion from './LabelsAccordion'
import HorizontalBarChartInfoAccordion from './HorizontalBarChartInfoAccordion'

interface HorizontalBarChartEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: HorizontalBarChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function HorizontalBarChartEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: HorizontalBarChartEditorProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-horizontal-bar') {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📊 Horizontal Bar Chart Configuration</h4>
      
      <div className="space-y-6">

        {/* Advanced Options - Accordions */}
        <div className="mt-6">
          <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
          <Accordion type="multiple" className="w-full space-y-2">
            
            <HorizontalBarChartInfoAccordion 
              selectedWidget={selectedWidget}
              chartConfig={chartConfig}
              onChartConfigChange={onChartConfigChange}
            />
            
            <ColorsAccordion 
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />

            <LabelsAccordion
              styling={chartConfig.styling}
              onConfigChange={onChartConfigChange}
              chartType="horizontal-bar"
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