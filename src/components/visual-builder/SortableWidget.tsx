'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import WidgetRenderer from './WidgetRenderer'
import type { Widget } from './ConfigParser'

interface SortableWidgetProps {
  widget: Widget
  className?: string
}

export default function SortableWidget({ widget, className }: SortableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${className} cursor-grab active:cursor-grabbing transition-all duration-200`}
    >
      <WidgetRenderer widget={widget} />
    </div>
  )
}