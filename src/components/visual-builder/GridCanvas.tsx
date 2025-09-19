'use client';

import { useRef, useState, useEffect } from 'react';
import { Responsive } from 'react-grid-layout';
import WidgetRenderer from './WidgetRenderer';
import type { Widget, GridConfig } from './ConfigParser';

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
  onLayoutChange?: (widgets: Widget[]) => void;
}

export default function GridCanvas({ widgets, gridConfig, onLayoutChange }: GridCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useContainerDimensions(containerRef);

  // Fixed grid dimensions (16:9 aspect ratio)
  const GRID_WIDTH = 1600;
  const GRID_HEIGHT = 900;

  // Calculate auto-scale based on width to always use 100% width
  let scale = containerWidth / GRID_WIDTH;

  // Calculate height based on rows configuration
  const scaledHeight = gridConfig.maxRows * gridConfig.rowHeight;

  // Ensure minimum scale for usability
  scale = Math.max(scale, 0.1);

  // Use row height from grid config
  const dynamicRowHeight = gridConfig.rowHeight;

  // Grid config with fixed dimensions
  const fixedGridConfig = {
    ...gridConfig,
    containerHeight: GRID_HEIGHT
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

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* Container with calculated height for 16:9 proportion */}
      <div
        className="w-full bg-gray-100"
        style={{
          height: scaledHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Auto-scaled grid container */}
        <div
          className="relative bg-white rounded-lg border border-gray-200 overflow-hidden"
          style={{
            width: containerWidth,
            transformOrigin: 'center'
          }}
        >
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
            rowHeight={dynamicRowHeight * scale}
            width={containerWidth}
            maxRows={gridConfig.maxRows}
            onLayoutChange={handleLayoutChange}
            isDraggable={true}
            isResizable={true}
            margin={[8 * scale, 8 * scale]}
            containerPadding={[16 * scale, 16 * scale]}
            useCSSTransforms={true}
            compactType={null}
            preventCollision={true}
            allowOverlap={false}
          >
            {widgets.map((widget) => (
              <div key={widget.id}>
                <WidgetRenderer widget={widget} />
              </div>
            ))}
          </ResponsiveGridLayout>
        )}

        {/* Grid Info */}
        <div className="absolute bottom-4 right-4 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg">
          Grid: {gridConfig.cols}×{gridConfig.maxRows} | Scale: {Math.round(scale * 100)}%
        </div>
        </div>
      </div>
    </div>
  );
}