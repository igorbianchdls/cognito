'use client'

import { useState, useCallback, useMemo } from 'react'
import { useStore } from '@nanostores/react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import SplitSidebarPanel from '@/components/apps/builder/SplitSidebarPanel'
import GridCanvas from '@/components/apps/GridCanvas'
import MultiGridCanvas from '@/components/apps/MultiGridCanvas'
import { $widgets, widgetActions } from '@/stores/apps/widgetStore'
import { $barChartsAsDropped } from '@/stores/apps/barChartStore'
import { $lineChartsAsDropped } from '@/stores/apps/lineChartStore'
import { $kpisAsDropped } from '@/stores/apps/kpiStore'
import { $tablesAsDropped } from '@/stores/apps/tableStore'
import { $activeTab, multiCanvasActions } from '@/stores/apps/multiCanvasStore'
import { isNavigationWidget } from '@/types/apps/droppedWidget'
import type { Widget, LayoutItem, DroppedWidget } from '@/types/apps/droppedWidget'
import { Button } from '@/components/ui/button'
import { Settings, Share, Github, BarChart3, MessageSquare, Code, Cpu, Archive, Database } from 'lucide-react'

export default function AppsPage() {
  const droppedWidgets = useStore($widgets)
  const barCharts = useStore($barChartsAsDropped)
  const lineCharts = useStore($lineChartsAsDropped)
  const kpis = useStore($kpisAsDropped)
  const tables = useStore($tablesAsDropped)
  
  // Combine all widgets from different stores
  const allWidgets = useMemo(() => [
    ...droppedWidgets,
    ...barCharts,
    ...lineCharts,
    ...kpis,
    ...tables
  ], [droppedWidgets, barCharts, lineCharts, kpis, tables])
  const [activeWidget, setActiveWidget] = useState<Widget | null>(null)
  const [activeTab, setActiveTab] = useState<'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved' | 'datasets'>('chat')

  // Tab configuration with icons and labels
  const tabs = [
    { id: 'widgets', label: 'Widgets', icon: BarChart3 },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'editor', label: 'Editor', icon: Settings },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'automations', label: 'Automações', icon: Cpu },
    { id: 'saved', label: 'Salvos', icon: Archive },
    { id: 'datasets', label: 'Datasets', icon: Database },
  ] as const

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
      
      if (hasNavigationWidget) {
        // Multi-canvas mode: Add widget to active tab
        console.log('[ADD] Adding widget to multi-canvas tab:', $activeTab.get())
        const activeTabId = $activeTab.get()
        const currentTabWidgets = multiCanvasActions.getTabWidgets(activeTabId)
        multiCanvasActions.updateTabWidgets(activeTabId, [...currentTabWidgets, newWidget])
      } else {
        // Normal mode: Add to main canvas
        console.log('[ADD] Adding widget to main canvas:', newWidget.i)
        widgetActions.addWidget(newWidget)
      }
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

  const handleEditWidgetClick = useCallback((widgetId: string) => {
    // Select the widget and switch to editor tab
    widgetActions.selectWidget(widgetId)
    setActiveTab('editor')
  }, [])

  // Detect if Navigation Widget is present to switch between canvas modes
  const hasNavigationWidget = useMemo(() => {
    return allWidgets.some(widget => isNavigationWidget(widget))
  }, [allWidgets])

  return (
    <SidebarProvider defaultOpen={false}>
      <SidebarShadcn />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 border-b border-gray-200" style={{backgroundColor: 'hsl(0 0% 98%)'}}>
          <div className="flex items-center justify-between w-full px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              
              {/* Tabs com UI de breadcrumb */}
              <Breadcrumb>
                <BreadcrumbList>
                  {tabs.map((tab, index) => (
                    <div key={tab.id} className="flex items-center">
                      <BreadcrumbItem>
                        {activeTab === tab.id ? (
                          <BreadcrumbPage className="flex items-center gap-2 text-sidebar-foreground">
                            <tab.icon className="w-4 h-4 text-sidebar-foreground" />
                            <span className="hidden sm:inline">
                              {tab.label === 'Automações' ? 'Auto' : tab.label}
                            </span>
                          </BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink 
                            href="#" 
                            onClick={(e) => {
                              e.preventDefault()
                              setActiveTab(tab.id)
                            }}
                            className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-foreground/80"
                          >
                            <tab.icon className="w-4 h-4 text-sidebar-foreground" />
                            <span className="hidden sm:inline">
                              {tab.label === 'Automações' ? 'Auto' : tab.label}
                            </span>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {index < tabs.length - 1 && <BreadcrumbSeparator />}
                    </div>
                  ))}
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            
            {/* Botões na extrema direita */}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4 text-sidebar-foreground" />
              </Button>
              <Button variant="ghost" size="sm">
                <Share className="h-4 w-4 text-sidebar-foreground" />
              </Button>
              <Button variant="ghost" size="sm">
                <Github className="h-4 w-4 text-sidebar-foreground" />
              </Button>
              <Button variant="outline" size="sm">Share</Button>
              <Button variant="default" size="sm">Publish</Button>
            </div>
          </div>
        </header>
        <div className="flex flex-1 flex-col" style={{backgroundColor: 'hsl(0 0% 98%)'}}>
          {/* Sistema de Apps aninhado */}
          <div className="grid grid-cols-[auto_1fr] flex-1 overflow-hidden" style={{backgroundColor: 'hsl(0 0% 98%)'}}>
              
            <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              {/* SplitSidebarPanel */}
              <div className="relative z-10">
                <SplitSidebarPanel 
                  activeTab={activeTab}
                  droppedWidgets={allWidgets}
                  onEditWidget={handleEditWidget}
                />
              </div>
            
              {/* Canvas */}
              <div className="relative z-0 py-1 px-3 h-[calc(100vh-4rem)] overflow-auto min-w-0">
                {hasNavigationWidget ? (
                  <MultiGridCanvas 
                    widgets={allWidgets}
                    onLayoutChange={handleLayoutChange}
                    onRemoveWidget={handleRemoveWidget}
                    onEditWidget={handleEditWidgetClick}
                  />
                ) : (
                  <GridCanvas 
                    widgets={allWidgets}
                    onLayoutChange={handleLayoutChange}
                    onRemoveWidget={handleRemoveWidget}
                    onEditWidget={handleEditWidgetClick}
                  />
                )}
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
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}