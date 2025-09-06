'use client'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface LegendStyling {
  showLegend?: boolean
  legendPosition?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
  legendDirection?: 'row' | 'column'
  legendSpacing?: number
  legendSymbolSize?: number
  legendSymbolShape?: 'circle' | 'square' | 'triangle'
}

interface LegendAccordionProps {
  styling?: LegendStyling
  onConfigChange: (field: string, value: unknown) => void
  fieldPrefix?: string
}

export default function LegendAccordion({ 
  styling, 
  onConfigChange, 
  fieldPrefix = 'styling' 
}: LegendAccordionProps) {
  
  const getFieldPath = (field: string) => `${fieldPrefix}.${field}`

  return (
    <AccordionItem value="legend" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>🏷️</span>
          <span className="text-sm font-medium">Legend Settings</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          
          {/* Position */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Position</label>
            <div className="grid grid-cols-4 gap-1">
              {['bottom', 'top', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                <button
                  key={pos}
                  onClick={() => {
                    console.log('🏷️ LegendAccordion: Position changed to:', pos)
                    onConfigChange(getFieldPath('legendPosition'), pos)
                  }}
                  className={`px-2 py-1 text-xs border rounded-md transition-colors ${
                    styling?.legendPosition === pos
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <span className="text-xs">{pos.replace('-', ' ')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Direction */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Direction</label>
            <div className="flex gap-2">
              {['row', 'column'].map((dir) => (
                <button
                  key={dir}
                  onClick={() => {
                    console.log('🏷️ LegendAccordion: Direction changed to:', dir)
                    onConfigChange(getFieldPath('legendDirection'), dir)
                  }}
                  className={`px-4 py-2 text-xs border rounded-md transition-colors ${
                    styling?.legendDirection === dir
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  {dir}
                </button>
              ))}
            </div>
          </div>

          {/* Symbol Shape */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Symbol Shape</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'circle', icon: '●', label: 'Circle' },
                { value: 'square', icon: '■', label: 'Square' },
                { value: 'triangle', icon: '▲', label: 'Triangle' }
              ].map((shape) => (
                <button
                  key={shape.value}
                  onClick={() => {
                    console.log('🏷️ LegendAccordion: Symbol shape changed to:', shape.value)
                    onConfigChange(getFieldPath('legendSymbolShape'), shape.value)
                  }}
                  className={`px-3 py-2 text-xs border rounded-md flex items-center gap-2 transition-colors ${
                    styling?.legendSymbolShape === shape.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <span>{shape.icon}</span>
                  <span>{shape.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Spacing</label>
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={styling?.legendSpacing ?? 20}
                onChange={(e) => {
                  console.log('🏷️ LegendAccordion: Spacing changed to:', e.target.value)
                  onConfigChange(getFieldPath('legendSpacing'), parseInt(e.target.value))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 text-center mt-1">
                {styling?.legendSpacing ?? 20}px
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Symbol Size</label>
              <input
                type="range"
                min="8"
                max="24"
                step="2"
                value={styling?.legendSymbolSize ?? 12}
                onChange={(e) => {
                  console.log('🏷️ LegendAccordion: Symbol size changed to:', e.target.value)
                  onConfigChange(getFieldPath('legendSymbolSize'), parseInt(e.target.value))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-xs text-gray-500 text-center mt-1">
                {styling?.legendSymbolSize ?? 12}px
              </div>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}