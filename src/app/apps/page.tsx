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
// import MultiGridCanvas from '@/components/apps/MultiGridCanvas' // REMOVED: Simplified to single canvas
// Chart stores - needed for charts to appear in canvas
import { $barChartsAsDropped, barChartActions } from '@/stores/apps/barChartStore'
import { $horizontalBarChartsAsDropped, horizontalBarChartActions } from '@/stores/apps/horizontalBarChartStore'
import { $lineChartsAsDropped, lineChartActions } from '@/stores/apps/lineChartStore'
import { $pieChartsAsDropped, pieChartActions } from '@/stores/apps/pieChartStore'
import { $areaChartsAsDropped, areaChartActions } from '@/stores/apps/areaChartStore'
import { $kpisAsDropped, kpiActions } from '@/stores/apps/kpiStore'
import { $tablesAsDropped, tableActions } from '@/stores/apps/tableStore'
// import { $activeTab, multiCanvasActions } from '@/stores/apps/multiCanvasStore' // REMOVED: Simplified to single canvas
// import { isNavigationWidget } from '@/types/apps/droppedWidget' // REMOVED: No navigation widgets in KPI-only mode
import type { Widget, LayoutItem, DroppedWidget } from '@/types/apps/droppedWidget'
import { Button } from '@/components/ui/button'
import { Settings, Share, Github, BarChart3, MessageSquare, Code, Cpu, Archive, Database } from 'lucide-react'

export default function AppsPage() {
  // Widget stores - KPIs, Tables, and Charts
  const kpis = useStore($kpisAsDropped)
  const tables = useStore($tablesAsDropped)
  const barCharts = useStore($barChartsAsDropped)
  const horizontalBarCharts = useStore($horizontalBarChartsAsDropped)
  const lineCharts = useStore($lineChartsAsDropped)
  const pieCharts = useStore($pieChartsAsDropped)
  const areaCharts = useStore($areaChartsAsDropped)
  
  // KPIs, Tables, and Charts supported - combine from all stores
  const allWidgets = useMemo(() => {
    const combined = [
      ...kpis,
      ...tables,
      ...barCharts,
      ...horizontalBarCharts,
      ...lineCharts,
      ...pieCharts,
      ...areaCharts
    ]
    
    // Diagnóstico: Verificar duplicatas
    const ids = combined.map(w => w.i)
    const uniqueIds = new Set(ids)
    if (ids.length !== uniqueIds.size) {
      console.error('🚨 DUPLICATED WIDGET IDs DETECTED!', {
        totalWidgets: ids.length,
        uniqueIds: uniqueIds.size,
        duplicatedIds: ids.filter((id, index) => ids.indexOf(id) !== index),
        allIds: ids,
        kpiIds: kpis.map(k => k.i)
      })
    } else {
      console.log('✅ All widget IDs are unique:', { 
        total: ids.length, 
        kpisCount: kpis.length,
        tablesCount: tables.length,
        barChartsCount: barCharts.length,
        horizontalBarChartsCount: horizontalBarCharts.length,
        lineChartsCount: lineCharts.length,
        pieChartsCount: pieCharts.length,
        areaChartsCount: areaCharts.length
      })
    }
    
    return combined
  }, [kpis, tables, barCharts, horizontalBarCharts, lineCharts, pieCharts, areaCharts])
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
      
      // Single canvas mode: Add KPI to main canvas
      console.log('[ADD] Adding KPI to main canvas:', newWidget.i)
      if (widget.type === 'kpi') {
        kpiActions.addKPI(newWidget)
      }
      // Note: Only KPIs supported now, other types ignored
    }
  }

  const handleLayoutChange = (layout: LayoutItem[]) => {
    console.log('[LAYOUT] Mudança detectada:', layout.map(l => ({ id: l.i, x: l.x, y: l.y, w: l.w, h: l.h })))
    
    // Separar widgets por tipo para atualizar stores apropriadas
    const kpiLayouts = layout.filter(item => {
      const widget = allWidgets.find(w => w.i === item.i)
      return widget?.type === 'kpi'
    })
    
    const barChartLayouts = layout.filter(item => {
      const widget = allWidgets.find(w => w.i === item.i)
      return widget?.type === 'chart-bar'
    })
    
    const horizontalBarChartLayouts = layout.filter(item => {
      const widget = allWidgets.find(w => w.i === item.i)
      return widget?.type === 'chart-horizontal-bar'
    })
    
    const lineChartLayouts = layout.filter(item => {
      const widget = allWidgets.find(w => w.i === item.i)
      return widget?.type === 'chart-line'
    })
    
    const pieChartLayouts = layout.filter(item => {
      const widget = allWidgets.find(w => w.i === item.i)
      return widget?.type === 'chart-pie'
    })
    
    const areaChartLayouts = layout.filter(item => {
      const widget = allWidgets.find(w => w.i === item.i)
      return widget?.type === 'chart-area'
    })
    
    // Atualizar cada store com os layouts correspondentes
    if (kpiLayouts.length > 0) {
      console.log('[LAYOUT] Updating', kpiLayouts.length, 'KPIs')
      kpiActions.updateKPIsLayout(kpiLayouts)
    }
    
    if (barChartLayouts.length > 0) {
      console.log('[LAYOUT] Updating', barChartLayouts.length, 'Bar Charts')
      barChartActions.updateBarChartsLayout(barChartLayouts)
    }
    
    if (horizontalBarChartLayouts.length > 0) {
      console.log('[LAYOUT] Updating', horizontalBarChartLayouts.length, 'Horizontal Bar Charts')
      horizontalBarChartActions.updateHorizontalBarChartsLayout(horizontalBarChartLayouts)
    }
    
    if (lineChartLayouts.length > 0) {
      console.log('[LAYOUT] Updating', lineChartLayouts.length, 'Line Charts')
      lineChartActions.updateLineChartsLayout(lineChartLayouts)
    }
    
    if (pieChartLayouts.length > 0) {
      console.log('[LAYOUT] Updating', pieChartLayouts.length, 'Pie Charts')
      pieChartActions.updatePieChartsLayout(pieChartLayouts)
    }
    
    if (areaChartLayouts.length > 0) {
      console.log('[LAYOUT] Updating', areaChartLayouts.length, 'Area Charts')
      areaChartActions.updateAreaChartsLayout(areaChartLayouts)
    }
  }

  const handleRemoveWidget = (widgetId: string) => {
    // Find widget type and use appropriate store
    const widget = allWidgets.find(w => w.i === widgetId)
    
    if (!widget) {
      console.warn('Widget not found:', widgetId)
      return
    }
    
    switch (widget.type) {
      case 'kpi':
        kpiActions.removeKPI(widgetId)
        break
      case 'table':
        tableActions.removeTable(widgetId)
        break
      case 'chart-bar':
        barChartActions.removeBarChart(widgetId)
        break
      case 'chart-horizontal-bar':
        horizontalBarChartActions.removeHorizontalBarChart(widgetId)
        break
      case 'chart-line':
        lineChartActions.removeLineChart(widgetId)
        break
      case 'chart-pie':
        pieChartActions.removePieChart(widgetId)
        break
      case 'chart-area':
        areaChartActions.removeAreaChart(widgetId)
        break
      default:
        console.warn('Remove not implemented for widget type:', (widget as DroppedWidget).type)
    }
  }

  const handleEditWidget = useCallback((widgetId: string, changes: Partial<DroppedWidget>) => {
    // Find widget type and use appropriate store
    const widget = allWidgets.find(w => w.i === widgetId)
    if (widget?.type === 'kpi') {
      // KPI editing handled through KPIConfigEditor via kpiStore
      console.log('KPI editing handled through KPIConfigEditor, changes:', changes)
    }
    // Note: Only KPIs supported now
  }, [allWidgets])

  const handleEditWidgetClick = useCallback((widgetId: string) => {
    // Find widget type and use appropriate store for selection
    const widget = allWidgets.find(w => w.i === widgetId)
    if (widget?.type === 'kpi') {
      kpiActions.selectKPI(widgetId)
    }
    setActiveTab('editor')
  }, [allWidgets])

  // REMOVED: No navigation widgets in KPI-only mode - always use single canvas
  // const hasNavigationWidget = useMemo(() => {
  //   return allWidgets.some(widget => isNavigationWidget(widget))
  // }, [allWidgets])

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
            
              {/* Canvas - Simplified to single GridCanvas */}
              <div className="relative z-0 py-1 px-3 h-[calc(100vh-4rem)] overflow-auto min-w-0">
                <GridCanvas 
                  widgets={allWidgets}
                  onLayoutChange={handleLayoutChange}
                  onRemoveWidget={handleRemoveWidget}
                  onEditWidget={handleEditWidgetClick}
                />
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