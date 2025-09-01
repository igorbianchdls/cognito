'use client'

import { useDraggable } from '@dnd-kit/core'
import { Type, Hash, FileText, Calendar, ToggleLeft } from 'lucide-react'
import type { BigQueryField } from './TablesExplorer'

interface DraggableColumnProps {
  field: BigQueryField
  sourceTable: string
}

export default function DraggableColumn({ field, sourceTable }: DraggableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `column-${sourceTable}-${field.name}`,
    data: {
      ...field,
      sourceTable,
    },
  })

  // Get icon for field type
  const getFieldIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return <FileText className="w-3 h-3" />
    }
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) {
      return <Hash className="w-3 h-3" />
    }
    if (lowerType.includes('date') || lowerType.includes('timestamp')) {
      return <Calendar className="w-3 h-3" />
    }
    if (lowerType.includes('bool')) {
      return <ToggleLeft className="w-3 h-3" />
    }
    return <Type className="w-3 h-3" />
  }

  // Get type color
  const getTypeColor = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return 'text-green-700 bg-green-100'
    }
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) {
      return 'text-blue-700 bg-blue-100'
    }
    if (lowerType.includes('date') || lowerType.includes('timestamp')) {
      return 'text-purple-700 bg-purple-100'
    }
    if (lowerType.includes('bool')) {
      return 'text-orange-700 bg-orange-100'
    }
    return 'text-gray-700 bg-gray-100'
  }

  // Check if field can be used for different purposes
  const canBeUsedForRows = () => {
    return true // Any field can be used for grouping
  }

  const canBeUsedForColumns = () => {
    const lowerType = field.type.toLowerCase()
    return lowerType.includes('int') || 
           lowerType.includes('numeric') || 
           lowerType.includes('float') ||
           lowerType.includes('decimal')
  }

  const canBeUsedForFilters = () => {
    return true // Any field can be filtered
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-start justify-between p-2 bg-white rounded border border-gray-200 cursor-grab transition-all overflow-hidden max-w-full ${
        isDragging 
          ? 'opacity-50 cursor-grabbing border-blue-300 shadow-md' 
          : 'hover:border-blue-300 hover:shadow-sm'
      }`}
      title={field.description || `Drag ${field.name} to chart builder`}
    >
      <div className="flex items-start gap-2 min-w-0 flex-1 overflow-hidden">
        <span className="text-gray-500 flex-shrink-0 mt-0.5">
          {getFieldIcon(field.type)}
        </span>
        <div className="min-w-0 flex-1 overflow-hidden">
          <span className="text-sm font-medium text-gray-900 truncate block">
            {field.name}
          </span>
          <div className="flex items-center gap-1 mt-1 overflow-hidden">
            <span className={`px-1.5 py-0.5 text-xs font-mono rounded flex-shrink-0 max-w-[80px] truncate ${getTypeColor(field.type)}`}>
              {field.type}
            </span>
            {field.mode && field.mode !== 'NULLABLE' && (
              <span className="px-1.5 py-0.5 text-xs bg-red-100 text-red-800 rounded flex-shrink-0 max-w-[60px] truncate">
                {field.mode}
              </span>
            )}
          </div>
          {field.description && (
            <p className="text-xs text-gray-500 truncate mt-1">
              {field.description}
            </p>
          )}
        </div>
      </div>
      
      {/* Usage indicators */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-1">
        {canBeUsedForRows() && (
          <div className="w-2 h-2 bg-green-400 rounded-full" title="Can be used for Rows" />
        )}
        {canBeUsedForColumns() && (
          <div className="w-2 h-2 bg-blue-400 rounded-full" title="Can be used for Columns" />
        )}
        {canBeUsedForFilters() && (
          <div className="w-2 h-2 bg-orange-400 rounded-full" title="Can be used for Filters" />
        )}
      </div>
    </div>
  )
}