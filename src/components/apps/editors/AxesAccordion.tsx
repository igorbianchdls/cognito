'use client'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface AxesStyling {
  // X Axis (Bottom) properties
  xAxisLegend?: string
  xAxisLegendPosition?: 'start' | 'middle' | 'end'
  xAxisLegendOffset?: number
  xAxisTickRotation?: number
  xAxisTickSize?: number
  xAxisTickPadding?: number

  // Y Axis (Left) properties
  yAxisLegend?: string
  yAxisLegendOffset?: number
  yAxisTickRotation?: number
  yAxisTickSize?: number
  yAxisTickPadding?: number
}

interface AxesAccordionProps {
  styling?: AxesStyling
  onConfigChange: (field: string, value: unknown) => void
  fieldPrefix?: string
  chartType: 'bar' | 'horizontal-bar' | 'line' | 'area' | 'pie'
}

export default function AxesAccordion({ 
  styling, 
  onConfigChange, 
  fieldPrefix = 'styling',
  chartType
}: AxesAccordionProps) {
  
  const getFieldPath = (field: string) => `${fieldPrefix}.${field}`

  // Pie charts don't have axes
  if (chartType === 'pie') {
    return null
  }

  return (
    <AccordionItem value="axes" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span className="text-sm font-medium">Axes</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-6">
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Chart Axes Configuration</label>
            <p className="text-xs text-gray-500 mb-4">
              Customize axis titles, labels rotation, and tick appearance.
            </p>
          </div>

          {/* X Axis Section */}
          <div className="border-b border-gray-100 pb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {chartType === 'horizontal-bar' ? 'Y Axis (Bottom)' : 'X Axis (Bottom)'}
            </h4>
            
            <div className="space-y-3">
              {/* X Axis Legend */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Axis Title</label>
                <input
                  type="text"
                  value={styling?.xAxisLegend || ''}
                  onChange={(e) => {
                    console.log('📊 AxesAccordion: X axis legend changed to:', e.target.value)
                    onConfigChange(getFieldPath('xAxisLegend'), e.target.value)
                  }}
                  placeholder="Enter axis title"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* X Axis Legend Position */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title Position</label>
                <select
                  value={styling?.xAxisLegendPosition || 'middle'}
                  onChange={(e) => {
                    console.log('📊 AxesAccordion: X axis legend position changed to:', e.target.value)
                    onConfigChange(getFieldPath('xAxisLegendPosition'), e.target.value)
                  }}
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="start">Start</option>
                  <option value="middle">Middle</option>
                  <option value="end">End</option>
                </select>
              </div>

              {/* X Axis Legend Offset */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title Offset</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={styling?.xAxisLegendOffset ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      console.log('📊 AxesAccordion: X axis legend offset changed to:', value)
                      onConfigChange(getFieldPath('xAxisLegendOffset'), value)
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-12">{styling?.xAxisLegendOffset ?? 0}px</span>
                </div>
              </div>

              {/* X Axis Tick Rotation */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Labels Rotation</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="90"
                    value={styling?.xAxisTickRotation ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      console.log('📊 AxesAccordion: X axis tick rotation changed to:', value)
                      onConfigChange(getFieldPath('xAxisTickRotation'), value)
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8">{styling?.xAxisTickRotation ?? 0}°</span>
                </div>
              </div>

              {/* X Axis Tick Size and Padding Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tick Size</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={styling?.xAxisTickSize ?? 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        console.log('📊 AxesAccordion: X axis tick size changed to:', value)
                        onConfigChange(getFieldPath('xAxisTickSize'), value)
                      }}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-8">{styling?.xAxisTickSize ?? 0}px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tick Padding</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={styling?.xAxisTickPadding ?? 8}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        console.log('📊 AxesAccordion: X axis tick padding changed to:', value)
                        onConfigChange(getFieldPath('xAxisTickPadding'), value)
                      }}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-8">{styling?.xAxisTickPadding ?? 8}px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Y Axis Section */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">
              {chartType === 'horizontal-bar' ? 'X Axis (Left)' : 'Y Axis (Left)'}
            </h4>
            
            <div className="space-y-3">
              {/* Y Axis Legend */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Axis Title</label>
                <input
                  type="text"
                  value={styling?.yAxisLegend || ''}
                  onChange={(e) => {
                    console.log('📊 AxesAccordion: Y axis legend changed to:', e.target.value)
                    onConfigChange(getFieldPath('yAxisLegend'), e.target.value)
                  }}
                  placeholder="Enter axis title"
                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Y Axis Legend Offset */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title Offset</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-100"
                    max="100"
                    value={styling?.yAxisLegendOffset ?? -40}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      console.log('📊 AxesAccordion: Y axis legend offset changed to:', value)
                      onConfigChange(getFieldPath('yAxisLegendOffset'), value)
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-12">{styling?.yAxisLegendOffset ?? -40}px</span>
                </div>
              </div>

              {/* Y Axis Tick Rotation */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Labels Rotation</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="-90"
                    max="90"
                    value={styling?.yAxisTickRotation ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      console.log('📊 AxesAccordion: Y axis tick rotation changed to:', value)
                      onConfigChange(getFieldPath('yAxisTickRotation'), value)
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8">{styling?.yAxisTickRotation ?? 0}°</span>
                </div>
              </div>

              {/* Y Axis Tick Size and Padding Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tick Size</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={styling?.yAxisTickSize ?? 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        console.log('📊 AxesAccordion: Y axis tick size changed to:', value)
                        onConfigChange(getFieldPath('yAxisTickSize'), value)
                      }}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-8">{styling?.yAxisTickSize ?? 0}px</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tick Padding</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={styling?.yAxisTickPadding ?? 8}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        console.log('📊 AxesAccordion: Y axis tick padding changed to:', value)
                        onConfigChange(getFieldPath('yAxisTickPadding'), value)
                      }}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500 w-8">{styling?.yAxisTickPadding ?? 8}px</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Hint */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-start gap-2">
              <span className="text-xs">💡</span>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Title:</strong> Main label for the axis</div>
                <div><strong>Rotation:</strong> Angle of value labels</div>
                <div><strong>Ticks:</strong> Small marks on the axis</div>
                <div><strong>Padding:</strong> Space between axis and labels</div>
              </div>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}