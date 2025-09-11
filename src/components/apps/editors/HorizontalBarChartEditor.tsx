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
import DimensionsAccordion from './DimensionsAccordion'
import AxesAccordion from './AxesAccordion'
import HorizontalBarChartInfoAccordion from './HorizontalBarChartInfoAccordion'
import ChartSpecificAccordion from './ChartSpecificAccordion'
import ContainerBorderAccordion from './ContainerBorderAccordion'
import PositionAccordion from './PositionAccordion'

interface HorizontalBarChartEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: HorizontalBarChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
  onLayoutChange?: (layoutChanges: {x?: number, y?: number, w?: number, h?: number}) => void
}

export default function HorizontalBarChartEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange,
  onLayoutChange 
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

            <ChartSpecificAccordion 
              chartType="horizontal-bar"
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
              chartType="horizontal-bar"
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