'use client';

import { useRef } from 'react';
import WidgetRenderer from './WidgetRenderer';
import type { Widget, GridConfig, LayoutRow, WidgetSpan } from './ConfigParser';

interface ResponsiveGridCanvasProps {
  widgets: Widget[];
  gridConfig: GridConfig;
  viewportMode?: 'desktop' | 'tablet' | 'mobile';
}

export default function ResponsiveGridCanvas({ widgets, gridConfig, viewportMode = 'desktop' }: ResponsiveGridCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Calculate widget height based on heightPx or fallback logic
  const getWidgetHeight = (widget: Widget): string => {
    // Priority 1: Use explicit heightPx if defined
    if (widget.heightPx) {
      return `${widget.heightPx}px`;
    }

    // Priority 2: Use position.h with grid conversion (h * rowHeight)
    if (widget.position?.h && gridConfig.rowHeight) {
      return `${widget.position.h * gridConfig.rowHeight}px`;
    }

    // Priority 3: Default minimum height
    return '200px';
  };

  // Generate CSS classes for widget spans based on viewportMode
  const getSpanClasses = (widget: Widget): string => {
    const { desktopSpan, tabletSpan, mobileSpan } = adaptWidgetForResponsive(widget);

    // Use viewportMode to determine span instead of CSS breakpoints
    let span: number;
    switch (viewportMode) {
      case 'mobile':
        span = mobileSpan;
        break;
      case 'tablet':
        span = tabletSpan;
        break;
      case 'desktop':
      default:
        span = desktopSpan;
        break;
    }

    return [
      `col-span-${span}`,
      'transition-all duration-200'        // Smooth transitions
    ].join(' ');
  };

  // Generate grid layout classes for a specific row
  const getGridClassesForRow = (rowKey: string): string => {
    let layoutConfig = getLayoutConfig();

    // Get specific layout for this row if available
    if (gridConfig.layoutRows && gridConfig.layoutRows[rowKey]) {
      layoutConfig = gridConfig.layoutRows[rowKey];
    }

    // Use viewportMode to determine columns instead of CSS breakpoints
    let columns: number;
    switch (viewportMode) {
      case 'mobile':
        columns = layoutConfig.mobile;
        break;
      case 'tablet':
        columns = layoutConfig.tablet;
        break;
      case 'desktop':
      default:
        columns = layoutConfig.desktop;
        break;
    }

    return [
      'grid gap-4 auto-rows-min',
      `grid-cols-${columns}`
    ].join(' ');
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
              .map((rowKey) => (
                <div key={`row-${rowKey}`} className={getGridClassesForRow(rowKey)}>
                  {widgetGroups[rowKey].map((widget) => (
                    <div
                      key={widget.id}
                      className={getSpanClasses(widget)}
                      style={{
                        height: 'auto',
                        minHeight: getWidgetHeight(widget)
                      }}
                    >
                      <WidgetRenderer widget={widget} />
                    </div>
                  ))}
                </div>
              ))
            }
          </div>
        )}

      </div>
    </div>
  );
}