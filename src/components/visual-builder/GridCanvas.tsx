'use client';

import WidgetPreview from './WidgetPreview';
import type { Widget } from './ConfigParser';

interface GridCanvasProps {
  widgets: Widget[];
}

export default function GridCanvas({ widgets }: GridCanvasProps) {

  // Grid settings
  const GRID_COLS = 12;
  const GRID_ROWS = 12;
  const CELL_SIZE = 60; // pixels
  const GAP = 8; // pixels

  return (
    <div className="relative w-full h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Grid Background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: `${CELL_SIZE + GAP}px ${CELL_SIZE + GAP}px`,
          backgroundPosition: `${GAP/2}px ${GAP/2}px`
        }}
      />

      {/* Grid Container */}
      <div
        className="relative p-2"
        style={{
          width: GRID_COLS * (CELL_SIZE + GAP) + GAP,
          height: GRID_ROWS * (CELL_SIZE + GAP) + GAP,
          minWidth: '100%',
          minHeight: '100%'
        }}
      >
        {/* Widgets */}
        {widgets.map((widget) => {
          const style = {
            position: 'absolute' as const,
            left: widget.position.x * (CELL_SIZE + GAP) + GAP,
            top: widget.position.y * (CELL_SIZE + GAP) + GAP,
            width: widget.position.w * (CELL_SIZE + GAP) - GAP,
            height: widget.position.h * (CELL_SIZE + GAP) - GAP,
            zIndex: 10
          };

          return (
            <div key={widget.id} style={style}>
              <WidgetPreview widget={widget} />
            </div>
          );
        })}

        {/* Grid Info */}
        <div className="absolute bottom-4 right-4 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg">
          Grid: {GRID_COLS}×{GRID_ROWS} | Widgets: {widgets.length}
        </div>
      </div>

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
    </div>
  );
}