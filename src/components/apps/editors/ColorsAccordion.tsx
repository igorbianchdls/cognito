'use client'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ColorsStyling {
  colors?: string[]
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
}

interface ColorsAccordionProps {
  styling?: ColorsStyling
  onConfigChange: (field: string, value: unknown) => void
  fieldPrefix?: string
}

export default function ColorsAccordion({ 
  styling, 
  onConfigChange, 
  fieldPrefix = 'styling' 
}: ColorsAccordionProps) {
  
  const getFieldPath = (field: string) => `${fieldPrefix}.${field}`

  return (
    <AccordionItem value="colors" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>🎨</span>
          <span className="text-sm font-medium">Color Settings</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          
          {/* Primary Color */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Primary Color</label>
            <input
              type="color"
              value={styling?.colors?.[0] || '#2563eb'}
              onChange={(e) => {
                console.log('🎨 ColorsAccordion: Primary color changed to:', e.target.value)
                const newColors = [...(styling?.colors || ['#2563eb'])]
                newColors[0] = e.target.value
                onConfigChange(getFieldPath('colors'), newColors)
              }}
              className="w-full h-12 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Color Palette */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Color Palette</label>
            <div className="flex gap-2">
              {[
                { colors: ['#2563eb', '#3b82f6', '#60a5fa'], name: 'Blue' },
                { colors: ['#dc2626', '#ef4444', '#f87171'], name: 'Red' },
                { colors: ['#16a34a', '#22c55e', '#4ade80'], name: 'Green' },
                { colors: ['#ca8a04', '#eab308', '#facc15'], name: 'Yellow' },
                { colors: ['#9333ea', '#a855f7', '#c084fc'], name: 'Purple' }
              ].map((palette) => (
                <button
                  key={palette.name}
                  onClick={() => {
                    console.log('🎨 ColorsAccordion: Color palette changed to:', palette.name)
                    onConfigChange(getFieldPath('colors'), palette.colors)
                  }}
                  className={`px-3 py-2 text-xs border rounded-md transition-colors ${
                    JSON.stringify(styling?.colors) === JSON.stringify(palette.colors)
                      ? 'bg-blue-900 border-blue-300 text-blue-300'
                      : 'bg-[#333333] border-gray-700 text-[#888888] hover:bg-gray-700'
                  }`}
                >
                  <div className="flex gap-1 mb-1">
                    {palette.colors.slice(0, 3).map((color, i) => (
                      <div key={i} className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }}></div>
                    ))}
                  </div>
                  {palette.name}
                </button>
              ))}
            </div>
          </div>

          {/* Additional Colors */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Additional Colors</label>
            <div className="grid grid-cols-4 gap-2">
              {(styling?.colors || ['#2563eb']).slice(1, 5).map((color, index) => (
                <div key={index}>
                  <label className="block text-xs text-gray-500 mb-1">Color {index + 2}</label>
                  <input
                    type="color"
                    value={color || '#2563eb'}
                    onChange={(e) => {
                      console.log(`🎨 ColorsAccordion: Color ${index + 2} changed to:`, e.target.value)
                      const newColors = [...(styling?.colors || ['#2563eb'])]
                      newColors[index + 1] = e.target.value
                      onConfigChange(getFieldPath('colors'), newColors)
                    }}
                    className="w-full h-8 border border-gray-300 rounded"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Border Settings */}
          <div className="border-t border-gray-200 pt-4 mt-4">
            <label className="block text-xs font-medium text-gray-600 mb-3">Border Settings</label>
            
            <div className="space-y-3">
              {/* Border Radius */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={styling?.borderRadius ?? 4}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      console.log('🎨 ColorsAccordion: Border radius changed to:', value)
                      onConfigChange(getFieldPath('borderRadius'), value)
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8">{styling?.borderRadius ?? 4}px</span>
                </div>
              </div>

              {/* Border Width */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Border Width</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="5"
                    value={styling?.borderWidth ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      console.log('🎨 ColorsAccordion: Border width changed to:', value)
                      onConfigChange(getFieldPath('borderWidth'), value)
                    }}
                    className="flex-1"
                  />
                  <span className="text-xs text-gray-500 w-8">{styling?.borderWidth ?? 0}px</span>
                </div>
              </div>

              {/* Border Color */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Border Color</label>
                <input
                  type="color"
                  value={styling?.borderColor || '#000000'}
                  onChange={(e) => {
                    console.log('🎨 ColorsAccordion: Border color changed to:', e.target.value)
                    onConfigChange(getFieldPath('borderColor'), e.target.value)
                  }}
                  className="w-full h-8 border border-gray-300 rounded"
                />
              </div>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}