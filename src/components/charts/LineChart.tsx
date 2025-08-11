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

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '300px' }}>
      <ResponsiveLine
        data={[
          {
            id: 'series',
            data: data.map(item => ({
              x: item.x || item.label || 'Unknown',
              y: item.y || item.value || 0
            }))
          }
        ]}
        margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
        xScale={{ type: 'point' }}
        yScale={{
          type: 'linear',
          min: 'auto',
          max: 'auto',
          stacked: false,
          reverse: false
        }}
        yFormat={(value) => formatValue(Number(value))}
        axisTop={null}
        axisRight={null}
        axisBottom={{
          tickSize: 5,
          tickPadding: 5,
          tickRotation: -45,
          legend: xColumn || 'X Axis',
          legendOffset: 50,
          legendPosition: 'middle'
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
        pointSize={8}
        pointColor={{ from: 'color' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabel={(point) => `${point.data.y}`}
        pointLabelYOffset={-12}
        useMesh={true}
        theme={nivoTheme}
        lineWidth={3}
        enableArea={false}
        colors={{ scheme: 'category10' }}
        animate={true}
        motionConfig="gentle"
      />
    </div>
  );
}