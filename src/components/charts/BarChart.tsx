'use client';

import { ResponsiveBar } from '@nivo/bar';
import { BarChartProps } from './types';
import { nivoTheme } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

// Valores padrão robustos e flexíveis
const DEFAULT_WIDTH = 600;
const DEFAULT_HEIGHT = 320;
const DEFAULT_MARGIN = { top: 40, right: 40, bottom: 64, left: 64 };
const DEFAULT_PADDING = 0.2;
const DEFAULT_INNER_PADDING = 0;
const DEFAULT_BORDER_RADIUS = 0;
const DEFAULT_BORDER_WIDTH = 0;
const DEFAULT_GROUP_MODE = 'grouped';
const DEFAULT_LAYOUT = 'vertical';
const DEFAULT_ENABLE_GRID_X = true;
const DEFAULT_ENABLE_GRID_Y = true;
const DEFAULT_ENABLE_LABEL = true;
const DEFAULT_ENABLE_TOTALS = false;
const DEFAULT_TOTALS_OFFSET = 10;
const DEFAULT_LABEL_OFFSET = 0;

const defaultTooltip = ({ id, value }: { id: string; value: number }) => (
  <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-sm">
    <div className="font-medium text-gray-900">{id}</div>
    <div className="text-blue-600 font-semibold">{formatValue(Number(value))}</div>
  </div>
);

export function BarChart(props: BarChartProps) {
  const {
    data,
    height = DEFAULT_HEIGHT,
    margin = DEFAULT_MARGIN,
    rowHeight = 100,
    gridHeight = 4,
    minHeight = 300,
    xColumn,
    yColumn,
    padding = DEFAULT_PADDING,
    innerPadding = DEFAULT_INNER_PADDING,
    borderRadius = DEFAULT_BORDER_RADIUS,
    colors = 'nivo',
    borderColor = { from: 'color' },
    borderWidth = DEFAULT_BORDER_WIDTH,
    groupMode = DEFAULT_GROUP_MODE,
    layout = DEFAULT_LAYOUT,
    valueScale = { type: 'linear' },
    indexScale = { type: 'band', round: true },
    enableGridX = DEFAULT_ENABLE_GRID_X,
    enableGridY = DEFAULT_ENABLE_GRID_Y,
    axisBottom = {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: xColumn || 'Category',
      legendOffset: 40,
      legendPosition: 'middle'
    },
    axisLeft = {
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: yColumn || 'Value',
      legendOffset: -56,
      format: (value: number) => formatValue(Number(value))
    },
    axisTop = null,
    axisRight = null,
    enableLabel = DEFAULT_ENABLE_LABEL,
    labelTextColor = { from: 'color', modifiers: [['darker', 1.6]] },
    labelSkipWidth = 0,
    labelSkipHeight = 0,
    labelOffset = DEFAULT_LABEL_OFFSET,
    enableTotals = DEFAULT_ENABLE_TOTALS,
    totalsOffset = DEFAULT_TOTALS_OFFSET,
    legends = [],
    animate = true,
    motionConfig = 'gentle',
    title,
    subtitle,
    titleFontSize = 18,
    titleFontWeight = 700,
    titleColor = '#222',
    subtitleFontSize = 14,
    subtitleFontWeight = 400,
    subtitleColor = '#6b7280',
    backgroundColor = '#fff',
    theme = nivoTheme,
    tooltip = defaultTooltip,
    keys,
    indexBy = 'categoria'
  } = props;

  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Adaptar dados dinamicamente como na referência
  const nivoData = data.map(item => ({
    categoria: item.x || item.label || 'Unknown',
    valor: item.y || item.value || 0,
    ...item // Para múltiplas séries
  }));

  // Inferir keys dinamicamente se não for passado
  const usedKeys = keys && keys.length > 0
    ? keys
    : Object.keys(nivoData[0] || {}).filter(k => k !== 'categoria' && k !== 'label');

  // Normalizar colors para garantir esquema válido
  const normalizedColors = typeof colors === 'string' ? { scheme: colors } : colors;

  // Calcular altura baseada no grid layout
  const calculatedHeight = gridHeight && rowHeight ? rowHeight * gridHeight : height;

  return (
    <div
      style={{
        width: '100%',
        height: gridHeight && rowHeight ? `${calculatedHeight}px` : '100%',
        background: backgroundColor,
        borderRadius: borderRadius,
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
      <div style={{ 
        width: '100%', 
        height: gridHeight && rowHeight ? calculatedHeight : '100%',
        minHeight: `${minHeight}px`
      }}>
        <ResponsiveBar
          data={nivoData}
          keys={usedKeys}
          indexBy={indexBy}
          margin={margin}
          padding={padding}
          innerPadding={innerPadding}
          groupMode={groupMode}
          layout={layout}
          valueScale={valueScale}
          indexScale={indexScale}
          colors={normalizedColors}
          borderRadius={borderRadius}
          borderWidth={borderWidth}
          borderColor={borderColor}
          axisTop={axisTop}
          axisRight={axisRight}
          axisBottom={axisBottom}
          axisLeft={axisLeft}
          enableGridX={enableGridX}
          enableGridY={enableGridY}
          enableLabel={enableLabel}
          labelSkipWidth={labelSkipWidth}
          labelSkipHeight={labelSkipHeight}
          labelTextColor={labelTextColor}
          labelOffset={labelOffset}
          enableTotals={enableTotals}
          totalsOffset={totalsOffset}
          legends={legends.length > 0 ? legends : []}
          animate={animate}
          motionConfig={motionConfig}
          theme={{
            ...theme,
            axis: {
              ...theme.axis,
              legend: {
                text: {
                  fontSize: 14,
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
          tooltip={tooltip}
          role="application"
          ariaLabel="Bar chart"
          barAriaLabel={function(e) { return `${e.id}: ${e.formattedValue} in category: ${e.indexValue}` }}
        />
      </div>
    </div>
  );
}