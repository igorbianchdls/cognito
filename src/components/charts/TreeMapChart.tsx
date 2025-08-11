'use client';

import { ResponsiveTreeMap } from '@nivo/treemap';
import { BaseChartProps } from './types';
import { nivoTheme, colorSchemes } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

export function TreeMapChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveTreeMap
      data={{
        name: "root",
        children: data.map(item => ({
          name: item.x || item.label || 'Unknown',
          value: item.y || item.value || 0
        }))
      }}
      identity="name"
      value="value"
      valueFormat={(value) => formatValue(Number(value))}
      margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
      labelSkipSize={12}
      labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
      parentLabelPosition="left"
      parentLabelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
      borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
      colors={{ scheme: colorSchemes.primary }}
      theme={nivoTheme}
      animate={true}
      motionConfig="gentle"
    />
  );
}