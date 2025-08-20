'use client'

import { useState, useCallback } from 'react'
import { useStore } from '@nanostores/react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import AppsHeader from '@/components/apps/AppsHeader'
import WidgetsPanel from '@/components/apps/WidgetsPanel'
import ChatPanel from '@/components/apps/ChatPanel'
import WidgetEditor from '@/components/apps/WidgetEditorNew'
import CodeEditor from '@/components/apps/CodeEditor'
import AutomationsPanel from '@/components/apps/AutomationsPanel'
import SavedPanel from '@/components/apps/SavedPanel'
import GridCanvas from '@/components/apps/GridCanvas'
import { $widgets, widgetActions } from '@/stores/widgetStore'
import type { Widget, LayoutItem, DroppedWidget } from '@/types/widget'

export default function AppsPage() {
  const droppedWidgets = useStore($widgets)
  const [activeWidget, setActiveWidget] = useState<Widget | null>(null)
  const [activeTab, setActiveTab] = useState<'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved'>('widgets')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

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
      
      const newWidget = {
        ...widget,
        i: `widget-${Date.now()}`,
        x: 0,
        y: 0, 
        w: widget.defaultWidth || 2,
        h: widget.defaultHeight || 2,
      }
      
      console.log('[ADD] Adicionando novo widget:', newWidget.i, 'na posição', { x: newWidget.x, y: newWidget.y })
      widgetActions.addWidget(newWidget)
    }
  }

  const handleLayoutChange = (layout: LayoutItem[]) => {
    console.log('[LAYOUT] Mudança detectada:', layout.map(l => ({ id: l.i, x: l.x, y: l.y, w: l.w, h: l.h })))
    widgetActions.updateLayout(layout)
  }

  const handleRemoveWidget = (widgetId: string) => {
    widgetActions.removeWidget(widgetId)
  }

  const handleEditWidget = useCallback((widgetId: string, changes: Partial<DroppedWidget>) => {
    widgetActions.editWidget(widgetId, changes)
  }, [])

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <AppsHeader 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        
        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Panel */}
          <div className={`${
            sidebarCollapsed 
              ? 'w-0 overflow-hidden' 
              : 'w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-hidden'
          } transition-all duration-300 ease-in-out`} style={{ height: 'calc(100vh - 80px)' }}>
            {activeTab === 'widgets' && <WidgetsPanel />}
            {activeTab === 'chat' && <ChatPanel droppedWidgets={droppedWidgets} onEditWidget={handleEditWidget} />}
            {activeTab === 'editor' && <WidgetEditor />}
            {activeTab === 'code' && <CodeEditor />}
            {activeTab === 'automations' && <AutomationsPanel />}
            {activeTab === 'saved' && <SavedPanel />}
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