'use client';

import { ResponsiveLine } from '@nivo/line';
import { BaseChartProps } from './types';
import { elegantTheme } from './theme';
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
  enablePoints?: boolean
  pointSize?: number
  curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX'
  enableArea?: boolean
  areaOpacity?: number
  lineWidth?: number
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
  titleFontSize?: number
  titleFontWeight?: number
  titleColor?: string
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

  // Container Border props
  containerBorderWidth?: number
  containerBorderColor?: string
  containerBorderRadius?: number
  containerPadding?: number
  // Container Shadow props
  containerShadowColor?: string
  containerShadowOpacity?: number
  containerShadowBlur?: number
  containerShadowOffsetX?: number
  containerShadowOffsetY?: number
}

export function LineChart({ 
  data, 
  colors,
  backgroundColor,
  backgroundOpacity,
  backgroundGradient,
  backdropFilter,
  borderRadius,
  borderWidth,
  borderColor,
  enableGridX,
  enableGridY,
  enablePoints,
  pointSize,
  curve,
  enableArea,
  areaOpacity,
  lineWidth,
  animate,
  motionConfig,
  margin,
  axisBottom,
  axisLeft,
  legends,
  enablePointLabels,
  pointLabelTextColor,
  // Typography - Title/Subtitle
  title,
  subtitle,
  titleFontSize = 18,
  titleFontWeight = 700,
  titleColor = '#222',
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
  containerBorderRadius,
  containerPadding,
  // Container Shadow props
  containerShadowColor,
  containerShadowOpacity,
  containerShadowBlur,
  containerShadowOffsetX,
  containerShadowOffsetY
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

  // Create advanced background styles
  const getAdvancedBackground = () => {
    // Priority: gradient > backgroundColor with opacity > backgroundColor
    if (backgroundGradient?.enabled) {
      const { type, direction, startColor, endColor } = backgroundGradient
      switch (type) {
        case 'linear':
          return `linear-gradient(${direction}, ${startColor}, ${endColor})`
        case 'radial':
          return `radial-gradient(${direction}, ${startColor}, ${endColor})`
        case 'conic':
          return `conic-gradient(from ${direction}, ${startColor}, ${endColor})`
        default:
          return `linear-gradient(${direction}, ${startColor}, ${endColor})`
      }
    }

    // Apply opacity to backgroundColor if specified
    if (backgroundColor && backgroundOpacity !== undefined) {
      const hex = backgroundColor.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`
    }

    return backgroundColor
  }

  const getBackdropFilter = () => {
    if (backdropFilter?.enabled && backdropFilter?.blur) {
      return `blur(${backdropFilter.blur}px)`
    }
    return undefined
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
      className={containerClassName}
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
          background: getAdvancedBackground(),
          backdropFilter: getBackdropFilter(),
          padding: `${containerPadding || 16}px`,
          margin: '0 auto',
          border: containerBorderWidth ? `${containerBorderWidth}px solid ${containerBorderColor || '#e5e7eb'}` : '1px solid #e5e7eb',
          borderRadius: containerBorderRadius ? `${containerBorderRadius}px` : undefined,
          boxShadow,
        })
      }}
    >
      {title && (
        <h3
          className={titleClassName || undefined}
          style={titleClassName ? {} : {
            margin: `${titleMarginTop ?? 0}px ${titleMarginRight ?? 0}px ${titleMarginBottom ?? 4}px ${titleMarginLeft ?? 0}px`,
            padding: `${titlePaddingTop ?? 0}px ${titlePaddingRight ?? 0}px ${titlePaddingBottom ?? 0}px ${titlePaddingLeft ?? 0}px`,
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
          bottom: margin?.bottom ?? 80,
          left: margin?.left ?? 50
        }}
        xScale={{ type: 'point' }}
        yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
        
        // Linha configurável
        lineWidth={lineWidth ?? 2}
        colors={colors || ['#2563eb']}
        curve={curve || 'cardinal'}
        enableArea={enableArea ?? false}
        areaOpacity={areaOpacity ?? 0.2}
        
        // Pontos configuráveis
        enablePoints={enablePoints ?? true}
        pointSize={pointSize ?? 4}
        pointColor={{ from: 'color' }}
        pointBorderWidth={borderWidth ?? 1}
        pointBorderColor={borderColor || { from: 'serieColor' }}
        
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
          legend: axisLeft.legend,
          legendOffset: axisLeft.legendOffset ?? -40,
          format: (value) => formatValue(Number(value))
        } : {
          tickSize: 0,
          tickPadding: 8,
          tickRotation: 0,
          format: (value) => formatValue(Number(value))
        }}
        
        // Grid configurável
        enableGridX={enableGridX ?? false}
        enableGridY={enableGridY ?? false}
        
        // Interação elegante
        useMesh={true}
        animate={animate ?? false}
        motionConfig={motionConfig || "gentle"}
        theme={elegantTheme}
        
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
                translateY: legends.translateY || 50,
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
              translateY: 50,
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