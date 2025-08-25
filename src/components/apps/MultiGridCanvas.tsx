'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { useDroppable } from '@dnd-kit/core'
import { Responsive, WidthProvider } from 'react-grid-layout'
import DroppedWidget from './DroppedWidget'
import { $selectedWidgetId, widgetActions } from '@/stores/widgetStore'
import { $canvasConfig } from '@/stores/canvasStore'
import { $multiCanvasState, $activeTab, multiCanvasActions } from '@/stores/multiCanvasStore'
import { WebPreview, WebPreviewNavigation, WebPreviewUrl, WebPreviewBody } from '@/components/ai-elements/web-preview'
import { isNavigationWidget } from '@/types/widget'
import type { DroppedWidget as DroppedWidgetType, LayoutItem } from '@/types/widget'

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
  const selectedWidgetId = useStore($selectedWidgetId)
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
    widgetActions.selectWidget(widgetId)
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
    <div ref={containerRef} className="h-full flex flex-row">
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
              isSelected={selectedWidgetId === navigationWidget.i}
              onClick={() => handleWidgetClick(navigationWidget.i)}
              onRemove={() => handleRemoveWidget(navigationWidget.i)}
              onEdit={onEditWidget ? () => onEditWidget(navigationWidget.i) : undefined}
            />
            
            {/* Selection indicator */}
            {selectedWidgetId === navigationWidget.i && (
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
            )}
          </div>
        </div>
      )}

      {/* Right Canvas - Main content area */}
      <div className="flex-1">
        <WebPreview 
          defaultUrl={`dashboard-tab-${activeTab}`}
          className={`h-full ${noBorder ? 'border-0' : ''} ${
            isOver ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
          }`}
        >
          <WebPreviewNavigation>
            <WebPreviewUrl 
              value={`Tab: ${multiCanvasState.tabs.find(t => t.id === activeTab)?.name || 'Dashboard'}`}
              readOnly
              className="text-center font-medium bg-gray-50"
            />
          </WebPreviewNavigation>
          
          <WebPreviewBody className="!border-0 !rounded-none">
            <div 
              ref={setNodeRef} 
              className="size-full relative transition-all duration-200 p-0 bg-white"
              style={{
                ...gridStyles,
                minHeight: '400px'
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
                >
                  {activeTabWidgets.map((widget) => (
                    <div key={widget.i} className="relative">
                      <DroppedWidget
                        widget={widget}
                        isSelected={selectedWidgetId === widget.i}
                        onClick={() => handleWidgetClick(widget.i)}
                        onRemove={() => handleRemoveWidget(widget.i)}
                        onEdit={onEditWidget ? () => onEditWidget(widget.i) : undefined}
                      />
                      
                      {/* Selection indicator */}
                      {selectedWidgetId === widget.i && (
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
          </WebPreviewBody>
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