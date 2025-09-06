'use client'

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
// Using div for labels since Label component is not available
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AreaChartConfig } from '@/stores/apps/areaChartStore'
import type { LineChartConfig } from '@/stores/apps/lineChartStore'
import type { PieChartConfig } from '@/stores/apps/pieChartStore'
import type { BarChartConfig } from '@/stores/apps/barChartStore'
import type { HorizontalBarChartConfig } from '@/stores/apps/horizontalBarChartStore'

type ChartStyling = 
  | AreaChartConfig['styling']
  | LineChartConfig['styling'] 
  | PieChartConfig['styling']
  | BarChartConfig['styling']
  | HorizontalBarChartConfig['styling']

interface ChartSpecificAccordionProps {
  chartType: 'bar' | 'horizontal-bar' | 'line' | 'pie' | 'area'
  styling: ChartStyling
  onConfigChange: (field: string, value: unknown) => void
}

export default function ChartSpecificAccordion({ 
  chartType, 
  styling, 
  onConfigChange 
}: ChartSpecificAccordionProps) {

  const renderBarChartControls = () => (
    <div className="space-y-4">
      {/* Group Mode */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Group Mode</div>
        <Select
          value={styling?.groupMode || 'grouped'}
          onValueChange={(value) => onConfigChange('styling.groupMode', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grouped">Grouped</SelectItem>
            <SelectItem value="stacked">Stacked</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Layout */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Layout</div>
        <Select
          value={styling?.layout || 'vertical'}
          onValueChange={(value) => onConfigChange('styling.layout', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="vertical">Vertical</SelectItem>
            <SelectItem value="horizontal">Horizontal</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Padding */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">
          Padding: {styling?.padding || 0.3}
        </div>
        <Slider
          value={[styling?.padding || 0.3]}
          onValueChange={(value) => onConfigChange('styling.padding', value[0])}
          max={1}
          min={0}
          step={0.1}
          className="w-full"
        />
      </div>

      {/* Inner Padding */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">
          Inner Padding: {styling?.innerPadding || 0}
        </div>
        <Slider
          value={[styling?.innerPadding || 0]}
          onValueChange={(value) => onConfigChange('styling.innerPadding', value[0])}
          max={10}
          min={0}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  )

  const renderLineChartControls = () => (
    <div className="space-y-4">
      {/* Line Width */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">
          Line Width: {styling?.lineWidth || 2}px
        </div>
        <Slider
          value={[styling?.lineWidth || 2]}
          onValueChange={(value) => onConfigChange('styling.lineWidth', value[0])}
          max={10}
          min={1}
          step={1}
          className="w-full"
        />
      </div>

      {/* Enable Points */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-700">Enable Points</div>
        <Switch
          checked={styling?.enablePoints ?? true}
          onCheckedChange={(checked) => onConfigChange('styling.enablePoints', checked)}
        />
      </div>

      {/* Point Size */}
      {(styling?.enablePoints ?? true) && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">
            Point Size: {styling?.pointSize || 4}px
          </div>
          <Slider
            value={[styling?.pointSize || 4]}
            onValueChange={(value) => onConfigChange('styling.pointSize', value[0])}
            max={20}
            min={2}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Curve Type */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Curve Type</div>
        <Select
          value={styling?.curve || 'cardinal'}
          onValueChange={(value) => onConfigChange('styling.curve', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="cardinal">Cardinal</SelectItem>
            <SelectItem value="catmullRom">Catmull Rom</SelectItem>
            <SelectItem value="monotoneX">Monotone X</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Enable Area */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-700">Enable Area</div>
        <Switch
          checked={styling?.enableArea ?? false}
          onCheckedChange={(checked) => onConfigChange('styling.enableArea', checked)}
        />
      </div>

      {/* Area Opacity */}
      {styling?.enableArea && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">
            Area Opacity: {((styling?.areaOpacity || 0.2) * 100).toFixed(0)}%
          </div>
          <Slider
            value={[styling?.areaOpacity || 0.2]}
            onValueChange={(value) => onConfigChange('styling.areaOpacity', value[0])}
            max={1}
            min={0}
            step={0.05}
            className="w-full"
          />
        </div>
      )}
    </div>
  )

  const renderPieChartControls = () => (
    <div className="space-y-4">
      {/* Inner Radius */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">
          Inner Radius: {((styling?.innerRadius || 0.5) * 100).toFixed(0)}%
        </div>
        <Slider
          value={[styling?.innerRadius || 0.5]}
          onValueChange={(value) => onConfigChange('styling.innerRadius', value[0])}
          max={0.9}
          min={0}
          step={0.05}
          className="w-full"
        />
      </div>

      {/* Pad Angle */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">
          Pad Angle: {styling?.padAngle || 1}°
        </div>
        <Slider
          value={[styling?.padAngle || 1]}
          onValueChange={(value) => onConfigChange('styling.padAngle', value[0])}
          max={10}
          min={0}
          step={0.5}
          className="w-full"
        />
      </div>

      {/* Corner Radius */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">
          Corner Radius: {styling?.cornerRadius || 2}px
        </div>
        <Slider
          value={[styling?.cornerRadius || 2]}
          onValueChange={(value) => onConfigChange('styling.cornerRadius', value[0])}
          max={20}
          min={0}
          step={1}
          className="w-full"
        />
      </div>

      {/* Active Outer Radius Offset */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">
          Hover Offset: {styling?.activeOuterRadiusOffset || 4}px
        </div>
        <Slider
          value={[styling?.activeOuterRadiusOffset || 4]}
          onValueChange={(value) => onConfigChange('styling.activeOuterRadiusOffset', value[0])}
          max={20}
          min={0}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  )

  const renderAreaChartControls = () => (
    <div className="space-y-4">
      {/* Line Width */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">
          Line Width: {styling?.lineWidth || 2}px
        </div>
        <Slider
          value={[styling?.lineWidth || 2]}
          onValueChange={(value) => onConfigChange('styling.lineWidth', value[0])}
          max={10}
          min={1}
          step={1}
          className="w-full"
        />
      </div>

      {/* Enable Points */}
      <div className="flex items-center justify-between">
        <div className="text-xs font-medium text-gray-700">Enable Points</div>
        <Switch
          checked={styling?.enablePoints ?? false}
          onCheckedChange={(checked) => onConfigChange('styling.enablePoints', checked)}
        />
      </div>

      {/* Point Size */}
      {styling?.enablePoints && (
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-700">
            Point Size: {styling?.pointSize || 4}px
          </div>
          <Slider
            value={[styling?.pointSize || 4]}
            onValueChange={(value) => onConfigChange('styling.pointSize', value[0])}
            max={20}
            min={2}
            step={1}
            className="w-full"
          />
        </div>
      )}

      {/* Curve Type */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">Curve Type</div>
        <Select
          value={styling?.curve || 'cardinal'}
          onValueChange={(value) => onConfigChange('styling.curve', value)}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="linear">Linear</SelectItem>
            <SelectItem value="cardinal">Cardinal</SelectItem>
            <SelectItem value="catmullRom">Catmull Rom</SelectItem>
            <SelectItem value="monotoneX">Monotone X</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Area Opacity */}
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700">
          Area Opacity: {((styling?.areaOpacity || 0.15) * 100).toFixed(0)}%
        </div>
        <Slider
          value={[styling?.areaOpacity || 0.15]}
          onValueChange={(value) => onConfigChange('styling.areaOpacity', value[0])}
          max={1}
          min={0}
          step={0.05}
          className="w-full"
        />
      </div>
    </div>
  )

  const getChartSpecificContent = () => {
    switch (chartType) {
      case 'bar':
      case 'horizontal-bar':
        return renderBarChartControls()
      case 'line':
        return renderLineChartControls()
      case 'pie':
        return renderPieChartControls()
      case 'area':
        return renderAreaChartControls()
      default:
        return null
    }
  }

  const getChartTypeLabel = () => {
    switch (chartType) {
      case 'bar':
        return '📊 Bar Chart'
      case 'horizontal-bar':
        return '📈 Horizontal Bar Chart'
      case 'line':
        return '📉 Line Chart'
      case 'pie':
        return '🥧 Pie Chart'
      case 'area':
        return '📊 Area Chart'
      default:
        return '📊 Chart'
    }
  }

  return (
    <AccordionItem value="chart-specific" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        {getChartTypeLabel()} Properties
      </AccordionTrigger>
      <AccordionContent className="space-y-3 pt-2">
        {getChartSpecificContent()}
      </AccordionContent>
    </AccordionItem>
  )
}