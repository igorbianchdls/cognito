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
import LabelsAccordion from './LabelsAccordion'
import DimensionsAccordion from './DimensionsAccordion'
import AxesAccordion from './AxesAccordion'
import ChartInfoAccordion from './ChartInfoAccordion'
import ChartSpecificAccordion from './ChartSpecificAccordion'
import ChartTypographyAccordion from './ChartTypographyAccordion'
import ContainerBorderAccordion from './ContainerBorderAccordion'
import PositionAccordion from './PositionAccordion'
import StyleClipboardAccordion from './StyleClipboardAccordion'

interface BarChartEditorProps {
  selectedWidget: DroppedWidget
  chartConfig: BarChartConfig
  onChartConfigChange: (field: string, value: unknown) => void
  onLayoutChange?: (layoutChanges: {x?: number, y?: number, w?: number, h?: number}) => void
}

export default function BarChartEditor({ 
  selectedWidget, 
  chartConfig, 
  onChartConfigChange,
  onLayoutChange 
}: BarChartEditorProps) {
  
  if (!selectedWidget || selectedWidget.type !== 'chart-bar') {
    return null
  }

  return (
    <div className="border-t pt-4 mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-4">📊 Bar Chart Configuration</h4>
      
      <div className="space-y-6">




        {/* Advanced Options - Accordions */}
        <div className="mt-6">
          <h6 className="text-sm font-medium text-gray-700 mb-3">⚙️ Advanced Options</h6>
          <Accordion type="multiple" className="w-full space-y-2">
            
            <ChartInfoAccordion 
              selectedWidget={selectedWidget}
              chartConfig={chartConfig}
              onChartConfigChange={onChartConfigChange}
            />

            <ChartSpecificAccordion 
              chartType="bar"
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />

            <ChartTypographyAccordion
              axisFontFamily={chartConfig.styling?.axisFontFamily}
              axisFontSize={chartConfig.styling?.axisFontSize}
              axisFontWeight={chartConfig.styling?.axisFontWeight}
              axisTextColor={chartConfig.styling?.axisTextColor}
              axisLegendFontSize={chartConfig.styling?.axisLegendFontSize}
              axisLegendFontWeight={chartConfig.styling?.axisLegendFontWeight}
              labelsFontFamily={chartConfig.styling?.labelsFontFamily}
              labelsFontSize={chartConfig.styling?.labelsFontSize}
              labelsFontWeight={chartConfig.styling?.labelsFontWeight}
              labelsTextColor={chartConfig.styling?.labelsTextColor}
              legendsFontFamily={chartConfig.styling?.legendsFontFamily}
              legendsFontSize={chartConfig.styling?.legendsFontSize}
              legendsFontWeight={chartConfig.styling?.legendsFontWeight}
              legendsTextColor={chartConfig.styling?.legendsTextColor}
              tooltipFontSize={chartConfig.styling?.tooltipFontSize}
              tooltipFontFamily={chartConfig.styling?.tooltipFontFamily}
              onConfigChange={onChartConfigChange}
            />
            
            <ColorsAccordion 
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />

            <LabelsAccordion
              styling={chartConfig.styling}
              onConfigChange={onChartConfigChange}
              chartType="bar"
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
              chartType="bar"
            />
            
            <LegendAccordion 
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />

            <GridAccordion 
              styling={chartConfig.styling} 
              onConfigChange={onChartConfigChange} 
            />

            <StyleClipboardAccordion
              currentWidgetType="chart-bar"
              currentWidgetId={selectedWidget.i}
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