'use client';

import { BaseChartProps } from './types';

export function StreamChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Stream Chart</div>
        <div className="text-sm">Stream requires time-series data - coming soon!</div>
        <div className="text-xs mt-2 text-gray-400">
          This chart type needs temporal data with multiple series
        </div>
      </div>
    </div>
  );
}