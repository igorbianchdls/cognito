'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { AreaChartConfig } from '@/stores/apps/areaChartStore'
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
import AreaChartInfoAccordion from './AreaChartInfoAccordion'

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

        {/* Advanced Options - Accordions */}
        <div className="mt-6">
          <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
          <Accordion type="multiple" className="w-full space-y-2">
            
            <AreaChartInfoAccordion 
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
              chartType="area"
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