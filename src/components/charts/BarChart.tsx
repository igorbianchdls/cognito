'use client';

import { ResponsiveBar } from '@nivo/bar';
import { BarChartProps } from './types';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import { createElegantTheme } from './theme';

// Valores padrão robustos e flexíveis
const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 0, left: 80 };
const DEFAULT_ENABLE_GRID_X = false;
const DEFAULT_ENABLE_GRID_Y = false;

export function BarChart(props: BarChartProps) {
  const {
    data,
    margin = DEFAULT_MARGIN,
    enableGridX = DEFAULT_ENABLE_GRID_X,
    enableGridY = DEFAULT_ENABLE_GRID_Y,
    gridColor,
    gridStrokeWidth,
    title,
    subtitle,
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
    groupMode,
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
    containerShadowOffsetY,
    // Positioning props
    translateY,
    marginBottom
  } = props;

  // Debug: Log do que BarChart recebe
  console.log('📊 BAR CHART recebeu:', {
    componentType: 'BarChart',
    hasData: !!data,
    dataLength: data?.length || 0,
    firstItem: data?.[0],
    props: { title, subtitle }
  });

  if (!data || data.length === 0) {
    console.log('📊 BAR CHART: Retornando EmptyState');
    return <EmptyState />;
  }

  // Transformar dados para formato Nivo
  const chartData = data.map(item => ({
    id: item.x || item.label || 'Unknown',
    value: item.y || item.value || 0,
    label: item.x || item.label || 'Unknown'
  }));

  // Debug: Log dos dados transformados
  console.log('📊 BAR CHART dados transformados:', {
    originalLength: data.length,
    transformedLength: chartData.length,
    firstTransformed: chartData[0],
    allTransformed: chartData.slice(0, 3)
  });

  // Inverter dados automaticamente para layout horizontal (maior valor no topo)
  const finalData = layout === 'horizontal' ? [...chartData].reverse() : chartData;

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


  
  // Build bar CSS filters directly (no function needed)
  const barCSSFilters = [
    barBrightness !== undefined && `brightness(${barBrightness})`,
    barSaturate !== undefined && `saturate(${barSaturate})`,
    barContrast !== undefined && `contrast(${barContrast})`,
    barBlur !== undefined && `blur(${barBlur}px)`
  ].filter(Boolean).join(' ') || undefined;
  
  // Build hover CSS filters directly (no function needed)
  const hoverCSSFilters = [
    hoverBrightness !== undefined && `brightness(${hoverBrightness})`,
    hoverSaturate !== undefined && `saturate(${hoverSaturate})`,
    hoverBlur !== undefined && `blur(${hoverBlur}px)`
  ].filter(Boolean).join(' ') || undefined;

  // Debug: Log CSS effects
  console.log('🎨 BAR CHART efeitos CSS diretos:', {
    containerStyles: {
      background: containerBackground || backgroundColor,
      opacity: containerOpacity,
      backdropFilter: containerBackdropFilter,
      filter: containerFilter,
      boxShadow: containerBoxShadow,
      border: containerBorder,
      transform: containerTransform,
      transition: containerTransition
    },
    barFilters: barCSSFilters,
    hoverFilters: hoverCSSFilters,
    colorProcessing: {
      originalColors: colors,
      barColor
    }
  });

  // Debug log
  console.log('🖼️ BarChart Shadow Debug:', {
    containerShadowColor,
    containerShadowOpacity,
    containerShadowBlur,
    containerShadowOffsetX,
    containerShadowOffsetY,
    boxShadow
  });

  // Container styles - ALL DIRECT (no complex functions!)
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
    filter: containerFilter,
    boxShadow: containerBoxShadow,
    border: containerBorder,
    transform: containerTransform,
    transition: containerTransition || (transitionDuration ? `all ${transitionDuration} ${transitionEasing || 'ease-in-out'}` : undefined),
  };

  // Create dynamic theme that can handle separate axis colors
  const dynamicTheme = {
    ...createElegantTheme({
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
      gridColor,
      gridStrokeWidth,
      tooltipFontSize,
      tooltipFontFamily
    }),
  };



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
          // Apply all container styles directly
          ...containerStyles,
          
          // Override with specific props if provided (backwards compatibility)
          padding: `${containerPadding || 16}px`,
          margin: '0 auto',
          border: containerStyles.border || (containerBorderWidth ? `${containerBorderWidth}px solid ${containerBorderColor || '#e5e7eb'}` : '1px solid #e5e7eb'),
          borderRadius: `${containerBorderRadius || 8}px`,
          boxShadow: containerStyles.boxShadow || boxShadow,
        })
      }}
    >
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
          keys={['value']}
          indexBy="id"
          
          // Layout configurável
          layout={layout || 'vertical'}
          groupMode={groupMode || 'grouped'}
          
          // Margins com espaço para legenda na parte inferior
          margin={marginBottom !== undefined ? { ...margin, bottom: marginBottom } : margin}
          padding={padding ?? 0.2}
          
          // Cores configuráveis
          colors={barColor ? [barColor] : colors || ['#2563eb']}
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
          theme={dynamicTheme}
          
          // Tooltip elegante
          tooltip={({ id, value }) => (
            <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-xs">
              <div className="font-medium text-gray-900">{id}</div>
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
                  translateY: translateY !== undefined ? translateY : (legendConfig.translateY || 0),
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
            return [
              {
                dataFrom: 'keys' as const,
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