'use client';

import { ResponsiveBar } from '@nivo/bar';
import { BarChartProps } from './types';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import { createElegantTheme } from './theme';

// Valores padrão robustos e flexíveis
const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 64, left: 64 };
const DEFAULT_ENABLE_GRID_X = true;
const DEFAULT_ENABLE_GRID_Y = true;

export function BarChart(props: BarChartProps) {
  const {
    data,
    margin = DEFAULT_MARGIN,
    enableGridX = DEFAULT_ENABLE_GRID_X,
    enableGridY = DEFAULT_ENABLE_GRID_Y,
    title,
    subtitle,
    titleFontSize = 18,
    titleFontWeight = 700,
    titleColor = '#222',
    subtitleFontSize = 14,
    subtitleFontWeight = 400,
    subtitleColor = '#6b7280',
    backgroundColor = '#fff',
    // Configurable props
    colors,
    borderRadius,
    borderWidth,
    borderColor,
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

  // Debug log
  console.log('🖼️ BarChart Shadow Debug:', {
    containerShadowColor,
    containerShadowOpacity,
    containerShadowBlur,
    containerShadowOffsetX,
    containerShadowOffsetY,
    boxShadow
  });

  // Create theme with custom typography
  const customTheme = createElegantTheme({
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
    tooltipFontFamily
  });



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
        borderRadius: `${containerBorderRadius || 8}px`,
        boxShadow,
      }}
    >
      {title && (
        <h3 style={{ 
          margin: '0 0 4px 0', 
          fontSize: `${titleFontSize}px`, 
          fontWeight: titleFontWeight, 
          color: titleColor
        }}>
          {title}
        </h3>
      )}
      {subtitle && (
        <div style={{ 
          margin: '0 0 16px 0', 
          fontSize: `${subtitleFontSize}px`, 
          color: subtitleColor,
          fontWeight: subtitleFontWeight
        }}>
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
          <ResponsiveBar
          data={finalData}
          keys={['value']}
          indexBy="id"
          
          // Layout configurável
          layout={layout || 'vertical'}
          groupMode={groupMode || 'grouped'}
          
          // Margins com espaço para legenda na parte inferior
          margin={margin}
          padding={padding ?? 0.2}
          
          // Cores configuráveis
          colors={colors || ['#2563eb']}
          
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
          theme={customTheme}
          
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
                  translateY: legendConfig.translateY || 50,
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
            
            // Retorna array vazio se não há legends configurado
            return [];
          })()}
          />
        </div>
      </div>
    </div>
  );
}