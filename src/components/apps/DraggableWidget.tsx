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
      className={`group border rounded-lg p-4 transition-all duration-200 bg-[#111111] hover:shadow-sm cursor-grab ${
        isDragging 
          ? 'opacity-50 cursor-grabbing border-blue-300 shadow-sm' 
          : 'border-[#888888] hover:border-[#AAAAAA]'
      }`}
    >
      <div className="flex flex-col items-center text-center space-y-2">
        {/* Icon */}
        <div className="text-[#888888] group-hover:text-[#AAAAAA] transition-colors duration-200">
          {widget.icon}
        </div>
        
        {/* Name */}
        <div className="text-sm font-medium text-[#888888] group-hover:text-[#AAAAAA] transition-colors duration-200">
          {widget.name}
        </div>
      </div>
    </div>
  )
}