'use client';

import { Bar, BarChart as RechartsBarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { BarChartProps, ChartData } from './types';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';

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
    keys,
    indexBy = 'category'
  } = props;

  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Transformar dados para formato Recharts
  const chartData = data.map((item, index) => ({
    category: item.x || item.label || `Item ${index + 1}`,
    value: item.y || item.value || 0,
    ...item // Para múltiplas séries
  }));

  // Inferir keys dinamicamente se não for passado
  const usedKeys = keys && keys.length > 0
    ? keys
    : ['value']; // Recharts usa keys simples

  // Configuração de cores para shadcn/ui chart
  const chartConfig: ChartConfig = {
    value: {
      label: yColumn || 'Value',
      color: "var(--chart-1)",
    }
  };

  // Calcular altura baseada no grid layout
  const calculatedHeight = gridHeight && rowHeight ? rowHeight * gridHeight : height;

  return (
    <div
      style={{
        width: '100%',
        height: gridHeight && rowHeight ? `${calculatedHeight}px` : '100%',
        background: backgroundColor,
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
          margin: '0 0 x 4px 0', 
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
      
      <ChartContainer
        config={chartConfig}
        className="flex-1 w-full"
        style={{ 
          minHeight: `${minHeight}px`,
          height: gridHeight && rowHeight ? calculatedHeight : '100%'
        }}
      >
        <RechartsBarChart
          accessibilityLayer
          data={chartData}
          margin={{
            top: margin?.top || 20,
            right: margin?.right || 12,
            bottom: margin?.bottom || 12,
            left: margin?.left || 12,
          }}
        >
          <CartesianGrid vertical={false} />
          
          <XAxis
            dataKey="category"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value}
          />
          
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => formatValue(value)}
          />
          
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          
          {usedKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--color-${key})`}
              radius={8}
            />
          ))}
        </RechartsBarChart>
      </ChartContainer>
    </div>
  );
}