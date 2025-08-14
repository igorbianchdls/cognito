'use client'

import { useState } from 'react'
import ChartWidget from './widgets/ChartWidget'
import MetricWidget from './widgets/MetricWidget'
import type { DroppedWidget as DroppedWidgetType } from '@/types/widget'

interface DroppedWidgetProps {
  widget: DroppedWidgetType
  onRemove: () => void
}

export default function DroppedWidget({ widget, onRemove }: DroppedWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)

  const renderWidget = () => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget />
      case 'metric':
        return <MetricWidget />
      default:
        return (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-2xl mb-2">{widget.icon}</div>
              <div className="text-sm font-medium">{widget.name}</div>
            </div>
          </div>
        )
    }
  }

  return (
    <div 
      className="h-full bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header with remove button */}
      <div className={`absolute top-2 right-2 z-10 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={onRemove}
          className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-sm transition-colors duration-200"
          title="Remove widget"
        >
          ×
        </button>
      </div>

      {/* Widget header - always visible */}
      <div className="p-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-lg">{widget.icon}</span>
          <span className="text-sm font-medium text-gray-900 truncate">
            {widget.name}
          </span>
        </div>
      </div>

      {/* Widget content */}
      <div className="p-3 h-[calc(100%-60px)]">
        {renderWidget()}
      </div>

      {/* Resize handle indicator */}
      <div className={`absolute bottom-1 right-1 w-3 h-3 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-full h-full">
          <div className="absolute bottom-0 right-0 w-2 h-2 border-r-2 border-b-2 border-gray-400"></div>
          <div className="absolute bottom-1 right-1 w-1 h-1 border-r border-b border-gray-300"></div>
        </div>
      </div>
    </div>
  )
}