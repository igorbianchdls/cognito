'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { PieChartConfig } from '@/stores/apps/pieChartStore'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import LegendAccordion from './LegendAccordion'
import ColorsAccordion from './ColorsAccordion'
import LabelsAccordion from './LabelsAccordion'
import DimensionsAccordion from './DimensionsAccordion'
import PieChartInfoAccordion from './PieChartInfoAccordion'

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

        {/* Advanced Options - Accordions */}
        <div className="mt-6">
          <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
          <Accordion type="multiple" className="w-full space-y-2">
            
            <PieChartInfoAccordion 
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
              chartType="pie"
            />

            <DimensionsAccordion
              styling={chartConfig.styling}
              onConfigChange={onChartConfigChange}
            />
            
            <LegendAccordion 
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />

          </Accordion>
        </div>

      </div>
    </div>
  )
}