'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import AppsHeader from '@/components/apps/AppsHeader'
import WidgetsPanel from '@/components/apps/WidgetsPanel'
import ChatPanel from '@/components/apps/ChatPanel'
import GridCanvas from '@/components/apps/GridCanvas'
import type { DroppedWidget, Widget, LayoutItem } from '@/types/widget'

export default function AppsPage() {
  const [droppedWidgets, setDroppedWidgets] = useState<DroppedWidget[]>([])
  const [activeWidget, setActiveWidget] = useState<Widget | null>(null)
  const [activeTab, setActiveTab] = useState<'widgets' | 'chat'>('widgets')

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const widget = active.data.current as Widget
    setActiveWidget(widget)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveWidget(null)
    
    if (over?.id === 'canvas-droppable') {
      const widget = active.data.current as Widget
      
      const newWidget: DroppedWidget = {
        ...widget,
        i: `widget-${Date.now()}`,
        x: 0,
        y: 0, 
        w: widget.defaultWidth || 2,
        h: widget.defaultHeight || 2,
      }
      
      setDroppedWidgets(prev => [...prev, newWidget])
    }
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
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <AppsHeader activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Panel */}
          <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
            {activeTab === 'widgets' ? <WidgetsPanel /> : <ChatPanel droppedWidgets={droppedWidgets} />}
          </div>
          
          {/* Right Canvas - Always visible */}
          <div className="flex-1 p-6">
            <GridCanvas 
              widgets={droppedWidgets}
              onLayoutChange={handleLayoutChange}
              onRemoveWidget={handleRemoveWidget}
            />
          </div>
        </div>
      </div>
      
      <DragOverlay>
        {activeWidget ? (
          <div className="bg-white border-2 border-blue-500 rounded-lg p-3 shadow-lg opacity-90">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activeWidget.icon}</span>
              <div>
                <div className="font-medium text-sm">{activeWidget.name}</div>
                <div className="text-xs text-gray-500">{activeWidget.description}</div>
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}