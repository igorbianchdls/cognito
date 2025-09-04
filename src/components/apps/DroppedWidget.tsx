'use client'

import { useState } from 'react'
import ChartWidget from './widgets/components/ChartWidget'
import ChartWrapper from './widgets/components/ChartWrapper'
import MetricWidget from './widgets/components/MetricWidget'
import KPIWrapper from '@/components/widgets/KPIWrapper'
import TableWrapper from '@/components/widgets/TableWrapper'
import ImageWidget from './widgets/components/ImageWidget'
import NavigationWidget from './widgets/components/NavigationWidget'
import type { DroppedWidget as DroppedWidgetType, ContainerConfig } from '@/types/apps/droppedWidget'

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

  // Diagnóstico: Log renderização de KPIs
  if (widget.type === 'kpi') {
    console.log('🎯 DroppedWidget rendering KPI:', { 
      id: widget.i, 
      name: widget.name,
      isSelected,
      kpiConfig: widget.kpiConfig,
      timestamp: Date.now()
    })
  }

  // Special full-screen rendering for NavigationWidget (Airtable style)
  if (widget.type === 'navigation') {
    return <NavigationWidget widget={widget} />
  }

  const renderWidget = () => {
    switch (widget.type) {
      case 'chart':
        return <ChartWidget widget={widget} />
      case 'chart-bar':
      case 'chart-line':
      case 'chart-pie':
      case 'chart-area':
        return <ChartWrapper widget={widget} />
      case 'metric':
        return <MetricWidget />
      case 'kpi':
        return <KPIWrapper widget={widget} />
      case 'table':
        return <TableWrapper widget={widget} />
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
      className={`h-full relative overflow-hidden transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-blue-500 ring-opacity-75 shadow-lg' 
          : 'hover:shadow-md'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      style={{
        backgroundColor: hexToRgba(containerConfig.backgroundColor || '#ffffff', containerConfig.backgroundOpacity ?? 1),
        borderColor: hexToRgba(containerConfig.borderColor || '#e5e7eb', containerConfig.borderOpacity ?? 1),
        borderWidth: `${containerConfig.borderWidth ?? 1}px`,
        borderRadius: `${containerConfig.borderRadius ?? 8}px`,
        borderStyle: 'solid'
      }}
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
            className="widget-button w-6 h-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-sm transition-colors duration-200"
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
          className="widget-button w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs font-medium shadow-sm transition-colors duration-200"
          title="Remove widget"
        >
          ×
        </button>
      </div>

      {/* Widget content */}
      <div 
        className="h-full p-3"
      >
        {renderWidget()}
      </div>

      {/* React-grid-layout handles resize natively - no custom resize indicator needed */}
    </div>
  )
}