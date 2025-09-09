'use client'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ContainerBorderStyling {
  containerBorderWidth?: number
  containerBorderColor?: string
  containerBorderRadius?: number
}

interface ContainerBorderAccordionProps {
  styling?: ContainerBorderStyling
  onConfigChange: (field: string, value: unknown) => void
  fieldPrefix?: string
}

export default function ContainerBorderAccordion({ 
  styling, 
  onConfigChange, 
  fieldPrefix = 'styling' 
}: ContainerBorderAccordionProps) {
  
  const getFieldPath = (field: string) => `${fieldPrefix}.${field}`

  return (
    <AccordionItem value="container-border" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>🖼️</span>
          <span className="text-sm font-medium">Container Border</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-3">Chart Container Border</label>
            <p className="text-xs text-gray-500 mb-4">
              Customize the border around the entire chart container including title and subtitle.
            </p>
          </div>

          {/* Border Width */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Border Width</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={styling?.containerBorderWidth ?? 0.5}
                onChange={(e) => {
                  const value = parseFloat(e.target.value)
                  console.log('🖼️ ContainerBorderAccordion: Border width changed to:', value)
                  onConfigChange(getFieldPath('containerBorderWidth'), value)
                }}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-12">{styling?.containerBorderWidth ?? 0.5}px</span>
            </div>
          </div>

          {/* Border Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Border Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styling?.containerBorderColor ?? '#cccccc'}
                onChange={(e) => {
                  const value = e.target.value
                  console.log('🖼️ ContainerBorderAccordion: Border color changed to:', value)
                  onConfigChange(getFieldPath('containerBorderColor'), value)
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={styling?.containerBorderColor ?? '#cccccc'}
                onChange={(e) => {
                  const value = e.target.value
                  console.log('🖼️ ContainerBorderAccordion: Border color changed to:', value)
                  onConfigChange(getFieldPath('containerBorderColor'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="#cccccc"
              />
            </div>
          </div>

          {/* Border Radius */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Border Radius</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="20"
                value={styling?.containerBorderRadius ?? 8}
                onChange={(e) => {
                  const value = parseInt(e.target.value)
                  console.log('🖼️ ContainerBorderAccordion: Border radius changed to:', value)
                  onConfigChange(getFieldPath('containerBorderRadius'), value)
                }}
                className="flex-1"
              />
              <span className="text-xs text-gray-500 w-12">{styling?.containerBorderRadius ?? 8}px</span>
            </div>
          </div>

          {/* Visual Hint */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-start gap-2">
              <span className="text-xs">💡</span>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Width:</strong> Thickness of the border (0-5px)</div>
                <div><strong>Color:</strong> Color of the border line</div>
                <div><strong>Radius:</strong> How rounded the corners are (0-20px)</div>
              </div>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}