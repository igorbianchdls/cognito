import { BaseWidget } from './baseWidget'

// KPI-specific configuration (clean, no legacy props)
export interface KPIConfig {
  // Data properties
  name?: string
  value?: number
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

// KPI Widget interface
export interface KPIWidget extends BaseWidget {
  type: 'kpi'
  config: KPIConfig
}

// KPI creation props
export interface CreateKPIWidgetProps {
  name: string
  icon?: string
  description?: string
  config?: Partial<KPIConfig>
}

// KPI data interface (for runtime data)
export interface KPIData {
  currentValue: number
  previousValue?: number
  target?: number
  change?: number
  trend: 'increasing' | 'decreasing' | 'stable'
  status: 'on-target' | 'above-target' | 'below-target' | 'critical'
  lastUpdated: string
}

// KPI simulation data
export interface KPISimulationData {
  currentValue: number
  previousValue: number
  target: number
  change: number
}

// Type guards
export function isKPIWidget(widget: BaseWidget): widget is KPIWidget {
  return widget.type === 'kpi'
}

// KPI status calculation helper
export function calculateKPIStatus(
  currentValue: number, 
  target?: number
): KPIConfig['status'] {
  if (!target) return 'critical'
  
  const percentage = (currentValue / target) * 100
  if (percentage >= 100) return 'on-target'
  if (percentage >= 80) return 'above-target'
  if (percentage >= 60) return 'below-target'
  return 'critical'
}

// KPI trend calculation helper
export function calculateKPITrend(change: number): KPIConfig['trend'] {
  if (Math.abs(change) < 0.5) return 'stable'
  return change > 0 ? 'increasing' : 'decreasing'
}

// KPI color scheme mapping
export const KPI_COLOR_SCHEMES = {
  green: {
    primary: '#16a34a',
    background: '#f0fdf4',
    border: '#22c55e'
  },
  blue: {
    primary: '#2563eb',
    background: '#eff6ff',
    border: '#3b82f6'
  },
  orange: {
    primary: '#ea580c',
    background: '#fff7ed',
    border: '#f97316'
  },
  red: {
    primary: '#dc2626',
    background: '#fef2f2',
    border: '#ef4444'
  }
} as const

// Default KPI configuration
export const DEFAULT_KPI_CONFIG: Required<Omit<KPIConfig, 'name' | 'value' | 'unit' | 'target' | 'change' | 'trend' | 'status' | 'metric' | 'calculation' | 'timeRange' | 'dataSource' | 'refreshRate' | 'simulationRange'>> = {
  enableSimulation: true,
  showTarget: true,
  showTrend: true,
  visualizationType: 'card',
  colorScheme: 'blue',
  valueFontSize: 36,
  valueColor: '#1f2937',
  valueFontWeight: 700,
  nameFontSize: 14,
  nameColor: '#6b7280',
  nameFontWeight: 500,
  backgroundColor: '#ffffff',
  borderColor: '#e5e7eb',
  borderWidth: 1,
  borderRadius: 8,
  padding: 16,
  textAlign: 'center',
  shadow: false,
  changeColor: '#16a34a',
  targetColor: '#9ca3af'
}