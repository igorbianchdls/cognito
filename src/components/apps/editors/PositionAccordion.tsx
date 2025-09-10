'use client'

import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import type { DroppedWidget } from '@/types/apps/droppedWidget'

interface PositionAccordionProps {
  selectedWidget: DroppedWidget
  onLayoutChange: (layoutChanges: {x?: number, y?: number, w?: number, h?: number}) => void
}

export default function PositionAccordion({ 
  selectedWidget, 
  onLayoutChange 
}: PositionAccordionProps) {

  // Verificação de segurança
  if (!onLayoutChange || !selectedWidget) {
    console.warn('PositionAccordion: onLayoutChange callback or selectedWidget is missing')
    return null
  }

  return (
    <AccordionItem value="position" className="border rounded-lg px-3">
      <AccordionTrigger className="text-xs font-medium hover:no-underline">
        📐 Position
      </AccordionTrigger>
      <AccordionContent className="space-y-4 pt-2">
        
        {/* Position Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Position</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">X Position</div>
              <Input
                type="number"
                value={selectedWidget.x}
                onChange={(e) => onLayoutChange({ x: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs"
                min="0"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Y Position</div>
              <Input
                type="number"
                value={selectedWidget.y}
                onChange={(e) => onLayoutChange({ y: parseInt(e.target.value) || 0 })}
                className="h-8 text-xs"
                min="0"
              />
            </div>
          </div>
        </div>

        {/* Size Section */}
        <div className="space-y-3">
          <div className="text-xs font-medium text-gray-700">Size</div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 mb-1">Width</div>
              <Input
                type="number"
                value={selectedWidget.w}
                onChange={(e) => onLayoutChange({ w: parseInt(e.target.value) || 1 })}
                className="h-8 text-xs"
                min="1"
              />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Height</div>
              <Input
                type="number"
                value={selectedWidget.h}
                onChange={(e) => onLayoutChange({ h: parseInt(e.target.value) || 1 })}
                className="h-8 text-xs"
                min="1"
              />
            </div>
          </div>
        </div>

      </AccordionContent>
    </AccordionItem>
  )
}