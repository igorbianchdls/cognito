'use client';

import { ResponsivePie } from '@nivo/pie';
import { BaseChartProps } from './types';
import { elegantTheme } from './theme';
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
  enableArcLabels?: boolean
  enableArcLinkLabels?: boolean
  arcLabelsSkipAngle?: number
  arcLabelsTextColor?: string
  arcLinkLabelsSkipAngle?: number
  arcLinkLabelsTextColor?: string
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
  enableArcLabels,
  enableArcLinkLabels,
  arcLabelsSkipAngle,
  arcLabelsTextColor,
  arcLinkLabelsSkipAngle,
  arcLinkLabelsTextColor,
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
  subtitleColor = '#6b7280',
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
    ? `${containerShadowOffsetX || 0}px ${containerShadowOffsetY || 4}px ${containerShadowBlur || 8}px rgba(${
        hexToRgb(containerShadowColor || '#000000')
      }, ${containerShadowOpacity || 0.2})`
    : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';

  // Debug log
  console.log('🖼️ PieChart Shadow Debug:', {
    containerShadowColor,
    containerShadowOpacity,
    containerShadowBlur,
    containerShadowOffsetX,
    containerShadowOffsetY,
    boxShadow
  });

  // Cores elegantes
  const elegantColors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c'];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: backgroundColor,
        padding: `${containerPadding || 16}px`,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        minWidth: 0,
        border: containerBorderWidth ? `${containerBorderWidth}px solid ${containerBorderColor || '#e5e7eb'}` : '1px solid #e5e7eb',
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
        enableArcLabels={enableArcLabels ?? true}
        arcLabelsSkipAngle={arcLabelsSkipAngle ?? 15}
        arcLabelsTextColor={arcLabelsTextColor ? { from: 'color', modifiers: [] } : { from: 'color', modifiers: [['darker', 1.8]] }}
        
        // Link Labels configuráveis
        enableArcLinkLabels={enableArcLinkLabels ?? false}
        arcLinkLabelsSkipAngle={arcLinkLabelsSkipAngle ?? 10}
        arcLinkLabelsTextColor={arcLinkLabelsTextColor || '#374151'}
        
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
                translateY: 50,
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