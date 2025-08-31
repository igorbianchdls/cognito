'use client';

import { ResponsivePie } from '@nivo/pie';
import { BaseChartProps } from './types';
import { nivoTheme } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import type { LegendConfig } from '@/types/apps/chartWidgets';

interface PieChartProps extends BaseChartProps {
  colors?: string[]
  // Visual & Style
  backgroundColor?: string
  backgroundOpacity?: number
  borderColor?: string
  borderOpacity?: number
  borderRadius?: number
  borderWidth?: number
  // Pie-specific
  innerRadius?: number
  padAngle?: number
  cornerRadius?: number
  activeOuterRadiusOffset?: number
  enableArcLinkLabels?: boolean
  arcLabelsSkipAngle?: number
  animate?: boolean
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow'
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  // Legends
  legends?: LegendConfig | Record<string, unknown>[]
}

export function PieChart({ 
  data, 
  colors,
  // Visual & Style
  backgroundColor,
  backgroundOpacity,
  borderColor,
  borderOpacity,
  borderRadius,
  borderWidth,
  // Pie-specific
  innerRadius,
  padAngle,
  cornerRadius,
  activeOuterRadiusOffset,
  enableArcLinkLabels,
  arcLabelsSkipAngle,
  animate,
  motionConfig,
  margin,
  legends
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

  // Apply background with opacity
  const getBackgroundColor = () => {
    if (!backgroundColor) return undefined;
    if (!backgroundOpacity || backgroundOpacity === 1) return backgroundColor;
    
    // Convert hex to rgba if needed
    if (backgroundColor.startsWith('#')) {
      const hex = backgroundColor.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, ${backgroundOpacity})`;
    }
    
    return backgroundColor;
  };

  return (
    <div 
      style={{ 
        width: '100%', 
        height: '100%', 
        minWidth: 0,
        backgroundColor: getBackgroundColor(),
        borderColor: borderColor,
        borderWidth: borderWidth ? `${borderWidth}px` : undefined,
        borderStyle: borderWidth ? 'solid' : undefined,
        borderRadius: borderRadius ? `${borderRadius}px` : undefined,
      }}
    >
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
          
          // Se legends é LegendConfig, converter para PieLegendProps[]
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
              symbolShape: 'square',
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