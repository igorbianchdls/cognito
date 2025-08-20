'use client'

import React from 'react'
import { useDraggable } from '@dnd-kit/core'
import type { Widget } from '@/types/widget'

interface ExtendedWidget extends Omit<Widget, 'icon'> {
  icon: React.ReactElement | string
}

interface DraggableWidgetProps {
  widget: Widget | ExtendedWidget
}

export default function DraggableWidget({ widget }: DraggableWidgetProps) {
  // Convert ExtendedWidget to standard Widget for drag data
  const dragData: Widget = {
    ...widget,
    icon: typeof widget.icon === 'string' ? widget.icon : '🔸'
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: widget.id,
    data: dragData,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`group border rounded-lg p-4 transition-all duration-200 bg-white hover:shadow-sm cursor-grab ${
        isDragging 
          ? 'opacity-50 cursor-grabbing border-blue-300 shadow-sm' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        {/* Icon */}
        <div className="text-gray-600 group-hover:text-gray-800 transition-colors duration-200">
          {widget.icon}
        </div>
        
        {/* Name */}
        <div className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors duration-200">
          {widget.name}
        </div>
      </div>
    </div>
  )
}