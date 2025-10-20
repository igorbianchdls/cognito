// Widget Mapper - Converte tool call results em widget operations
// Baseado na mesma lógica do CodeEditor

import { kpiActions, $kpiWidgets } from '@/stores/apps/kpiStore'
import { tableActions, $tableWidgets } from '@/stores/apps/tableStore'
import { barChartActions, $barChartStore, type BarChartConfig } from '@/stores/apps/barChartStore'
import { lineChartActions, $lineChartStore, type LineChartConfig } from '@/stores/apps/lineChartStore'
import { pieChartActions, $pieChartStore, type PieChartConfig } from '@/stores/apps/pieChartStore'
import { areaChartActions, $areaChartStore, type AreaChartConfig } from '@/stores/apps/areaChartStore'
import { horizontalBarChartActions, $horizontalBarChartStore, type HorizontalBarChartConfig } from '@/stores/apps/horizontalBarChartStore'

// Types for operations
interface CreateKPIParams {
  type: 'kpi'
  table: string
  field: string
  calculation: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
  title: string
}

interface CreateChartParams {
  type: 'chart'
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'
  table: string
  xField: string
  yField: string
  aggregation: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
  title: string
}

interface CreateTableParams {
  type: 'table'
  table: string
  columns: string[]
  title?: string
}

interface UpdateParams {
  newTitle?: string
  newTable?: string
  newField?: string
  newCalculation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
  newXField?: string
  newYField?: string
  newChartType?: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar'
  newAggregation?: 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX'
  newColumns?: string[]
}

interface WidgetOperation {
  action: 'create' | 'update' | 'delete'
  type?: 'kpi' | 'chart' | 'table'
  widgetName?: string
  params: CreateKPIParams | CreateChartParams | CreateTableParams | UpdateParams
}

// Main handler - processes array of operations
export async function handleWidgetOperations(operations: WidgetOperation[]) {
  console.log('⚙️ Processing', operations.length, 'widget operations')
  
  for (const operation of operations) {
    try {
      console.log('🔧 Processing operation:', operation)
      
      switch (operation.action) {
        case 'create':
          await handleCreateOperation(operation)
          break
        case 'update':
          await handleUpdateOperation(operation)
          break
        case 'delete':
          await handleDeleteOperation(operation)
          break
        default:
          console.warn('⚠️ Unknown operation action:', operation.action)
      }
    } catch (error) {
      console.error('❌ Error processing operation:', error)
      // Continue with next operation even if one fails
    }
  }
}

// Handler for create operations
async function handleCreateOperation(operation: WidgetOperation) {
  console.log('➕ Creating widget:', operation.type)
  
  switch (operation.type) {
    case 'kpi':
      await createKPIFromParams(operation.params as CreateKPIParams)
      break
    case 'chart':
      await createChartFromParams(operation.params as CreateChartParams)
      break
    case 'table':
      await createTableFromParams(operation.params as CreateTableParams)
      break
    default:
      console.warn('⚠️ Unknown widget type:', operation.type)
  }
}

// Handler for update operations
async function handleUpdateOperation(operation: WidgetOperation) {
  console.log('🔄 Updating widget:', operation.widgetName)
  
  // Detect widget type by name
  if (!operation.widgetName) {
    console.warn('⚠️ No widget name provided for update operation')
    return
  }
  const widgetType = detectWidgetType(operation.widgetName)
  
  switch (widgetType) {
    case 'kpi':
      await updateKPIFromParams(operation.widgetName, operation.params as UpdateParams)
      break
    case 'chart':
      await updateChartFromParams(operation.widgetName, operation.params as UpdateParams)
      break
    case 'table':
      await updateTableFromParams(operation.widgetName, operation.params as UpdateParams)
      break
    default:
      console.warn('⚠️ Could not determine widget type for:', operation.widgetName)
  }
}

// Handler for delete operations
async function handleDeleteOperation(operation: WidgetOperation) {
  console.log('🗑️ Deleting widget:', operation.widgetName)
  
  if (!operation.widgetName) {
    console.warn('⚠️ No widget name provided for delete operation')
    return
  }
  const widgetType = detectWidgetType(operation.widgetName)
  
  switch (widgetType) {
    case 'kpi':
      const kpis = $kpiWidgets.get()
      const kpi = kpis.find(k => k.config.name === operation.widgetName)
      if (kpi) {
        kpiActions.removeKPI(kpi.i)
        console.log('✅ KPI deleted successfully')
      }
      break
    case 'chart':
      // Find and delete chart from appropriate store
      const barCharts = $barChartStore.get().barCharts
      const barChart = barCharts.find(c => c.name === operation.widgetName)
      if (barChart) {
        barChartActions.removeBarChart(barChart.id)
        console.log('✅ Chart deleted successfully')
      }
      // Add similar logic for other chart types...
      break
    case 'table':
      const tables = $tableWidgets.get()
      const table = tables.find(t => t.name === operation.widgetName)
      if (table) {
        tableActions.removeTable(table.i)
        console.log('✅ Table deleted successfully')
      }
      break
  }
}

// CREATE FUNCTIONS - Based on CodeEditor logic

async function createKPIFromParams(params: CreateKPIParams) {
  console.log('🎯 Creating KPI with params:', params)
  
  try {
    // 1. Generate query (same as CodeEditor)
    const query = `SELECT ${params.calculation}(${params.field}) as value FROM \`creatto-463117.biquery_data.${params.table}\``
    
    console.log('📊 Generated query:', query)
    
    // 2. Execute BigQuery
    console.log('🔍 Executing BigQuery...')
    const response = await fetch('/api/bigquery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'execute',
        query: query
      })
    })
    
    if (!response.ok) {
      throw new Error(`BigQuery failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    console.log('📈 BigQuery result:', result)
    
    const kpiValue = result.success && result.data?.data?.[0]?.value || 0
    console.log('💰 Calculated KPI value:', kpiValue)
    
    // 3. Create KPI in store (exactly like CodeEditor)
    const newKPI = kpiActions.addKPI({
      name: params.title,
      icon: '🎯',
      description: `KPI from ${params.table}`,
      config: {
        name: params.title,
        value: kpiValue,
        calculation: params.calculation,
        metric: params.field,
        unit: '$', // Could be enhanced to detect from field type
        dataSourceType: 'bigquery',
        bigqueryData: {
          selectedTable: params.table,
          kpiValueFields: [{ name: params.field, type: 'NUMERIC' }],
          filterFields: [],
          query: query,
          calculatedValue: kpiValue,
          lastExecuted: new Date(),
          isLoading: false,
          error: null
        }
      }
    })
    
    console.log('✅ KPI created successfully:', newKPI)
    
  } catch (error) {
    console.error('❌ Failed to create KPI:', error)
  }
}

async function createChartFromParams(params: CreateChartParams) {
  console.log('📊 Creating chart with params:', params)
  
  try {
    // 1. Generate query for chart
    const query = `SELECT ${params.xField}, ${params.aggregation}(${params.yField}) as value FROM \`creatto-463117.biquery_data.${params.table}\` GROUP BY ${params.xField} ORDER BY value DESC LIMIT 100`
    
    console.log('📊 Generated chart query:', query)
    
    // 2. Execute BigQuery
    const response = await fetch('/api/bigquery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', query })
    })
    
    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    const chartData = result.success && result.data?.data ? result.data.data : []
    
    console.log('📈 Chart data retrieved:', chartData.length, 'rows')
    
    // 3. Base chart configuration
    const baseChartConfig = {
      name: params.title,
      bigqueryData: {
        query,
        selectedTable: params.table,
        columns: {
          xAxis: [{ name: params.xField, type: 'STRING', mode: 'NULLABLE' }],
          yAxis: [{ name: params.yField, type: 'NUMERIC', mode: 'NULLABLE', aggregation: params.aggregation }],
          filters: []
        },
        data: chartData,
        lastExecuted: new Date(),
        isLoading: false,
        error: null
      },
      position: { x: 0, y: 0, w: 4, h: 3 }
    }
    
    // 4. Create chart based on type (use specific action)
    switch (params.chartType) {
      case 'bar':
        barChartActions.addBarChart({
          ...baseChartConfig,
          chartType: 'bar',
          styling: {
            colors: ['#2563eb'],
            showLegend: true,
            showGrid: true,
            title: params.title
          }
        })
        break
      case 'line':
        lineChartActions.addLineChart({
          ...baseChartConfig,
          chartType: 'line',
          styling: {
            colors: ['#10b981'],
            showLegend: true,
            showGrid: true,
            title: params.title
          }
        })
        break
      case 'pie':
        pieChartActions.addPieChart({
          ...baseChartConfig,
          chartType: 'pie',
          styling: {
            colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
            showLegend: true,
            showGrid: false,
            title: params.title
          }
        })
        break
      case 'area':
        areaChartActions.addAreaChart({
          ...baseChartConfig,
          chartType: 'area',
          styling: {
            colors: ['#8b5cf6'],
            showLegend: true,
            showGrid: true,
            title: params.title,
            areaOpacity: 0.4
          }
        })
        break
      case 'horizontal-bar':
        horizontalBarChartActions.addHorizontalBarChart({
          ...baseChartConfig,
          chartType: 'horizontal-bar',
          styling: {
            colors: ['#10b981'],
            showLegend: true,
            showGrid: true,
            title: params.title
          }
        })
        break
      default:
        console.warn('⚠️ Unknown chart type:', params.chartType)
        return
    }
    
    console.log('✅ Chart created successfully:', params.chartType)
    
  } catch (error) {
    console.error('❌ Failed to create chart:', error)
  }
}

async function createTableFromParams(params: CreateTableParams) {
  console.log('📋 Creating table with params:', params)
  
  try {
    // 1. Generate SQL query (same as CodeEditor)
    const query = `SELECT ${params.columns.join(', ')} FROM \`creatto-463117.biquery_data.${params.table}\` LIMIT 100`
    
    console.log('📊 Generated table query:', query)
    
    // 2. Execute BigQuery
    const response = await fetch('/api/bigquery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', query })
    })
    
    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.data?.data && Array.isArray(result.data.data)) {
      const data = result.data.data
      
      console.log('📈 Table data retrieved:', data.length, 'rows')
      
      // 3. Create Table using the same action as CodeEditor
      tableActions.addTable({
        name: params.title || `${params.table} - Table`,
        icon: '📋',
        description: `Table from ${params.table}`,
        position: { x: 0, y: 0 },
        size: { w: 72, h: 200 },
        config: {
          data: data, // Real BigQuery data
          columns: params.columns.map((col: string) => ({
            id: col,
            header: col,
            accessorKey: col,
            sortable: true,
            type: 'text' as const
          })),
          showPagination: true,
          showColumnToggle: true,
          pageSize: 10,
          searchPlaceholder: 'Buscar...',
          dataSource: 'BigQuery'
        }
      })
      
      console.log('✅ Table created successfully:', params.title || params.table)
    } else {
      throw new Error(result.error || 'No data returned')
    }
  } catch (error) {
    console.error('❌ Failed to create table:', error)
  }
}

// UPDATE FUNCTIONS - Based on CodeEditor logic

async function updateKPIFromParams(widgetName: string, params: UpdateParams) {
  console.log('🔄 Updating KPI:', widgetName)
  
  try {
    // 1. Find existing KPI by name (same as CodeEditor)
    const currentKPIs = $kpiWidgets.get()
    const existingKPI = currentKPIs.find(kpi => kpi.config.name === widgetName)
    
    if (!existingKPI) {
      throw new Error(`KPI "${widgetName}" not found`)
    }
    
    console.log('Found KPI to update:', widgetName, '(ID:', existingKPI.i, ')')
    
    // 2. Get current data
    const currentData = existingKPI.config.bigqueryData
    
    // 3. Apply changes (use new values or keep current ones)
    const updatedTable = params.newTable || currentData?.selectedTable
    const updatedField = params.newField || (currentData?.kpiValueFields?.[0]?.name)
    const updatedCalculation = params.newCalculation || existingKPI.config.calculation
    const updatedTitle = params.newTitle || existingKPI.config.name
    
    if (!updatedTable || !updatedField || !updatedCalculation) {
      throw new Error('Missing required KPI parameters')
    }
    
    console.log('Updating KPI:', updatedTable + '.' + updatedField, '(' + updatedCalculation + ')')
    
    // 4. Generate and execute new query
    const query = `SELECT ${updatedCalculation}(${updatedField}) as value FROM \`creatto-463117.biquery_data.${updatedTable}\``
    
    console.log('Executing:', query)
    
    const response = await fetch('/api/bigquery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', query })
    })
    
    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.data?.data && Array.isArray(result.data.data)) {
      const newValue = result.data.data[0]?.value || 0
      
      // 5. Update KPI using store action
      kpiActions.updateKPIConfig(existingKPI.i, {
        name: updatedTitle,
        value: newValue,
        calculation: updatedCalculation,
        metric: updatedField,
        dataSourceType: 'bigquery',
        bigqueryData: {
          selectedTable: updatedTable,
          kpiValueFields: [{ name: updatedField, type: 'NUMERIC' }],
          filterFields: [],
          query: query,
          calculatedValue: newValue,
          lastExecuted: new Date(),
          isLoading: false,
          error: null
        }
      })
      
      console.log('✅ KPI updated successfully:', updatedTitle, '=', newValue)
    } else {
      throw new Error(result.error || 'No data returned')
    }
  } catch (error) {
    console.error('❌ Failed to update KPI:', error)
  }
}

async function updateChartFromParams(widgetName: string, params: UpdateParams) {
  console.log('🔄 Updating chart:', widgetName)
  
  try {
    // 1. Find existing Chart by name (search all chart types)
    let existingChart: BarChartConfig | LineChartConfig | PieChartConfig | AreaChartConfig | HorizontalBarChartConfig | null = null
    let chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar' | null = null
    
    const barCharts = $barChartStore.get().barCharts
    const lineCharts = $lineChartStore.get().lineCharts
    const pieCharts = $pieChartStore.get().pieCharts
    const areaCharts = $areaChartStore.get().areaCharts
    const horizontalBarCharts = $horizontalBarChartStore.get().horizontalBarCharts
    
    existingChart = barCharts.find(chart => chart.name === widgetName) || null
    if (existingChart) chartType = 'bar'
    
    if (!existingChart) {
      existingChart = lineCharts.find(chart => chart.name === widgetName) || null
      if (existingChart) chartType = 'line'
    }
    
    if (!existingChart) {
      existingChart = pieCharts.find(chart => chart.name === widgetName) || null
      if (existingChart) chartType = 'pie'
    }
    
    if (!existingChart) {
      existingChart = areaCharts.find(chart => chart.name === widgetName) || null
      if (existingChart) chartType = 'area'
    }
    
    if (!existingChart) {
      existingChart = horizontalBarCharts.find(chart => chart.name === widgetName) || null
      if (existingChart) chartType = 'horizontal-bar'
    }
    
    if (!existingChart) {
      throw new Error(`Chart "${widgetName}" not found`)
    }
    
    console.log('Found', chartType, 'chart:', widgetName)
    
    // 2. Use existing parameters or new ones
    const updatedTable = params.newTable || existingChart.bigqueryData.selectedTable
    const updatedXField = params.newXField || (existingChart.bigqueryData.columns.xAxis[0]?.name)
    const updatedYField = params.newYField || (existingChart.bigqueryData.columns.yAxis[0]?.name)
    const updatedAggregation = params.newAggregation || (existingChart.bigqueryData.columns.yAxis[0]?.aggregation) || 'SUM'
    const updatedTitle = params.newTitle || existingChart.name
    
    if (!updatedTable || !updatedXField || !updatedYField) {
      throw new Error('Missing required chart parameters')
    }
    
    // 3. Generate and execute new query
    const query = `SELECT ${updatedXField}, ${updatedAggregation}(${updatedYField}) as value FROM \`creatto-463117.biquery_data.${updatedTable}\` GROUP BY ${updatedXField} ORDER BY value DESC LIMIT 100`
    
    const response = await fetch('/api/bigquery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', query })
    })
    
    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    const chartData = result.success && result.data?.data ? result.data.data : []
    
    // 4. Update chart using appropriate action
    const updateData = {
      name: updatedTitle,
      bigqueryData: {
        query,
        selectedTable: updatedTable,
        columns: {
          xAxis: [{ name: updatedXField, type: 'STRING', mode: 'NULLABLE' }],
          yAxis: [{ name: updatedYField, type: 'NUMERIC', mode: 'NULLABLE', aggregation: updatedAggregation }],
          filters: existingChart.bigqueryData.columns?.filters || []
        },
        data: chartData,
        lastExecuted: new Date(),
        isLoading: false,
        error: null
      }
    }
    
    switch (chartType) {
      case 'bar':
        barChartActions.updateBarChart(existingChart.id, updateData)
        break
      case 'line':
        lineChartActions.updateLineChart(existingChart.id, updateData)
        break
      case 'pie':
        pieChartActions.updatePieChart(existingChart.id, updateData)
        break
      case 'area':
        areaChartActions.updateAreaChart(existingChart.id, updateData)
        break
      case 'horizontal-bar':
        horizontalBarChartActions.updateHorizontalBarChart(existingChart.id, updateData)
        break
    }
    
    console.log('✅ Chart updated successfully:', updatedTitle)
    
  } catch (error) {
    console.error('❌ Failed to update chart:', error)
  }
}

async function updateTableFromParams(widgetName: string, params: UpdateParams) {
  console.log('🔄 Updating table:', widgetName)
  
  try {
    // 1. Find existing Table by name
    const currentTables = $tableWidgets.get()
    const existingTable = currentTables.find(table => table.name === widgetName)
    
    if (!existingTable) {
      throw new Error(`Table "${widgetName}" not found`)
    }
    
    console.log('Found Table to update:', widgetName, '(ID:', existingTable.i, ')')
    
    // 2. Get current data
    const currentColumns = existingTable.config.columns?.map(col => col.id) || []
    
    // 3. Apply changes
    const updatedTable = params.newTable
    const updatedColumns = params.newColumns || currentColumns
    const updatedTitle = params.newTitle || existingTable.name
    
    if (!updatedTable || !updatedColumns.length) {
      throw new Error('BigQuery table and columns are required for table update')
    }
    
    // 4. Generate and execute new query
    const query = `SELECT ${updatedColumns.join(', ')} FROM \`creatto-463117.biquery_data.${updatedTable}\` LIMIT 100`
    
    const response = await fetch('/api/bigquery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'execute', query })
    })
    
    if (!response.ok) {
      throw new Error(`Query failed: ${response.statusText}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.data?.data && Array.isArray(result.data.data)) {
      const data = result.data.data
      
      // 5. Update Table using store action
      tableActions.updateTableConfig(existingTable.i, {
        data: data,
        columns: updatedColumns.map(col => ({
          id: col,
          header: col,
          accessorKey: col,
          sortable: true,
          type: 'text' as const
        }))
      })
      
      // Update name if changed
      if (updatedTitle !== existingTable.name) {
        tableActions.editTable(existingTable.i, { name: updatedTitle })
      }
      
      console.log('✅ Table updated successfully:', updatedTitle)
    } else {
      throw new Error(result.error || 'No data returned')
    }
  } catch (error) {
    console.error('❌ Failed to update table:', error)
  }
}

// Helper function to detect widget type by name
function detectWidgetType(widgetName: string): 'kpi' | 'chart' | 'table' | 'unknown' {
  // Search in all stores to determine type
  const kpis = $kpiWidgets.get()
  const tables = $tableWidgets.get()
  const barCharts = $barChartStore.get().barCharts
  const lineCharts = $lineChartStore.get().lineCharts
  const pieCharts = $pieChartStore.get().pieCharts
  const areaCharts = $areaChartStore.get().areaCharts
  const horizontalBarCharts = $horizontalBarChartStore.get().horizontalBarCharts
  
  if (kpis.find(k => k.config.name === widgetName)) return 'kpi'
  if (tables.find(t => t.name === widgetName)) return 'table'
  
  if (barCharts.find(c => c.name === widgetName) ||
      lineCharts.find(c => c.name === widgetName) ||
      pieCharts.find(c => c.name === widgetName) ||
      areaCharts.find(c => c.name === widgetName) ||
      horizontalBarCharts.find(c => c.name === widgetName)) {
    return 'chart'
  }
  
  return 'unknown'
}