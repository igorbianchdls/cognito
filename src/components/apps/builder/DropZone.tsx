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
      <div className="mb-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-medium text-gray-700">{label}</h3>
        </div>
      </div>

      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[60px] p-4 rounded-md transition-all
          ${isOver 
            ? 'bg-blue-50 border border-blue-200' 
            : fields.length > 0
              ? 'bg-gray-50 border border-gray-200'
              : 'bg-gray-50 hover:bg-gray-100'
          }
        `}
      >
        {fields.length === 0 ? (
          /* Empty State */
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-500 text-center">
              {isOver ? 'Drop here' : `Drag ${label.toLowerCase()} here`}
            </p>
          </div>
        ) : (
          /* Fields List */
          <div className="space-y-2">
            {fields.map((field, index) => {
              const typeAccepted = isTypeAccepted(field.type)
              
              return (
                <div
                  key={`${field.name}-${index}`}
                  className={`
                    flex items-center justify-between p-2 rounded-sm
                    ${typeAccepted 
                      ? 'bg-white hover:bg-gray-50' 
                      : 'bg-red-50 border border-red-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm">{getFieldIcon(field.type)}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-700 truncate block">
                        {field.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        {field.type}
                      </span>
                      
                      {/* Aggregation selector for Y-axis numeric fields */}
                      {id === 'y-axis-drop-zone' && isNumericField(field.type) && onAggregationChange && (
                        <div className="mt-1">
                          <Select
                            value={field.aggregation || 'SUM'}
                            onValueChange={(value) => onAggregationChange(field.name, value as BigQueryField['aggregation'])}
                          >
                            <SelectTrigger className="h-6 text-xs w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {aggregationOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value} className="text-xs">
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {!typeAccepted && (
                      <span className="text-xs text-red-600" title={`${field.type} not supported for ${label.toLowerCase()}`}>
                        ⚠️
                      </span>
                    )}
                    
                    {onRemoveField && (
                      <button
                        onClick={() => onRemoveField(field.name)}
                        className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                        title="Remove field"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

    </div>
  )
}