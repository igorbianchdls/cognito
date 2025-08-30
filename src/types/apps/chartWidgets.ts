import { BaseWidget } from './baseWidget'

// Legend configuration interface
export interface LegendConfig {
  enabled?: boolean
  anchor?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left'
  direction?: 'row' | 'column'
  translateX?: number
  translateY?: number
  itemWidth?: number
  itemHeight?: number
  itemsSpacing?: number
  symbolSize?: number
  symbolShape?: 'circle' | 'square' | 'triangle'
}

// Base chart configuration interface
export interface BaseChartConfig {
  // Visual & Colors
  colors?: string[]
  backgroundColor?: string
  backgroundOpacity?: number
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  borderOpacity?: number
  
  // Grid & Axes
  enableGridX?: boolean
  enableGridY?: boolean
  axisBottom?: {
    legend?: string
    legendPosition?: 'start' | 'middle' | 'end'
    legendOffset?: number
    tickRotation?: number
    tickSize?: number
    tickPadding?: number
    format?: string
  }
  axisLeft?: {
    legend?: string
    legendOffset?: number
    tickRotation?: number
    tickSize?: number
    tickPadding?: number
    format?: string
  }
  
  // Layout & Spacing
  margin?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  }
  padding?: number
  
  // Labels & Text
  enableLabel?: boolean
  labelTextColor?: string
  labelPosition?: 'start' | 'middle' | 'end'
  labelSkipWidth?: number
  labelSkipHeight?: number
  labelFormat?: string
  
  // Title & Description
  title?: string
  subtitle?: string
  showTitle?: boolean
  showSubtitle?: boolean
  titleFontSize?: number
  titleColor?: string
  titleFontWeight?: number
  titlePadding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  } | number // backward compatibility
  subtitleFontSize?: number
  subtitleColor?: string
  subtitleFontWeight?: number
  subtitlePadding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  } | number // backward compatibility
  chartPadding?: {
    top?: number
    right?: number
    bottom?: number
    left?: number
  } | number // backward compatibility
  
  // Legends
  legends?: LegendConfig
  
  // Animation
  animate?: boolean
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow'
}

// Bar Chart specific configuration
export interface BarChartConfig extends BaseChartConfig {
  groupMode?: 'grouped' | 'stacked'
  layout?: 'horizontal' | 'vertical'
}

// Line Chart specific configuration
export interface LineChartConfig extends BaseChartConfig {
  enableArea?: boolean
  areaOpacity?: number
  curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX'
  lineWidth?: number
  pointSize?: number
  enablePoints?: boolean
}

// Pie Chart specific configuration
export interface PieChartConfig extends BaseChartConfig {
  innerRadius?: number
  padAngle?: number
  cornerRadius?: number
  activeOuterRadiusOffset?: number
  enableArcLinkLabels?: boolean
  arcLabelsSkipAngle?: number
}

// Area Chart specific configuration
export interface AreaChartConfig extends BaseChartConfig {
  enableArea?: boolean
  areaOpacity?: number
  curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX'
  enablePoints?: boolean
  pointSize?: number
  lineWidth?: number
}

// Chart widget type discriminators
export type ChartType = 'chart' | 'chart-bar' | 'chart-line' | 'chart-pie' | 'chart-area'

// Base chart widget interface
export interface BaseChartWidget extends BaseWidget {
  type: ChartType
}

// Specific chart widget interfaces
export interface BarChartWidget extends BaseChartWidget {
  type: 'chart' | 'chart-bar'
  config: BarChartConfig
}

export interface LineChartWidget extends BaseChartWidget {
  type: 'chart-line'
  config: LineChartConfig
}

export interface PieChartWidget extends BaseChartWidget {
  type: 'chart-pie'
  config: PieChartConfig
}

export interface AreaChartWidget extends BaseChartWidget {
  type: 'chart-area'
  config: AreaChartConfig
}

// Union type for all chart widgets
export type ChartWidget = BarChartWidget | LineChartWidget | PieChartWidget | AreaChartWidget

// Chart data interface (used by chart components)
export interface ChartData {
  x: string | number
  y: number
  [key: string]: string | number | boolean | null | undefined
}

// Chart creation helpers
export interface CreateChartWidgetProps {
  chartType: ChartType
  name: string
  icon?: string
  description?: string
  config?: Partial<BaseChartConfig>
}

// Type guards
export function isChartWidget(widget: BaseWidget): widget is ChartWidget {
  return ['chart', 'chart-bar', 'chart-line', 'chart-pie', 'chart-area'].includes(widget.type)
}

export function isBarChart(widget: ChartWidget): widget is BarChartWidget {
  return widget.type === 'chart' || widget.type === 'chart-bar'
}

export function isLineChart(widget: ChartWidget): widget is LineChartWidget {
  return widget.type === 'chart-line'
}

export function isPieChart(widget: ChartWidget): widget is PieChartWidget {
  return widget.type === 'chart-pie'
}

export function isAreaChart(widget: ChartWidget): widget is AreaChartWidget {
  return widget.type === 'chart-area'
}