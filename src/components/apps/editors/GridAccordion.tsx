'use client'

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface GridStyling {
  showGrid?: boolean
  enableGridX?: boolean
  enableGridY?: boolean
}

interface GridAccordionProps {
  styling?: GridStyling
  onConfigChange: (field: string, value: unknown) => void
  fieldPrefix?: string
}

export default function GridAccordion({ 
  styling, 
  onConfigChange, 
  fieldPrefix = 'styling' 
}: GridAccordionProps) {
  
  const getFieldPath = (field: string) => `${fieldPrefix}.${field}`

  return (
    <AccordionItem value="grid" className="border border-gray-200 rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-2">
          <span>📊</span>
          <span className="text-sm font-medium">Grid Settings</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        <div className="space-y-4">
          
          {/* Show Grid Toggle */}
          <div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={styling?.showGrid !== false}
                onChange={(e) => {
                  console.log('📊 GridAccordion: Show grid changed to:', e.target.checked)
                  onConfigChange(getFieldPath('showGrid'), e.target.checked)
                }}
                className="rounded"
              />
              <span className="font-medium text-gray-600">Show Grid</span>
            </label>
          </div>

          {/* Grid Options - Mostrar apenas se showGrid estiver ativo */}
          {styling?.showGrid && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <h6 className="text-xs font-medium text-gray-700 mb-3">Grid Lines</h6>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={styling?.enableGridX !== false}
                    onChange={(e) => {
                      console.log('📊 GridAccordion: Enable grid X changed to:', e.target.checked)
                      onConfigChange(getFieldPath('enableGridX'), e.target.checked)
                    }}
                    className="rounded"
                  />
                  <span className="text-gray-600">Horizontal Lines</span>
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={styling?.enableGridY !== false}
                    onChange={(e) => {
                      console.log('📊 GridAccordion: Enable grid Y changed to:', e.target.checked)
                      onConfigChange(getFieldPath('enableGridY'), e.target.checked)
                    }}
                    className="rounded"
                  />
                  <span className="text-gray-600">Vertical Lines</span>
                </label>
              </div>
            </div>
          )}

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}