'use client'

import { useDraggable } from '@dnd-kit/core'
import { BarChart3, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CustomMeasure } from '@/stores/measureStore'
import { measureActions } from '@/stores/measureStore'

interface DraggableMeasureProps {
  measure: CustomMeasure
  onRemove?: (measureId: string) => void
}

export default function DraggableMeasure({ measure, onRemove }: DraggableMeasureProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: `measure-${measure.id}`,
    data: {
      name: measure.name,
      type: 'numeric', // Measures are always numeric
      mode: 'NULLABLE',
      description: `Custom measure: ${measure.expression}`,
      aggregation: measure.aggregation,
      sourceTable: measure.tableId,
      isMeasure: true, // Flag to identify as custom measure
      expression: measure.expression,
      measureId: measure.id
    },
  })

  // Handle remove measure
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent drag from starting
    if (onRemove) {
      onRemove(measure.id)
    } else {
      measureActions.removeMeasure(measure.tableId, measure.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-start justify-between p-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded border border-green-200 cursor-grab transition-all ${
        isDragging 
          ? 'opacity-50 cursor-grabbing border-green-400 shadow-md' 
          : 'hover:border-green-400 hover:shadow-sm'
      }`}
      title={`Drag ${measure.name} to chart builder`}
    >
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <span className="text-green-600 flex-shrink-0 mt-0.5">
          <BarChart3 className="w-3 h-3" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium text-gray-900 truncate block">
            {measure.name}
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-1.5 py-0.5 text-xs font-mono rounded bg-green-100 text-green-800">
              {measure.expression}
            </span>
            <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
              Medida
            </span>
          </div>
          <p className="text-xs text-green-600 truncate mt-1">
            {measure.aggregation} de {measure.column}
          </p>
        </div>
      </div>
      
      {/* Remove button */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="h-6 w-6 p-0 hover:bg-red-100 text-red-500 transition-colors"
          title="Remove measure"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    </div>
  )
}