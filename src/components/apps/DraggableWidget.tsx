'use client'

import { useDraggable } from '@dnd-kit/core'
import type { Widget } from '@/types/widget'

interface DraggableWidgetProps {
  widget: Widget
}

export default function DraggableWidget({ widget }: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: widget.id,
    data: widget,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group border rounded-lg p-3 transition-all duration-200 hover:shadow-md ${
        isDragging 
          ? 'opacity-50 cursor-grabbing bg-blue-50 border-blue-300' 
          : 'bg-gray-50 hover:bg-blue-50 border-gray-200 hover:border-blue-300 cursor-grab'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
          {widget.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 text-sm group-hover:text-blue-900">
            {widget.name}
          </div>
          <div className="text-xs text-gray-500 group-hover:text-blue-600 truncate">
            {widget.description}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Size: {widget.defaultWidth}×{widget.defaultHeight}
          </div>
        </div>
      </div>
      
      {/* Drag indicator */}
      <div className="mt-2 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
        </div>
      </div>
    </div>
  )
}