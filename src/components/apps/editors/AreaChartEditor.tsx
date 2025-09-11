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
import DimensionsAccordion from './DimensionsAccordion'
import AxesAccordion from './AxesAccordion'
import AreaChartInfoAccordion from './AreaChartInfoAccordion'
import ChartSpecificAccordion from './ChartSpecificAccordion'
import ContainerBorderAccordion from './ContainerBorderAccordion'
import PositionAccordion from './PositionAccordion'

interface AreaChartEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: AreaChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
  onLayoutChange?: (layoutChanges: {x?: number, y?: number, w?: number, h?: number}) => void
}

export default function AreaChartEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange,
  onLayoutChange 
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

            <ChartSpecificAccordion 
              chartType="area"
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
              chartType="area"
            />

            <DimensionsAccordion
              styling={chartConfig.styling}
              onConfigChange={onChartConfigChange}
            />

            <ContainerBorderAccordion
              styling={chartConfig.styling}
              onConfigChange={onChartConfigChange}
            />

            <AxesAccordion
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

            {onLayoutChange && (
              <PositionAccordion
                selectedWidget={selectedWidget}
                onLayoutChange={onLayoutChange}
              />
            )}

          </Accordion>
        </div>

      </div>
    </div>
  )
}