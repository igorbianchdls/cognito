export interface ChartData {
  x?: string;
  y?: number;
  label?: string;
  value?: number;
  color?: string;
}

export interface BaseChartProps {
  data: ChartData[];
  xColumn?: string;
  yColumn?: string;
  isFullscreen?: boolean;
}

export interface ChartMetadata {
  totalDataPoints?: number;
  generatedAt?: string;
  executionTime?: number;
  dataSource?: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'radar' | 'funnel' | 'treemap' | 'stream';