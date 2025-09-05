'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { useDroppable } from '@dnd-kit/core'
import { Responsive, WidthProvider } from 'react-grid-layout'
import DroppedWidget from './DroppedWidget'
import { $selectedKPI, kpiActions } from '@/stores/apps/kpiStore'
import { $selectedTable, tableActions } from '@/stores/apps/tableStore'
import { $selectedBarChart, barChartActions } from '@/stores/apps/barChartStore'
import { $canvasConfig } from '@/stores/apps/canvasStore' // Canvas customization store
import { WebPreview, WebPreviewNavigation, WebPreviewUrl, WebPreviewNavigationButton } from '@/components/ai-elements/web-preview'
import { savedDashboardActions } from '@/stores/apps/savedDashboardStore'
import { Eye, Save, Download, Settings, Share, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DroppedWidget as DroppedWidgetType, LayoutItem } from '@/types/apps/droppedWidget'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface GridCanvasProps {
  widgets: DroppedWidgetType[]
  onLayoutChange: (layout: LayoutItem[]) => void
  onRemoveWidget: (widgetId: string) => void
  onEditWidget?: (widgetId: string) => void
  readOnly?: boolean
  noBorder?: boolean
}

export default function GridCanvas({ 
  widgets, 
  onLayoutChange, 
  onRemoveWidget,
  onEditWidget,
  readOnly = false,
  noBorder = false
}: GridCanvasProps) {
  const selectedKPI = useStore($selectedKPI)
  const selectedTable = useStore($selectedTable)
  const selectedBarChart = useStore($selectedBarChart)
  const canvasConfig = useStore($canvasConfig)
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable'
  })

  // State for container width measurement
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // States to control drag/resize interactions
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)

  const handleWidgetClick = (widgetId: string) => {
    // Find the widget to determine its type
    const widget = widgets.find(w => w.i === widgetId)
    
    if (widget?.type === 'kpi') {
      // Clear other selections and select KPI
      console.log('🎯 Selecting KPI:', widgetId)
      tableActions.selectTable(null)
      barChartActions.selectBarChart(null)
      kpiActions.selectKPI(widgetId)
    } else if (widget?.type === 'table') {
      // Clear other selections and select table
      console.log('📋 Selecting Table:', widgetId)
      kpiActions.selectKPI(null)
      barChartActions.selectBarChart(null)
      tableActions.selectTable(widgetId)
    } else if (widget?.type === 'chart-bar') {
      // Clear other selections and select bar chart
      console.log('📊 Selecting BarChart:', widgetId)
      kpiActions.selectKPI(null)
      tableActions.selectTable(null)
      barChartActions.selectBarChart(widgetId)
    }
    // Support for KPIs, Tables, and Charts - unified selection
  }

  // Navigation button handlers
  const handlePreview = () => {
    // Enter fullscreen preview mode
    const canvasElement = containerRef.current
    if (canvasElement && canvasElement.requestFullscreen) {
      canvasElement.requestFullscreen()
    }
    console.log('Preview dashboard - entering fullscreen')
  }

  const handleSave = () => {
    // Use the same save functionality as the header button
    savedDashboardActions.promptAndSave()
  }

  const handleExport = () => {
    // Export dashboard as JSON file
    const dashboardData = {
      widgets,
      canvasConfig,
      exportDate: new Date().toISOString(),
      title: 'My Dashboard Export'
    }
    
    const dataStr = JSON.stringify(dashboardData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const link = document.createElement('a')
    link.href = URL.createObjectURL(dataBlob)
    link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    console.log('Dashboard exported as JSON file')
  }

  const handleSettings = () => {
    // TODO: Open canvas settings panel/modal
    console.log('Open canvas settings - this could open a settings modal')
    alert('Canvas Settings - This feature will be implemented with a settings modal')
  }

  // Effect to measure container width for 16:9 calculation
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

  // Calculate height for responsive mode in desktop
  const calculateResponsiveHeight = useMemo(() => {
    if (canvasConfig.canvasMode === 'responsive' && containerWidth > 768) {
      // Priority: 16:12 ratio > manual height > auto
      if (canvasConfig.maintain16by9) {
        return Math.floor(containerWidth * 0.75) // 12/16 = 0.75
      } else if (typeof canvasConfig.responsiveHeight === 'number') {
        return canvasConfig.responsiveHeight // manual height
      } else if (canvasConfig.responsiveHeight === 'viewport') {
        return Math.max(400, window.innerHeight - 200) // viewport - space for headers
      }
      // 'auto' or fallback
      return null
    }
    return null // Mobile/tablet: maintain current behavior
  }, [containerWidth, canvasConfig.canvasMode, canvasConfig.maintain16by9, canvasConfig.responsiveHeight])

  const layout = useMemo(() => {
    console.log('[GRID] Recalculando layout - widgets:', widgets.length)
    widgets.forEach(w => console.log('[GRID] Widget', w.i, 'posição no store:', { x: w.x, y: w.y, w: w.w, h: w.h }))
    
    return widgets.map(widget => ({
      i: widget.i,
      x: widget.x,
      y: widget.y,
      w: widget.w,
      h: widget.h,
      minW: 1,
      minH: 1,
    }))
  }, [widgets])

  // Generate canvas styles based on configuration
  // Applies user-customized background, dimensions, and styling
  const canvasStyles = useMemo(() => {
    const styles: React.CSSProperties = {
      backgroundColor: canvasConfig.backgroundColor,
      borderRadius: `${canvasConfig.borderRadius}px`,
      overflow: canvasConfig.overflow,
    }

    // Background image
    if (canvasConfig.backgroundImage) {
      styles.backgroundImage = `url(${canvasConfig.backgroundImage})`
      styles.backgroundSize = canvasConfig.backgroundSize
      styles.backgroundPosition = canvasConfig.backgroundPosition
      styles.backgroundRepeat = canvasConfig.backgroundRepeat
    }

    // Canvas dimensions
    if (canvasConfig.canvasMode === 'fixed') {
      if (canvasConfig.width !== 'auto' && canvasConfig.width !== '100%') {
        styles.width = typeof canvasConfig.width === 'number' ? `${canvasConfig.width}px` : canvasConfig.width
      }
      if (canvasConfig.height !== 'auto' && canvasConfig.height !== '100vh') {
        styles.height = typeof canvasConfig.height === 'number' ? `${canvasConfig.height}px` : canvasConfig.height
      }
    }

    // Min/max constraints and responsive height control
    if (calculateResponsiveHeight && canvasConfig.canvasMode === 'responsive') {
      // Apply calculated height for desktop responsive mode
      styles.height = `${calculateResponsiveHeight}px`
      // Don't apply minHeight to allow exact height control
    } else if (canvasConfig.canvasMode !== 'fixed') {
      // Apply minHeight only in responsive mode without specific height
      styles.minHeight = `${canvasConfig.minHeight}px`
    }
    if (canvasConfig.maxWidth) {
      styles.maxWidth = `${canvasConfig.maxWidth}px`
    }

    // Box shadow
    if (canvasConfig.boxShadow) {
      styles.boxShadow = '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
    }

    return styles
  }, [canvasConfig])

  // Generate responsive breakpoints for react-grid-layout
  const responsiveBreakpoints = useMemo(() => ({
    lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0
  }), [])

  const responsiveCols = useMemo(() => ({
    lg: canvasConfig.breakpoints.lg,
    md: canvasConfig.breakpoints.md,
    sm: canvasConfig.breakpoints.sm,
    xs: canvasConfig.breakpoints.xs,
    xxs: canvasConfig.breakpoints.xxs
  }), [canvasConfig.breakpoints])

  return (
    <div ref={containerRef} className="flex flex-col">
      <WebPreview 
        defaultUrl="dashboard-canvas"
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
            value="https://dashboard.app/canvas/my-dashboard" 
            readOnly
            className="text-sm bg-gray-50"
          />
          
          <WebPreviewNavigationButton tooltip="Export Dashboard" onClick={handleExport}>
            <Download className="h-6 w-6" />
          </WebPreviewNavigationButton>
          
          <WebPreviewNavigationButton tooltip="Canvas Settings" onClick={handleSettings}>
            <Settings className="h-6 w-6" />
          </WebPreviewNavigationButton>
        </WebPreviewNavigation>
        
        {/* Canvas direto dentro do WebPreview, sem iframe */}
        <div 
          ref={setNodeRef}
          style={{...canvasStyles, height: '880px'}}
          className={`relative transition-colors p-0 bg-white ${
            (canvasConfig.canvasMode === 'fixed' || containerWidth > 768) ? '' : ''
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
            breakpoints={responsiveBreakpoints}
            cols={responsiveCols}
            rowHeight={canvasConfig.rowHeight}
            onLayoutChange={onLayoutChange}
            isDraggable={!readOnly}
            isResizable={!readOnly}
            margin={canvasConfig.margin}
            containerPadding={canvasConfig.containerPadding}
            useCSSTransforms={true}
            compactType={null}
            preventCollision={true}
            allowOverlap={false}
            autoSize={false}
            maxRows={12}
            draggableCancel=".widget-button, button, .table-resizer, .table-interactive, [data-draggable=false]"
            onDragStart={() => {
              console.log('🎯 GridCanvas: Drag started')
              setIsDragging(true)
            }}
            onDragStop={(layout) => {
              console.log('🎯 GridCanvas: Drag stopped', layout)
              setIsDragging(false)
              onLayoutChange(layout)
            }}
            onResizeStart={() => {
              console.log('📏 GridCanvas: Resize started')
              setIsResizing(true)
            }}
            onResizeStop={(layout) => {
              console.log('📏 GridCanvas: Resize stopped', layout)
              setIsResizing(false)
              onLayoutChange(layout)
            }}
          >
            {widgets.map((widget) => (
              <div 
                key={widget.i}
                onClick={() => handleWidgetClick(widget.i)}
                className={`cursor-pointer transition-all ${
                  (widget.type === 'kpi' && selectedKPI?.i === widget.i) ||
                  (widget.type === 'table' && selectedTable?.i === widget.i) ||
                  (widget.type === 'chart-bar' && selectedBarChart?.id === widget.i)
                    ? 'ring-2 ring-blue-500 ring-opacity-50' 
                    : ''
                }`}
              >
                <DroppedWidget 
                  widget={widget} 
                  onRemove={() => onRemoveWidget(widget.i)}
                  onEdit={onEditWidget ? () => onEditWidget(widget.i) : undefined}
                  isSelected={
                    (widget.type === 'kpi' && selectedKPI?.i === widget.i) ||
                    (widget.type === 'table' && selectedTable?.i === widget.i) ||
                    (widget.type === 'chart-bar' && selectedBarChart?.id === widget.i)
                  }
                />
              </div>
            ))}
          </ResponsiveGridLayout>
        </div>
      </WebPreview>
    </div>
  )
}