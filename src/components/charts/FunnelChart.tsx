'use client';

import { ResponsiveFunnel } from '@nivo/funnel';
import { BaseChartProps } from './types';
import { nivoTheme, colorSchemes } from './theme';
import { formatValue } from './utils';
import { EmptyState } from './EmptyState';

export function FunnelChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState />;
  }

  return (
    <ResponsiveFunnel
      data={data.map(item => ({
        id: item.x || item.label || 'Unknown',
        value: item.y || item.value || 0,
        label: item.x || item.label || 'Unknown'
      }))}
      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      valueFormat={(value) => formatValue(Number(value))}
      colors={{ scheme: colorSchemes.primary }}
      borderWidth={20}
      labelColor={{ from: 'color', modifiers: [['darker', 3]] }}
      beforeSeparatorLength={100}
      beforeSeparatorOffset={20}
      afterSeparatorLength={100}
      afterSeparatorOffset={20}
      currentPartSizeExtension={10}
      currentBorderWidth={40}
      theme={nivoTheme}
      animate={true}
      motionConfig="gentle"
    />
  );
}