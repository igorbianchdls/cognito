'use client'

import { useState } from 'react'
import ChartWidget from './widgets/ChartWidget'
import LineChartWidget from './widgets/LineChartWidget'
import PieChartWidget from './widgets/PieChartWidget'
import AreaChartWidget from './widgets/AreaChartWidget'
import MetricWidget from './widgets/MetricWidget'
import KPIWidget from './widgets/KPIWidget'
import TableWidget from './widgets/TableWidget'
import ImageWidget from './widgets/ImageWidget'
import NavigationWidget from './widgets/NavigationWidget'
import type { DroppedWidget as DroppedWidgetType } from '@/types/widget'

interface DroppedWidgetProps {
  widget: DroppedWidgetType
  onRemove: () => void
  isSelected?: boolean
  onClick?: () => void
}

export default function DroppedWidget({ widget, onRemove, isSelected = false, onClick }: DroppedWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Special full-screen rendering for NavigationWidget (Airtable style)
  if (widget.type === 'navigation') {
    return <NavigationWidget widget={widget} />
  }

  const renderWidget = () => {
    switch (widget.type) {
      case 'chart':
      case 'chart-bar':
        return <ChartWidget widget={widget} />
      case 'chart-line':
        return <LineChartWidget widget={widget} />
      case 'chart-pie':
        return <PieChartWidget widget={widget} />
      case 'chart-area':
        return <AreaChartWidget widget={widget} />
      case 'metric':
        return <MetricWidget />
      case 'kpi':
        return <KPIWidget widget={widget} />
      case 'table':
        return <TableWidget widget={widget} />
      case 'image':
        return <ImageWidget widget={widget} />
      case 'navigation':
        return <NavigationWidget widget={widget} />
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
      className={`h-full bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden ${
        isSelected 
          ? 'border-2 border-blue-500 shadow-lg' 
          : 'border border-gray-200'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
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
      <div 
        className="p-3 border-b border-gray-100"
        style={{
          backgroundColor: widget.color ? `${widget.color}20` : '#f9fafb'
        }}
      >
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