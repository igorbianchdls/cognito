'use client';

import { ResponsiveLine } from '@nivo/line';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import { createElegantTheme } from './theme';
import type { LegendProps } from '@nivo/legends';
import type { LegendConfig } from '@/types/apps/chartWidgets';

export interface ChartDataItem {
  label: string;
  [key: string]: string | number;
}

export interface StackedLinesChartProps {
  data: ChartDataItem[];
  keys: string[];
  indexBy?: string;
  title?: string;
  subtitle?: string;

  // Colors & Style
  colors?: string[];
  lineWidth?: number;
  enablePoints?: boolean;
  pointSize?: number;
  curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX';
  enableArea?: boolean;
  areaOpacity?: number;

  // Container & Dimensions
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  containerBackground?: string;
  containerOpacity?: number;
  containerBackdropFilter?: string;
  containerBoxShadow?: string;
  containerBorder?: string;
  containerTransform?: string;
  containerTransition?: string;
  containerClassName?: string;
  containerBorderWidth?: number;
  containerBorderColor?: string;
  containerBorderAccentColor?: string;
  containerBorderRadius?: number;
  containerBorderVariant?: 'smooth' | 'accent' | 'none';
  containerPadding?: number;
  backgroundColor?: string;
  backgroundOpacity?: number;
  backgroundGradient?: {
    enabled: boolean;
    type: 'linear' | 'radial' | 'conic';
    direction: string;
    startColor: string;
    endColor: string;
  };
  backdropFilter?: { enabled: boolean; blur: number };

  // Grid & Axes
  enableGridX?: boolean;
  enableGridY?: boolean;
  gridColor?: string;
  gridStrokeWidth?: number;
  axisBottom?: {
    tickSize?: number;
    tickPadding?: number;
    tickRotation?: number;
    legend?: string;
    legendPosition?: 'start' | 'middle' | 'end';
    legendOffset?: number;
    format?: (value: string | number) => string;
  } | null;
  axisLeft?: {
    tickSize?: number;
    tickPadding?: number;
    tickRotation?: number;
    legend?: string;
    legendOffset?: number;
    format?: (value: string | number) => string;
  } | null;

  // Legends
  legends?: readonly LegendProps[] | LegendConfig;
  translateY?: number;

  // Typography - Title
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: number | string;
  titleColor?: string;

  // Typography - Subtitle
  subtitleFontFamily?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: number | string;
  subtitleColor?: string;

  // Spacing - Title/Subtitle
  titleMarginTop?: number;
  titleMarginRight?: number;
  titleMarginBottom?: number;
  titleMarginLeft?: number;
  titlePaddingTop?: number;
  titlePaddingRight?: number;
  titlePaddingBottom?: number;
  titlePaddingLeft?: number;

  subtitleMarginTop?: number;
  subtitleMarginRight?: number;
  subtitleMarginBottom?: number;
  subtitleMarginLeft?: number;
  subtitlePaddingTop?: number;
  subtitlePaddingRight?: number;
  subtitlePaddingBottom?: number;
  subtitlePaddingLeft?: number;

  // Axis typography
  axisTextColor?: string;
  axisFontFamily?: string;
  axisFontSize?: number;
  axisFontWeight?: number;
  axisLegendFontSize?: number;
  axisLegendFontWeight?: number;
  labelsFontFamily?: string;
  labelsFontSize?: number;
  labelsFontWeight?: number;
  labelsTextColor?: string;
  legendsFontFamily?: string;
  legendsFontSize?: number;
  legendsFontWeight?: number;
  legendsTextColor?: string;
  tooltipFontSize?: number;
  tooltipFontFamily?: string;

  // Animation
  animate?: boolean;
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow';

  // Series metadata (key to label mapping)
  seriesMetadata?: Array<{ key: string; label: string; color: string }>;
}

const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 50, left: 50 };

export function StackedLinesChart(props: StackedLinesChartProps) {
  const {
    data,
    keys,
    indexBy = 'label',
    title,
    subtitle,
    colors,
    lineWidth = 2,
    enablePoints = true,
    pointSize = 6,
    curve = 'cardinal',
    enableArea = true,
    areaOpacity = 0.15,
    margin = DEFAULT_MARGIN,
    containerBackground,
    containerOpacity,
    containerBackdropFilter,
    containerBoxShadow,
    containerBorder,
    containerTransform,
    containerTransition,
    containerClassName,
    containerBorderWidth,
    containerBorderColor,
    containerBorderAccentColor,
    containerBorderRadius,
    containerBorderVariant,
    containerPadding,
    backgroundColor = '#fff',
    backgroundOpacity,
    backgroundGradient,
    backdropFilter,
    enableGridX = false,
    enableGridY = true,
    gridColor,
    gridStrokeWidth,
    axisBottom,
    axisLeft,
    legends,
    translateY,
    titleFontFamily,
    titleFontSize = 18,
    titleFontWeight = 700,
    titleColor = '#222',
    subtitleFontFamily,
    subtitleFontSize = 14,
    subtitleFontWeight = 400,
    subtitleColor = '#6b7280',
    titleMarginTop,
    titleMarginRight,
    titleMarginBottom,
    titleMarginLeft,
    titlePaddingTop,
    titlePaddingRight,
    titlePaddingBottom,
    titlePaddingLeft,
    subtitleMarginTop,
    subtitleMarginRight,
    subtitleMarginBottom,
    subtitleMarginLeft,
    subtitlePaddingTop,
    subtitlePaddingRight,
    subtitlePaddingBottom,
    subtitlePaddingLeft,
    axisTextColor,
    axisFontFamily,
    axisFontSize,
    axisFontWeight,
    axisLegendFontSize,
    axisLegendFontWeight,
    labelsFontFamily,
    labelsFontSize,
    labelsFontWeight,
    labelsTextColor,
    legendsFontFamily,
    legendsFontSize,
    legendsFontWeight,
    legendsTextColor,
    tooltipFontSize,
    tooltipFontFamily,
    animate = false,
    motionConfig = 'gentle',
    seriesMetadata
  } = props;

  if (!data || data.length === 0 || !keys || keys.length === 0) {
    return <EmptyState />;
  }

  // Transform table-like data into Nivo Line series
  type LineSerie = { id: string | number; data: Array<{ x: string | number; y: number }> };
  const labelByKey = new Map<string, string>((seriesMetadata || []).map(s => [s.key, s.label]));
  const series: LineSerie[] = keys.map((k) => ({
    id: labelByKey.get(k) ?? k,
    data: data.map((row) => ({ x: String(row[indexBy] ?? row.label), y: Number(row[k] ?? 0) }))
  }));

  // Container styles (same pattern as other charts)
  const containerStyles: React.CSSProperties = {
    background: containerBackground || (
      backgroundGradient?.enabled
        ? `linear-gradient(${backgroundGradient.direction}, ${backgroundGradient.startColor}, ${backgroundGradient.endColor})`
        : backgroundColor
    ),
    opacity: containerOpacity !== undefined ? containerOpacity : backgroundOpacity,
    backdropFilter: containerBackdropFilter || (backdropFilter?.enabled ? `blur(${backdropFilter.blur}px)` : undefined),
    boxShadow: containerBoxShadow,
    transform: containerTransform,
    transition: containerTransition
  };

  // Legend mapping (if provided)
  const keyToLabelMap = seriesMetadata?.reduce((acc, s) => {
    acc[s.key] = s.label;
    return acc;
  }, {} as Record<string, string>) || {};

  return (
    <div
      className={containerClassName || 'relative flex flex-col min-w-0'}
      style={{
        position: 'relative',
        flexDirection: 'column',
        alignItems: 'stretch',
        minWidth: 0,
        height: '100%',
        ...(containerClassName ? {} : {
          ...containerStyles,
          padding: `${containerPadding || 16}px`,
          margin: '0 auto',
          border: containerBorderVariant === 'none'
            ? 'none'
            : (containerBorderWidth !== undefined
                ? (containerBorder ?? `${containerBorderWidth}px solid ${containerBorderColor || '#e5e7eb'}`)
                : (containerBorder ?? `1px solid ${containerBorderColor || '#e5e7eb'}`)),
          borderRadius: containerBorderVariant === 'accent' ? 0 : (containerBorderRadius !== undefined ? `${containerBorderRadius}px` : '12px'),
        })
      }}
    >
      {containerBorderVariant === 'accent' && (
        <>
          <div className="absolute w-3 h-3" style={{ top: '-0.5px', left: '-0.5px', borderTop: `0.5px solid ${containerBorderAccentColor || '#bbb'}`, borderLeft: `0.5px solid ${containerBorderAccentColor || '#bbb'}` }} />
          <div className="absolute w-3 h-3" style={{ top: '-0.5px', right: '-0.5px', borderTop: `0.5px solid ${containerBorderAccentColor || '#bbb'}`, borderRight: `0.5px solid ${containerBorderAccentColor || '#bbb'}` }} />
          <div className="absolute w-3 h-3" style={{ bottom: '-0.5px', left: '-0.5px', borderBottom: `0.5px solid ${containerBorderAccentColor || '#bbb'}`, borderLeft: `0.5px solid ${containerBorderAccentColor || '#bbb'}` }} />
          <div className="absolute w-3 h-3" style={{ bottom: '-0.5px', right: '-0.5px', borderBottom: `0.5px solid ${containerBorderAccentColor || '#bbb'}`, borderRight: `0.5px solid ${containerBorderAccentColor || '#bbb'}` }} />
        </>
      )}

      {title && (
        <h3
          style={{
            margin: `${titleMarginTop ?? 0}px ${titleMarginRight ?? 0}px ${titleMarginBottom ?? 8}px ${titleMarginLeft ?? 0}px`,
            padding: `${titlePaddingTop ?? 0}px ${titlePaddingRight ?? 0}px ${titlePaddingBottom ?? 0}px ${titlePaddingLeft ?? 0}px`,
            fontFamily: titleFontFamily,
            fontSize: `${titleFontSize}px`,
            fontWeight: titleFontWeight,
            color: titleColor
          }}
        >{title}</h3>
      )}

      {subtitle && (
        <div
          style={{
            margin: `${subtitleMarginTop ?? 0}px ${subtitleMarginRight ?? 0}px ${subtitleMarginBottom ?? 16}px ${subtitleMarginLeft ?? 0}px`,
            padding: `${subtitlePaddingTop ?? 0}px ${subtitlePaddingRight ?? 0}px ${subtitlePaddingBottom ?? 0}px ${subtitlePaddingLeft ?? 0}px`,
            fontFamily: subtitleFontFamily,
            fontSize: `${subtitleFontSize}px`,
            color: subtitleColor,
            fontWeight: subtitleFontWeight
          }}
        >{subtitle}</div>
      )}

      <div style={{ flex: 1, height: '100%' }}>
        <ResponsiveLine
          data={series}
          margin={margin}
          enableArea={enableArea}
          areaOpacity={areaOpacity}
          colors={colors}
          lineWidth={lineWidth}
          enablePoints={enablePoints}
          pointSize={pointSize}
          curve={curve}
          xScale={{ type: 'point' }}
          yScale={{ type: 'linear', stacked: true, min: 'auto', max: 'auto' }}
          axisBottom={axisBottom ? {
            tickSize: axisBottom.tickSize ?? 0,
            tickPadding: axisBottom.tickPadding ?? 8,
            tickRotation: axisBottom.tickRotation ?? 0,
            legend: axisBottom.legend,
            legendPosition: axisBottom.legendPosition ?? 'middle',
            legendOffset: axisBottom.legendOffset ?? 36,
            format: axisBottom.format || ((v) => String(v).slice(0, 12))
          } : {
            tickSize: 0,
            tickPadding: 8,
            tickRotation: 0,
            format: (v) => String(v).slice(0, 12)
          }}
          axisLeft={axisLeft ? {
            tickSize: axisLeft.tickSize ?? 0,
            tickPadding: axisLeft.tickPadding ?? 8,
            tickRotation: axisLeft.tickRotation ?? 0,
            legend: axisLeft.legend,
            legendOffset: axisLeft.legendOffset ?? -40,
            format: axisLeft.format || ((v) => formatValue(Number(v)))
          } : {
            tickSize: 0,
            tickPadding: 8,
            tickRotation: 0,
            format: (v) => formatValue(Number(v))
          }}
          enableGridX={enableGridX}
          enableGridY={enableGridY}
          theme={createElegantTheme({
            axisFontFamily,
            axisFontSize,
            axisFontWeight,
            axisTextColor: axisTextColor || '#6b7280',
            axisLegendFontSize,
            axisLegendFontWeight,
            labelsFontFamily,
            labelsFontSize,
            labelsFontWeight,
            labelsTextColor,
            legendsFontFamily,
            legendsFontSize,
            legendsFontWeight,
            legendsTextColor,
            tooltipFontSize,
            tooltipFontFamily,
            gridColor,
            gridStrokeWidth
          })}
          animate={animate}
          motionConfig={motionConfig}
          useMesh={true}
          tooltip={({ point }) => (
            <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-xs">
              <div className="font-medium text-gray-900">{String(point.seriesId)}</div>
              <div className="text-blue-600 font-mono font-medium tabular-nums">{formatValue(Number(point.data.y as number))}</div>
            </div>
          )}
          legends={(() => {
            if (Array.isArray(legends)) return legends;
            if (legends && typeof legends === 'object') {
              const cfg = legends as LegendConfig;
              return [
                {
                  anchor: (cfg.anchor ?? 'bottom') as LegendProps['anchor'],
                  direction: (cfg.direction ?? 'row') as LegendProps['direction'],
                  justify: false,
                  translateX: (cfg.translateX ?? 0),
                  translateY: translateY !== undefined ? translateY : (cfg.translateY ?? 50),
                  itemsSpacing: (cfg.itemsSpacing ?? 20),
                  itemWidth: (cfg.itemWidth ?? 80),
                  itemHeight: (cfg.itemHeight ?? 18),
                  itemDirection: (cfg.itemDirection ?? 'left-to-right') as LegendProps['itemDirection'],
                  itemOpacity: 0.8,
                  symbolSize: (cfg.symbolSize ?? 12),
                  symbolShape: (cfg.symbolShape ?? 'circle') as LegendProps['symbolShape'],
                  effects: [{ on: 'hover' as const, style: { itemOpacity: 1 } }]
                }
              ];
            }
            return [
              {
                anchor: 'bottom' as const,
                direction: 'row' as const,
                justify: false,
                translateX: 0,
                translateY: translateY !== undefined ? translateY : 50,
                itemsSpacing: 20,
                itemWidth: 80,
                itemHeight: 18,
                itemDirection: 'left-to-right' as const,
                itemOpacity: 0.8,
                symbolSize: 12,
                symbolShape: 'circle' as const,
                effects: [{ on: 'hover' as const, style: { itemOpacity: 1 } }]
              }
            ];
          })()}
        />
      </div>
    </div>
  );
}

export default StackedLinesChart;
