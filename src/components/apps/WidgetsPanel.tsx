'use client'

import { useState } from 'react'
import DraggableWidget from './DraggableWidget'

const availableWidgets = [
  {
    id: 'chart-widget',
    name: 'Chart Widget',
    type: 'chart',
    icon: '📊',
    description: 'Display data in chart format',
    defaultWidth: 3,
    defaultHeight: 2,
  },
  {
    id: 'metric-widget',
    name: 'Metric Widget', 
    type: 'metric',
    icon: '📈',
    description: 'Show key performance metrics',
    defaultWidth: 2,
    defaultHeight: 1,
  },
]

interface WidgetsPanelProps {
  onWidgetDrop: (widget: any, position: any) => void
}

export default function WidgetsPanel({ onWidgetDrop }: WidgetsPanelProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Widgets</h2>
        <p className="text-sm text-gray-600 mt-1">
          Drag widgets to the canvas to add them
        </p>
      </div>

      {/* Widgets List */}
      <div className="flex-1 p-4 space-y-3">
        {availableWidgets.map((widget) => (
          <DraggableWidget
            key={widget.id}
            widget={widget}
            onWidgetDrop={onWidgetDrop}
          />
        ))}
      </div>

      {/* Instructions */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-600">
          <p className="mb-2">💡 <strong>How to use:</strong></p>
          <ul className="space-y-1 text-xs">
            <li>• Drag widgets to the canvas</li>
            <li>• Resize and move them around</li>
            <li>• Click the × to remove widgets</li>
          </ul>
        </div>
      </div>
    </div>
  )
}