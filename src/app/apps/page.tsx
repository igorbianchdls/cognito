'use client'

import { useState, useCallback } from 'react'
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

  const handleEditWidget = useCallback((widgetId: string, changes: Partial<DroppedWidget>) => {
    try {
      console.log('🎨 AppsPage handleEditWidget chamado:', { widgetId, changes });
      console.log('📦 Current widgets before edit:', droppedWidgets.map(w => ({ id: w.i, name: w.name })));
      
      // Special handling for delete action
      if ('_delete' in changes) {
        console.log('🗑️ AppsPage: Deletando widget:', widgetId);
        const widgetToDelete = droppedWidgets.find(w => w.i === widgetId);
        if (widgetToDelete) {
          console.log('🗑️ Widget encontrado para deleção:', widgetToDelete.name);
          setDroppedWidgets(prev => {
            const newWidgets = prev.filter(w => w.i !== widgetId);
            console.log('✅ Widget deletado. Widgets restantes:', newWidgets.length);
            return newWidgets;
          });
        } else {
          console.error('❌ Widget para deletar não encontrado:', widgetId);
        }
        return;
      }
      
      // Regular edit
      console.log('🔄 AppsPage: Editando widget normalmente');
      setDroppedWidgets(prev => {
        const updatedWidgets = prev.map(w => {
          if (w.i === widgetId) {
            const updated = {...w, ...changes};
            console.log('✅ Widget atualizado:', { before: w, after: updated });
            return updated;
          }
          return w;
        });
        console.log('📦 Widgets após edição:', updatedWidgets.length);
        return updatedWidgets;
      });
      
    } catch (error) {
      console.error('❌ Erro em handleEditWidget:', error);
      console.error('❌ Error details:', {
        widgetId,
        changes,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack'
      });
    }
  }, [droppedWidgets])

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <AppsHeader activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Main Content */}
        <div className="flex-1 flex">
          {/* Left Panel */}
          <div className="w-80 bg-white border-r border-gray-200 flex-shrink-0">
            {activeTab === 'widgets' ? <WidgetsPanel /> : <ChatPanel droppedWidgets={droppedWidgets} onEditWidget={handleEditWidget} />}
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