'use client';

import { useRef, useState, useEffect } from 'react';
import { Responsive } from 'react-grid-layout';
import WidgetRenderer from './WidgetRenderer';
import DashboardInCanvasHeader from './DashboardInCanvasHeader';
import type { Widget, GridConfig } from './ConfigParser';
import type { GlobalFilters, DateRangeFilter } from '@/stores/visualBuilderStore';

const ResponsiveGridLayout = Responsive;

// Custom hook to measure container dimensions and calculate auto-scale
const useContainerDimensions = (ref: React.RefObject<HTMLDivElement | null>) => {
  const [dimensions, setDimensions] = useState({ width: 1600, height: 900 });

  useEffect(() => {
    const updateDimensions = () => {
      if (ref.current) {
        const containerWidth = ref.current.clientWidth;
        const containerHeight = ref.current.clientHeight;

        setDimensions({
          width: containerWidth,
          height: containerHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [ref]);

  return dimensions;
};

interface GridCanvasProps {
  widgets: Widget[];
  gridConfig: GridConfig;
  globalFilters?: GlobalFilters;
  onLayoutChange?: (widgets: Widget[]) => void;
  headerTitle?: string;
  headerSubtitle?: string;
  onFilterChange?: (filters: GlobalFilters) => void;
  isFilterLoading?: boolean;
}

export default function GridCanvas({ widgets, gridConfig, globalFilters, onLayoutChange, headerTitle, headerSubtitle, onFilterChange, isFilterLoading }: GridCanvasProps) {
  // Extract theme colors from gridConfig
  const backgroundColor = gridConfig.backgroundColor || '#ffffff';
  const borderColor = gridConfig.borderColor || '#e5e7eb';
  const containerRef = useRef<HTMLDivElement>(null);

  // Advanced container styles with priority system (same as widgets)
  const pad = gridConfig.padding ?? 16;
  const containerStyles = {
    // Background: priority to gradient, fallback to backgroundColor
    background: gridConfig.backgroundGradient?.enabled
      ? `${gridConfig.backgroundGradient.type}-gradient(${gridConfig.backgroundGradient.direction}, ${gridConfig.backgroundGradient.startColor}, ${gridConfig.backgroundGradient.endColor})`
      : backgroundColor,

    // Advanced CSS effects
    opacity: gridConfig.backgroundOpacity,
    backdropFilter: gridConfig.backdropFilter?.enabled
      ? `blur(${gridConfig.backdropFilter.blur}px)`
      : undefined,

    // Border & Shadow
    borderWidth: gridConfig.borderWidth ? `${gridConfig.borderWidth}px` : '1px',
    borderColor: borderColor,
    borderRadius: gridConfig.borderRadius ? `${gridConfig.borderRadius}px` : undefined,
    boxShadow: gridConfig.containerShadowColor
      ? `${gridConfig.containerShadowOffsetX || 0}px ${gridConfig.containerShadowOffsetY || 4}px ${gridConfig.containerShadowBlur || 8}px rgba(${hexToRgb(gridConfig.containerShadowColor)}, ${gridConfig.containerShadowOpacity || 0.1})`
      : undefined,

    // Spacing
    paddingTop: 0,
    paddingLeft: `${pad}px`,
    paddingRight: `${pad}px`,
    paddingBottom: `${pad}px`,
    margin: gridConfig.margin ? `${gridConfig.margin}px` : undefined,
  };

  // Helper function to convert hex to RGB
  function hexToRgb(hex: string): string {
    const result = hex.replace('#', '').match(/.{2}/g);
    return result ? result.map(h => parseInt(h, 16)).join(', ') : '0, 0, 0';
  }
  const { width: containerWidth, height: containerHeight } = useContainerDimensions(containerRef);

  // Fixed grid dimensions
  const GRID_WIDTH = 1600;
  const GRID_HEIGHT = 800;

  // Use fixed values from config
  const configHeight = gridConfig.height || GRID_HEIGHT;
  const dynamicRowHeight = gridConfig.rowHeight;

  // Grid config with fixed dimensions
  const fixedGridConfig = {
    ...gridConfig,
    containerHeight: configHeight
  };

  // Generate layout for react-grid-layout
  const layout = widgets.map(widget => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
    minW: 1,
    minH: 1,
  }));

  const handleLayoutChange = (newLayout: Array<{ i: string; x: number; y: number; w: number; h: number }>) => {
    if (!onLayoutChange) return;

    // Update widgets with new positions
    const updatedWidgets = widgets.map(widget => {
      const layoutItem = newLayout.find(item => item.i === widget.id);
      if (layoutItem) {
        return {
          ...widget,
          position: {
            x: layoutItem.x,
            y: layoutItem.y,
            w: layoutItem.w,
            h: layoutItem.h,
          }
        };
      }
      return widget;
    });

    onLayoutChange(updatedWidgets);
  };

  const headerNode = (
    <DashboardInCanvasHeader
      title={headerTitle || 'Dashboard'}
      subtitle={headerSubtitle}
      currentFilter={globalFilters?.dateRange || { type: 'last_30_days' }}
      onFilterChange={(dateRange: DateRangeFilter) => onFilterChange?.({ dateRange })}
      isLoading={!!isFilterLoading}
      containerPadding={gridConfig.padding ?? 16}
    />
  );

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* Grid container */}
      <div
        className="relative overflow-hidden"
        style={{
          width: containerWidth,
          height: configHeight,
          transformOrigin: 'center',
          ...containerStyles,
          border: `${containerStyles.borderWidth} solid ${containerStyles.borderColor}`
        }}
      >
        {headerNode}
        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-lg font-medium mb-2">No widgets configured</h3>
              <p className="text-sm">Add widgets in the JSON editor to see them here</p>
            </div>
          </div>
        )}

        {/* Grid Layout */}
        {widgets.length > 0 && (
          <ResponsiveGridLayout
            className="layout"
            layouts={{ lg: layout }}
            breakpoints={{ lg: 0 }}
            cols={{ lg: gridConfig.cols }}
            rowHeight={dynamicRowHeight}
            width={containerWidth}
            maxRows={gridConfig.maxRows}
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            margin={[8, 8]}
            containerPadding={[16, 16]}
            useCSSTransforms={true}
            compactType={null}
            preventCollision={true}
            allowOverlap={false}
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetRenderer widget={widget} globalFilters={globalFilters} />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </div>
    </div>
  );
}
