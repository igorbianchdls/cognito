'use client'

import DraggableWidget from './DraggableWidget'
import type { Widget } from '@/types/widget'

const availableWidgets: Widget[] = [
  {
    id: 'bar-chart-widget',
    name: 'Bar Chart',
    type: 'chart-bar',
    icon: '📊',
    description: 'Display data with vertical bars',
    defaultWidth: 4,
    defaultHeight: 3,
  },
  {
    id: 'line-chart-widget',
    name: 'Line Chart',
    type: 'chart-line',
    icon: '📈',
    description: 'Show trends and data over time',
    defaultWidth: 4,
    defaultHeight: 3,
  },
  {
    id: 'pie-chart-widget',
    name: 'Pie Chart',
    type: 'chart-pie',
    icon: '🥧',
    description: 'Show data distribution and percentages',
    defaultWidth: 3,
    defaultHeight: 3,
  },
  {
    id: 'area-chart-widget',
    name: 'Area Chart',
    type: 'chart-area',
    icon: '📉',
    description: 'Display filled area under data curves',
    defaultWidth: 4,
    defaultHeight: 3,
  },
  {
    id: 'metric-widget',
    name: 'Metric Widget', 
    type: 'metric',
    icon: '🔢',
    description: 'Show key performance metrics',
    defaultWidth: 2,
    defaultHeight: 1,
  },
  {
    id: 'kpi-widget',
    name: 'KPI Widget',
    type: 'kpi',
    icon: '📊',
    description: 'Display key performance indicators with trends',
    defaultWidth: 3,
    defaultHeight: 2,
  },
  {
    id: 'table-widget',
    name: 'Table Widget',
    type: 'table',
    icon: '📋',
    description: 'Display data in organized table format with sorting and filtering',
    defaultWidth: 4,
    defaultHeight: 3,
  },
  {
    id: 'image-widget',
    name: 'Image',
    type: 'image',
    icon: '🖼️',
    description: 'Display images with customizable styling and behavior',
    defaultWidth: 3,
    defaultHeight: 2,
  },
]

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface WidgetsPanelProps {}

export default function WidgetsPanel({}: WidgetsPanelProps) {
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