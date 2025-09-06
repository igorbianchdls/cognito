'use client';

import { ResponsivePie } from '@nivo/pie';
import { BaseChartProps } from './types';
import { nivoTheme } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import type { LegendConfig } from '@/types/apps/chartWidgets';

interface PieChartProps extends BaseChartProps {
  colors?: string[]
  backgroundColor?: string
  innerRadius?: number
  padAngle?: number
  cornerRadius?: number
  activeOuterRadiusOffset?: number
  borderWidth?: number
  borderColor?: string
  enableArcLinkLabels?: boolean
  arcLabelsSkipAngle?: number
  animate?: boolean
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow'
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  legends?: LegendConfig | Record<string, unknown>[]
  title?: string
  subtitle?: string
  titleFontSize?: number
  titleFontWeight?: string | number
  titleColor?: string
  subtitleFontSize?: number
  subtitleFontWeight?: string | number
  subtitleColor?: string
}

export function PieChart({ 
  data, 
  colors,
  backgroundColor,
  innerRadius,
  padAngle,
  cornerRadius,
  activeOuterRadiusOffset,
  borderWidth,
  borderColor,
  enableArcLinkLabels,
  arcLabelsSkipAngle,
  animate,
  motionConfig,
  margin,
  legends,
  title,
  subtitle,
  titleFontSize = 18,
  titleFontWeight = 700,
  titleColor = '#222',
  subtitleFontSize = 14,
  subtitleFontWeight = 400,
  subtitleColor = '#6b7280'
}: PieChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Transformar dados para formato Nivo
  const chartData = data.map(item => ({
    id: item.x || item.label || 'Unknown',
    label: item.x || item.label || 'Unknown',
    value: item.y || item.value || 0
  }));

  // Tema elegante inspirado no shadcn/ui
  const elegantTheme = {
    ...nivoTheme,
    labels: {
      text: { fontSize: 12, fill: '#374151', fontFamily: 'Geist, sans-serif', fontWeight: 500 }
    },
    legends: {
      text: { fontSize: 12, fill: '#6b7280', fontFamily: 'Geist, sans-serif' }
    }
  };

  // Cores elegantes
  const elegantColors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c'];

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
      <ResponsivePie
        data={chartData}
        
        // Margins configuráveis
        margin={{
          top: margin?.top ?? 20,
          right: margin?.right ?? 20,
          bottom: margin?.bottom ?? 80,
          left: margin?.left ?? 20
        }}
        
        // Estilo configurável
        innerRadius={innerRadius ?? 0.5}
        padAngle={padAngle ?? 1}
        cornerRadius={cornerRadius ?? 2}
        activeOuterRadiusOffset={activeOuterRadiusOffset ?? 4}
        
        // Cores configuráveis
        colors={colors || elegantColors}
        
        // Bordas configuráveis
        borderWidth={borderWidth ?? 0}
        borderColor={borderColor || '#ffffff'}
        
        // Labels configuráveis
        enableArcLinkLabels={enableArcLinkLabels ?? false}
        arcLabelsSkipAngle={arcLabelsSkipAngle ?? 15}
        arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 1.8]] }}
        
        animate={animate ?? false}
        motionConfig={motionConfig || "gentle"}
        theme={elegantTheme}
        
        // Tooltip elegante
        tooltip={({ datum }) => (
          <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-xs">
            <div className="font-medium text-gray-900">{datum.id}</div>
            <div className="font-mono font-medium tabular-nums" style={{ color: datum.color }}>
              {formatValue(Number(datum.value))}
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
                symbolShape: legends.symbolShape || 'square',
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