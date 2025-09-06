'use client'

import type { DroppedWidget } from '@/types/apps/droppedWidget'
import type { LineChartConfig } from '@/stores/apps/lineChartStore'
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
import DimensionsAccordion from './DimensionsAccordion'
import AxesAccordion from './AxesAccordion'
import LineChartInfoAccordion from './LineChartInfoAccordion'
import ChartSpecificAccordion from './ChartSpecificAccordion'

interface LineChartEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: LineChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
}

export default function LineChartEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange 
}: LineChartEditorProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-line') {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📈 Line Chart Configuration</h4>
      
      <div className="space-y-6">

        {/* Advanced Options - Accordions */}
        <div className="mt-6">
          <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
          <Accordion type="multiple" className="w-full space-y-2">
            
            <LineChartInfoAccordion 
              selectedWidget={selectedWidget}
              chartConfig={chartConfig}
              onChartConfigChange={onChartConfigChange}
            />

            <ChartSpecificAccordion 
              chartType="line"
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />
            
            <ColorsAccordion 
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />

            <LabelsAccordion
              styling={chartConfig.styling}
              onConfigChange={onChartConfigChange}
              chartType="line"
            />

            <DimensionsAccordion
              styling={chartConfig.styling}
              onConfigChange={onChartConfigChange}
            />

            <AxesAccordion
              styling={chartConfig.styling}
              onConfigChange={onChartConfigChange}
              chartType="line"
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