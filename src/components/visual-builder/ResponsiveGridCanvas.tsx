'use client';

import { useRef } from 'react';
import WidgetRenderer from './WidgetRenderer';
import type { Widget, GridConfig } from './ConfigParser';

interface ResponsiveGridCanvasProps {
  widgets: Widget[];
  gridConfig: GridConfig;
}

export default function ResponsiveGridCanvas({ widgets, gridConfig }: ResponsiveGridCanvasProps) {
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

  // Adapt widget position for responsive layout
  const adaptWidgetForResponsive = (widget: Widget) => {
    // Calculate span based on widget width
    // Widgets with w >= 6 (half grid or more) take 2 columns on desktop
    // Widgets with w >= 4 take 1 column but can span 2 on tablet
    const desktopSpan = widget.position.w >= 6 ? 2 : 1;
    const tabletSpan = widget.position.w >= 4 ? 2 : 1;
    const mobileSpan = 1; // Always 1 on mobile

    // Calculate order based on position (top-to-bottom, left-to-right)
    const order = widget.position.y * 12 + widget.position.x;

    return {
      desktopSpan,
      tabletSpan,
      mobileSpan,
      order
    };
  };

  // Sort widgets by their calculated order
  const sortedWidgets = [...widgets].sort((a, b) => {
    const orderA = adaptWidgetForResponsive(a).order;
    const orderB = adaptWidgetForResponsive(b).order;
    return orderA - orderB;
  });

  // Generate CSS classes for widget spans
  const getSpanClasses = (widget: Widget): string => {
    const { desktopSpan, tabletSpan, mobileSpan } = adaptWidgetForResponsive(widget);

    return [
      `col-span-${mobileSpan}`,           // Mobile: always 1
      `md:col-span-${tabletSpan}`,        // Tablet: 1 or 2
      `lg:col-span-${desktopSpan}`,       // Desktop: 1 or 2
      'min-h-[200px]',                    // Minimum height
      'transition-all duration-200'        // Smooth transitions
    ].join(' ');
  };

  return (
    <div ref={containerRef} className="w-full h-full">
      {/* Grid container */}
      <div
        className="relative overflow-auto"
        style={{
          minHeight: '600px',
          ...containerStyles,
          border: `${containerStyles.borderWidth} solid ${containerStyles.borderColor}`
        }}
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

        {/* Responsive Grid Layout */}
        {widgets.length > 0 && (
          <div className="
            grid gap-4 p-4
            grid-cols-1
            md:grid-cols-2
            lg:grid-cols-4
            auto-rows-min
          ">
            {sortedWidgets.map((widget) => (
              <div
                key={widget.id}
                className={getSpanClasses(widget)}
              >
                <div className="h-full">
                  <WidgetRenderer widget={widget} />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Layout Info */}
        {widgets.length > 0 && (
          <div className="absolute top-2 right-2 bg-black/20 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
            <span className="hidden lg:inline">4 cols</span>
            <span className="hidden md:inline lg:hidden">2 cols</span>
            <span className="inline md:hidden">1 col</span>
          </div>
        )}
      </div>
    </div>
  );
}