'use client';

import { ResponsiveLine } from '@nivo/line';
import { BaseChartProps } from './types';
import { elegantTheme } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import type { LegendConfig } from '@/types/apps/chartWidgets';

interface AreaChartProps extends BaseChartProps {
  colors?: string[]
  backgroundColor?: string
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  enableGridX?: boolean
  enableGridY?: boolean
  enableArea?: boolean
  areaOpacity?: number
  lineWidth?: number
  pointSize?: number
  enablePoints?: boolean
  curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX'
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
  titleFontSize?: number
  titleFontWeight?: string | number
  titleColor?: string
  subtitleFontSize?: number
  subtitleFontWeight?: string | number
  subtitleColor?: string
  enablePointLabels?: boolean
  pointLabelTextColor?: string
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

export function AreaChart({ 
  data, 
  xColumn, 
  yColumn, 
  isFullscreen,
  colors,
  backgroundColor,
  borderRadius,
  borderWidth,
  borderColor,
  enableGridX,
  enableGridY,
  enableArea,
  areaOpacity,
  lineWidth,
  pointSize,
  enablePoints,
  curve,
  animate,
  motionConfig,
  margin,
  axisBottom,
  axisLeft,
  legends,
  title,
  subtitle,
  titleFontSize = 18,
  titleFontWeight = 700,
  titleColor = '#222',
  subtitleFontSize = 14,
  subtitleFontWeight = 400,
  subtitleColor = '#6b7280',
  enablePointLabels,
  pointLabelTextColor,
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
}: AreaChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = hex.replace('#', '').match(/.{2}/g);
    return result ? result.map(h => parseInt(h, 16)).join(', ') : '0, 0, 0';
  };

  // Create box shadow style - apply if any shadow property is defined
  const boxShadow = (containerShadowColor || containerShadowOpacity !== undefined || 
                    containerShadowBlur !== undefined || containerShadowOffsetX !== undefined || 
                    containerShadowOffsetY !== undefined)
    ? `${containerShadowOffsetX || 0}px ${containerShadowOffsetY || 4}px ${containerShadowBlur || 8}px rgba(${
        hexToRgb(containerShadowColor || '#000000')
      }, ${containerShadowOpacity || 0.2})`
    : undefined;

  // Debug log
  console.log('🖼️ AreaChart Shadow Debug:', {
    containerShadowColor,
    containerShadowOpacity,
    containerShadowBlur,
    containerShadowOffsetX,
    containerShadowOffsetY,
    boxShadow
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: backgroundColor,
        padding: containerPadding ? `${containerPadding}px` : 0,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        minWidth: 0,
        border: containerBorderWidth ? `${containerBorderWidth}px solid ${containerBorderColor || '#ccc'}` : undefined,
        borderRadius: containerBorderRadius ? `${containerBorderRadius}px` : undefined,
        boxShadow,
      }}
    >
      {title && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '8px',
          fontSize: `${titleFontSize}px`, 
          fontWeight: titleFontWeight, 
          color: titleColor
        }}>
          {title}
        </div>
      )}
      {subtitle && (
        <div style={{ 
          textAlign: 'center', 
          marginBottom: '16px',
          fontSize: `${subtitleFontSize}px`, 
          color: subtitleColor,
          fontWeight: subtitleFontWeight
        }}>
          {subtitle}
        </div>
      )}
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
        yScale={{ type: 'linear', min: 0, max: 'auto' }}
        
        // Área configurável
        enableArea={enableArea ?? true}
        areaOpacity={areaOpacity ?? 0.15}
        lineWidth={lineWidth ?? 2}
        colors={colors || ['#2563eb']}
        curve={curve || 'cardinal'}
        
        // Pontos configuráveis
        enablePoints={enablePoints ?? false}
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
        
        // Eixos limpos (sem linhas)
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
        enableGridY={enableGridY ?? true}
        
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
          
          // Se legends é um objeto com configurações (vindo do ChartWrapper)
          if (legends && typeof legends === 'object') {
            return [
              {
                anchor: legends.anchor || 'bottom',
                direction: legends.direction || 'row',
                justify: false,
                translateX: 0,
                translateY: 70,
                itemsSpacing: legends.itemsSpacing || 20,
                itemWidth: 80,
                itemHeight: 18,
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
            ];
          }
          
          // Se legends for undefined, não mostrar legend
          return [];
        })()}
      />
    </div>
  );
}