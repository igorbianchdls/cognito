'use client'

import { useDroppable } from '@dnd-kit/core'
import { X, Plus } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BigQueryField } from './TablesExplorer'

interface DropZoneProps {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  fields: BigQueryField[]
  acceptedTypes?: string[]
  onRemoveField?: (fieldName: string) => void
  onAggregationChange?: (fieldName: string, aggregation: BigQueryField['aggregation']) => void
  className?: string
}

export default function DropZone({
  id,
  label,
  description,
  icon,
  fields,
  acceptedTypes,
  onRemoveField,
  onAggregationChange,
  className = ''
}: DropZoneProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  })

  // Check if a field type is accepted
  const isTypeAccepted = (fieldType: string) => {
    if (!acceptedTypes) return true
    
    const lowerType = fieldType.toLowerCase()
    return acceptedTypes.some(acceptedType => {
      switch (acceptedType) {
        case 'numeric':
          return lowerType.includes('int') || 
                 lowerType.includes('numeric') || 
                 lowerType.includes('float') ||
                 lowerType.includes('decimal')
        case 'string':
          return lowerType.includes('string') || lowerType.includes('text')
        case 'date':
          return lowerType.includes('date') || lowerType.includes('timestamp')
        case 'boolean':
          return lowerType.includes('bool')
        default:
          return true
      }
    })
  }

  // Get field icon
  const getFieldIcon = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('string') || lowerType.includes('text')) {
      return '🔤'
    }
    if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) {
      return '🔢'
    }
    if (lowerType.includes('date') || lowerType.includes('timestamp')) {
      return '📅'
    }
    if (lowerType.includes('bool')) {
      return '✓'
    }
    return '📊'
  }

  // Check if field is numeric and needs aggregation
  const isNumericField = (type: string) => {
    const lowerType = type.toLowerCase()
    return lowerType.includes('int') || 
           lowerType.includes('numeric') || 
           lowerType.includes('float') ||
           lowerType.includes('decimal')
  }

  // Aggregation options
  const aggregationOptions = [
    { value: 'SUM', label: 'SUM' },
    { value: 'AVG', label: 'AVG' },
    { value: 'COUNT', label: 'COUNT' },
    { value: 'MAX', label: 'MAX' },
    { value: 'MIN', label: 'MIN' }
  ] as const

  return (
    <div className={`${className}`}>
      {/* Drop Zone Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        </div>
        <p className="text-xs text-gray-600">{description}</p>
      </div>

      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[80px] p-3 border-2 border-dashed rounded-lg transition-all
          ${isOver 
            ? 'border-blue-400 bg-blue-50' 
            : fields.length > 0
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 bg-white hover:border-gray-400'
          }
        `}
      >
        {fields.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Plus className="w-6 h-6 mb-1 opacity-50" />
            <p className="text-xs text-center">
              {isOver ? 'Drop here' : `Drag ${label.toLowerCase()} here`}
            </p>
          </div>
        ) : (
          /* Fields List */
          <div className="flex flex-wrap gap-2">
            {fields.map((field, index) => {
              const typeAccepted = isTypeAccepted(field.type)
              
              // Define cores baseadas no tipo de drop zone
              const getZoneColor = () => {
                switch(id) {
                  case 'x-axis-drop-zone':
                    return 'bg-blue-500 text-white'
                  case 'y-axis-drop-zone':
                    return 'bg-green-500 text-white'
                  case 'filters-drop-zone':
                    return 'bg-orange-500 text-white'
                  default:
                    return typeAccepted ? 'bg-gray-500 text-white' : 'bg-red-500 text-white'
                }
              }
              
              return (
                <div
                  key={`${field.name}-${index}`}
                  className={`
                    inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
                    ${getZoneColor()}
                    hover:opacity-90 transition-opacity
                  `}
                >
                  <span className="truncate max-w-[120px]">
                    {field.name}
                  </span>
                  
                  {onRemoveField && (
                    <button
                      onClick={() => onRemoveField(field.name)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      title="Remove field"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Type Hints */}
      {acceptedTypes && acceptedTypes.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">
            Accepts: {acceptedTypes.join(', ')} types
          </p>
        </div>
      )}
    </div>
  )
}