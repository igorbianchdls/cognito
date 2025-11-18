'use client';

import { ResponsiveBar, BarLegendProps } from '@nivo/bar';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import { createElegantTheme } from './theme';

export interface PivotSeriesMeta { key: string; label: string; color: string }

export interface PivotBarChartProps {
  items: Array<{ label: string; [key: string]: string | number }>
  keys: string[]
  seriesMetadata: PivotSeriesMeta[]

  title?: string
  subtitle?: string
  layout?: 'vertical' | 'horizontal'
  groupMode?: 'grouped' | 'stacked'
  margin?: { top?: number; right?: number; bottom?: number; left?: number }

  // Grid & Axis
  enableGridX?: boolean
  enableGridY?: boolean
  gridColor?: string
  gridStrokeWidth?: number
  axisBottom?: { tickSize?: number; tickPadding?: number; tickRotation?: number; legend?: string; legendPosition?: 'start' | 'middle' | 'end'; legendOffset?: number }
  axisLeft?: { tickSize?: number; tickPadding?: number; tickRotation?: number; legend?: string; legendOffset?: number }

  // Legends
  legends?: readonly BarLegendProps[]
  showLegend?: boolean
  translateY?: number

  // Styling
  borderRadius?: number
  borderWidth?: number
  borderColor?: string | { from: string; modifiers: Array<[string, number]> }
  padding?: number
  innerPadding?: number

  // Container styling (compat com outros charts)
  containerBackground?: string
  containerOpacity?: number
  containerBackdropFilter?: string
  containerFilter?: string
  containerBoxShadow?: string
  containerBorder?: string
  containerTransform?: string
  containerTransition?: string
  containerClassName?: string
  containerBorderWidth?: number
  containerBorderColor?: string
  containerBorderAccentColor?: string
  containerBorderRadius?: number
  containerBorderVariant?: 'smooth' | 'accent' | 'none'
  containerPadding?: number

  backgroundColor?: string
  backgroundOpacity?: number
  backgroundGradient?: { enabled: boolean; type: 'linear' | 'radial' | 'conic'; direction: string; startColor: string; endColor: string }
  backdropFilter?: { enabled: boolean; blur: number }

  // Typography
  titleFontFamily?: string
  titleFontSize?: number
  titleFontWeight?: number | string
  titleColor?: string
  subtitleFontFamily?: string
  subtitleFontSize?: number
  subtitleFontWeight?: number | string
  subtitleColor?: string
  axisTextColor?: string

  // Events
  onBarClick?: (category: string, seriesKey?: string) => void
}

const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 50, left: 50 };

export function PivotBarChart(props: PivotBarChartProps) {
  const {
    items,
    keys,
    seriesMetadata,
    title,
    subtitle,
    layout = 'vertical',
    groupMode = 'grouped',
    margin = DEFAULT_MARGIN,
    enableGridX = false,
    enableGridY = true,
    gridColor,
    gridStrokeWidth,
    axisBottom,
    axisLeft,
    legends,
    translateY,
    borderRadius = 4,
    borderWidth = 0,
    borderColor,
    padding = 0.2,
    innerPadding = 2,
    containerBackground,
    containerOpacity,
    containerBackdropFilter,
    containerFilter,
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
    titleFontFamily,
    titleFontSize = 18,
    titleFontWeight = 700,
    titleColor = '#222',
    subtitleFontFamily,
    subtitleFontSize = 14,
    subtitleFontWeight = 400,
    subtitleColor = '#6b7280',
    axisTextColor,
    onBarClick
  } = props;

  if (!items || items.length === 0) return <EmptyState />;

  const containerStyles: React.CSSProperties = {
    background: containerBackground || (
      backgroundGradient?.enabled
        ? `linear-gradient(${backgroundGradient.direction}, ${backgroundGradient.startColor}, ${backgroundGradient.endColor})`
        : backgroundColor
    ),
    opacity: containerOpacity !== undefined ? containerOpacity : backgroundOpacity,
    backdropFilter: containerBackdropFilter || (backdropFilter?.enabled ? `blur(${backdropFilter.blur}px)` : undefined),
    filter: containerFilter,
    boxShadow: containerBoxShadow,
    transform: containerTransform,
    transition: containerTransition
  };

  // Nivo theme
  const theme = createElegantTheme({ axisTextColor: axisTextColor || '#6b7280', gridColor, gridStrokeWidth })

  // Legend config: prefer provided legends; else build from metadata
  const autoLegends: readonly BarLegendProps[] = [
    {
      dataFrom: 'keys',
      anchor: 'bottom',
      direction: 'row',
      justify: false,
      translateX: 0,
      translateY: translateY !== undefined ? translateY : 50,
      itemsSpacing: 20,
      itemWidth: 80,
      itemHeight: 18,
      itemDirection: 'left-to-right',
      itemOpacity: 0.8,
      symbolSize: 12,
      symbolShape: 'circle',
      effects: [{ on: 'hover' as const, style: { itemOpacity: 1 } }]
    }
  ];

  // Build custom label mapping
  const keyToLabel = seriesMetadata.reduce((acc, s) => { acc[s.key] = s.label; return acc; }, {} as Record<string, string>);
  const keyToColor = seriesMetadata.reduce((acc, s) => { acc[s.key] = s.color; return acc; }, {} as Record<string, string>);

  return (
    <div
      className={containerClassName || 'relative flex flex-col min-w-0'}
      style={{
        position: 'relative', flexDirection: 'column', alignItems: 'stretch', minWidth: 0, height: '100%',
        ...(containerClassName ? {} : {
          ...containerStyles,
          padding: `${containerPadding || 16}px`,
          margin: '0 auto',
          border: containerBorderVariant === 'none'
            ? 'none'
            : (containerBorderWidth !== undefined
                ? (containerBorder || `${containerBorderWidth}px solid ${containerBorderColor || '#e5e7eb'}`)
                : (containerBorder || `1px solid ${containerBorderColor || '#e5e7eb'}`)),
          borderRadius: containerBorderVariant === 'accent' ? 0 : (containerBorderRadius !== undefined ? `${containerBorderRadius}px` : '12px'),
        })
      }}
    >
      {/* Corner accents for 'accent' variant (like KPI) */}
      {containerBorderVariant === 'accent' && (
        <>
          <div className="absolute w-3 h-3" style={{ top: '-0.5px', left: '-0.5px', borderTop: `0.5px solid ${containerBorderAccentColor || '#bbb'}`, borderLeft: `0.5px solid ${containerBorderAccentColor || '#bbb'}` }} />
          <div className="absolute w-3 h-3" style={{ top: '-0.5px', right: '-0.5px', borderTop: `0.5px solid ${containerBorderAccentColor || '#bbb'}`, borderRight: `0.5px solid ${containerBorderAccentColor || '#bbb'}` }} />
          <div className="absolute w-3 h-3" style={{ bottom: '-0.5px', left: '-0.5px', borderBottom: `0.5px solid ${containerBorderAccentColor || '#bbb'}`, borderLeft: `0.5px solid ${containerBorderAccentColor || '#bbb'}` }} />
          <div className="absolute w-3 h-3" style={{ bottom: '-0.5px', right: '-0.5px', borderBottom: `0.5px solid ${containerBorderAccentColor || '#bbb'}`, borderRight: `0.5px solid ${containerBorderAccentColor || '#bbb'}` }} />
        </>
      )}
      {title && (
        <h3 style={{
          margin: `0 0 8px 0`,
          fontFamily: titleFontFamily,
          fontSize: `${titleFontSize}px`,
          fontWeight: titleFontWeight,
          color: titleColor
        }}>{title}</h3>
      )}
      {subtitle && (
        <div style={{
          margin: `0 0 16px 0`,
          fontFamily: subtitleFontFamily,
          fontSize: `${subtitleFontSize}px`,
          fontWeight: subtitleFontWeight,
          color: subtitleColor
        }}>{subtitle}</div>
      )}

      <div style={{ flex: 1, height: '100%' }}>
        <ResponsiveBar
          data={items}
          keys={keys}
          indexBy={'label'}
          layout={layout}
          groupMode={groupMode}
          margin={margin}
          padding={padding}
          innerPadding={innerPadding}
          colors={({ id }) => keyToColor[String(id)] || '#2563eb'}
          borderRadius={borderRadius}
          // @ts-expect-error nivo type mismatch
          borderColor={borderColor || { from: 'color', modifiers: [['darker', 0.3]] }}
          borderWidth={borderWidth}
          axisTop={null}
          axisRight={null}
          axisBottom={axisBottom ? {
            tickSize: axisBottom.tickSize ?? 0,
            tickPadding: axisBottom.tickPadding ?? 8,
            tickRotation: axisBottom.tickRotation ?? 0,
            legend: axisBottom.legend,
            legendPosition: axisBottom.legendPosition ?? 'middle',
            legendOffset: axisBottom.legendOffset ?? 46,
            format: layout === 'horizontal' ? (v) => formatValue(Number(v)) : (v) => String(v).slice(0, 12)
          } : {
            tickSize: 0, tickPadding: 8, tickRotation: 0,
            format: layout === 'horizontal' ? (v) => formatValue(Number(v)) : (v) => String(v).slice(0, 12)
          }}
          axisLeft={axisLeft ? {
            tickSize: axisLeft.tickSize ?? 0,
            tickPadding: axisLeft.tickPadding ?? 8,
            tickRotation: axisLeft.tickRotation ?? 0,
            legend: axisLeft.legend,
            legendOffset: axisLeft.legendOffset ?? -40,
            format: layout === 'horizontal' ? (v) => String(v).slice(0, 12) : (v) => formatValue(Number(v))
          } : {
            tickSize: 0, tickPadding: 8, tickRotation: 0,
            format: layout === 'horizontal' ? (v) => String(v).slice(0, 12) : (v) => formatValue(Number(v))
          }}
          enableGridX={enableGridX}
          enableGridY={enableGridY}
          theme={theme}
          tooltip={({ id, value, indexValue }) => (
            <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-xs">
              <div className="font-medium text-gray-900">{keyToLabel[String(id)] || id}</div>
              <div className="text-blue-600 font-mono font-medium tabular-nums">{formatValue(Number(value))}</div>
              <div className="text-gray-500 mt-1">{String(indexValue)}</div>
            </div>
          )}
          legends={props.showLegend === false ? undefined : (legends || autoLegends)}
          onClick={(d) => onBarClick && onBarClick(String(d.indexValue), String(d.id))}
        />
      </div>
    </div>
  );
}

export default PivotBarChart;
