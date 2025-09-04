import { atom } from 'nanostores'

export interface BigQueryField {
  name: string
  type: 'STRING' | 'INTEGER' | 'FLOAT' | 'TIMESTAMP' | 'DATE' | 'BOOLEAN'
  mode: 'NULLABLE' | 'REQUIRED' | 'REPEATED'
  description?: string
  aggregation?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
}

export interface BarChartBigQueryData {
  query: string
  selectedTable: string | null
  columns: {
    xAxis: BigQueryField[]
    yAxis: BigQueryField[]
    filters: BigQueryField[]
  }
  data: Record<string, unknown>[] | null
  lastExecuted: Date | null
  isLoading: boolean
  error: string | null
}

export interface BarChartConfig {
  id: string
  name: string
  bigqueryData: BarChartBigQueryData
  chartType: 'bar'
  styling: {
    colors: string[]
    showLegend: boolean
    showGrid: boolean
    title?: string
  }
  position: {
    x: number
    y: number
    w: number
    h: number
  }
}

export interface BarChartStore {
  barCharts: BarChartConfig[]
}

const initialBarChartState: BarChartStore = {
  barCharts: []
}

export const $barChartStore = atom<BarChartStore>(initialBarChartState)

export const barChartActions = {
  addBarChart: (config: Omit<BarChartConfig, 'id'>) => {
    const newChart: BarChartConfig = {
      ...config,
      id: `bar-chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    const currentState = $barChartStore.get()
    $barChartStore.set({
      ...currentState,
      barCharts: [...currentState.barCharts, newChart]
    })

    return newChart
  },

  updateBarChart: (chartId: string, updates: Partial<BarChartConfig>) => {
    const currentState = $barChartStore.get()
    $barChartStore.set({
      ...currentState,
      barCharts: currentState.barCharts.map(chart =>
        chart.id === chartId ? { ...chart, ...updates } : chart
      )
    })
  },

  removeBarChart: (chartId: string) => {
    const currentState = $barChartStore.get()
    $barChartStore.set({
      ...currentState,
      barCharts: currentState.barCharts.filter(chart => chart.id !== chartId)
    })
  },

  updateBigQueryData: (chartId: string, bigqueryData: Partial<BarChartBigQueryData>) => {
    const currentState = $barChartStore.get()
    $barChartStore.set({
      ...currentState,
      barCharts: currentState.barCharts.map(chart =>
        chart.id === chartId 
          ? { 
              ...chart, 
              bigqueryData: { ...chart.bigqueryData, ...bigqueryData }
            } 
          : chart
      )
    })
  },

  generateBarChartQuery: (xAxis: BigQueryField[], yAxis: BigQueryField[], filters: BigQueryField[], tableName: string): string => {
    let query = `SELECT `
    
    const selectFields: string[] = []
    
    xAxis.forEach(field => {
      selectFields.push(field.name)
    })
    
    yAxis.forEach(field => {
      if (field.aggregation && field.aggregation !== 'COUNT') {
        selectFields.push(`${field.aggregation}(${field.name}) as ${field.name}`)
      } else if (field.aggregation === 'COUNT') {
        selectFields.push(`COUNT(*) as ${field.name}`)
      } else {
        selectFields.push(field.name)
      }
    })
    
    query += selectFields.join(', ')
    query += ` FROM \`${tableName}\``
    
    if (filters.length > 0) {
      const whereConditions = filters.map(filter => `${filter.name} IS NOT NULL`).join(' AND ')
      query += ` WHERE ${whereConditions}`
    }
    
    if (xAxis.length > 0) {
      query += ` GROUP BY ${xAxis.map(field => field.name).join(', ')}`
    }
    
    query += ` LIMIT 1000`
    
    return query
  },

  executeBarChartQuery: async (chartId: string): Promise<void> => {
    const currentState = $barChartStore.get()
    const chart = currentState.barCharts.find(c => c.id === chartId)
    
    if (!chart) return

    barChartActions.updateBigQueryData(chartId, { 
      isLoading: true, 
      error: null 
    })

    try {
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: chart.bigqueryData.query })
      })

      if (!response.ok) {
        throw new Error(`Query failed: ${response.statusText}`)
      }

      const data = await response.json()

      barChartActions.updateBigQueryData(chartId, {
        data: data.rows || [],
        lastExecuted: new Date(),
        isLoading: false,
        error: null
      })
    } catch (error) {
      barChartActions.updateBigQueryData(chartId, {
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    }
  },

  refreshBarChart: async (chartId: string) => {
    await barChartActions.executeBarChartQuery(chartId)
  }
}