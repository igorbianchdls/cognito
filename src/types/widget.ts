export interface Widget {
  id: string
  name: string
  type: string
  icon: string
  description: string
  defaultWidth: number
  defaultHeight: number
}

export interface ChartConfig {
  // Visual & Colors
  colors?: string[]
  backgroundColor?: string
  borderRadius?: number
  borderWidth?: number
  
  // Grid & Axes
  enableGridX?: boolean
  enableGridY?: boolean
  axisBottom?: {
    legend?: string
    tickRotation?: number
    tickSize?: number
    tickPadding?: number
  }
  axisLeft?: {
    legend?: string
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
  title?: string
  subtitle?: string
  titleFontSize?: number
  titleColor?: string
  
  // Animation
  animate?: boolean
  motionConfig?: 'default' | 'gentle' | 'wobbly' | 'stiff' | 'slow'
  
  // Chart-specific properties
  groupMode?: 'grouped' | 'stacked' // Bar charts
  layout?: 'horizontal' | 'vertical' // Bar charts
  innerRadius?: number // Pie charts
  padAngle?: number // Pie charts
  cornerRadius?: number // Pie charts
  enableArea?: boolean // Line charts
  curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX' // Line/Area charts
  pointSize?: number // Line charts
  enablePoints?: boolean // Line charts
}

export interface DroppedWidget extends Widget {
  i: string
  x: number
  y: number
  w: number
  h: number
  color?: string
  chartConfig?: ChartConfig
}

export interface Position {
  x: number
  y: number
}

export interface LayoutItem {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW?: number
  minH?: number
}