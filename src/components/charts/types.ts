import { OrdinalColorScaleConfig } from '@nivo/colors';
import { ComputedDatum, BarDatum, BarLegendProps } from '@nivo/bar';

export interface ChartData {
  x?: string;
  y?: number;
  label?: string;
  value?: number;
  color?: string;
  [key: string]: string | number | undefined; // Para suporte a múltiplas séries
}

export interface BaseChartProps {
  data: ChartData[];
  xColumn?: string;
  yColumn?: string;
  isFullscreen?: boolean;
}

export interface BarChartProps extends BaseChartProps {
  // Container & Dimensions
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  rowHeight?: number;
  gridHeight?: number;
  minHeight?: number;
  
  // Layout & Spacing
  padding?: number;
  innerPadding?: number;
  borderRadius?: number;
  groupMode?: 'grouped' | 'stacked';
  layout?: 'horizontal' | 'vertical';
  
  // Colors & Style
  colors?: OrdinalColorScaleConfig<ComputedDatum<BarDatum>> | string;
  borderColor?: string | { from: string; modifiers: Array<[string, number]> };
  borderWidth?: number;
  
  // Scales
  valueScale?: { type: 'linear' | 'symlog' };
  indexScale?: { type: 'band'; round?: boolean };
  
  // Grid
  enableGridX?: boolean;
  enableGridY?: boolean;
  
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
    tickRotation?: number;
    legend?: string;
    legendOffset?: number;
    format?: (value: number) => string;
  } | null;
  axisTop?: {
    tickSize?: number;
    tickPadding?: number;
    tickRotation?: number;
    legend?: string;
    legendPosition?: 'start' | 'middle' | 'end';
    legendOffset?: number;
  } | null;
  axisRight?: {
    tickSize?: number;
    tickPadding?: number;
    tickRotation?: number;
    legend?: string;
    legendOffset?: number;
    format?: (value: number) => string;
  } | null;
  
  // Labels
  enableLabel?: boolean;
  labelTextColor?: string | { from: string; modifiers: Array<[string, number]> };
  labelSkipWidth?: number;
  labelSkipHeight?: number;
  labelFormat?: (value: number) => string;
  labelPosition?: 'start' | 'middle' | 'end';
  labelOffset?: number;
  
  // Totals
  enableTotals?: boolean;
  totalsOffset?: number;
  
  // Legends
  legends?: readonly BarLegendProps[];
  
  // Animation
  animate?: boolean;
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow';
  
  // Container Styling
  title?: string;
  subtitle?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: string | number;
  subtitleColor?: string;
  backgroundColor?: string;
  
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