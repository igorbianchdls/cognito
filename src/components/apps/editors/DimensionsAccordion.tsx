'use client'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface DimensionsStyling {
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
}

interface DimensionsAccordionProps {
  styling?: DimensionsStyling
  onConfigChange: (field: string, value: unknown) => void
  fieldPrefix?: string
}

export default function DimensionsAccordion({ 
  styling, 
  onConfigChange, 
  fieldPrefix = 'styling' 
}: DimensionsAccordionProps) {
  
  const getFieldPath = (field: string) => `${fieldPrefix}.${field}`

  return (
    <AccordionItem value="dimensions" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>📐</span>
          <span className="text-sm font-medium">Dimensions</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-3">Chart Margins</label>
            <p className="text-xs text-gray-500 mb-4">
              Adjust the spacing around the chart area to accommodate labels, legends, and titles.
            </p>
          </div>

          {/* Margin Grid Layout */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Margin Top */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Top Margin</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={styling?.marginTop ?? 12}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    console.log('📐 DimensionsAccordion: Margin top changed to:', value)
                    onConfigChange(getFieldPath('marginTop'), value)
                  }}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-10">{styling?.marginTop ?? 12}px</span>
              </div>
            </div>

            {/* Margin Right */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Right Margin</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={styling?.marginRight ?? 12}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    console.log('📐 DimensionsAccordion: Margin right changed to:', value)
                    onConfigChange(getFieldPath('marginRight'), value)
                  }}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-10">{styling?.marginRight ?? 12}px</span>
              </div>
            </div>

            {/* Margin Bottom */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Bottom Margin</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={styling?.marginBottom ?? 60}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    console.log('📐 DimensionsAccordion: Margin bottom changed to:', value)
                    onConfigChange(getFieldPath('marginBottom'), value)
                  }}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-10">{styling?.marginBottom ?? 60}px</span>
              </div>
            </div>

            {/* Margin Left */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">Left Margin</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="0"
                  max="120"
                  value={styling?.marginLeft ?? 50}
                  onChange={(e) => {
                    const value = parseInt(e.target.value)
                    console.log('📐 DimensionsAccordion: Margin left changed to:', value)
                    onConfigChange(getFieldPath('marginLeft'), value)
                  }}
                  className="flex-1"
                />
                <span className="text-xs text-gray-500 w-10">{styling?.marginLeft ?? 50}px</span>
              </div>
            </div>

          </div>

          {/* Visual Hint */}
          <div className="mt-4 p-3 bg-gray-50 rounded-md">
            <div className="flex items-start gap-2">
              <span className="text-xs">💡</span>
              <div className="text-xs text-gray-600 space-y-1">
                <div><strong>Top:</strong> Space for chart title</div>
                <div><strong>Right:</strong> Space for right-aligned elements</div>
                <div><strong>Bottom:</strong> Space for legends and axis labels</div>
                <div><strong>Left:</strong> Space for Y-axis labels and title</div>
              </div>
            </div>
          </div>

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}