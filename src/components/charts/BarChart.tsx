'use client';

import { ResponsiveBar } from '@nivo/bar';
import { BaseChartProps } from './types';
import { nivoTheme, colorSchemes } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

export function BarChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveBar
      data={data.map(item => ({
        id: item.x || item.label || 'Unknown',
        value: item.y || item.value || 0,
        label: item.x || item.label || 'Unknown'
      }))}
      keys={['value']}
      indexBy="id"
      margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
      padding={0.2}
      colors={{ scheme: colorSchemes.primary }}
      borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: -45,
        legend: xColumn || 'X Axis',
        legendPosition: 'middle',
        legendOffset: 50
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: yColumn || 'Y Axis',
        legendPosition: 'middle',
        legendOffset: -60,
        format: (value) => formatValue(Number(value))
      }}
      enableLabel={true}
      label={(d) => formatValue(Number(d.value))}
      labelSkipWidth={12}
      labelSkipHeight={12}
      labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
      animate={true}
      motionConfig="gentle"
      theme={nivoTheme}
      tooltip={({ id, value }) => (
        <div className="bg-white px-3 py-2 shadow-lg rounded border text-sm">
          <div className="font-semibold">{id}</div>
          <div className="text-blue-600">{formatValue(Number(value))}</div>
        </div>
      )}
    />
  );
}