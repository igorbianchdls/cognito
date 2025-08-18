import { atom, computed } from 'nanostores'
import type { 
  ChartWidget, 
  CreateChartWidgetProps, 
  BarChartWidget, 
  LineChartWidget, 
  PieChartWidget, 
  AreaChartWidget,
  BarChartConfig,
  LineChartConfig,
  PieChartConfig,
  AreaChartConfig
} from '@/types/chartWidgets'
import type { LayoutItem } from '@/types/baseWidget'

// Main charts atom
export const $chartWidgets = atom<ChartWidget[]>([])

// Selected chart atom
export const $selectedChartId = atom<string | null>(null)

// Computed for selected chart
export const $selectedChart = computed([$chartWidgets, $selectedChartId], (charts, selectedId) => {
  if (!selectedId) return null
  return charts.find(c => c.i === selectedId) || null
})

// Charts grouped by type
export const $chartsByType = computed([$chartWidgets], (charts) => {
  const grouped = {
    bar: [] as BarChartWidget[],
    line: [] as LineChartWidget[],
    pie: [] as PieChartWidget[],
    area: [] as AreaChartWidget[]
  }
  
  charts.forEach(chart => {
    switch (chart.type) {
      case 'chart':
      case 'chart-bar':
        grouped.bar.push(chart as BarChartWidget)
        break
      case 'chart-line':
        grouped.line.push(chart as LineChartWidget)
        break
      case 'chart-pie':
        grouped.pie.push(chart as PieChartWidget)
        break
      case 'chart-area':
        grouped.area.push(chart as AreaChartWidget)
        break
    }
  })
  
  return grouped
})

// Chart creation helpers
function createBaseChart(props: CreateChartWidgetProps): Omit<ChartWidget, 'config'> {
  const timestamp = Date.now()
  return {
    id: `chart-${timestamp}`,
    i: `chart-${timestamp}`,
    name: props.name,
    type: props.chartType,
    icon: props.icon || '📊',
    description: props.description || `${props.chartType} chart`,
    x: 0,
    y: 0,
    w: 4,
    h: 3,
    defaultWidth: 4,
    defaultHeight: 3,
    color: '#3B82F6'
  }
}

// Chart Actions
export const chartActions = {
  // Set all charts
  setCharts: (charts: ChartWidget[]) => {
    console.log('📊 Setting charts:', charts.length)
    $chartWidgets.set(charts)
  },

  // Add chart
  addChart: (props: CreateChartWidgetProps & { position?: { x: number; y: number }, size?: { w: number; h: number } }) => {
    console.log('➕ Adding chart:', props.chartType, props.name)
    
    const baseChart = createBaseChart(props)
    
    let chart: ChartWidget
    
    switch (props.chartType) {
      case 'chart':
      case 'chart-bar':
        chart = {
          ...baseChart,
          type: props.chartType,
          config: {
            colors: ['#2563eb'],
            enableGridY: true,
            enableGridX: false,
            groupMode: 'grouped',
            layout: 'vertical',
            animate: true,
            motionConfig: 'gentle',
            margin: { top: 12, right: 12, bottom: 60, left: 50 },
            ...props.config
          } as BarChartConfig
        } as BarChartWidget
        break
        
      case 'chart-line':
        chart = {
          ...baseChart,
          type: 'chart-line',
          config: {
            colors: ['#2563eb'],
            enableGridY: true,
            enableGridX: false,
            curve: 'linear',
            lineWidth: 2,
            pointSize: 5,
            enablePoints: true,
            animate: true,
            motionConfig: 'gentle',
            margin: { top: 12, right: 12, bottom: 60, left: 50 },
            ...props.config
          } as LineChartConfig
        } as LineChartWidget
        break
        
      case 'chart-pie':
        chart = {
          ...baseChart,
          type: 'chart-pie',
          config: {
            colors: ['#2563eb', '#16a34a', '#dc2626', '#ca8a04', '#9333ea'],
            innerRadius: 0,
            padAngle: 0.7,
            cornerRadius: 3,
            activeOuterRadiusOffset: 8,
            enableArcLinkLabels: true,
            arcLabelsSkipAngle: 10,
            animate: true,
            motionConfig: 'gentle',
            margin: { top: 40, right: 80, bottom: 40, left: 80 },
            ...props.config
          } as PieChartConfig
        } as PieChartWidget
        break
        
      case 'chart-area':
        chart = {
          ...baseChart,
          type: 'chart-area',
          config: {
            colors: ['#2563eb'],
            enableGridY: true,
            enableGridX: false,
            curve: 'linear',
            areaOpacity: 0.3,
            enablePoints: false,
            pointSize: 5,
            animate: true,
            motionConfig: 'gentle',
            margin: { top: 12, right: 12, bottom: 60, left: 50 },
            ...props.config
          } as AreaChartConfig
        } as AreaChartWidget
        break
        
      default:
        throw new Error(`Unknown chart type: ${props.chartType}`)
    }
    
    // Apply position and size if provided
    if (props.position) {
      chart.x = props.position.x
      chart.y = props.position.y
    }
    if (props.size) {
      chart.w = props.size.w
      chart.h = props.size.h
    }
    
    const currentCharts = $chartWidgets.get()
    $chartWidgets.set([...currentCharts, chart])
    
    return chart
  },

  // Edit chart
  editChart: (chartId: string, changes: Partial<ChartWidget>) => {
    console.log('✏️ Editing chart:', { chartId, changes })
    const currentCharts = $chartWidgets.get()
    
    const updatedCharts = currentCharts.map(chart => {
      if (chart.i !== chartId) return chart
      
      // Handle nested config.chartConfig from chat (fix for duplication bug)
      if (changes.config && typeof changes.config === 'object' && 'chartConfig' in changes.config) {
        const { config, ...otherChanges } = changes
        const chartConfig = (config as Record<string, unknown>).chartConfig as Record<string, unknown> // Extract nested chartConfig
        console.log('🔧 [CHART-FIX] Detected nested config.chartConfig, flattening:', { chartConfig })
        const result = {
          ...chart,
          ...otherChanges,
          config: { ...chart.config, ...chartConfig } // Apply chartConfig directly to chart.config
        }
        console.log('🔧 [CHART-FIX] Result config:', result.config)
        return result
      }
      
      // Regular merge for other changes
      return { ...chart, ...changes }
    })
    $chartWidgets.set(updatedCharts)
  },

  // Update chart config specifically
  updateChartConfig: <T extends ChartWidget>(chartId: string, configChanges: Partial<T['config']>) => {
    console.log('🔧 chartStore.updateChartConfig ENTRADA:', { chartId, configChanges })
    const currentCharts = $chartWidgets.get()
    
    const targetChart = currentCharts.find(c => c.i === chartId)
    console.log('🔧 Target chart ANTES update:', {
      id: targetChart?.i,
      type: targetChart?.type,
      configAntes: targetChart?.config,
      configKeysAntes: Object.keys(targetChart?.config || {})
    })
    
    const updatedCharts = currentCharts.map(chart => {
      if (chart.i === chartId) {
        const newChart = {
          ...chart,
          config: { ...chart.config, ...configChanges }
        }
        console.log('🔧 Chart DEPOIS update:', {
          id: newChart.i,
          configDepois: newChart.config,
          configKeysDepois: Object.keys(newChart.config || {}),
          changesToApply: configChanges
        })
        return newChart
      }
      return chart
    })
    
    $chartWidgets.set(updatedCharts)
    console.log('🔧 chartStore.$chartWidgets.set() chamado com sucesso')
    
    // Verificar se realmente foi atualizado
    setTimeout(() => {
      const verifyCharts = $chartWidgets.get()
      const verifyChart = verifyCharts.find(c => c.i === chartId)
      console.log('🔧 Verificação 50ms depois:', {
        chartId,
        configVerify: verifyChart?.config,
        updateSuccess: JSON.stringify(verifyChart?.config) !== JSON.stringify(targetChart?.config)
      })
    }, 50)
  },

  // Remove chart
  removeChart: (chartId: string) => {
    console.log('🗑️ Removing chart:', chartId)
    const currentCharts = $chartWidgets.get()
    const newCharts = currentCharts.filter(chart => chart.i !== chartId)
    $chartWidgets.set(newCharts)
    
    // Clear selection if removed chart was selected
    if ($selectedChartId.get() === chartId) {
      $selectedChartId.set(null)
    }
  },

  // Select chart
  selectChart: (chartId: string | null) => {
    console.log('🎯 Selecting chart:', chartId)
    $selectedChartId.set(chartId)
  },

  // Update layout (for react-grid-layout)
  updateChartsLayout: (layout: LayoutItem[]) => {
    console.log('📐 Updating charts layout for', layout.length, 'items')
    const currentCharts = $chartWidgets.get()
    
    const updatedCharts = currentCharts.map(chart => {
      const layoutItem = layout.find(l => l.i === chart.i)
      return layoutItem ? { ...chart, ...layoutItem } : chart
    })
    $chartWidgets.set(updatedCharts)
  },

  // Duplicate chart
  duplicateChart: (chartId: string) => {
    console.log('📋 Duplicating chart:', chartId)
    const currentCharts = $chartWidgets.get()
    const chartToDuplicate = currentCharts.find(chart => chart.i === chartId)
    
    if (!chartToDuplicate) {
      console.warn('Chart not found for duplication:', chartId)
      return
    }
    
    const timestamp = Date.now()
    const duplicatedChart: ChartWidget = {
      ...chartToDuplicate,
      id: `chart-${timestamp}`,
      i: `chart-${timestamp}`,
      name: `${chartToDuplicate.name} (Copy)`,
      x: chartToDuplicate.x + 1,
      y: chartToDuplicate.y + 1
    }
    
    $chartWidgets.set([...currentCharts, duplicatedChart])
    return duplicatedChart
  }
}