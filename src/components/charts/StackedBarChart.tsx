'use client';

import { ResponsiveBar, BarDatum, ComputedDatum, BarLegendProps } from '@nivo/bar';
import { OrdinalColorScaleConfig } from '@nivo/colors';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import { createElegantTheme } from './theme';
import type { LegendConfig } from '@/types/apps/chartWidgets';

export interface ChartData {
  label: string;
  [key: string]: string | number; // Para suporte a múltiplas séries
}

export interface StackedBarChartProps {
  data: ChartData[];
  xColumn?: string;
  yColumn?: string;
  isFullscreen?: boolean;
  title?: string;
  subtitle?: string;

  // Container & Dimensions
  width?: number;
  height?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  rowHeight?: number;
  gridHeight?: number;
  minHeight?: number;

  // Layout & Spacing
  padding?: number;
  innerPadding?: number;
  borderRadius?: number;
  groupMode?: 'stacked'; // Sempre stacked
  layout?: 'horizontal' | 'vertical';

  // Colors & Style
  colors?: OrdinalColorScaleConfig<ComputedDatum<BarDatum>> | string;
  barColor?: string;
  borderColor?: string | { from: string; modifiers: Array<[string, number]> };
  borderWidth?: number;

  // Container Glass Effect & Modern Styles (Props do fundo/container do chart)
  containerBackground?: string;
  containerOpacity?: number;
  containerBackdropFilter?: string;
  containerFilter?: string;
  containerBoxShadow?: string;
  containerBorder?: string;
  containerTransform?: string;
  containerTransition?: string;

  // Bar Visual Effects - CSS Only
  barOpacity?: number;
  barHoverOpacity?: number;
  borderOpacity?: number;

  // Bar CSS Filters
  barBrightness?: number;
  barSaturate?: number;
  barContrast?: number;
  barBlur?: number;
  barBoxShadow?: string;

  // Hover CSS Effects
  hoverBrightness?: number;
  hoverSaturate?: number;
  hoverScale?: number;
  hoverBlur?: number;

  // CSS Transitions
  transitionDuration?: string;
  transitionEasing?: string;

  // Scales
  valueScale?: { type: 'linear' | 'symlog' };
  indexScale?: { type: 'band'; round?: boolean };

  // Grid
  enableGridX?: boolean;
  enableGridY?: boolean;
  gridColor?: string;
  gridStrokeWidth?: number;

  // Axes Configuration
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
  axisTop?: {
    tickSize?: number;
    tickPadding?: number;
    tickRotation?: number;
    legend?: string;
    legendPosition?: 'start' | 'middle' | 'end';
    legendOffset?: number;
  } | null;
  axisRight?: {
    tickSize?: number;
    tickPadding?: number;
    tickRotation?: number;
    legend?: string;
    legendOffset?: number;
    format?: (value: number) => string;
  } | null;

  // Labels
  enableLabel?: boolean;
  labelTextColor?: string | { from: string; modifiers: Array<[string, number]> };
  labelSkipWidth?: number;
  labelSkipHeight?: number;
  labelFormat?: string | ((value: number) => string);
  labelPosition?: 'start' | 'middle' | 'end';
  labelOffset?: number;

  // Totals
  enableTotals?: boolean;
  totalsOffset?: number;

  // Legends
  legends?: readonly BarLegendProps[] | LegendConfig;

  // Animation
  animate?: boolean;
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow';

  // Typography - Title
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;

  // Typography - Subtitle
  subtitleFontFamily?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: string | number;
  subtitleColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  backgroundGradient?: {
    enabled: boolean
    type: 'linear' | 'radial' | 'conic'
    direction: string
    startColor: string
    endColor: string
  }
  backdropFilter?: {
    enabled: boolean
    blur: number
  }

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

  // Tailwind Classes - Title/Subtitle
  titleClassName?: string;
  subtitleClassName?: string;
  containerClassName?: string;

  // Typography - Axis
  axisFontFamily?: string;
  axisFontSize?: number;
  axisFontWeight?: number;
  axisTextColor?: string;
  axisLegendFontSize?: number;
  axisLegendFontWeight?: number;

  // Typography - Labels
  labelsFontFamily?: string;
  labelsFontSize?: number;
  labelsFontWeight?: number;
  labelsTextColor?: string;

  // Typography - Legends
  legendsFontFamily?: string;
  legendsFontSize?: number;
  legendsFontWeight?: number;
  legendsTextColor?: string;

  // Typography - Tooltip
  tooltipFontSize?: number;
  tooltipFontFamily?: string;

  // Container Border
  containerBorderWidth?: number;
  containerBorderColor?: string;
  containerBorderAccentColor?: string;
  containerBorderRadius?: number;
  containerBorderVariant?: 'smooth' | 'accent' | 'none';
  containerPadding?: number;

  // Container Shadow
  containerShadowColor?: string;
  containerShadowOpacity?: number;
  containerShadowBlur?: number;
  containerShadowOffsetX?: number;
  containerShadowOffsetY?: number;

  // Positioning
  translateY?: number;
  marginBottom?: number;

  // Advanced
  theme?: object;
  tooltip?: (data: { id: string; value: number }) => React.ReactNode;
  keys?: string[];
  indexBy?: string;

  // Series Label (for dynamic legend)
  seriesLabel?: string;

  // Series metadata (key to label mapping)
  seriesMetadata?: Array<{ key: string; label: string; color: string }>;
}

// Valores padrão robustos e flexíveis
const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 50, left: 50 };
const DEFAULT_ENABLE_GRID_X = false;
const DEFAULT_ENABLE_GRID_Y = false;
const DEFAULT_TRANSLATE_Y = 40;

export function StackedBarChart(props: StackedBarChartProps) {
  const {
    data,
    margin = DEFAULT_MARGIN,
    enableGridX = DEFAULT_ENABLE_GRID_X,
    enableGridY = DEFAULT_ENABLE_GRID_Y,
    gridColor,
    gridStrokeWidth,
    title,
    subtitle,
    seriesLabel,
    // Typography - Title
    titleFontFamily,
    titleFontSize = 18,
    titleFontWeight = 700,
    titleColor = '#222',
    // Typography - Subtitle
    subtitleFontFamily,
    subtitleFontSize = 14,
    subtitleFontWeight = 400,
    subtitleColor = '#6b7280',
    backgroundColor = '#fff',
    backgroundOpacity,
    backgroundGradient,
    backdropFilter,
    // Configurable props
    colors,
    barColor,
    borderRadius,
    borderWidth,
    borderColor,
    // Container Glass Effect & Modern Styles
    containerBackground,
    containerOpacity,
    containerBackdropFilter,
    containerFilter,
    containerBoxShadow,
    containerBorder,
    containerTransform,
    containerTransition,

    // Bar Visual Effects - CSS Only
    barOpacity,
    barHoverOpacity,
    borderOpacity,

    // Bar CSS Filters
    barBrightness,
    barSaturate,
    barContrast,
    barBlur,
    barBoxShadow,

    // Hover CSS Effects
    hoverBrightness,
    hoverSaturate,
    hoverScale,
    hoverBlur,

    // CSS Transitions
    transitionDuration,
    transitionEasing,
    padding,
    layout,
    enableLabel,
    labelPosition,
    labelSkipWidth,
    labelSkipHeight,
    labelTextColor,
    labelFormat,
    labelOffset,
    animate,
    motionConfig,
    axisBottom,
    axisLeft,
    legends,
    // Typography props
    axisFontFamily,
    axisFontSize,
    axisFontWeight,
    axisTextColor,
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
    // Spacing props - Title/Subtitle
    titleMarginTop,
    titleMarginBottom,
    titleMarginLeft,
    titlePaddingTop,
    titlePaddingRight,
    titlePaddingBottom,
    titlePaddingLeft,
    subtitleMarginTop,
    subtitleMarginBottom,
    subtitleMarginLeft,
    subtitlePaddingTop,
    subtitlePaddingRight,
    subtitlePaddingBottom,
    subtitlePaddingLeft,
    // Tailwind Classes - Title/Subtitle
    titleClassName = "",
    subtitleClassName = "",
    containerClassName = "",
    // Container Border props
    containerBorderWidth,
    containerBorderColor,
    containerBorderAccentColor,
    containerBorderRadius,
    containerPadding,
    containerBorderVariant,
    // Positioning props
    translateY,
    marginBottom,
    keys,
    indexBy,
    seriesMetadata
  } = props;

  // Debug: Log do que StackedBarChart recebe
  console.log('📊 STACKED BAR CHART recebeu:', {
    componentType: 'StackedBarChart',
    hasData: !!data,
    dataLength: data?.length || 0,
    firstItem: data?.[0],
    keys,
    props: { title, subtitle }
  });

  if (!data || data.length === 0) {
    console.log('📊 STACKED BAR CHART: Retornando EmptyState');
    return <EmptyState />;
  }

  // Para stacked bar chart, esperamos que os dados já venham formatados com múltiplas keys
  // Exemplo: [{ label: 'Jan', series1: 100, series2: 200 }, ...]
  const chartData = data;

  // Create mapping from keys to labels for legend formatting
  const keyToLabelMap = seriesMetadata?.reduce((acc, series) => {
    acc[series.key] = series.label;
    return acc;
  }, {} as Record<string, string>) || {};

  // Inverter dados automaticamente para layout horizontal (maior valor no topo)
  const finalData = layout === 'horizontal' ? [...chartData].reverse() : chartData;

  // Build bar CSS filters directly
  const barCSSFilters = [
    barBrightness !== undefined && `brightness(${barBrightness})`,
    barSaturate !== undefined && `saturate(${barSaturate})`,
    barContrast !== undefined && `contrast(${barContrast})`,
    barBlur !== undefined && `blur(${barBlur}px)`
  ].filter(Boolean).join(' ') || undefined;

  // Build hover CSS filters directly
  const hoverCSSFilters = [
    hoverBrightness !== undefined && `brightness(${hoverBrightness})`,
    hoverSaturate !== undefined && `saturate(${hoverSaturate})`,
    hoverBlur !== undefined && `blur(${hoverBlur}px)`
  ].filter(Boolean).join(' ') || undefined;

  // Container styles - ALL DIRECT
  const containerStyles = {
    // Background: priority to new containerBackground, fallback to old backgroundColor
    background: containerBackground || (
      backgroundGradient?.enabled
        ? `linear-gradient(${backgroundGradient.direction}, ${backgroundGradient.startColor}, ${backgroundGradient.endColor})`
        : backgroundColor
    ),

    // Direct CSS props
    opacity: containerOpacity !== undefined ? containerOpacity : backgroundOpacity,
    backdropFilter: containerBackdropFilter || (backdropFilter?.enabled ? `blur(${backdropFilter.blur}px)` : undefined),
    filter: containerFilter,
    transform: containerTransform,
    transition: containerTransition || (transitionDuration ? `all ${transitionDuration} ${transitionEasing || 'ease-in-out'}` : undefined),
  };

  return (
    <div
      className={`${containerClassName} relative`}
      style={{
        // Propriedades essenciais SEMPRE aplicadas
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        minWidth: 0,
        // Propriedades condicionais (só quando não há containerClassName)
        ...(containerClassName ? {} : {
          // Apply all container styles directly
          ...containerStyles,

          // Override with specific props if provided (backwards compatibility)
          padding: `${containerPadding || 16}px`,
          margin: '0 auto',
          border: containerBorderVariant === 'none'
            ? 'none'
            : (containerBorderWidth !== undefined
                ? `${containerBorderWidth}px solid ${containerBorderColor || '#e5e7eb'}`
                : `1px solid ${containerBorderColor || '#e5e7eb'}`),
          borderRadius: containerBorderVariant === 'accent' ? 0 : (containerBorderRadius !== undefined ? `${containerBorderRadius}px` : '12px'),
        })
      }}
    >
      {/* Corner accents - only for accent variant */}
      {containerBorderVariant === 'accent' && (
      <div
        className="absolute w-3 h-3"
        style={{
          top: '-0.5px',
          left: '-0.5px',
          borderTop: `0.5px solid ${containerBorderAccentColor || '#bbb'}`,
          borderLeft: `0.5px solid ${containerBorderAccentColor || '#bbb'}`
        }}
      ></div>)}
      {containerBorderVariant === 'accent' && (<div
        className="absolute w-3 h-3"
        style={{
          top: '-0.5px',
          right: '-0.5px',
          borderTop: `0.5px solid ${containerBorderAccentColor || '#bbb'}`,
          borderRight: `0.5px solid ${containerBorderAccentColor || '#bbb'}`
        }}
      ></div>)}
      {containerBorderVariant === 'accent' && (<div
        className="absolute w-3 h-3"
        style={{
          bottom: '-0.5px',
          left: '-0.5px',
          borderBottom: `0.5px solid ${containerBorderAccentColor || '#bbb'}`,
          borderLeft: `0.5px solid ${containerBorderAccentColor || '#bbb'}`
        }}
      ></div>)}
      {containerBorderVariant === 'accent' && (<div
        className="absolute w-3 h-3"
        style={{
          bottom: '-0.5px',
          right: '-0.5px',
          borderBottom: `0.5px solid ${containerBorderAccentColor || '#bbb'}`,
          borderRight: `0.5px solid ${containerBorderAccentColor || '#bbb'}`
        }}
      ></div>)}
      {title && (
        <h3
          className={titleClassName || undefined}
          style={titleClassName ? {} : {
            margin: `${titleMarginTop ?? 0}px 0px ${titleMarginBottom ?? 4}px ${titleMarginLeft ?? 0}px`,
            padding: `${titlePaddingTop ?? 0}px ${titlePaddingRight ?? 0}px ${titlePaddingBottom ?? 0}px ${titlePaddingLeft ?? 0}px`,
            fontFamily: titleFontFamily,
            fontSize: `${titleFontSize ?? 18}px`,
            fontWeight: titleFontWeight ?? 700,
            color: titleColor ?? '#222'
          }}
        >
          {title}
        </h3>
      )}
      {subtitle && (
        <div
          className={subtitleClassName || undefined}
          style={subtitleClassName ? {} : {
            margin: `${subtitleMarginTop ?? 0}px 0px ${subtitleMarginBottom ?? 16}px ${subtitleMarginLeft ?? 0}px`,
            padding: `${subtitlePaddingTop ?? 0}px ${subtitlePaddingRight ?? 0}px ${subtitlePaddingBottom ?? 0}px ${subtitlePaddingLeft ?? 0}px`,
            fontFamily: subtitleFontFamily,
            fontSize: `${subtitleFontSize ?? 14}px`,
            color: subtitleColor ?? '#6b7280',
            fontWeight: subtitleFontWeight ?? 400
          }}
        >
          {subtitle}
        </div>
      )}

      <div
        style={{
          flex: 1,
          height: '100%',
          filter: barCSSFilters,
          boxShadow: barBoxShadow,
          transition: transitionDuration ? `all ${transitionDuration} ${transitionEasing || 'ease-in-out'}` : undefined,
        }}
        onMouseEnter={(e) => {
          if (hoverScale !== undefined) {
            e.currentTarget.style.transform = `scale(${hoverScale})`;
          }
          if (hoverCSSFilters) {
            e.currentTarget.style.filter = hoverCSSFilters;
          }
        }}
        onMouseLeave={(e) => {
          if (hoverScale !== undefined) {
            e.currentTarget.style.transform = 'scale(1)';
          }
          e.currentTarget.style.filter = barCSSFilters || '';
        }}
      >
        <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
          <ResponsiveBar
          data={finalData}
          keys={keys || [seriesLabel || 'value']}
          indexBy={indexBy || "label"}

          // Layout configurável - SEMPRE STACKED
          layout={layout || 'vertical'}
          groupMode="stacked"

          // Margins com espaço para legenda na parte inferior
          margin={marginBottom !== undefined ? { ...margin, bottom: marginBottom } : margin}
          padding={padding ?? 0.2}

          // Cores configuráveis
          colors={barColor ? [barColor] : colors || ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']}
          fillOpacity={barOpacity}

          // Bordas configuráveis
          borderRadius={borderRadius ?? 4}
          // @ts-expect-error - Nivo library type incompatibility
          borderColor={borderColor || { from: 'color', modifiers: [['darker', 0.3]] }}
          borderWidth={borderWidth ?? 0}

          // Eixos configuráveis
          axisTop={null}
          axisRight={null}
          axisBottom={axisBottom ? {
            tickSize: axisBottom.tickSize ?? 0,
            tickPadding: axisBottom.tickPadding ?? 8,
            tickRotation: axisBottom.tickRotation ?? 0,
            legend: axisBottom.legend,
            legendPosition: axisBottom.legendPosition ?? 'middle',
            legendOffset: axisBottom.legendOffset ?? 46,
            format: axisBottom.format || (layout === 'horizontal'
              ? (value) => formatValue(Number(value))  // Numbers for horizontal
              : (value) => value.toString().slice(0, 10) // Strings for vertical
            )
          } : {
            tickSize: 0,
            tickPadding: 8,
            tickRotation: 0,
            format: layout === 'horizontal'
              ? (value) => formatValue(Number(value))
              : (value) => value.toString().slice(0, 10)
          }}
          axisLeft={axisLeft ? {
            tickSize: axisLeft.tickSize ?? 0,
            tickPadding: axisLeft.tickPadding ?? 8,
            tickRotation: axisLeft.tickRotation ?? 0,
            tickValues: 8,
            legend: axisLeft.legend,
            legendOffset: axisLeft.legendOffset ?? -40,
            format: axisLeft.format || (layout === 'horizontal'
              ? (value) => value.toString().slice(0, 10) // Strings for horizontal
              : (value) => formatValue(Number(value)) // Numbers for vertical
            )
          } : {
            tickSize: 0,
            tickPadding: 8,
            tickRotation: 0,
            tickValues: 8,
            format: layout === 'horizontal'
              ? (value) => value.toString().slice(0, 10)
              : (value) => formatValue(Number(value))
          }}

          // Grid configurável
          enableGridX={enableGridX}
          enableGridY={enableGridY}

          // Labels configuráveis
          enableLabel={enableLabel ?? false}
          labelPosition={labelPosition || 'middle'}
          labelSkipWidth={labelSkipWidth ?? 0}
          labelSkipHeight={labelSkipHeight ?? 0}
          // @ts-expect-error - Nivo library type incompatibility
          labelTextColor={labelTextColor || '#374151'}

          animate={animate ?? false}
          motionConfig={motionConfig || "gentle"}
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

          // Tooltip elegante
          tooltip={({ id, value }) => (
            <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-xs">
              <div className="font-medium text-gray-900">{keyToLabelMap[String(id)] || id}</div>
              <div className="text-blue-600 font-mono font-medium tabular-nums">
                {formatValue(Number(value))}
              </div>
            </div>
          )}

          // Legendas configuráveis
          legends={(() => {
            // Se legends é array (BarLegendProps[]), usar diretamente
            if (Array.isArray(legends)) {
              return legends;
            }

            // Se legends é LegendConfig, converter para BarLegendProps[]
            if (legends && typeof legends === 'object' && !Array.isArray(legends)) {
              // Type guard para LegendConfig
              const legendConfig = legends as Record<string, unknown>;

              return [
                {
                  dataFrom: 'keys' as const,
                  anchor: legendConfig.anchor || 'bottom',
                  direction: legendConfig.direction || 'row',
                  justify: false,
                  translateX: legendConfig.translateX || 0,
                  translateY: translateY !== undefined ? translateY : (legendConfig.translateY || DEFAULT_TRANSLATE_Y),
                  itemsSpacing: legendConfig.itemsSpacing || 20,
                  itemWidth: legendConfig.itemWidth || 80,
                  itemHeight: legendConfig.itemHeight || 18,
                  itemDirection: legendConfig.itemDirection || 'left-to-right',
                  itemOpacity: 0.8,
                  symbolSize: legendConfig.symbolSize || 12,
                  symbolShape: legendConfig.symbolShape || 'circle',
                  effects: [
                    {
                      on: 'hover',
                      style: {
                        itemOpacity: 1
                      }
                    }
                  ]
                }
              ];
            }

            // Configuração padrão se legends não especificado
            const baseLegendConfig = {
              dataFrom: 'keys' as const,
              anchor: 'bottom' as const,
              direction: 'row' as const,
              justify: false,
              translateX: 0,
              translateY: translateY !== undefined ? translateY : DEFAULT_TRANSLATE_Y,
              itemsSpacing: 20,
              itemWidth: 80,
              itemHeight: 18,
              itemDirection: 'left-to-right' as const,
              itemOpacity: 0.8,
              symbolSize: 12,
              symbolShape: 'circle' as const,
              effects: [
                {
                  on: 'hover' as const,
                  style: {
                    itemOpacity: 1
                  }
                }
              ]
            };

            // If we have series metadata, use custom data to show proper labels
            if (seriesMetadata && seriesMetadata.length > 0) {
              return [{
                ...baseLegendConfig,
                data: seriesMetadata.map((series) => ({
                  id: series.key,
                  label: series.label,
                  color: series.color
                }))
              }];
            }

            return [baseLegendConfig];
          })()}
          />
        </div>
      </div>
    </div>
  );
}
