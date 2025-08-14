'use client'

import { useCallback } from 'react'

interface DraggableWidgetProps {
  widget: {
    id: string
    name: string
    type: string
    icon: string
    description: string
    defaultWidth: number
    defaultHeight: number
  }
  onWidgetDrop: (widget: any, position: any) => void
}

export default function DraggableWidget({ widget, onWidgetDrop }: DraggableWidgetProps) {
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(widget))
    e.dataTransfer.effectAllowed = 'copy'
    
    // Create a custom drag image
    const dragImage = document.createElement('div')
    dragImage.className = 'bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg'
    dragImage.style.cssText = `
      position: absolute;
      top: -1000px;
      width: 200px;
      height: 80px;
      display: flex;
      align-items: center;
      gap: 12px;
    `
    dragImage.innerHTML = `
      <span style="font-size: 24px;">${widget.icon}</span>
      <div>
        <div style="font-weight: 600; font-size: 14px; color: #111827;">${widget.name}</div>
        <div style="font-size: 12px; color: #6B7280;">${widget.description}</div>
      </div>
    `
    document.body.appendChild(dragImage)
    e.dataTransfer.setDragImage(dragImage, 100, 40)
    
    // Clean up the drag image after a short delay
    setTimeout(() => {
      document.body.removeChild(dragImage)
    }, 0)
  }, [widget])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    // Optional: Add any cleanup logic here
  }, [])

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="group bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg p-3 cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-md"
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