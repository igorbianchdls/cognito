import { OrdinalColorScaleConfig } from '@nivo/colors';
import { ComputedDatum, BarDatum, BarLegendProps } from '@nivo/bar';
import { LegendConfig } from '@/types/apps/chartWidgets';

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
  title?: string;
  subtitle?: string;
}

export interface BarChartProps extends BaseChartProps {
  // Container & Dimensions
  width?: number;
  height?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
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
  barColor?: string;
  borderColor?: string | { from: string; modifiers: Array<[string, number]> };
  borderWidth?: number;
  
  // Container Glass Effect & Modern Styles (Props do fundo/container do chart)
  containerBackground?: string;           // background (gradients, rgba, solid colors)
  containerOpacity?: number;             // opacity (0-1)
  containerBackdropFilter?: string;      // backdrop-filter (blur, saturate, etc)
  containerFilter?: string;              // filter (brightness, contrast, etc)
  containerBoxShadow?: string;           // box-shadow (shadows, glow effects)
  containerBorder?: string;              // border (solid, gradient borders)
  containerTransform?: string;           // transform (scale, rotate, perspective)
  containerTransition?: string;          // transition (animations, easing)
  
  // Bar Visual Effects - CSS Only
  barOpacity?: number;
  barHoverOpacity?: number;
  borderOpacity?: number;
  
  // Bar CSS Filters
  barBrightness?: number;
  barSaturate?: number;
  barContrast?: number;
  barBlur?: number;
  barBoxShadow?: string;
  
  // Hover CSS Effects
  hoverBrightness?: number;
  hoverSaturate?: number;
  hoverScale?: number;
  hoverBlur?: number;
  
  // CSS Transitions
  transitionDuration?: string;
  transitionEasing?: string;
  
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
    format?: (value: string | number) => string;
  } | null;
  axisLeft?: {
    tickSize?: number;
    tickPadding?: number;
    tickRotation?: number;
    legend?: string;
    legendOffset?: number;
    format?: (value: string | number) => string;
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
  labelFormat?: string | ((value: number) => string);
  labelPosition?: 'start' | 'middle' | 'end';
  labelOffset?: number;
  
  // Totals
  enableTotals?: boolean;
  totalsOffset?: number;
  
  // Legends
  legends?: readonly BarLegendProps[] | LegendConfig;
  
  // Animation
  animate?: boolean;
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow';
  
  // Container Styling
  title?: string;
  subtitle?: string;
  
  // Typography - Title
  titleFontFamily?: string;
  titleFontSize?: number;
  titleFontWeight?: string | number;
  titleColor?: string;
  
  // Typography - Subtitle  
  subtitleFontFamily?: string;
  subtitleFontSize?: number;
  subtitleFontWeight?: string | number;
  subtitleColor?: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  backgroundGradient?: {
    enabled: boolean
    type: 'linear' | 'radial' | 'conic'
    direction: string
    startColor: string
    endColor: string
  }
  backdropFilter?: {
    enabled: boolean
    blur: number
  }

  // Spacing - Title/Subtitle
  titleMarginTop?: number;
  titleMarginRight?: number;
  titleMarginBottom?: number;
  titleMarginLeft?: number;
  titlePaddingTop?: number;
  titlePaddingRight?: number;
  titlePaddingBottom?: number;
  titlePaddingLeft?: number;

  subtitleMarginTop?: number;
  subtitleMarginRight?: number;
  subtitleMarginBottom?: number;
  subtitleMarginLeft?: number;
  subtitlePaddingTop?: number;
  subtitlePaddingRight?: number;
  subtitlePaddingBottom?: number;
  subtitlePaddingLeft?: number;

  // Tailwind Classes - Title/Subtitle (precedence over individual props)
  titleClassName?: string;
  subtitleClassName?: string;
  containerClassName?: string;

  // Typography - Axis
  axisFontFamily?: string;
  axisFontSize?: number;
  axisFontWeight?: number;
  axisTextColor?: string;
  axisLegendFontSize?: number;
  axisLegendFontWeight?: number;
  
  // Typography - Labels  
  labelsFontFamily?: string;
  labelsFontSize?: number;
  labelsFontWeight?: number;
  labelsTextColor?: string;
  
  // Typography - Legends
  legendsFontFamily?: string;
  legendsFontSize?: number;
  legendsFontWeight?: number;
  legendsTextColor?: string;
  
  // Typography - Tooltip
  tooltipFontSize?: number;
  tooltipFontFamily?: string;
  
  // Container Border
  containerBorderWidth?: number;
  containerBorderColor?: string;
  containerBorderRadius?: number;
  containerPadding?: number;
  
  // Container Shadow
  containerShadowColor?: string;
  containerShadowOpacity?: number;
  containerShadowBlur?: number;
  containerShadowOffsetX?: number;
  containerShadowOffsetY?: number;
  
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

export type ChartType = 'bar' | 'horizontal-bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'radar' | 'funnel' | 'treemap' | 'stream';