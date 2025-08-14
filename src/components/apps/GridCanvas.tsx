'use client'

import { useMemo } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { Responsive, WidthProvider } from 'react-grid-layout'
import DroppedWidget from './DroppedWidget'
import type { DroppedWidget as DroppedWidgetType, LayoutItem } from '@/types/widget'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface GridCanvasProps {
  widgets: DroppedWidgetType[]
  onLayoutChange: (layout: LayoutItem[]) => void
  onRemoveWidget: (widgetId: string) => void
}

export default function GridCanvas({ 
  widgets, 
  onLayoutChange, 
  onRemoveWidget
}: GridCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable'
  })

  const layout = useMemo(() => 
    widgets.map(widget => ({
      i: widget.i,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: 1,
      minH: 1,
    })), [widgets]
  )

  return (
    <div className="h-full flex flex-col">
      {/* Canvas Header */}
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Dashboard Canvas</h2>
        <p className="text-sm text-gray-600">
          {widgets.length === 0 
            ? 'Drag widgets from the left panel to get started'
            : `${widgets.length} widget${widgets.length !== 1 ? 's' : ''} on canvas`
          }
        </p>
      </div>

      {/* Grid Container */}
      <div 
        ref={setNodeRef}
        className={`flex-1 bg-white rounded-lg border-2 border-dashed relative overflow-hidden transition-colors ${
          isOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300'
        }`}
      >
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg font-medium">Drop widgets here</p>
              <p className="text-sm">Drag from the widgets panel to create your dashboard</p>
            </div>
          </div>
        ) : null}
        
        <ResponsiveGridLayout
          className="layout"
          layouts={{ lg: layout }}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          onLayoutChange={onLayoutChange}
          isDraggable={true}
          isResizable={true}
          margin={[10, 10]}
          containerPadding={[20, 20]}
          useCSSTransforms={true}
        >
          {widgets.map((widget) => (
            <div key={widget.i}>
              <DroppedWidget 
                widget={widget} 
                onRemove={() => onRemoveWidget(widget.i)}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}