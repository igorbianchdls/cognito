'use client';

import { Area, AreaChart as RechartsAreaChart, CartesianGrid, XAxis } from 'recharts';
import { BaseChartProps } from './types';
import { EmptyState } from './EmptyState';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';

export function AreaChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Transformar dados para formato Recharts elegante (múltiplas séries)
  const chartData = data.map((item, index) => ({
    category: item.x || item.label || `Item ${index + 1}`,
    desktop: item.y || item.value || 0,
    mobile: Math.round((item.y || item.value || 0) * 0.6), // Segunda série derivada
  }));

  // ChartConfig elegante com cores hardcoded
  const chartConfig: ChartConfig = {
    desktop: {
      label: "Desktop",
      color: "#2563eb",
    },
    mobile: {
      label: "Mobile",
      color: "#dc2626",
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
            dataKey="mobile"
            type="natural"
            fill="var(--color-mobile)"
            fillOpacity={0.4}
            stroke="var(--color-mobile)"
            stackId="a"
          />
          <Area
            dataKey="desktop"
            type="natural"
            fill="var(--color-desktop)"
            fillOpacity={0.4}
            stroke="var(--color-desktop)"
            stackId="a"
          />
          <ChartLegend content={<ChartLegendContent />} />
        </RechartsAreaChart>
      </ChartContainer>
    </div>
  );
}