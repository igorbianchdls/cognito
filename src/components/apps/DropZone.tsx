'use client'

import { useDroppable } from '@dnd-kit/core'
import { X, Plus } from 'lucide-react'
import type { BigQueryField } from './TablesExplorer'

interface DropZoneProps {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  fields: BigQueryField[]
  acceptedTypes?: string[]
  onRemoveField?: (fieldName: string) => void
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
          <div className="space-y-2">
            {fields.map((field, index) => {
              const typeAccepted = isTypeAccepted(field.type)
              
              return (
                <div
                  key={`${field.name}-${index}`}
                  className={`
                    flex items-center justify-between p-2 rounded border
                    ${typeAccepted 
                      ? 'bg-white border-gray-200' 
                      : 'bg-red-50 border-red-200'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm">{getFieldIcon(field.type)}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-gray-900 truncate block">
                        {field.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {field.type}
                      </span>
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