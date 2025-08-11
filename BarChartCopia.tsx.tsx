import React from 'react';
import { ResponsiveBar, BarLegendProps } from '@nivo/bar';

interface BarChartProps {
  // Container
  chartContainer?: any;
  // Dimensions
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  rowHeight?: number; // Nova prop para sincronizar com o grid layout
  gridHeight?: number; // Altura em unidades de grid (h)
  // Dados
  data: Array<{ label: string; value: number }>;
  // Eixos
  xAxisLabel?: string;
  xTickSize?: number;
  xTickPadding?: number;
  xTickRotation?: number;
  xTickLabelFontSize?: number;
  yAxisLabel?: string;
  yTickSize?: number;
  yTickPadding?: number;
  yTickRotation?: number;
  yTickLabelFontSize?: number;
  axisLabelFontSize?: number;
  // Legendas
  legends?: readonly BarLegendProps[];
  // Grid
  enableGridX?: boolean;
  enableGridY?: boolean;
  // Cores
  colors?: any; // OrdinalColorScaleConfig | string
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: any; // string | object | Function
  barColor?: string;
  // Novas props
  groupMode?: 'grouped' | 'stacked';
  layout?: 'horizontal' | 'vertical';
  padding?: number;
  innerPadding?: number;
  keys?: string[];
  // Outros
  title?: string;
  subtitle?: string;
  enableLabel?: boolean;
  labelTextColor?: any;
  labelOffset?: number;
  enableTotals?: boolean;
  totalsOffset?: number;
  titleFontWeight?: string;
  titleColor?: string;
  subtitleFontWeight?: string;
  subtitleColor?: string;
  titleFontSize?: number;
  subtitleFontSize?: number;
  labelSkipWidth?: number;
  labelSkipHeight?: number;
  labelPosition?: 'middle' | 'top' | 'bottom';
  minHeight?: number;
}

const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 240;
const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 64, left: 64 };
const DEFAULT_GROUP_MODE = 'grouped';
const DEFAULT_LAYOUT = 'vertical';
const DEFAULT_PADDING = 0.2;
const DEFAULT_INNER_PADDING = 0;
const DEFAULT_COLORS = { scheme: 'nivo' };
const DEFAULT_BORDER_RADIUS = 0;
const DEFAULT_BORDER_WIDTH = 0;
const DEFAULT_BORDER_COLOR = { from: 'color' };
const DEFAULT_ENABLE_LABEL = true;
const DEFAULT_LABEL_TEXT_COLOR = { theme: 'labels.text.fill' };
const DEFAULT_LABEL_OFFSET = 0;
const DEFAULT_ENABLE_TOTALS = false;
const DEFAULT_TOTALS_OFFSET = 10;

const BarChart: React.FC<BarChartProps> = ({
  chartContainer = {},
  width = DEFAULT_WIDTH,
  height = DEFAULT_HEIGHT,
  margin = DEFAULT_MARGIN,
  rowHeight = 100, // Valor padrão do grid layout
  gridHeight = 4,  // Valor padrão de altura em unidades de grid (4 linhas)
  data = [
    { label: "A", value: 33 },
    { label: "B", value: 45 },
    { label: "C", value: 25 },
    { label: "D", value: 60 },
    { label: "E", value: 35 }
  ],
  keys,
  xAxisLabel = 'Categoria',
  xTickSize = 5,
  xTickPadding = 5,
  xTickRotation = 0,
  xTickLabelFontSize = 12,
  yAxisLabel = 'Valor',
  yTickSize = 5,
  yTickPadding = 5,
  yTickRotation = 0,
  yTickLabelFontSize = 12,
  axisLabelFontSize = 14,
  legends = [],
  enableGridX = true,
  enableGridY = true,
  colors = 'nivo',
  borderRadius = 8,
  borderWidth = 1,
  borderColor = { from: 'color' },
  barColor = '#3b82f6',
  title = 'Bar Chart',
  subtitle = '',
  groupMode = DEFAULT_GROUP_MODE,
  layout = DEFAULT_LAYOUT,
  padding = DEFAULT_PADDING,
  innerPadding = DEFAULT_INNER_PADDING,
  enableLabel = DEFAULT_ENABLE_LABEL,
  labelTextColor = DEFAULT_LABEL_TEXT_COLOR,
  labelOffset = DEFAULT_LABEL_OFFSET,
  enableTotals = DEFAULT_ENABLE_TOTALS,
  totalsOffset = DEFAULT_TOTALS_OFFSET,
  labelSkipWidth = 0,
  labelSkipHeight = 0,
  labelPosition = 'middle',
  titleFontWeight,
  titleColor,
  subtitleFontWeight,
  subtitleColor,
  titleFontSize,
  subtitleFontSize,
  backgroundColor,
  minHeight = 300,
  ...rest
}) => {
  console.log('BarChart xAxisLabel:', xAxisLabel, 'yAxisLabel:', yAxisLabel);
  
  // Calcular altura baseada no grid layout
  const calculatedHeight = rowHeight * gridHeight;
  console.log('BarChart altura calculada:', calculatedHeight, 'rowHeight:', rowHeight, 'gridHeight:', gridHeight);
  
  // Adaptar dados para o formato do Nivo
  const nivoData = data.map(item => ({
    categoria: item.label,
    valor: item.value,
    ...item // para múltiplas séries
  }));

  // Inferir keys dinamicamente se não for passado
  const usedKeys = keys && keys.length > 0
    ? keys
    : Object.keys(nivoData[0] || {}).filter(k => k !== 'categoria' && k !== 'label');

  // Normaliza colors para garantir esquema
  const normalizedColors = typeof colors === 'string' ? { scheme: colors } : colors;

  // colorBy dinâmico: por categoria se só uma key, por série se múltiplas
  const colorBy = usedKeys.length === 1 ? 'indexValue' : 'id';

  return (
    <div
      style={{
        width: '100%',
        height: gridHeight && rowHeight ? `${calculatedHeight}px` : '100%',
        background: backgroundColor || '#fff',
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: borderRadius,
        boxShadow: chartContainer.boxShadow || '0 1px 4px rgba(0,0,0,0.03)',
        padding: 12,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        minWidth: 0,
      }}
    >
      {title && (
        <h3 style={{ 
          margin: '0 0 4px 0', 
          fontSize: titleFontSize || '18px', 
          fontWeight: titleFontWeight || 700, 
          color: titleColor || '#222',
          fontFamily: chartContainer.titleFontFamily
        }}>
          {title}
        </h3>
      )}
      {subtitle && (
        <div style={{ 
          margin: '0 0 16px 0', 
          fontSize: subtitleFontSize || '14px', 
          color: subtitleColor || '#6b7280',
          fontWeight: subtitleFontWeight
        }}>
          {subtitle}
        </div>
      )}
      <div style={{ 
        width: '100%', 
        height: gridHeight && rowHeight ? calculatedHeight : '100%'
      }}>
        <ResponsiveBar
          data={nivoData}
          keys={usedKeys}
          indexBy="categoria"
          margin={margin}
          padding={padding}
          innerPadding={innerPadding}
          groupMode={groupMode}
          layout={layout}
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={normalizedColors}
          borderRadius={borderRadius}
          borderWidth={borderWidth}
          borderColor={borderColor}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: xTickSize,
            tickPadding: xTickPadding,
            tickRotation: xTickRotation,
            legend: xAxisLabel,
            legendOffset: 40,
            legendPosition: 'middle',
          }}
          axisLeft={{
            tickSize: yTickSize,
            tickPadding: yTickPadding,
            tickRotation: yTickRotation,
            legend: yAxisLabel,
            legendOffset: -56,
            legendPosition: 'middle',
          }}
          enableGridX={enableGridX}
          enableGridY={enableGridY}
          labelSkipWidth={labelSkipWidth}
          labelSkipHeight={labelSkipHeight}
          labelPosition={labelPosition}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 1.6]]
          }}
          legends={Array.isArray(legends) && legends.length > 0 ? legends : [
            {
              dataFrom: 'keys',
              anchor: 'top',
              direction: 'row',
              justify: false,
              translateX: 0,
              translateY: -30,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: 'left-to-right',
              itemOpacity: 0.85,
              symbolSize: 20,
              effects: [
                {
                  on: 'hover',
                  style: {
                    itemOpacity: 1
                  }
                }
              ]
            } as BarLegendProps
          ]}
          role="application"
          ariaLabel="Bar chart"
          barAriaLabel={function(e) { return e.id + ": " + e.formattedValue + " in category: " + e.indexValue }}
          theme={{
            axis: {
              legend: {
                text: {
                  fontSize: axisLabelFontSize,
                  fontWeight: 600,
                  fill: '#374151',
                },
              },
              ticks: {
                text: {
                  fontSize: 12,
                  fill: '#6b7280',
                },
              },
            },
            legends: {
              text: {
                fontSize: 12,
                fill: '#6b7280',
              },
            },
          }}
          enableLabel={enableLabel}
          labelTextColor={labelTextColor}
          labelOffset={labelOffset}
          enableTotals={enableTotals}
          totalsOffset={totalsOffset}
        />
      </div>
    </div>
  );
};

export default BarChart; 