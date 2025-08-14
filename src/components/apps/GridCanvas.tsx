'use client'

import { useMemo, useRef, useCallback } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import DroppedWidget from './DroppedWidget'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface GridCanvasProps {
  widgets: any[]
  onLayoutChange: (layout: any[]) => void
  onRemoveWidget: (widgetId: string) => void
  onWidgetDrop: (widget: any, position: any) => void
}

export default function GridCanvas({ 
  widgets, 
  onLayoutChange, 
  onRemoveWidget, 
  onWidgetDrop 
}: GridCanvasProps) {
  const gridRef = useRef<HTMLDivElement>(null)

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

  const handleDrop = useCallback((layout: any[], layoutItem: any, _event: any) => {
    // This is called when an item is dropped from outside
    console.log('Item dropped:', layoutItem)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }, [])

  const handleDrop2 = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    
    const widgetData = e.dataTransfer.getData('application/json')
    if (!widgetData) return

    try {
      const widget = JSON.parse(widgetData)
      const rect = gridRef.current?.getBoundingClientRect()
      if (!rect) return

      // Calculate grid position based on mouse position
      const x = Math.floor((e.clientX - rect.left) / 120) // Approximate grid cell width
      const y = Math.floor((e.clientY - rect.top) / 120)  // Approximate grid cell height

      onWidgetDrop(widget, { x: Math.max(0, x), y: Math.max(0, y) })
    } catch (error) {
      console.error('Error parsing widget data:', error)
    }
  }, [onWidgetDrop])

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
        ref={gridRef}
        className="flex-1 bg-white rounded-lg border-2 border-dashed border-gray-300 relative overflow-hidden"
        onDragOver={handleDragOver}
        onDrop={handleDrop2}
      >
        {widgets.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-lg font-medium">Drop widgets here</p>
              <p className="text-sm">Drag from the widgets panel to create your dashboard</p>
            </div>
          </div>
        ) : (
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
            onDrop={handleDrop}
            isDroppable={false} // We handle drops manually
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
        )}
      </div>
    </div>
  )
}