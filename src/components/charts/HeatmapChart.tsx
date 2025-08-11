'use client';

import { BaseChartProps } from './types';

export function HeatmapChart({ data, xColumn, yColumn, isFullscreen }: BaseChartProps) {
  return (
    <div className="flex items-center justify-center h-full text-gray-500">
      <div className="text-center">
        <div className="text-lg font-semibold mb-2">Heatmap Chart</div>
        <div className="text-sm">Heatmap requires matrix data format - coming soon!</div>
        <div className="text-xs mt-2 text-gray-400">
          This chart type needs structured correlation data
        </div>
      </div>
    </div>
  );
}