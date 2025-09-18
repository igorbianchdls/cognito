'use client';

import { Responsive } from 'react-grid-layout';
import WidgetRenderer from './WidgetRenderer';
import type { Widget } from './ConfigParser';

const ResponsiveGridLayout = Responsive;

interface GridCanvasProps {
  widgets: Widget[];
  onLayoutChange?: (widgets: Widget[]) => void;
}

export default function GridCanvas({ widgets, onLayoutChange }: GridCanvasProps) {

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
    <div className="relative w-full h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
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
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          width={1600}
          maxRows={12}
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
              <WidgetRenderer widget={widget} />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      {/* Grid Info */}
      <div className="absolute bottom-4 right-4 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg">
        Grid: 12×12 | Widgets: {widgets.length}
      </div>
    </div>
  );
}