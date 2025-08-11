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

export interface BarChartProps extends BaseChartProps {
  // Layout & Spacing
  margin?: { top: number; right: number; bottom: number; left: number };
  padding?: number;
  borderRadius?: number;
  
  // Colors & Style
  colors?: string[] | { scheme: string };
  borderColor?: string | { from: string; modifiers: Array<[string, number]> };
  borderWidth?: number;
  
  // Axes Configuration
  axisBottom?: {
    tickSize?: number;
    tickPadding?: number;
    tickRotation?: number;
    legend?: string;
    legendPosition?: 'start' | 'middle' | 'end';
    legendOffset?: number;
  } | null;
  axisLeft?: {
    tickSize?: number;
    tickPadding?: number;
    legend?: string;
    legendOffset?: number;
    format?: (value: number) => string;
  } | null;
  axisTop?: object | null;
  axisRight?: object | null;
  
  // Labels
  enableLabel?: boolean;
  labelTextColor?: string | { from: string; modifiers: Array<[string, number]> };
  labelSkipWidth?: number;
  labelSkipHeight?: number;
  labelFormat?: (value: number) => string;
  
  // Animation
  animate?: boolean;
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow';
  
  // Advanced
  theme?: object;
  tooltip?: (data: { id: string; value: number }) => React.ReactNode;
  keys?: string[];
  indexBy?: string;
}

export interface ChartMetadata {
  totalDataPoints?: number;
  generatedAt?: string;
  executionTime?: number;
  dataSource?: string;
}

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'radar' | 'funnel' | 'treemap' | 'stream';