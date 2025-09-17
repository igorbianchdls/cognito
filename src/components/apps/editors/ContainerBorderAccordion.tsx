'use client'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface ContainerBorderStyling {
  backgroundColor?: string
  containerBorderWidth?: number
  containerBorderColor?: string
  containerBorderRadius?: number
  containerPadding?: number
  containerShadowColor?: string
  containerShadowOpacity?: number
  containerShadowBlur?: number
  containerShadowOffsetX?: number
  containerShadowOffsetY?: number
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

  // Debug log for styling values
  console.log('🖼️ ContainerBorderAccordion Debug:', styling)

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

          {/* Background Color */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Background Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={styling?.backgroundColor ?? '#ffffff'}
                onChange={(e) => {
                  const value = e.target.value
                  console.log('🖼️ ContainerBorderAccordion: Background color changed to:', value)
                  onConfigChange(getFieldPath('backgroundColor'), value)
                }}
                className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <input
                type="text"
                value={styling?.backgroundColor ?? '#ffffff'}
                onChange={(e) => {
                  const value = e.target.value
                  console.log('🖼️ ContainerBorderAccordion: Background color changed to:', value)
                  onConfigChange(getFieldPath('backgroundColor'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="#ffffff"
              />
            </div>
          </div>

          {/* Border Width */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Border Width</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={styling?.containerBorderWidth ?? 0.5}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  console.log('🖼️ ContainerBorderAccordion: Border width changed to:', value)
                  onConfigChange(getFieldPath('containerBorderWidth'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="0.5"
              />
              <span className="text-xs text-gray-500 w-8">px</span>
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
                type="number"
                min="0"
                max="50"
                step="1"
                value={styling?.containerBorderRadius ?? 8}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  console.log('🖼️ ContainerBorderAccordion: Border radius changed to:', value)
                  onConfigChange(getFieldPath('containerBorderRadius'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="8"
              />
              <span className="text-xs text-gray-500 w-8">px</span>
            </div>
          </div>

          {/* Container Padding */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">Container Padding</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="20"
                step="1"
                value={styling?.containerPadding ?? 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0
                  console.log('🖼️ ContainerBorderAccordion: Container padding changed to:', value)
                  onConfigChange(getFieldPath('containerPadding'), value)
                }}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                placeholder="0"
              />
              <span className="text-xs text-gray-500 w-8">px</span>
            </div>
          </div>

          {/* Container Shadow */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <label className="block text-xs font-medium text-gray-600 mb-3">Container Shadow</label>
            
            {/* Shadow Color */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Shadow Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={styling?.containerShadowColor ?? '#000000'}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log('🖼️ ContainerBorderAccordion: Shadow color changed to:', value)
                    onConfigChange(getFieldPath('containerShadowColor'), value)
                  }}
                  className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={styling?.containerShadowColor ?? '#000000'}
                  onChange={(e) => {
                    const value = e.target.value
                    console.log('🖼️ ContainerBorderAccordion: Shadow color changed to:', value)
                    onConfigChange(getFieldPath('containerShadowColor'), value)
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Shadow Opacity */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Shadow Opacity</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={styling?.containerShadowOpacity ?? 0.2}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0
                    console.log('🖼️ ContainerBorderAccordion: Shadow opacity changed to:', value)
                    onConfigChange(getFieldPath('containerShadowOpacity'), value)
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="0.2"
                />
                <span className="text-xs text-gray-500 w-8">α</span>
              </div>
            </div>

            {/* Shadow Blur */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1">Shadow Blur</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  value={styling?.containerShadowBlur ?? 8}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0
                    console.log('🖼️ ContainerBorderAccordion: Shadow blur changed to:', value)
                    onConfigChange(getFieldPath('containerShadowBlur'), value)
                  }}
                  className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                  placeholder="8"
                />
                <span className="text-xs text-gray-500 w-8">px</span>
              </div>
            </div>

            {/* Shadow Offset X and Y */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Offset X</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="-20"
                    max="20"
                    step="1"
                    value={styling?.containerShadowOffsetX ?? 0}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      console.log('🖼️ ContainerBorderAccordion: Shadow offset X changed to:', value)
                      onConfigChange(getFieldPath('containerShadowOffsetX'), value)
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="0"
                  />
                  <span className="text-xs text-gray-500 w-8">px</span>
                </div>
              </div>
              
              <div>
                <label className="block text-xs text-gray-500 mb-1">Offset Y</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="-20"
                    max="20"
                    step="1"
                    value={styling?.containerShadowOffsetY ?? 4}
                    onChange={(e) => {
                      const value = parseInt(e.target.value) || 0
                      console.log('🖼️ ContainerBorderAccordion: Shadow offset Y changed to:', value)
                      onConfigChange(getFieldPath('containerShadowOffsetY'), value)
                    }}
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="4"
                  />
                  <span className="text-xs text-gray-500 w-8">px</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Hint */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-start gap-2">
              <span className="text-xs">💡</span>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Background:</strong> Background color of the entire chart container</div>
                <div><strong>Border:</strong> Width, color, and radius of the border</div>
                <div><strong>Padding:</strong> Space between border and content (0-20px)</div>
                <div><strong>Shadow:</strong> Color, opacity (0-1), blur (0-20px), and offsets (-20 to 20px)</div>
              </div>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}