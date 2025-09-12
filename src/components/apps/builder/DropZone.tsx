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
  // Debug: Log props when component renders
  console.log('🎯 DropZone render:', { 
    id, 
    label,
    fieldsCount: fields?.length || 0, 
    fields: fields?.map(f => ({ name: f.name, type: f.type })) || [],
    hasOnRemoveField: !!onRemoveField,
    timestamp: Date.now()
  })
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
          <h3 className="text-sm font-medium" style={{ color: 'rgb(94, 94, 94)' }}>{label}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>

      {/* Drop Area */}
      <div
        ref={setNodeRef}
        className={`
          min-h-[80px] p-3 border-2 border-dashed rounded-lg transition-all
          ${isOver 
            ? 'border-primary/50 bg-primary/10' 
            : fields.length > 0
              ? 'border-border bg-muted/30'
              : 'border-border bg-background hover:border-primary/30'
          }
        `}
      >
        {fields.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
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
                    return 'bg-primary text-primary-foreground'
                  case 'y-axis-drop-zone':
                    return 'bg-emerald-500 text-white'
                  case 'filters-drop-zone':
                    return 'bg-orange-500 text-white'
                  case 'kpi-value-drop-zone':
                    return 'bg-purple-500 text-white'
                  default:
                    return typeAccepted ? 'bg-secondary text-secondary-foreground' : 'bg-destructive text-destructive-foreground'
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
                      onClick={(e) => {
                        e.stopPropagation()
                        console.log('🗑️ DropZone X button clicked:', { 
                          fieldName: field.name, 
                          dropZoneId: id,
                          hasOnRemoveField: !!onRemoveField,
                          timestamp: Date.now()
                        })
                        onRemoveField(field.name)
                        console.log('🗑️ DropZone onRemoveField called successfully')
                      }}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors cursor-pointer"
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
          <p className="text-xs text-muted-foreground">
            Accepts: {acceptedTypes.join(', ')} types
          </p>
        </div>
      )}
    </div>
  )
}