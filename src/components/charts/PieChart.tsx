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
  gridColor?: string
  gridStrokeWidth?: number
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
  titleFontFamily?: string
  titleFontSize?: number
  titleFontWeight?: string | number
  titleColor?: string
  subtitleFontFamily?: string
  subtitleFontSize?: number
  subtitleFontWeight?: string | number
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

const DEFAULT_MARGIN_BOTTOM = 40;
const DEFAULT_TRANSLATE_Y = 30;

export function PieChart({
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
}: PieChartProps) {
  // Debug: Log do que PieChart recebe
  // console.log('📊 PIE CHART recebeu:', {
  //   componentType: 'PieChart',
  //   hasData: !!data,
  //   dataLength: data?.length || 0,
  //   firstItem: data?.[0],
  //   props: { title, subtitle }
  // });

  if (!data || data.length === 0) {
    // console.log('📊 PIE CHART: Retornando EmptyState');
    return <EmptyState />;
  }

  // Transformar dados para formato Nivo
  const chartData = data.map(item => ({
    id: item.x || item.label || 'Unknown',
    label: item.x || item.label || 'Unknown',
    value: item.y || item.value || 0
  }));

  // Debug: Log dos dados transformados
  // console.log('📊 PIE CHART dados transformados:', {
  //   originalLength: data.length,
  //   transformedLength: chartData.length,
  //   firstTransformed: chartData[0],
  //   allTransformed: chartData.slice(0, 3)
  // });

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = hex.replace('#', '').match(/.{2}/g);
    return result ? result.map(h => parseInt(h, 16)).join(', ') : '0, 0, 0';
  };

  // Create box shadow style - apply custom shadow or default KPI shadow
  // const hasCustomShadow = containerShadowColor || containerShadowOpacity !== undefined ||
  //                        containerShadowBlur !== undefined || containerShadowOffsetX !== undefined ||
  //                        containerShadowOffsetY !== undefined;
  //
  // const boxShadow = hasCustomShadow
  //   ? `${containerShadowOffsetX || 0}px ${containerShadowOffsetY || 4}px ${containerShadowBlur || 8}px rgba(${
  //       hexToRgb(containerShadowColor || '#000000')
  //     }, ${containerShadowOpacity || 0.2})`
  //   : '0 4px 6px -1px rgba(0, 0, 0, 0.1)';

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
  // console.log('🖼️ PieChart Shadow Debug:', {
  //   containerShadowColor,
  //   containerShadowOpacity,
  //   containerShadowBlur,
  //   containerShadowOffsetX,
  //   containerShadowOffsetY,
  //   boxShadow
  // });

  // Cores elegantes
  const elegantColors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c'];

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
      {/* Corner accents - positioned to overlay border */}
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
          <ResponsivePie
        data={chartData}
        
        // Margins configuráveis
        margin={{
          top: margin?.top ?? 20,
          right: margin?.right ?? 20,
          bottom: marginBottom !== undefined ? marginBottom : (margin?.bottom ?? DEFAULT_MARGIN_BOTTOM),
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
                translateY: translateY !== undefined ? translateY : DEFAULT_TRANSLATE_Y,
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
          
          // Configuração padrão se legends não especificado
          return [
            {
              anchor: 'bottom',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: translateY !== undefined ? translateY : DEFAULT_TRANSLATE_Y,
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
      </div>
    </div>
  );
}