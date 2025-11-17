'use client';

import { RadialBarChart, RadialBar, PolarRadiusAxis, Label } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export interface RadialStackedData {
  [key: string]: string | number;
}

export interface RadialStackedChartProps {
  data: RadialStackedData | RadialStackedData[];
  keys: string[]; // stacked keys, e.g., ['desktop','mobile'] or ['meta','faturamento']

  // Title/Description (optional external wrappers can render these too)
  title?: string;
  description?: string;

  // Layout / geometry
  startAngle?: number;
  endAngle?: number;
  innerRadius?: number | string;
  outerRadius?: number | string;
  cornerRadius?: number;
  stackId?: string;

  // Center label
  centerLabelTop?: string;
  centerLabelBottom?: string;
  centerLabelFormatter?: (totals: number, payload: RadialStackedData) => { top?: string; bottom?: string };

  // Colors & config for ChartContainer (maps keys → CSS vars)
  config: ChartConfig;

  // Class / sizing
  className?: string;

  // Container styles (basic defaults to ensure background)
  containerBackground?: string;
  containerBorderColor?: string;
  containerBorderWidth?: number;
  containerBorderRadius?: number;
}

export function RadialStackedChart({
  data,
  keys,
  title,
  description,
  startAngle = 180,
  endAngle = 0,
  innerRadius = 80,
  outerRadius = 130,
  cornerRadius = 5,
  stackId = 'a',
  centerLabelTop,
  centerLabelBottom,
  centerLabelFormatter,
  config,
  className,
  containerBackground = '#ffffff',
  containerBorderColor = '#e5e7eb',
  containerBorderWidth = 1,
  containerBorderRadius = 12,
}: RadialStackedChartProps) {
  const chartData = Array.isArray(data) ? data : [data];
  const first = chartData[0] || {};

  const total = keys.reduce((acc, k) => acc + Number(first[k] || 0), 0);

  const center = centerLabelFormatter
    ? centerLabelFormatter(total, first)
    : { top: centerLabelTop ?? total.toLocaleString(), bottom: centerLabelBottom ?? '' };

  return (
    <div
      className={cn('relative flex flex-col min-w-0 p-4', className)}
      style={{
        background: containerBackground,
        border: `${containerBorderWidth}px solid ${containerBorderColor}`,
        borderRadius: `${containerBorderRadius}px`
      }}
    >
      {title && (
        <h3 className="mb-2" style={{ fontWeight: 700 }}>
          {title}
        </h3>
      )}
      {description && (
        <div className="mb-3 text-sm text-gray-500">{description}</div>
      )}
      <ChartContainer
        config={config}
        className={cn('mx-auto aspect-square w-full max-w-[280px]')}
      >
        <RadialBarChart data={chartData} startAngle={startAngle} endAngle={endAngle} innerRadius={innerRadius} outerRadius={outerRadius}>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
          <Label
            content={({ viewBox }) => {
              if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                return (
                  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                    {center.top && (
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) - 12} className="fill-foreground text-xl font-bold">
                        {center.top}
                      </tspan>
                    )}
                    {center.bottom && (
                      <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 8} className="fill-muted-foreground">
                        {center.bottom}
                      </tspan>
                    )}
                  </text>
                );
              }
              return null;
            }}
          />
        </PolarRadiusAxis>
          {keys.map((k) => (
            <RadialBar
              key={k}
              dataKey={k}
              stackId={stackId}
              cornerRadius={cornerRadius}
              fill={`var(--color-${k})`}
              className="stroke-transparent stroke-2"
            />
          ))}
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
}

export default RadialStackedChart;
