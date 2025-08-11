'use client';

import { ResponsivePie } from '@nivo/pie';
import { BaseChartProps } from './types';
import { nivoTheme, colorSchemes } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

export function PieChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  const chartData = data.map(item => ({
    id: item.x || item.label || 'Unknown',
    label: item.x || item.label || 'Unknown',
    value: item.y || item.value || 0
  }));

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '250px' }}>
      <ResponsivePie
        data={chartData}
      margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
      innerRadius={0.5}
      padAngle={0.7}
      cornerRadius={3}
      activeOuterRadiusOffset={8}
      colors={{ scheme: colorSchemes.primary }}
      borderWidth={1}
      borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
      arcLinkLabelsSkipAngle={10}
      arcLinkLabelsTextColor="#333333"
      arcLinkLabelsThickness={2}
      arcLinkLabelsColor={{ from: 'color' }}
      arcLabelsSkipAngle={10}
      arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
      theme={nivoTheme}
      animate={true}
      motionConfig="gentle"
      valueFormat={(value) => formatValue(Number(value))}
      />
    </div>
  );
}