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
  // Container Border props
  containerBorderWidth?: number
  containerBorderColor?: string
  containerBorderRadius?: number
}

export function LineChart({ 
  data, 
  colors,
  backgroundColor,
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
  // Container Border props
  containerBorderWidth,
  containerBorderColor,
  containerBorderRadius
}: LineChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }


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
        border: containerBorderWidth ? `${containerBorderWidth}px solid ${containerBorderColor || '#ccc'}` : undefined,
        borderRadius: containerBorderRadius ? `${containerBorderRadius}px` : undefined,
      }}
    >
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
          
          // Se legends é LegendConfig, converter para LineLegendProps[]
          if (legends && typeof legends === 'object' && 'enabled' in legends) {
            return legends.enabled !== false ? [
              {
                anchor: legends.anchor || 'bottom',
                direction: legends.direction || 'row',
                justify: false,
                translateX: legends.translateX || 0,
                translateY: legends.translateY || 70,
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
              translateY: 70,
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
  );
}