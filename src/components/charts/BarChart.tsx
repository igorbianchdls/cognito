'use client';

import { ResponsiveBar } from '@nivo/bar';
import { BarChartProps } from './types';
import { nivoTheme } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

// Valores padrão elegantes inspirados no design shadcn
const defaultBarChartProps = {
  // Layout elegante como shadcn
  margin: { top: 20, right: 30, bottom: 40, left: 40 },
  padding: 0.3,
  borderRadius: 4, // Barras arredondadas
  borderWidth: 0,
  
  // Cores suaves inspiradas no shadcn/ui - usando scheme do Nivo
  colors: { scheme: 'category10' },
  
  // Eixos limpos
  axisBottom: {
    tickSize: 0,
    tickPadding: 8,
    tickRotation: 0,
    legendPosition: 'middle' as const,
    legendOffset: 32
  },
  axisLeft: {
    tickSize: 0,
    tickPadding: 8,
    legendOffset: -35
  },
  
  // Labels discretos
  enableLabel: false, // Mais limpo por padrão
  labelSkipWidth: 12,
  labelSkipHeight: 12,
  labelTextColor: { from: 'color', modifiers: [['darker', 1.4]] },
  
  // Animação suave
  animate: true,
  motionConfig: 'gentle' as const,
  
  // Configurações básicas
  keys: ['value'],
  indexBy: 'id'
};

const defaultTooltip = ({ id, value }: { id: string; value: number }) => (
  <div className="bg-white px-3 py-2 shadow-lg rounded-lg border border-gray-200 text-sm">
    <div className="font-medium text-gray-900">{id}</div>
    <div className="text-blue-600 font-semibold">{formatValue(Number(value))}</div>
  </div>
);

export function BarChart(props: BarChartProps) {
  const {
    data,
    xColumn,
    yColumn,
    margin = defaultBarChartProps.margin,
    padding = defaultBarChartProps.padding,
    borderRadius = defaultBarChartProps.borderRadius,
    colors = defaultBarChartProps.colors,
    borderColor,
    borderWidth = defaultBarChartProps.borderWidth,
    axisBottom = { 
      ...defaultBarChartProps.axisBottom, 
      legend: xColumn || 'Category' 
    },
    axisLeft = { 
      ...defaultBarChartProps.axisLeft, 
      legend: yColumn || 'Value',
      format: (value: number) => formatValue(Number(value))
    },
    axisTop = null,
    axisRight = null,
    enableLabel = defaultBarChartProps.enableLabel,
    labelTextColor = defaultBarChartProps.labelTextColor,
    labelSkipWidth = defaultBarChartProps.labelSkipWidth,
    labelSkipHeight = defaultBarChartProps.labelSkipHeight,
    labelFormat = (value: number) => formatValue(Number(value)),
    animate = defaultBarChartProps.animate,
    motionConfig = defaultBarChartProps.motionConfig,
    theme = nivoTheme,
    tooltip = defaultTooltip,
    keys = defaultBarChartProps.keys,
    indexBy = defaultBarChartProps.indexBy
  } = props;

  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  const chartData = data.map(item => ({
    id: item.x || item.label || 'Unknown',
    value: item.y || item.value || 0,
    label: item.x || item.label || 'Unknown'
  }));

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      <ResponsiveBar
        data={chartData}
        keys={keys}
        indexBy={indexBy}
        margin={margin}
        padding={padding}
        borderRadius={borderRadius}
        colors={colors}
        borderColor={borderColor}
        borderWidth={borderWidth}
        axisTop={axisTop}
        axisRight={axisRight}
        axisBottom={axisBottom}
        axisLeft={axisLeft}
        enableLabel={enableLabel}
        label={enableLabel ? (d) => labelFormat(d.value) : undefined}
        labelSkipWidth={labelSkipWidth}
        labelSkipHeight={labelSkipHeight}
        labelTextColor={labelTextColor}
        animate={animate}
        motionConfig={motionConfig}
        theme={theme}
        tooltip={tooltip}
      />
    </div>
  );
}