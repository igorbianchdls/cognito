export interface Widget {
  id: string
  name: string
  type: string
  icon: string
  description: string
  defaultWidth: number
  defaultHeight: number
}

// Chart-specific configuration
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
  activeOuterRadiusOffset?: number // Pie charts
  enableArcLinkLabels?: boolean // Pie charts
  arcLabelsSkipAngle?: number // Pie charts
  enableArea?: boolean // Line/Area charts
  areaOpacity?: number // Area charts
  curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX' // Line/Area charts
  lineWidth?: number // Line/Area charts
  pointSize?: number // Line charts
  enablePoints?: boolean // Line charts
}

// Legacy ChartConfig interface for backward compatibility with old KPI widgets
export interface LegacyChartConfigWithKPI extends ChartConfig {
  // Legacy KPI properties that were stored in chartConfig
  kpiName?: string
  kpiValue?: number
  kpiUnit?: string
  kpiTarget?: number
  kpiChange?: number
  kpiTrend?: 'increasing' | 'decreasing' | 'stable'
  kpiStatus?: 'on-target' | 'above-target' | 'below-target' | 'critical'
  showTarget?: boolean
  showTrend?: boolean
  kpiVisualizationType?: 'card' | 'display' | 'gauge'
  kpiColorScheme?: 'green' | 'blue' | 'orange' | 'red'
  kpiMetric?: string
  kpiCalculation?: string
  kpiTimeRange?: string
  kpiValueFontSize?: number
  kpiValueColor?: string
  kpiValueFontWeight?: number
  kpiNameFontSize?: number
  kpiNameColor?: string
  kpiNameFontWeight?: number
  kpiBackgroundColor?: string
  kpiBorderColor?: string
  kpiBorderWidth?: number
  kpiBorderRadius?: number
  kpiPadding?: number
  kpiTextAlign?: 'left' | 'center' | 'right'
  kpiShadow?: boolean
  kpiChangeColor?: string
  kpiTargetColor?: string
}

// KPI-specific configuration
export interface KPIConfig {
  // Data properties
  name?: string
  value?: number
  previousValue?: number
  unit?: string
  target?: number
  change?: number
  trend?: 'increasing' | 'decreasing' | 'stable'
  status?: 'on-target' | 'above-target' | 'below-target' | 'critical'
  metric?: string
  calculation?: string
  timeRange?: string
  
  // Data source and simulation control
  dataSource?: string
  refreshRate?: string
  enableSimulation?: boolean
  simulationRange?: {
    min?: number
    max?: number
    baseValue?: number
  }
  
  // Display options
  showTarget?: boolean
  showTrend?: boolean
  visualizationType?: 'card' | 'display' | 'gauge'
  colorScheme?: 'green' | 'blue' | 'orange' | 'red'
  
  // Design properties
  valueFontSize?: number
  valueColor?: string
  valueFontWeight?: number
  nameFontSize?: number
  nameColor?: string
  nameFontWeight?: number
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  padding?: number
  textAlign?: 'left' | 'center' | 'right'
  shadow?: boolean
  changeColor?: string
  targetColor?: string
}

// Gallery-specific configuration
export interface GalleryConfig {
  // Data properties
  imageUrl?: string
  title?: string
  description?: string
  
  // Layout properties
  columns?: number
  gap?: number
  aspectRatio?: 'square' | '16:9' | '4:3' | '3:2' | 'auto'
  
  // Visual properties
  borderRadius?: number
  shadow?: boolean
  showTitles?: boolean
  showDescriptions?: boolean
  
  // Interaction properties
  enableLightbox?: boolean
  enableHover?: boolean
  hoverEffect?: 'zoom' | 'overlay' | 'none'
  
  // Data source
  dataSource?: string
  refreshRate?: string
}

// Navigation-specific configuration
export interface NavigationConfig {
  // Visual properties
  backgroundColor?: string
  borderColor?: string
  borderRadius?: number
  
  // Tab properties
  tabStyle?: 'default' | 'rounded' | 'pills'
  tabPosition?: 'top' | 'bottom'
  showAddButton?: boolean
  maxTabs?: number
  
  // Animation properties
  animateSwitch?: boolean
  animationDuration?: number
  
  // Sidebar theme (new for sidebar layout)
  theme?: 'default' | 'dark' | 'blue' | 'green' | 'purple' | 'orange'
  sidebarWidth?: number
}

// Image-specific configuration
export interface ImageConfig {
  // Basic properties
  src?: string
  alt?: string
  title?: string
  
  // Layout properties
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none'
  objectPosition?: string
  
  // Style properties
  borderRadius?: number
  borderWidth?: number
  borderColor?: string
  shadow?: boolean
  opacity?: number
  backgroundColor?: string
  
  // Behavior properties
  clickAction?: 'none' | 'link' | 'modal'
  linkUrl?: string
  openInNewTab?: boolean
  
  // Fallback properties
  fallbackSrc?: string
  showPlaceholder?: boolean
  placeholderText?: string
}

// Container configuration interface
export interface ContainerConfig {
  backgroundColor?: string
  backgroundOpacity?: number
  borderColor?: string
  borderOpacity?: number
  borderWidth?: number
  borderRadius?: number
}

// Unified widget configuration interface
export interface WidgetConfig {
  chartConfig?: import('./chartWidgets').BaseChartConfig  // For chart widgets (Bar, Line, Pie, Area)
  kpiConfig?: KPIConfig      // For KPI widgets
  tableConfig?: import('./tableWidgets').TableConfig  // For table widgets (import from tableWidgets.ts)
  galleryConfig?: GalleryConfig  // For gallery widgets
  imageConfig?: ImageConfig  // For image widgets
  navigationConfig?: NavigationConfig  // For navigation widgets
  barChartConfig?: { bigqueryData: import('../../stores/apps/barChartStore').BarChartBigQueryData, styling: import('../../stores/apps/barChartStore').BarChartConfig['styling'] }  // For bar chart widgets
  lineChartConfig?: { bigqueryData: import('../../stores/apps/lineChartStore').LineChartBigQueryData, styling: import('../../stores/apps/lineChartStore').LineChartConfig['styling'] }  // For line chart widgets
  containerConfig?: ContainerConfig  // For widget container styling
}

export interface DroppedWidget extends Widget {
  i: string
  x: number
  y: number
  w: number
  h: number
  color?: string
  config?: WidgetConfig       // New unified configuration
  chartConfig?: ChartConfig   // Deprecated: kept for backward compatibility
  barChartConfig?: import('../../stores/apps/barChartStore').BarChartConfig  // Direct access for bar charts
  lineChartConfig?: import('../../stores/apps/lineChartStore').LineChartConfig  // Direct access for line charts
  kpiConfig?: import('./kpiWidgets').KPIConfig  // Direct access for KPIs
  tableConfig?: import('./tableWidgets').TableConfig  // Direct access for tables
  bigqueryData?: {            // BigQuery data from Chart Builder
    chartType: string
    data: Array<{ x: string; y: number; label: string; value: number }>
    xColumn: string
    yColumn: string
    query: string
    source: string
    table: string
    lastUpdated: string
  }
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

// Type guard functions
export function isImageWidget(widget: DroppedWidget): boolean {
  return widget.type === 'image'
}

export function isNavigationWidget(widget: DroppedWidget): boolean {
  return widget.type === 'navigation'
}