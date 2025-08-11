'use client';

import { ResponsiveLine } from '@nivo/line';
import { BaseChartProps } from './types';
import { nivoTheme, colorSchemes } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

export function LineChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Transformar dados para formato Recharts elegante
  const chartData = data.map((item, index) => ({
    category: item.x || item.label || `Item ${index + 1}`,
    value: item.y || item.value || 0,
  }));

  // ChartConfig elegante com cores hardcoded
  const chartConfig: ChartConfig = {
    value: {
      label: yColumn || 'Value',
      color: "#2563eb",
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
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
          />
          <Line
            dataKey="value"
            type="natural"
            stroke="var(--color-value)"
            strokeWidth={2}
            dot={{
              fill: "var(--color-value)",
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