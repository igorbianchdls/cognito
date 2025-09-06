'use client';

import { ResponsiveLine } from '@nivo/line';
import { BaseChartProps } from './types';
import { nivoTheme } from './theme';
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
    tickRotation?: number
    tickSize?: number
    tickPadding?: number
  }
  axisLeft?: {
    legend?: string
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
  pointLabelTextColor
}: AreaChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Tema elegante inspirado no shadcn/ui
  const elegantTheme = {
    ...nivoTheme,
    axis: {
      ticks: {
        line: { stroke: 'transparent' }, // Remove tick lines
        text: { fontSize: 12, fill: '#6b7280', fontFamily: 'Geist, sans-serif' }
      },
      domain: { line: { stroke: 'transparent' } } // Remove axis lines
    },
    grid: {
      line: { stroke: '#f1f5f9', strokeWidth: 1 } // Grid sutil
    },
    legends: {
      text: { fontSize: 12, fill: '#6b7280', fontFamily: 'Geist, sans-serif' }
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: backgroundColor,
        padding: 0,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        minWidth: 0,
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