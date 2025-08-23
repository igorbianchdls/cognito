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
import type { DroppedWidget as DroppedWidgetType, ContainerConfig } from '@/types/widget'

// Helper function to convert hex color + opacity to RGBA
function hexToRgba(hex: string, opacity: number = 1): string {
  // Remove # if present
  hex = hex.replace('#', '')
  
  // Convert 3-digit hex to 6-digit
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('')
  }
  
  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

// Default container configuration
const DEFAULT_CONTAINER_CONFIG: ContainerConfig = {
  backgroundColor: '#ffffff',
  backgroundOpacity: 1,
  borderColor: '#e5e7eb',
  borderOpacity: 1,
  borderWidth: 1,
  borderRadius: 8
}

interface DroppedWidgetProps {
  widget: DroppedWidgetType
  onRemove: () => void
  onEdit?: () => void
  isSelected?: boolean
  onClick?: () => void
}

export default function DroppedWidget({ widget, onRemove, onEdit, isSelected = false, onClick }: DroppedWidgetProps) {
  const [isHovered, setIsHovered] = useState(false)

  // Get container configuration with defaults
  const containerConfig = widget.config?.containerConfig || DEFAULT_CONTAINER_CONFIG

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
      {/* Header with edit and remove buttons */}
      <div className={`absolute top-2 right-2 z-10 flex gap-1 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        {/* Edit button */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-sm transition-colors duration-200"
            title="Edit widget"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        
        {/* Remove button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-sm transition-colors duration-200"
          title="Remove widget"
        >
          ×
        </button>
      </div>

      {/* Widget content */}
      <div 
        className="h-full"
        style={{
          padding: '12px',
          backgroundColor: hexToRgba(containerConfig.backgroundColor || '#ffffff', containerConfig.backgroundOpacity ?? 1),
          borderColor: hexToRgba(containerConfig.borderColor || '#e5e7eb', containerConfig.borderOpacity ?? 1),
          borderWidth: `${containerConfig.borderWidth || 1}px`,
          borderRadius: `${containerConfig.borderRadius || 8}px`,
          borderStyle: 'solid'
        }}
      >
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