'use client';

import { Pie, PieChart as RechartsPieChart } from 'recharts';
import { BaseChartProps } from './types';
import { EmptyState } from './EmptyState';
import { ChartContainer, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';

export function PieChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  // Transformar dados para formato Recharts elegante
  const chartData = data.map((item, index) => {
    const category = item.x || item.label || `Item ${index + 1}`;
    const key = category.toLowerCase().replace(/\s+/g, '-');
    return {
      category,
      value: item.y || item.value || 0,
      fill: `var(--color-${key})`
    };
  });

  // ChartConfig elegante com cores hardcoded
  const chartConfig: ChartConfig = {
    value: {
      label: yColumn || 'Value',
    }
  };

  // Cores hardcoded elegantes
  const hardcodedColors = ['#2563eb', '#dc2626', '#16a34a', '#ca8a04', '#9333ea', '#c2410c'];
  chartData.forEach((item, index) => {
    const key = item.category.toLowerCase().replace(/\s+/g, '-');
    chartConfig[key] = {
      label: item.category,
      color: hardcodedColors[index % hardcodedColors.length]
    };
  });

  return (
    <div style={{ width: '100%', height: '400px', minWidth: 0 }}>
      <ChartContainer
        config={chartConfig}
        className="mx-auto aspect-square max-h-[300px]"
      >
        <RechartsPieChart>
          <Pie 
            data={chartData} 
            dataKey="value"
            nameKey="category"
          />
          <ChartLegend
            content={<ChartLegendContent nameKey="category" />}
            className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
          />
        </RechartsPieChart>
      </ChartContainer>
    </div>
  );
}