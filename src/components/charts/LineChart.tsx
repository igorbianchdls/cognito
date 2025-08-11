'use client';

import { CartesianGrid, Line, LineChart as RechartsLineChart, XAxis, YAxis } from 'recharts';
import { BaseChartProps } from './types';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';

export function LineChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Transformar dados para formato Recharts
  const chartData = data.map((item, index) => ({
    category: item.x || item.label || `Item ${index + 1}`,
    value: item.y || item.value || 0,
  }));

  // Configuração de cores para shadcn/ui chart
  const chartConfig: ChartConfig = {
    value: {
      label: yColumn || 'Value',
      color: "var(--chart-1)",
    }
  };

  return (
    <div style={{ width: '100%', height: '400px', minWidth: 0 }}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <RechartsLineChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
            top: 12,
            bottom: 12,
          }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="category"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.toString().slice(0, 3)}
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
          <Line
            dataKey="value"
            type="natural"
            stroke="hsl(var(--chart-1))"
            strokeWidth={2}
            dot={{
              fill: "hsl(var(--chart-1))",
            }}
            activeDot={{
              r: 6,
            }}
          />
        </RechartsLineChart>
      </ChartContainer>
    </div>
  );
}