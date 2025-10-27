'use client';

import { useRef, useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, UniqueIdentifier } from '@dnd-kit/core';
import { SortableContext, useSortable, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import WidgetRenderer from './WidgetRenderer';
import WidgetEditorModal from './WidgetEditorModal';
import DashboardInCanvasHeader from './DashboardInCanvasHeader';
import type { Widget, GridConfig, LayoutRow, WidgetSpan } from './ConfigParser';
import type { GlobalFilters, DateRangeFilter } from '@/stores/visualBuilderStore';

interface ResponsiveGridCanvasProps {
  widgets: Widget[];
  gridConfig: GridConfig;
  globalFilters?: GlobalFilters;
  viewportMode?: 'desktop' | 'tablet' | 'mobile';
  onLayoutChange?: (widgets: Widget[]) => void;
  headerTitle?: string;
  headerSubtitle?: string;
  onFilterChange?: (filters: GlobalFilters) => void;
  isFilterLoading?: boolean;
}

// Draggable Widget Component
interface DraggableWidgetProps {
  widget: Widget;
  spanClasses: string;
  spanValue: number;
  minHeight: string;
  globalFilters?: GlobalFilters;
  onEdit: (widget: Widget) => void;
}

function DraggableWidget({ widget, spanClasses, spanValue, minHeight, globalFilters, onEdit }: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: `span ${spanValue}`, // CSS Grid native span
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={spanClasses}
    >
      <div
        style={{
          height: minHeight,
          position: 'relative'
        }}
        className="group hover:ring-2 hover:ring-blue-400 rounded-lg transition-all"
      >
        {/* Drag Handle - Left Side */}
        <div
          {...listeners}
          className="absolute left-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-gray-700 text-white px-2 py-1 rounded cursor-grab active:cursor-grabbing"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          ⋮⋮
        </div>

        {/* Edit Button - Right Side */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEdit(widget);
            }}
            className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium hover:bg-blue-700 cursor-pointer"
          >
            ✏️ Editar
          </button>
        </div>

        <WidgetRenderer widget={widget} globalFilters={globalFilters} />
      </div>
    </div>
  );
}

export default function ResponsiveGridCanvas({ widgets, gridConfig, globalFilters, viewportMode = 'desktop', onLayoutChange, headerTitle, headerSubtitle, onFilterChange, isFilterLoading }: ResponsiveGridCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingWidget, setEditingWidget] = useState<Widget | null>(null);

  // Handle widget edit
  const handleEditWidget = (widget: Widget) => {
    setEditingWidget(widget);
  };

  // Handle save widget changes
  const handleSaveWidget = (updatedWidget: Widget) => {
    if (!onLayoutChange) return;

    const updatedWidgets = widgets.map(w =>
      w.id === updatedWidget.id ? updatedWidget : w
    );
    onLayoutChange(updatedWidgets);
  };

  // Extract theme colors from gridConfig
  const backgroundColor = gridConfig.backgroundColor || '#ffffff';
  const borderColor = gridConfig.borderColor || '#e5e7eb';

  // Advanced container styles (same as original GridCanvas)
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
    padding: gridConfig.padding ? `${gridConfig.padding}px` : '16px',
    margin: gridConfig.margin ? `${gridConfig.margin}px` : undefined,
  };

  // Helper function to convert hex to RGB
  function hexToRgb(hex: string): string {
    const result = hex.replace('#', '').match(/.{2}/g);
    return result ? result.map(h => parseInt(h, 16)).join(', ') : '0, 0, 0';
  }

  // Get layout configuration from JSON or use default
  const getLayoutConfig = (): LayoutRow => {
    // If layoutRows are defined in JSON and widget has a row reference, use it
    if (gridConfig.layoutRows && Object.keys(gridConfig.layoutRows).length > 0) {
      // Use the first layout row as default if none specified
      const firstRowKey = Object.keys(gridConfig.layoutRows)[0];
      return gridConfig.layoutRows[firstRowKey];
    }

    // Default fallback layout
    return {
      desktop: 4,
      tablet: 2,
      mobile: 1
    };
  };

  // Adapt widget for responsive layout
  const adaptWidgetForResponsive = (widget: Widget) => {
    let layoutConfig = getLayoutConfig();

    // If widget has a specific row reference, use that layout
    if (widget.row && gridConfig.layoutRows && gridConfig.layoutRows[widget.row]) {
      layoutConfig = gridConfig.layoutRows[widget.row];
    }

    // Use widget's defined spans or calculate from position
    let desktopSpan, tabletSpan, mobileSpan;

    if (widget.span) {
      // Use explicit span configuration
      desktopSpan = widget.span.desktop || 1;
      tabletSpan = widget.span.tablet || 1;
      mobileSpan = widget.span.mobile || 1;
    } else {
      // Fallback: calculate span based on widget width (original logic)
      desktopSpan = widget.position.w >= 6 ? Math.min(2, layoutConfig.desktop) : 1;
      tabletSpan = widget.position.w >= 4 ? Math.min(2, layoutConfig.tablet) : 1;
      mobileSpan = 1; // Always 1 on mobile
    }

    // Use explicit order or calculate from position
    const order = widget.order !== undefined
      ? widget.order
      : widget.position.y * 12 + widget.position.x;

    return {
      desktopSpan,
      tabletSpan,
      mobileSpan,
      order,
      layoutConfig
    };
  };

  // Group widgets by row and sort within each group
  const groupWidgetsByRow = () => {
    const groups: { [key: string]: Widget[] } = {};

    widgets.forEach(widget => {
      const row = widget.row || '1'; // Default to row 1 if no row specified
      if (!groups[row]) groups[row] = [];
      groups[row].push(widget);
    });

    // Sort widgets within each group by order
    Object.keys(groups).forEach(row => {
      groups[row].sort((a, b) => {
        const orderA = adaptWidgetForResponsive(a).order;
        const orderB = adaptWidgetForResponsive(b).order;
        return orderA - orderB;
      });
    });

    return groups;
  };

  const widgetGroups = groupWidgetsByRow();

  // Handle drag end - reorder widgets within the same row
  const handleDragEnd = (event: DragEndEvent, rowKey: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id || !onLayoutChange) return;

    // Find widgets in this row
    const rowWidgets = widgetGroups[rowKey];
    const oldIndex = rowWidgets.findIndex(w => w.id === active.id);
    const newIndex = rowWidgets.findIndex(w => w.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // Reorder widgets in the row
    const reorderedRowWidgets = [...rowWidgets];
    const [movedWidget] = reorderedRowWidgets.splice(oldIndex, 1);
    reorderedRowWidgets.splice(newIndex, 0, movedWidget);

    // Update order values based on new positions
    const updatedRowWidgets = reorderedRowWidgets.map((widget, index) => ({
      ...widget,
      order: index + 1
    }));

    // Merge with widgets from other rows
    const otherWidgets = widgets.filter(w => (w.row || '1') !== rowKey);
    const updatedWidgets = [...otherWidgets, ...updatedRowWidgets];

    // Call parent callback
    onLayoutChange(updatedWidgets);
  };

  // Calculate widget height based on heightPx or fallback logic
  const getWidgetHeight = (widget: Widget): string => {
    // Priority 1: Use explicit heightPx if defined
    if (widget.heightPx) {
      return `${widget.heightPx}px`;
    }

    // Priority 2: Default height by widget type
    if (widget.type === 'kpi') {
      return '140px';
    }

    if (['bar', 'line', 'pie', 'area'].includes(widget.type)) {
      return '500px';
    }

    // Priority 3: Fallback for other widget types
    return '200px';
  };

  // Get span value for widget based on viewportMode
  const getSpanValue = (widget: Widget): number => {
    const { desktopSpan, tabletSpan, mobileSpan } = adaptWidgetForResponsive(widget);

    switch (viewportMode) {
      case 'mobile':
        return mobileSpan;
      case 'tablet':
        return tabletSpan;
      case 'desktop':
      default:
        return desktopSpan;
    }
  };

  // Generate CSS classes for widget (only fixed classes)
  const getSpanClasses = (): string => {
    return 'transition-all duration-200';
  };

  // Get columns value for row based on viewportMode
  const getColumnsValue = (rowKey: string): number => {
    // Get specific layout for this row or use default
    const layoutConfig = gridConfig.layoutRows?.[rowKey] || {
      desktop: 4,
      tablet: 2,
      mobile: 1
    };

    switch (viewportMode) {
      case 'mobile':
        return layoutConfig.mobile;
      case 'tablet':
        return layoutConfig.tablet;
      case 'desktop':
      default:
        return layoutConfig.desktop;
    }
  };

  // Generate grid layout classes for a specific row (only fixed classes)
  const getGridClassesForRow = (): string => {
    return 'grid gap-4 auto-rows-min';
  };

  // Get device-specific styles
  const getDeviceStyles = () => {
    const baseStyles = {
      ...containerStyles,
      border: `${containerStyles.borderWidth} solid ${containerStyles.borderColor}`
    };

    switch (viewportMode) {
      case 'desktop':
        return {
          ...baseStyles,
          width: '100%'
        };
      case 'tablet':
        return {
          ...baseStyles,
          maxWidth: '768px',
          width: '100%',
          margin: '0 auto'
        };
      case 'mobile':
        return {
          ...baseStyles,
          maxWidth: '375px',
          width: '100%',
          margin: '0 auto'
        };
      default:
        return baseStyles;
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      <DashboardInCanvasHeader
        title={headerTitle || 'Dashboard'}
        subtitle={headerSubtitle}
        currentFilter={globalFilters?.dateRange || { type: 'last_30_days' }}
        onFilterChange={(dateRange: DateRangeFilter) => onFilterChange?.({ dateRange })}
        isLoading={!!isFilterLoading}
      />
      {/* Grid container */}
      <div
        className="relative overflow-hidden"
        style={getDeviceStyles()}
      >
        {/* Empty State */}
        {widgets.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-medium mb-2">No widgets configured</h3>
              <p className="text-sm">Add widgets in the JSON editor to see them here</p>
              <p className="text-xs text-gray-400 mt-2">
                This dashboard adapts: 4 columns (desktop) → 2 columns (tablet) → 1 column (mobile)
              </p>
            </div>
          </div>
        )}

        {/* Responsive Grid Layout - Grouped by Rows */}
        {widgets.length > 0 && (
          <div className="p-4 space-y-4">
            {Object.keys(widgetGroups)
              .sort((a, b) => parseInt(a) - parseInt(b)) // Sort rows numerically
              .map((rowKey) => {
                const rowWidgets = widgetGroups[rowKey];
                const widgetIds = rowWidgets.map(w => w.id);

                return (
                  <DndContext
                    key={`dnd-${rowKey}`}
                    collisionDetection={closestCenter}
                    onDragEnd={(event) => handleDragEnd(event, rowKey)}
                  >
                    <SortableContext items={widgetIds} strategy={horizontalListSortingStrategy}>
                      <div
                        className={getGridClassesForRow()}
                        style={{
                          gridTemplateColumns: `repeat(${getColumnsValue(rowKey)}, 1fr)`,
                          width: '100%'
                        }}
                      >
                        {rowWidgets.map((widget) => (
                          <DraggableWidget
                            key={widget.id}
                            widget={widget}
                            spanClasses={getSpanClasses()}
                            spanValue={getSpanValue(widget)}
                            minHeight={getWidgetHeight(widget)}
                            globalFilters={globalFilters}
                            onEdit={handleEditWidget}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                );
              })
            }
          </div>
        )}

      </div>

      {/* Widget Editor Modal */}
      <WidgetEditorModal
        widget={editingWidget}
        isOpen={!!editingWidget}
        onClose={() => setEditingWidget(null)}
        onSave={handleSaveWidget}
      />
    </div>
  );
}
