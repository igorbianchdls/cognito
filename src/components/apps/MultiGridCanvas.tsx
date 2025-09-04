'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { useDroppable } from '@dnd-kit/core'
import { Responsive, WidthProvider } from 'react-grid-layout'
import DroppedWidget from './DroppedWidget'
// import { $selectedWidgetId, widgetActions } from '@/stores/apps/widgetStore' // REMOVED: Only KPIs supported now
import { $selectedKPI, kpiActions } from '@/stores/apps/kpiStore'
import { $canvasConfig } from '@/stores/apps/canvasStore'
import { $multiCanvasState, $activeTab, multiCanvasActions } from '@/stores/apps/multiCanvasStore'
import { WebPreview, WebPreviewNavigation, WebPreviewUrl, WebPreviewNavigationButton } from '@/components/ai-elements/web-preview'
import { savedDashboardActions } from '@/stores/apps/savedDashboardStore'
import { Eye, Save, Download, Settings } from 'lucide-react'
import { isNavigationWidget } from '@/types/apps/droppedWidget'
import type { DroppedWidget as DroppedWidgetType, LayoutItem } from '@/types/apps/droppedWidget'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface MultiGridCanvasProps {
  widgets: DroppedWidgetType[]
  onLayoutChange: (layout: LayoutItem[]) => void
  onRemoveWidget: (widgetId: string) => void
  onEditWidget?: (widgetId: string) => void
  readOnly?: boolean
  noBorder?: boolean
}

export default function MultiGridCanvas({ 
  widgets, 
  onLayoutChange, 
  onRemoveWidget,
  onEditWidget,
  readOnly = false,
  noBorder = false
}: MultiGridCanvasProps) {
  const selectedKPI = useStore($selectedKPI)
  const canvasConfig = useStore($canvasConfig)
  const multiCanvasState = useStore($multiCanvasState)
  const activeTab = useStore($activeTab)
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable'
  })

  // State for container width measurement
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  
  // States to control drag/resize interactions
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  // Initialize multi-canvas mode if not already done
  useEffect(() => {
    if (!isInitialized && widgets.some(w => isNavigationWidget(w))) {
      console.log('🔄 Initializing multi-canvas mode')
      multiCanvasActions.initializeMultiCanvas(widgets)
      setIsInitialized(true)
    }
  }, [widgets, isInitialized])

  // Separate navigation widget from content widgets
  const navigationWidget = useMemo(() => {
    return widgets.find(w => isNavigationWidget(w))
  }, [widgets])

  // Get widgets for active tab
  const activeTabWidgets = useMemo(() => {
    const activeTabData = multiCanvasState.tabs.find(tab => tab.id === activeTab)
    return activeTabData?.widgets || []
  }, [multiCanvasState.tabs, activeTab])

  const handleWidgetClick = (widgetId: string) => {
    // Find widget from the widgets array passed as props
    const widget = widgets.find(w => w.i === widgetId)
    
    if (widget?.type === 'kpi') {
      // Use kpiStore for KPI selection
      console.log('🎯 Selecting KPI in MultiGridCanvas:', widgetId)
      kpiActions.selectKPI(widgetId)
    }
    // Note: Only KPIs supported now, other widget types removed
  }

  // Navigation button handlers
  const handlePreview = () => {
    // Enter fullscreen preview mode for multi-canvas
    const canvasElement = containerRef.current
    if (canvasElement && canvasElement.requestFullscreen) {
      canvasElement.requestFullscreen()
    }
    console.log('Preview multi-canvas dashboard - entering fullscreen', { activeTab })
  }

  const handleSave = () => {
    // Use the same save functionality as the header button
    savedDashboardActions.promptAndSave()
  }

  const handleExport = () => {
    // Export active tab as JSON file
    const activeTabData = multiCanvasState.tabs.find(tab => tab.id === activeTab)
    const exportData = {
      tabName: activeTabData?.name || 'Dashboard',
      tabId: activeTab,
      widgets: activeTabWidgets,
      navigationWidget,
      exportDate: new Date().toISOString(),
      title: `${activeTabData?.name || 'Tab'} Export`
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `tab-${activeTabData?.name.toLowerCase().replace(/\s+/g, '-') || 'export'}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('Tab exported as JSON file', { activeTab, tabName: activeTabData?.name })
  }

  const handleSettings = () => {
    // TODO: Open multi-canvas settings panel/modal
    console.log('Open multi-canvas settings - this could open a settings modal')
    alert('Multi-Canvas Settings - This feature will be implemented with a settings modal')
  }

  // Effect to measure container width for responsive calculations
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }
    
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  // Note: Container width is available for future responsive calculations if needed

  // Handle layout changes for active tab
  const handleLayoutChange = (layout: LayoutItem[]) => {
    console.log('[MULTI-CANVAS] Layout change for tab:', activeTab, layout)
    
    // Update the layout in the main widget store
    onLayoutChange(layout)
    
    // Update the widgets in the multi-canvas store for the active tab
    const updatedWidgets = activeTabWidgets.map(widget => {
      const layoutItem = layout.find(l => l.i === widget.i)
      if (layoutItem) {
        return {
          ...widget,
          x: layoutItem.x,
          y: layoutItem.y,
          w: layoutItem.w,
          h: layoutItem.h
        }
      }
      return widget
    })
    
    multiCanvasActions.updateTabWidgets(activeTab, updatedWidgets)
  }

  // Handle widget removal
  const handleRemoveWidget = (widgetId: string) => {
    console.log('[MULTI-CANVAS] Removing widget:', widgetId)
    
    // If it's the navigation widget, exit multi-canvas mode
    if (navigationWidget && navigationWidget.i === widgetId) {
      console.log('🔄 Navigation widget removed, exiting multi-canvas mode')
      const restoredWidgets = multiCanvasActions.exitMultiCanvas()
      
      // Restore widgets to main canvas
      restoredWidgets.forEach(widget => {
        widgetActions.addWidget(widget)
      })
    }
    
    onRemoveWidget(widgetId)
  }

  const gridStyles = {
    backgroundColor: canvasConfig.backgroundColor,
    backgroundImage: canvasConfig.backgroundImage ? `url(${canvasConfig.backgroundImage})` : 'none',
    backgroundSize: canvasConfig.backgroundImage ? canvasConfig.backgroundSize : 'auto',
    backgroundPosition: canvasConfig.backgroundImage ? canvasConfig.backgroundPosition : 'auto',
    backgroundRepeat: canvasConfig.backgroundImage ? canvasConfig.backgroundRepeat : 'repeat',
  }

  return (
    <div ref={containerRef} className="flex flex-row">
      {/* Left Sidebar - Navigation Widget */}
      {navigationWidget && (
        <div 
          className="flex-shrink-0 transition-all duration-300"
          style={{
            width: `${navigationWidget.config?.navigationConfig?.sidebarWidth || 256}px`,
            minWidth: '64px' // Minimum width for collapsed state
          }}
        >
          <div className="relative h-full">
            <DroppedWidget
              key={navigationWidget.i}
              widget={navigationWidget}
              isSelected={false} // Note: Navigation widgets not supported with KPI selection
              onClick={() => handleWidgetClick(navigationWidget.i)}
              onRemove={() => handleRemoveWidget(navigationWidget.i)}
              onEdit={onEditWidget ? () => onEditWidget(navigationWidget.i) : undefined}
            />
            
            {/* Selection indicator */}
            {false && ( // Note: Widget editing disabled for navigation widgets
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* Right Canvas - Main content area */}
      <div className="flex-1">
        <WebPreview 
          defaultUrl={`dashboard-tab-${activeTab}`}
          className={`${noBorder ? 'border-0' : ''} ${
            isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
          }`}
        >
          <WebPreviewNavigation>
            <WebPreviewNavigationButton tooltip="Preview Dashboard" onClick={handlePreview}>
              <Eye className="h-6 w-6" />
            </WebPreviewNavigationButton>
            
            <WebPreviewNavigationButton tooltip="Save Dashboard" onClick={handleSave}>
              <Save className="h-6 w-6" />
            </WebPreviewNavigationButton>
            
            <WebPreviewUrl 
              value={`https://dashboard.app/tabs/${multiCanvasState.tabs.find(t => t.id === activeTab)?.name.toLowerCase().replace(/\s+/g, '-') || 'dashboard'}`}
              readOnly
              className="text-sm bg-gray-50"
            />
            
            <WebPreviewNavigationButton tooltip="Export Tab" onClick={handleExport}>
              <Download className="h-6 w-6" />
            </WebPreviewNavigationButton>
            
            <WebPreviewNavigationButton tooltip="Multi-Canvas Settings" onClick={handleSettings}>
              <Settings className="h-6 w-6" />
            </WebPreviewNavigationButton>
          </WebPreviewNavigation>
          
          {/* Canvas direto dentro do WebPreview, sem iframe */}
          <div 
            ref={setNodeRef} 
            className="relative transition-all duration-200 p-0 bg-white"
            style={{
              ...gridStyles,
              height: '880px'
            }}
          >
            {/* Empty state when no widgets */}
            {activeTabWidgets.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-4">📊</div>
                  <div className="text-lg font-medium">Tab: {multiCanvasState.tabs.find(t => t.id === activeTab)?.name}</div>
                  <div className="text-sm mt-2">Drag widgets here to get started</div>
                </div>
              </div>
            )}

            {/* Grid Layout for active tab */}
            {activeTabWidgets.length > 0 && (
              <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: activeTabWidgets.map(w => ({ i: w.i, x: w.x, y: w.y, w: w.w, h: w.h })) }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={60}
                width={containerWidth}
                onLayoutChange={handleLayoutChange}
                isDraggable={!readOnly}
                isResizable={!readOnly}
                margin={[16, 16]}
                containerPadding={[16, 16]}
                onDragStart={() => {
                  console.log('🎯 MultiGridCanvas: Drag started')
                  setIsDragging(true)
                }}
                onDragStop={(layout) => {
                  console.log('🎯 MultiGridCanvas: Drag stopped', layout)
                  setIsDragging(false)
                  handleLayoutChange(layout)
                }}
                onResizeStart={() => {
                  console.log('📏 MultiGridCanvas: Resize started')
                  setIsResizing(true)
                }}
                onResizeStop={(layout) => {
                  console.log('📏 MultiGridCanvas: Resize stopped', layout)
                  setIsResizing(false)
                  handleLayoutChange(layout)
                }}
              >
                {activeTabWidgets.map((widget) => (
                  <div key={widget.i} className="relative">
                    <DroppedWidget
                      widget={widget}
                      isSelected={widget.type === 'kpi' && selectedKPI?.i === widget.i}
                      onClick={() => handleWidgetClick(widget.i)}
                      onRemove={() => handleRemoveWidget(widget.i)}
                      onEdit={onEditWidget ? () => onEditWidget(widget.i) : undefined}
                    />
                    
                    {/* Selection indicator */}
                    {widget.type === 'kpi' && selectedKPI?.i === widget.i && (
                      <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
                    )}
                  </div>
                ))}
              </ResponsiveGridLayout>
            )}

            {/* Drop zone overlay when dragging */}
            {isOver && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center">
                <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
                  <span className="text-blue-600 font-medium">Drop widget in {multiCanvasState.tabs.find(t => t.id === activeTab)?.name}</span>
                </div>
              </div>
            )}
          </div>
        </WebPreview>
        
        {/* Debug info (development only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
            <div>Active Tab: {activeTab} | Widgets: {activeTabWidgets.length} | Navigation: {navigationWidget ? 'Yes' : 'No'}</div>
          </div>
        )}
      </div>
    </div>
  )
}