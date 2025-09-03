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
} from '@/types/apps/chartWidgets'
import type { LayoutItem } from '@/types/apps/baseWidget'

// BigQuery table type (moved from WidgetEditor)
export interface BigQueryTable {
  datasetId: string
  tableId: string
  projectId?: string
  description?: string
  numRows?: number
  numBytes?: number
  creationTime?: Date
  lastModifiedTime?: Date
  // Support for different API response formats
  DATASETID?: string
  TABLEID?: string
  NUMROWS?: number
  NUMBYTES?: number
}

// BigQuery field type (imported from TablesExplorer)
export interface BigQueryField {
  name: string
  type: 'string' | 'numeric' | 'date' | 'boolean'
  description?: string
}

// Function reference to invalidate adapter cache (set by compositeStore)
let invalidateAdapterCacheFn: ((widgetId: string) => void) | null = null
export function setInvalidateAdapterCacheFn(fn: (widgetId: string) => void) {
  invalidateAdapterCacheFn = fn
}

// Main charts atom
export const $chartWidgets = atom<ChartWidget[]>([])

// Selected chart atom
export const $selectedChartId = atom<string | null>(null)

// Chart data management atoms (moved from WidgetEditor)
export const $availableTables = atom<BigQueryTable[]>([])
export const $selectedTable = atom<string | null>(null)
export const $tableColumns = atom<BigQueryField[]>([])
export const $loadingTables = atom<boolean>(false)
export const $loadingColumns = atom<string | null>(null)
export const $loadingChartUpdate = atom<boolean>(false)

// Staging atoms for chart fields
export const $stagedXAxis = atom<BigQueryField[]>([])
export const $stagedYAxis = atom<BigQueryField[]>([])
export const $stagedFilters = atom<BigQueryField[]>([])

// Clear staging areas
export function clearStagingAreas() {
  $stagedXAxis.set([])
  $stagedYAxis.set([])
  $stagedFilters.set([])
}

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
            enableLabel: false,
            labelPosition: 'middle',
            labelSkipWidth: 0,
            labelSkipHeight: 0,
            borderRadius: 4,
            borderWidth: 0,
            animate: false,
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
            animate: false,
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
            animate: false,
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
            animate: false,
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
      // ONLY apply this fix when there's actually a chartConfig nested incorrectly
      if (changes.config && typeof changes.config === 'object' && 
          'chartConfig' in changes.config && 
          Object.keys(changes.config).length === 1 && // Only chartConfig, no other properties
          Object.keys(changes.config).includes('chartConfig')) {
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
      
      // Regular merge for other changes - preserve all config properties including containerConfig
      const result = { 
        ...chart, 
        ...changes,
        config: {
          ...chart.config,
          ...changes.config
        }
      }
      return result
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
    
    // Invalidate adapter cache to force re-computation
    invalidateAdapterCacheFn?.(chartId)
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
    console.log('[CHART-STORE] Atualizando layout de', layout.length, 'charts')
    const currentCharts = $chartWidgets.get()
    
    const updatedCharts = currentCharts.map(chart => {
      const layoutItem = layout.find(l => l.i === chart.i)
      if (layoutItem) {
        console.log('[CHART-STORE] Salvando posição:', chart.i, { x: layoutItem.x, y: layoutItem.y, w: layoutItem.w, h: layoutItem.h })
        return { ...chart, ...layoutItem }
      }
      return chart
    })
    $chartWidgets.set(updatedCharts)
    
    // Debug: Verificar se posições foram salvas no chartStore
    const verificacao = $chartWidgets.get()
    verificacao.forEach(chart => {
      console.log('[CHART-STORE] Estado final:', chart.i, { x: chart.x, y: chart.y, w: chart.w, h: chart.h })
    })
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
  },

  // Chart Data Management Functions (moved from WidgetEditor)
  
  // Load available BigQuery tables
  loadTables: async () => {
    $loadingTables.set(true)
    try {
      const response = await fetch('/api/bigquery?action=tables&dataset=biquery_data')
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        $availableTables.set(result.data)
      } else {
        throw new Error(result.error || 'Failed to load tables')
      }
    } catch (err) {
      console.error('Error loading tables:', err)
    } finally {
      $loadingTables.set(false)
    }
  },

  // Load columns for a specific table
  loadTableColumns: async (tableId: string) => {
    $loadingColumns.set(tableId)
    try {
      const response = await fetch(`/api/bigquery?action=schema&dataset=biquery_data&table=${tableId}`)
      const result = await response.json()
      
      if (result.success && Array.isArray(result.data)) {
        $tableColumns.set(result.data)
      } else {
        throw new Error(result.error || 'Failed to load table columns')
      }
    } catch (err) {
      console.error('Error loading table columns:', err)
      $tableColumns.set([])
    } finally {
      $loadingColumns.set(null)
    }
  },

  // Select table and load its columns
  selectTable: async (tableId: string) => {
    $selectedTable.set(tableId)
    await chartActions.loadTableColumns(tableId)
  },

  // Chart field staging management
  addToStagingArea: (field: BigQueryField, area: 'xAxis' | 'yAxis' | 'filters') => {
    // Remove from all areas first
    const currentXAxis = $stagedXAxis.get().filter(f => f.name !== field.name)
    const currentYAxis = $stagedYAxis.get().filter(f => f.name !== field.name)
    const currentFilters = $stagedFilters.get().filter(f => f.name !== field.name)
    
    $stagedXAxis.set(currentXAxis)
    $stagedYAxis.set(currentYAxis)  
    $stagedFilters.set(currentFilters)
    
    // Add to the specified area
    switch (area) {
      case 'xAxis':
        $stagedXAxis.set([...currentXAxis, field])
        break
      case 'yAxis':
        $stagedYAxis.set([...currentYAxis, field])
        break
      case 'filters':
        $stagedFilters.set([...currentFilters, field])
        break
    }
  },

  // Remove field from staging area
  removeFromStagingArea: (fieldName: string, area: 'xAxis' | 'yAxis' | 'filters') => {
    switch (area) {
      case 'xAxis':
        const currentXAxis = $stagedXAxis.get().filter(f => f.name !== fieldName)
        $stagedXAxis.set(currentXAxis)
        break
      case 'yAxis':
        const currentYAxis = $stagedYAxis.get().filter(f => f.name !== fieldName)
        $stagedYAxis.set(currentYAxis)
        break
      case 'filters':
        const currentFilters = $stagedFilters.get().filter(f => f.name !== fieldName)
        $stagedFilters.set(currentFilters)
        break
    }
  },

  // Update chart with staged data
  updateChartWithStagedData: async (chartId: string) => {
    if (!chartId) return

    $loadingChartUpdate.set(true)
    try {
      const stagedXAxis = $stagedXAxis.get()
      const stagedYAxis = $stagedYAxis.get()
      const stagedFilters = $stagedFilters.get()
      const selectedTable = $selectedTable.get()
      
      if (!selectedTable) {
        throw new Error('No table selected')
      }
      
      // Validate required fields (like ChartPreview)
      if (stagedXAxis.length === 0 || stagedYAxis.length === 0) {
        throw new Error('X-Axis and Y-Axis fields are required')
      }
      
      // Generate query exactly like ChartPreview does
      const xAxisColumn = stagedXAxis[0]
      const yAxisColumn = stagedYAxis[0]
      
      // Helper function (simplified - no aggregation property available)
      const getAggregationFunction = (field: typeof yAxisColumn) => {
        const lowerType = field.type.toLowerCase()
        
        if (lowerType.includes('string') || lowerType.includes('text')) {
          return 'COUNT'
        }
        
        if (lowerType.includes('int') || lowerType.includes('numeric') || lowerType.includes('float')) {
          return 'SUM'
        }
        
        return 'COUNT'
      }
      
      // Build SELECT clause (like ChartPreview)
      const selectCols = [xAxisColumn.name]
      const aggregation = getAggregationFunction(yAxisColumn)
      selectCols.push(`${aggregation}(${yAxisColumn.name}) as ${yAxisColumn.name}_agg`)

      // Build WHERE clause for filters (like ChartPreview)
      let whereClause = ''
      if (stagedFilters.length > 0) {
        const filterConditions = stagedFilters.map(filter => {
          return `${filter.name} IS NOT NULL`
        }).join(' AND ')
        
        if (filterConditions) {
          whereClause = `WHERE ${filterConditions}`
        }
      }

      // Generate query exactly like ChartPreview
      const query = `
SELECT ${selectCols.join(', ')}
FROM \`creatto-463117.biquery_data.${selectedTable}\`
${whereClause}
GROUP BY ${xAxisColumn.name}
ORDER BY ${yAxisColumn.name}_agg DESC
LIMIT 50
      `.trim()
      
      console.log('🔄 Executing query to update chart data:', query)
      
      // Execute BigQuery (like table updateTableData)
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)
      
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          query: query
        }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`API response: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('📊 Chart query execution result:', result)
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const rawData = result.data.data
        const xAxisColumn = stagedXAxis[0]
        const yAxisColumn = stagedYAxis[0]
        
        console.log('📊 Chart Update: Transformando dados', {
          rawDataLength: rawData.length,
          sampleRow: rawData[0],
          xColumn: xAxisColumn.name,
          yColumn: `${yAxisColumn.name}_agg`
        })
        
        // Transform data for chart (exactly like ChartPreview)
        const transformedData = rawData.map((row: Record<string, unknown>) => ({
          x: String(row[xAxisColumn.name] || 'Unknown'),
          y: Number(row[`${yAxisColumn.name}_agg`] || 0),
          label: String(row[xAxisColumn.name] || 'Unknown'),
          value: Number(row[`${yAxisColumn.name}_agg`] || 0)
        }))

        console.log('📊 Chart Update: Dados transformados', {
          transformedLength: transformedData.length,
          sampleTransformed: transformedData[0]
        })

        // Prepare config update with transformed data (like ChartBuilder)
        const configUpdate: Record<string, unknown> = {}
        
        // Update xAxis configuration
        configUpdate.xAxis = {
          field: xAxisColumn.name,
          name: xAxisColumn.name,
          type: xAxisColumn.type
        }
        
        // Update yAxis configuration  
        configUpdate.yAxis = {
          field: yAxisColumn.name,
          name: yAxisColumn.name,
          type: yAxisColumn.type
        }
        
        // Update filters
        configUpdate.filters = stagedFilters.map(field => ({
          name: field.name,
          type: field.type,
          value: ''
        }))
        
        // Set data source and columns
        configUpdate.dataSource = selectedTable
        const tableColumns = $tableColumns.get()
        configUpdate.columns = tableColumns.map(col => ({
          name: col.name,
          type: col.type,
          sourceTable: selectedTable
        }))
        
        // Set the transformed chart data (not raw data)
        configUpdate.data = transformedData
        
        console.log('🔄 Updating chart config with new data:', configUpdate)
        
        // Apply config update and bigquery data
        chartActions.updateChartConfig(chartId, configUpdate)
        
        // Update bigqueryData directly on the chart widget (exactly like ChartBuilder does)
        const currentCharts = $chartWidgets.get()
        const updatedCharts = currentCharts.map(chart => {
          if (chart.i === chartId) {
            return {
              ...chart,
              bigqueryData: {
                chartType: chart.type.replace('chart-', '') || 'bar', // Extract chart type
                data: transformedData, // Use transformed data like ChartBuilder
                xColumn: xAxisColumn.name,
                yColumn: yAxisColumn.name,
                query: query,
                source: 'bigquery',
                table: selectedTable,
                lastUpdated: new Date().toISOString()
              }
            }
          }
          return chart
        })
        $chartWidgets.set(updatedCharts)
        
        // Clear staging areas after successful update
        clearStagingAreas()
        
        console.log('✅ Chart updated successfully with', result.data.data.length, 'rows')
        
      } else {
        const errorMsg = result.error || 'No data returned from query'
        throw new Error(errorMsg)
      }
      
    } catch (err) {
      console.error('❌ Failed to update chart data:', err)
    } finally {
      $loadingChartUpdate.set(false)
    }
  }
}