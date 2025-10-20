'use client'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface LabelsStyling {
  // Bar Chart Labels
  enableLabel?: boolean
  labelPosition?: 'start' | 'middle' | 'end'
  labelSkipWidth?: number
  labelSkipHeight?: number
  labelTextColor?: string
  labelFormat?: string
  labelOffset?: number

  // Pie Chart Labels
  enableArcLabels?: boolean
  enableArcLinkLabels?: boolean
  arcLabelsSkipAngle?: number
  arcLabelsTextColor?: string
  arcLinkLabelsSkipAngle?: number
  arcLinkLabelsTextColor?: string

  // Line/Area Chart Labels
  enablePointLabels?: boolean
  pointLabelTextColor?: string
}

interface LabelsAccordionProps {
  styling?: LabelsStyling
  onConfigChange: (field: string, value: unknown) => void
  fieldPrefix?: string
  chartType: 'bar' | 'horizontal-bar' | 'line' | 'pie' | 'area'
}

export default function LabelsAccordion({ 
  styling, 
  onConfigChange, 
  fieldPrefix = 'styling',
  chartType
}: LabelsAccordionProps) {
  
  const getFieldPath = (field: string) => `${fieldPrefix}.${field}`

  const renderBarChartLabels = () => (
    <div className="space-y-4">
      {/* Enable Labels */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">Enable Labels</label>
        <input
          type="checkbox"
          checked={styling?.enableLabel ?? false}
          onChange={(e) => {
            console.log('📊 LabelsAccordion: Enable labels changed to:', e.target.checked)
            onConfigChange(getFieldPath('enableLabel'), e.target.checked)
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {styling?.enableLabel && (
        <>
          {/* Label Position */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Label Position</label>
            <select
              value={styling?.labelPosition || 'middle'}
              onChange={(e) => {
                console.log('📊 LabelsAccordion: Label position changed to:', e.target.value)
                onConfigChange(getFieldPath('labelPosition'), e.target.value)
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="start">Start</option>
              <option value="middle">Middle</option>
              <option value="end">End</option>
            </select>
          </div>

          {/* Skip Width */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Skip Width (px)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={styling?.labelSkipWidth ?? 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  console.log('📊 LabelsAccordion: Label skip width changed to:', value)
                  onConfigChange(getFieldPath('labelSkipWidth'), value)
                }}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-10">{styling?.labelSkipWidth ?? 0}px</span>
            </div>
          </div>

          {/* Skip Height */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Skip Height (px)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="50"
                value={styling?.labelSkipHeight ?? 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  console.log('📊 LabelsAccordion: Label skip height changed to:', value)
                  onConfigChange(getFieldPath('labelSkipHeight'), value)
                }}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-10">{styling?.labelSkipHeight ?? 0}px</span>
            </div>
          </div>

          {/* Label Text Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Label Text Color</label>
            <input
              type="color"
              value={styling?.labelTextColor || '#374151'}
              onChange={(e) => {
                console.log('📊 LabelsAccordion: Label text color changed to:', e.target.value)
                onConfigChange(getFieldPath('labelTextColor'), e.target.value)
              }}
              className="w-full h-8 border border-gray-300 rounded"
            />
          </div>
        </>
      )}
    </div>
  )

  const renderPieChartLabels = () => (
    <div className="space-y-4">
      {/* Enable Arc Labels */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">Arc Labels</label>
        <input
          type="checkbox"
          checked={styling?.enableArcLabels ?? true}
          onChange={(e) => {
            console.log('🥧 LabelsAccordion: Enable arc labels changed to:', e.target.checked)
            onConfigChange(getFieldPath('enableArcLabels'), e.target.checked)
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {/* Enable Arc Link Labels */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">Arc Link Labels</label>
        <input
          type="checkbox"
          checked={styling?.enableArcLinkLabels ?? false}
          onChange={(e) => {
            console.log('🥧 LabelsAccordion: Enable arc link labels changed to:', e.target.checked)
            onConfigChange(getFieldPath('enableArcLinkLabels'), e.target.checked)
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {styling?.enableArcLabels && (
        <>
          {/* Arc Labels Skip Angle */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Arc Labels Skip Angle (°)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="45"
                value={styling?.arcLabelsSkipAngle ?? 15}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  console.log('🥧 LabelsAccordion: Arc labels skip angle changed to:', value)
                  onConfigChange(getFieldPath('arcLabelsSkipAngle'), value)
                }}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8">{styling?.arcLabelsSkipAngle ?? 15}°</span>
            </div>
          </div>

          {/* Arc Labels Text Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Arc Labels Text Color</label>
            <input
              type="color"
              value={styling?.arcLabelsTextColor || '#ffffff'}
              onChange={(e) => {
                console.log('🥧 LabelsAccordion: Arc labels text color changed to:', e.target.value)
                onConfigChange(getFieldPath('arcLabelsTextColor'), e.target.value)
              }}
              className="w-full h-8 border border-gray-300 rounded"
            />
          </div>
        </>
      )}

      {styling?.enableArcLinkLabels && (
        <>
          {/* Arc Link Labels Skip Angle */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Link Labels Skip Angle (°)</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="45"
                value={styling?.arcLinkLabelsSkipAngle ?? 10}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  console.log('🥧 LabelsAccordion: Arc link labels skip angle changed to:', value)
                  onConfigChange(getFieldPath('arcLinkLabelsSkipAngle'), value)
                }}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-8">{styling?.arcLinkLabelsSkipAngle ?? 10}°</span>
            </div>
          </div>

          {/* Arc Link Labels Text Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Link Labels Text Color</label>
            <input
              type="color"
              value={styling?.arcLinkLabelsTextColor || '#374151'}
              onChange={(e) => {
                console.log('🥧 LabelsAccordion: Arc link labels text color changed to:', e.target.value)
                onConfigChange(getFieldPath('arcLinkLabelsTextColor'), e.target.value)
              }}
              className="w-full h-8 border border-gray-300 rounded"
            />
          </div>
        </>
      )}
    </div>
  )

  const renderLineAreaChartLabels = () => (
    <div className="space-y-4">
      {/* Enable Point Labels */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-600">Point Labels</label>
        <input
          type="checkbox"
          checked={styling?.enablePointLabels ?? false}
          onChange={(e) => {
            console.log('📈 LabelsAccordion: Enable point labels changed to:', e.target.checked)
            onConfigChange(getFieldPath('enablePointLabels'), e.target.checked)
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </div>

      {styling?.enablePointLabels && (
        <>
          {/* Point Label Text Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Point Label Text Color</label>
            <input
              type="color"
              value={styling?.pointLabelTextColor || '#374151'}
              onChange={(e) => {
                console.log('📈 LabelsAccordion: Point label text color changed to:', e.target.value)
                onConfigChange(getFieldPath('pointLabelTextColor'), e.target.value)
              }}
              className="w-full h-8 border border-gray-300 rounded"
            />
          </div>
        </>
      )}
    </div>
  )

  const renderLabelsContent = () => {
    switch (chartType) {
      case 'bar':
      case 'horizontal-bar':
        return renderBarChartLabels()
      case 'pie':
        return renderPieChartLabels()
      case 'line':
      case 'area':
        return renderLineAreaChartLabels()
      default:
        return <div className="text-xs text-gray-500">Labels não disponíveis para este tipo de chart.</div>
    }
  }

  return (
    <AccordionItem value="labels" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>🏷️</span>
          <span className="text-sm font-medium">Labels</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {renderLabelsContent()}
      </AccordionContent>
    </AccordionItem>
  )
}