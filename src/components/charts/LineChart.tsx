'use client';

import { ResponsiveLine } from '@nivo/line';
import { BaseChartProps } from './types';
import { elegantTheme, createElegantTheme } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import type { LegendConfig } from '@/types/apps/chartWidgets';

interface LineChartProps extends BaseChartProps {
  colors?: string[]
  backgroundColor?: string
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  enableGridX?: boolean
  enableGridY?: boolean
  gridColor?: string
  gridStrokeWidth?: number
  enablePoints?: boolean
  pointSize?: number
  curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX'
  enableArea?: boolean
  areaOpacity?: number
  lineWidth?: number
  lineColor?: string
  pointColor?: string
  pointBorderColor?: string
  axisTextColor?: string
  animate?: boolean
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow'
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  axisBottom?: {
    legend?: string
    legendPosition?: 'start' | 'middle' | 'end'
    legendOffset?: number
    tickRotation?: number
    tickSize?: number
    tickPadding?: number
  }
  axisLeft?: {
    legend?: string
    legendOffset?: number
    tickRotation?: number
    tickSize?: number
    tickPadding?: number
  }
  legends?: LegendConfig | Record<string, unknown>[]
  enablePointLabels?: boolean
  pointLabelTextColor?: string

  // Typography - Title/Subtitle
  titleFontFamily?: string
  titleFontSize?: number
  titleFontWeight?: number
  titleColor?: string
  subtitleFontFamily?: string
  subtitleFontSize?: number
  subtitleFontWeight?: number
  subtitleColor?: string

  // Spacing - Title/Subtitle
  titleMarginTop?: number
  titleMarginRight?: number
  titleMarginBottom?: number
  titleMarginLeft?: number
  titlePaddingTop?: number
  titlePaddingRight?: number
  titlePaddingBottom?: number
  titlePaddingLeft?: number

  subtitleMarginTop?: number
  subtitleMarginRight?: number
  subtitleMarginBottom?: number
  subtitleMarginLeft?: number
  subtitlePaddingTop?: number
  subtitlePaddingRight?: number
  subtitlePaddingBottom?: number
  subtitlePaddingLeft?: number

  // Tailwind Classes - Title/Subtitle (precedence over individual props)
  titleClassName?: string
  subtitleClassName?: string
  containerClassName?: string

  // Background Advanced
  backgroundOpacity?: number
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

  // Container Glass Effect & Modern Styles
  containerBackground?: string           // background (gradients, rgba, solid colors)
  containerOpacity?: number             // opacity (0-1)
  containerBackdropFilter?: string      // backdrop-filter (blur, saturate, etc)
  containerBoxShadow?: string           // box-shadow (shadows, glow effects)

  // Container Border props
  containerBorderWidth?: number
  containerBorderColor?: string
  containerBorderAccentColor?: string
  containerBorderRadius?: number
  containerPadding?: number
  // Container Shadow props
  containerShadowColor?: string
  containerShadowOpacity?: number
  containerShadowBlur?: number
  containerShadowOffsetX?: number
  containerShadowOffsetY?: number

  // Positioning
  translateY?: number
  marginBottom?: number
}

export function LineChart({
  data,
  colors,
  backgroundColor,
  backgroundOpacity,
  backgroundGradient,
  backdropFilter,
  // Container Glass Effect & Modern Styles
  containerBackground,
  containerOpacity,
  containerBackdropFilter,
  containerBoxShadow,
  borderRadius,
  borderWidth,
  borderColor,
  enableGridX,
  enableGridY,
  gridColor,
  gridStrokeWidth,
  enablePoints,
  pointSize,
  curve,
  enableArea,
  areaOpacity,
  lineWidth,
  lineColor,
  pointColor,
  pointBorderColor,
  animate,
  motionConfig,
  margin,
  axisBottom,
  axisLeft,
  legends,
  enablePointLabels,
  pointLabelTextColor,
  axisTextColor,
  // Typography - Title/Subtitle
  title,
  subtitle,
  titleFontFamily,
  titleFontSize = 18,
  titleFontWeight = 700,
  titleColor = '#222',
  subtitleFontFamily,
  subtitleFontSize = 14,
  subtitleFontWeight = 400,
  subtitleColor = '#6b7280',
  // Spacing - Title/Subtitle
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
  // Container Shadow props
  containerShadowColor,
  containerShadowOpacity,
  containerShadowBlur,
  containerShadowOffsetX,
  containerShadowOffsetY,
  // Positioning props
  translateY,
  marginBottom
}: LineChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = hex.replace('#', '').match(/.{2}/g);
    return result ? result.map(h => parseInt(h, 16)).join(', ') : '0, 0, 0';
  };

  // Create box shadow style - apply custom shadow or default KPI shadow
  const hasCustomShadow = containerShadowColor || containerShadowOpacity !== undefined || 
                         containerShadowBlur !== undefined || containerShadowOffsetX !== undefined || 
                         containerShadowOffsetY !== undefined;
  
  const boxShadow = hasCustomShadow
    ? `${containerShadowOffsetX || 0}px ${containerShadowOffsetY || 2}px ${containerShadowBlur || 4}px rgba(${
        hexToRgb(containerShadowColor || '#000000')
      }, ${containerShadowOpacity || 0.1})`
    : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';

  // Container styles with priority system (same as BarChart)
  const containerStyles = {
    // Background: priority to new containerBackground, fallback to old backgroundColor
    background: containerBackground || (
      backgroundGradient?.enabled
        ? `linear-gradient(${backgroundGradient.direction}, ${backgroundGradient.startColor}, ${backgroundGradient.endColor})`
        : backgroundColor
    ),

    // Direct CSS props - simple and predictable
    opacity: containerOpacity !== undefined ? containerOpacity : backgroundOpacity,
    backdropFilter: containerBackdropFilter || (backdropFilter?.enabled ? `blur(${backdropFilter.blur}px)` : undefined),
    // boxShadow: containerBoxShadow, // Commented out
  }

  // Debug log
  console.log('🖼️ LineChart Shadow Debug:', {
    containerShadowColor,
    containerShadowOpacity,
    containerShadowBlur,
    containerShadowOffsetX,
    containerShadowOffsetY,
    boxShadow
  });

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
          ...containerStyles,
          padding: `${containerPadding || 16}px`,
          margin: '0 auto',
          border: `0.5px solid ${containerBorderColor || '#777'}`, // Corner accent border
          // border: containerBorderWidth ? `${containerBorderWidth}px solid ${containerBorderColor || '#e5e7eb'}` : '1px solid #e5e7eb', // Commented out
          // borderRadius: containerBorderRadius ? `${containerBorderRadius}px` : undefined, // Commented for corner accent effect
          // Fallback shadow if containerBoxShadow not provided
          // boxShadow: containerBoxShadow || boxShadow, // Commented out
        })
      }}
    >
      {/* Corner accents - positioned outside to overlay border */}
      <div
        className="absolute w-3 h-3"
        style={{
          top: '-0.5px',
          left: '-0.5px',
          borderTop: `0.5px solid ${containerBorderAccentColor || '#bbb'}`,
          borderLeft: `0.5px solid ${containerBorderAccentColor || '#bbb'}`
        }}
      ></div>
      <div
        className="absolute w-3 h-3"
        style={{
          top: '-0.5px',
          right: '-0.5px',
          borderTop: `0.5px solid ${containerBorderAccentColor || '#bbb'}`,
          borderRight: `0.5px solid ${containerBorderAccentColor || '#bbb'}`
        }}
      ></div>
      <div
        className="absolute w-3 h-3"
        style={{
          bottom: '-0.5px',
          left: '-0.5px',
          borderBottom: `0.5px solid ${containerBorderAccentColor || '#bbb'}`,
          borderLeft: `0.5px solid ${containerBorderAccentColor || '#bbb'}`
        }}
      ></div>
      <div
        className="absolute w-3 h-3"
        style={{
          bottom: '-0.5px',
          right: '-0.5px',
          borderBottom: `0.5px solid ${containerBorderAccentColor || '#bbb'}`,
          borderRight: `0.5px solid ${containerBorderAccentColor || '#bbb'}`
        }}
      ></div>

      {title && (
        <h3
          className={titleClassName || undefined}
          style={titleClassName ? {} : {
            margin: `${titleMarginTop ?? 0}px ${titleMarginRight ?? 0}px ${titleMarginBottom ?? 4}px ${titleMarginLeft ?? 0}px`,
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
            margin: `${subtitleMarginTop ?? 0}px ${subtitleMarginRight ?? 0}px ${subtitleMarginBottom ?? 16}px ${subtitleMarginLeft ?? 0}px`,
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
          height: '100%'
        }}
      >
        <div style={{ height: '100%', width: '100%', overflow: 'hidden' }}>
          <ResponsiveLine
        data={[
          {
            id: 'series',
            data: data.map(item => ({
              x: item.x || item.label || 'Unknown',
              y: item.y || item.value || 0
            }))
          }
        ]}
        // Margins configuráveis
        margin={{
          top: margin?.top ?? 12,
          right: margin?.right ?? 12,
          bottom: marginBottom !== undefined ? marginBottom : (margin?.bottom ?? 0),
          left: margin?.left ?? 50
        }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        
        // Linha configurável
        lineWidth={lineWidth ?? 2}
        colors={lineColor ? [lineColor] : colors || ['#2563eb']}
        curve={curve || 'cardinal'}
        enableArea={enableArea ?? false}
        areaOpacity={areaOpacity ?? 0.2}
        
        // Pontos configuráveis
        enablePoints={enablePoints ?? true}
        pointSize={pointSize ?? 4}
        pointColor={pointColor ? pointColor : { from: 'color' }}
        pointBorderWidth={borderWidth ?? 1}
        pointBorderColor={pointBorderColor ? pointBorderColor : borderColor || { from: 'serieColor' }}
        
        // Labels nos pontos
        enablePointLabel={enablePointLabels ?? false}
        pointLabelYOffset={-12}
        // @ts-expect-error - Nivo library type incompatibility
        pointLabel={(point) => point.data.y}
        pointLabelColor={pointLabelTextColor || '#374151'}
        
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
          format: (value) => value.toString().slice(0, 8)
        } : {
          tickSize: 0,
          tickPadding: 8,
          tickRotation: 0,
          format: (value) => value.toString().slice(0, 8)
        }}
        axisLeft={axisLeft ? {
          tickSize: axisLeft.tickSize ?? 0,
          tickPadding: axisLeft.tickPadding ?? 8,
          tickRotation: axisLeft.tickRotation ?? 0,
          tickValues: 8,
          legend: axisLeft.legend,
          legendOffset: axisLeft.legendOffset ?? -40,
          format: (value) => formatValue(Number(value))
        } : {
          tickSize: 0,
          tickPadding: 8,
          tickRotation: 0,
          tickValues: 8,
          format: (value) => formatValue(Number(value))
        }}
        
        // Grid configurável
        enableGridX={enableGridX ?? false}
        enableGridY={enableGridY ?? false}
        
        // Interação elegante
        useMesh={true}
        animate={animate ?? false}
        motionConfig={motionConfig || "gentle"}
        theme={createElegantTheme({
          axisTextColor: axisTextColor || '#6b7280',
          gridColor,
          gridStrokeWidth
        })}
        
        // Tooltip elegante
        tooltip={({ point }) => (
          <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-xs">
            <div className="font-medium text-gray-900">{point.data.x}</div>
            <div className="text-blue-600 font-mono font-medium tabular-nums">
              {formatValue(Number(point.data.y))}
            </div>
          </div>
        )}
        
        // Legendas configuráveis
        // @ts-expect-error - Nivo legend type compatibility
        legends={(() => {
          // Se legends é array, usar diretamente
          if (Array.isArray(legends)) {
            return legends as Record<string, unknown>[];
          }
          
          // Se legends é LegendConfig, converter para LineLegendProps[]
          if (legends && typeof legends === 'object' && 'enabled' in legends) {
            return legends.enabled !== false ? [
              {
                anchor: legends.anchor || 'bottom',
                direction: legends.direction || 'row',
                justify: false,
                translateX: legends.translateX || 0,
                translateY: translateY !== undefined ? translateY : (legends.translateY || 0),
                itemsSpacing: legends.itemsSpacing || 20,
                itemWidth: legends.itemWidth || 80,
                itemHeight: legends.itemHeight || 18,
                itemDirection: 'left-to-right',
                itemOpacity: 0.8,
                symbolSize: legends.symbolSize || 12,
                symbolShape: legends.symbolShape || 'circle',
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1
                    }
                  }
                ]
              }
            ] : [];
          }
          
          // Configuração padrão se legends não especificado
          return [
            {
              anchor: 'bottom',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: translateY !== undefined ? translateY : 0,
              itemsSpacing: 20,
              itemWidth: 80,
              itemHeight: 18,
              itemDirection: 'left-to-right',
              itemOpacity: 0.8,
              symbolSize: 12,
              symbolShape: 'circle',
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
        })()}
          />
        </div>
      </div>
    </div>
  );
}