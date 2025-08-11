'use client';

import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis } from 'recharts';
import { BaseChartProps } from './types';
import { EmptyState } from './EmptyState';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';

export function AreaChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
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
      color: "#2563eb",
    }
  };

  return (
    <div style={{ width: '100%', height: '400px', minWidth: 0 }}>
      <ChartContainer config={chartConfig} className="h-full w-full">
        <RechartsAreaChart
          accessibilityLayer
          data={chartData}
          margin={{
            left: 12,
            right: 12,
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
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="line" />}
          />
          <Area
            dataKey="value"
            type="natural"
            fill="var(--color-value)"
            fillOpacity={0.4}
            stroke="var(--color-value)"
          />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}