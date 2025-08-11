'use client';

import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { BaseChartProps } from './types';
import { nivoTheme, colorSchemes } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

export function ScatterChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveScatterPlot
      data={[
        {
          id: 'series',
          data: data.map(item => ({
            x: parseFloat(String(item.x)) || 0,
            y: item.y || item.value || 0
          }))
        }
      ]}
      margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
      xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
      yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
      colors={{ scheme: colorSchemes.primary }}
      blendMode="multiply"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: xColumn || 'X Axis',
        legendOffset: 46,
        legendPosition: 'middle',
        format: (value) => formatValue(Number(value))
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: yColumn || 'Y Axis',
        legendOffset: -60,
        legendPosition: 'middle',
        format: (value) => formatValue(Number(value))
      }}
      theme={nivoTheme}
      animate={true}
      motionConfig="gentle"
    />
  );
}