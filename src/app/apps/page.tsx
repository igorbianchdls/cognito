'use client'

import { useState } from 'react'
import WidgetsPanel from '@/components/apps/WidgetsPanel'
import GridCanvas from '@/components/apps/GridCanvas'
import type { DroppedWidget, Widget, Position, LayoutItem } from '@/types/widget'

export default function AppsPage() {
  const [droppedWidgets, setDroppedWidgets] = useState<DroppedWidget[]>([])

  const handleWidgetDrop = (widget: Widget, position: Position) => {
    const newWidget = {
      ...widget,
      i: `widget-${Date.now()}`,
      x: position.x || 0,
      y: position.y || 0,
      w: widget.defaultWidth || 2,
      h: widget.defaultHeight || 2,
    }
    setDroppedWidgets(prev => [...prev, newWidget])
  }

  const handleLayoutChange = (layout: LayoutItem[]) => {
    setDroppedWidgets(prev => 
      prev.map(widget => {
        const layoutItem = layout.find(l => l.i === widget.i)
        return layoutItem ? { ...widget, ...layoutItem } : widget
      })
    )
  }

  const handleRemoveWidget = (widgetId: string) => {
    setDroppedWidgets(prev => prev.filter(w => w.i !== widgetId))
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Widgets */}
      <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
        <WidgetsPanel />
      </div>
      
      {/* Right Canvas - Grid Layout */}
      <div className="flex-1 p-6">
        <GridCanvas 
          widgets={droppedWidgets}
          onLayoutChange={handleLayoutChange}
          onRemoveWidget={handleRemoveWidget}
          onWidgetDrop={handleWidgetDrop}
        />
      </div>
    </div>
  )
}