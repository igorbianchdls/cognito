'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { useStore } from '@nanostores/react'
import { useDroppable } from '@dnd-kit/core'
import { Responsive, WidthProvider } from 'react-grid-layout'
import DroppedWidget from './DroppedWidget'
import { $selectedWidgetId, widgetActions } from '@/stores/widgetStore'
import { $canvasConfig } from '@/stores/canvasStore' // Canvas customization store
import type { DroppedWidget as DroppedWidgetType, LayoutItem } from '@/types/widget'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface GridCanvasProps {
  widgets: DroppedWidgetType[]
  onLayoutChange: (layout: LayoutItem[]) => void
  onRemoveWidget: (widgetId: string) => void
  onEditWidget?: (widgetId: string) => void
}

export default function GridCanvas({ 
  widgets, 
  onLayoutChange, 
  onRemoveWidget,
  onEditWidget
}: GridCanvasProps) {
  const selectedWidgetId = useStore($selectedWidgetId)
  const canvasConfig = useStore($canvasConfig)
  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-droppable'
  })

  // State for container width measurement
  const [containerWidth, setContainerWidth] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleWidgetClick = (widgetId: string) => {
    widgetActions.selectWidget(widgetId)
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
    <div ref={containerRef} className="h-full flex flex-col">

      {/* Grid Container */}
      <div 
        ref={setNodeRef}
        style={canvasStyles}
        className={`border-2 border-dashed relative transition-colors p-3 bg-white ${
          (canvasConfig.canvasMode === 'fixed' || containerWidth > 768) ? '' : 'flex-1'
        } ${
          isOver 
            ? 'border-blue-500' 
            : 'border-gray-300'
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
          isDraggable={true}
          isResizable={true}
          margin={canvasConfig.margin}
          containerPadding={canvasConfig.containerPadding}
          useCSSTransforms={true}
          compactType={null}
          preventCollision={true}
          allowOverlap={false}
          autoSize={false}
          maxRows={12}
        >
          {widgets.map((widget) => (
            <div 
              key={widget.i}
              onClick={() => handleWidgetClick(widget.i)}
              className={`cursor-pointer transition-all ${
                selectedWidgetId === widget.i 
                  ? 'ring-2 ring-blue-500 ring-opacity-50' 
                  : ''
              }`}
            >
              <DroppedWidget 
                widget={widget} 
                onRemove={() => onRemoveWidget(widget.i)}
                onEdit={onEditWidget ? () => onEditWidget(widget.i) : undefined}
                isSelected={selectedWidgetId === widget.i}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  )
}