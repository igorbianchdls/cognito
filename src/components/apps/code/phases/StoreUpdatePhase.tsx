'use client'

import { useState, useEffect } from 'react'
import { kpiActions, $kpiWidgets } from '@/stores/apps/kpiStore'
import { tableActions, $tableWidgets } from '@/stores/apps/tableStore'
import { barChartActions, $barChartStore } from '@/stores/apps/barChartStore'
import { lineChartActions, $lineChartStore } from '@/stores/apps/lineChartStore'
import { pieChartActions, $pieChartStore } from '@/stores/apps/pieChartStore'
import { areaChartActions, $areaChartStore } from '@/stores/apps/areaChartStore'
import { horizontalBarChartActions, $horizontalBarChartStore } from '@/stores/apps/horizontalBarChartStore'
import CodeEditorInterface from '../ui/CodeEditorInterface'
import { QueryConstructionPhase } from './QueryConstructionPhase'
import { WidgetLookupPhase } from './WidgetLookupPhase'
import { LoggingPhase } from './LoggingPhase'
import { BigQueryExecutionPhase } from './BigQueryExecutionPhase'
import { DataTransformationPhase } from './DataTransformationPhase'

interface StoreUpdatePhaseProps {
  initialCode?: string
}

export default function StoreUpdatePhase({ initialCode }: StoreUpdatePhaseProps = {}) {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  // Default example JSON
  const defaultCode = `[
  {
    "action": "create",
    "type": "kpi",
    "table": "ecommerce",
    "field": "id",
    "calculation": "COUNT",
    "title": "Total de Registros"
  },
  {
    "action": "create",
    "type": "kpi", 
    "table": "ecommerce",
    "field": "event_name",
    "calculation": "COUNT_DISTINCT",
    "title": "Eventos Únicos"
  },
  {
    "action": "create",
    "type": "chart",
    "chartType": "bar",
    "table": "ecommerce",
    "xField": "event_name",
    "yField": "id",
    "aggregation": "COUNT",
    "title": "Eventos por Quantidade"
  },
  {
    "action": "create",
    "type": "chart",
    "chartType": "pie",
    "table": "ecommerce",
    "xField": "event_name", 
    "yField": "id",
    "aggregation": "COUNT",
    "title": "Distribuição de Eventos"
  },
  {
    "action": "create",
    "type": "table",
    "table": "ecommerce",
    "columns": ["id", "event_name", "user_pseudo_id"],
    "title": "Dados E-commerce"
  }
]`

  useEffect(() => {
    setCode(initialCode || defaultCode)
  }, [initialCode, defaultCode])

  // Log function for output
  const log = (...args: unknown[]) => {
    LoggingPhase.log(setOutput, ...args)
  }


  // Update KPI function (follows Datasets pattern)
  const updateKPI = async (kpiName: string, newTable?: string, newField?: string, newCalculation?: string, newTitle?: string) => {
    try {
      // 1. Find existing KPI by name (same as Datasets selection)
      const existingKPI = WidgetLookupPhase.findExistingKPI(kpiName)
      
      if (!existingKPI) {
        throw new Error(`KPI "${kpiName}" not found`)
      }
      
      log(`Found KPI to update: ${kpiName} (ID: ${existingKPI.i})`)
      
      // 2. Get current data (same as Datasets loads into builder)
      const currentData = existingKPI.config.bigqueryData
      const currentTable = currentData?.selectedTable
      const currentField = currentData?.kpiValueFields?.[0]
      const currentCalculation = existingKPI.config.calculation
      
      // 3. Apply changes (use new values or keep current ones)
      const updatedTable = newTable || currentTable
      const updatedField = newField || currentField?.name
      const updatedCalculation = newCalculation || currentCalculation
      const updatedTitle = newTitle || existingKPI.config.name
      
      if (!updatedTable || !updatedField || !updatedCalculation) {
        throw new Error('Missing required KPI parameters')
      }
      
      log(`Updating KPI: ${updatedTable}.${updatedField} (${updatedCalculation})`)
      
      // 4. Generate and execute new query (same as createKPI)
      const query = QueryConstructionPhase.buildKPIQuery(updatedTable, updatedField, updatedCalculation)
      
      log(`Executing: ${query}`)

      const result = await BigQueryExecutionPhase.executeQuery(query)
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        const newValue = DataTransformationPhase.transformKPIData(data)
        
        // 5. Update KPI config (same as Datasets update flow)
        kpiActions.updateKPIConfig(existingKPI.i, {
          name: updatedTitle,
          value: newValue,
          metric: updatedField,
          calculation: updatedCalculation as 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT',
          dataSourceType: 'bigquery',
          bigqueryData: {
            selectedTable: updatedTable,
            kpiValueFields: [{ 
              name: updatedField, 
              type: 'NUMERIC', 
              mode: 'NULLABLE',
              aggregation: updatedCalculation as 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
            }],
            filterFields: currentData?.filterFields || [],
            query: query,
            lastExecuted: new Date(),
            isLoading: false,
            error: null
          }
        })

        log(`✅ KPI "${updatedTitle}" updated successfully with value: ${newValue}`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      log(`❌ Failed to update KPI: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Update Chart function (follows Datasets pattern)
  const updateChart = async (chartName: string, newTable?: string, newXField?: string, newYField?: string, newAggregation?: string, newTitle?: string) => {
    try {
      // 1. Find existing Chart by name (search all chart types)
      const { existingChart, chartType } = WidgetLookupPhase.findExistingChart(chartName)
      
      if (!existingChart || !chartType) {
        throw new Error(`Chart "${chartName}" not found`)
      }
      
      log(`Found ${chartType} chart to update: ${chartName} (ID: ${existingChart.id})`)
      
      // 2. Get current data (same as Datasets loads into builder)
      const currentData = existingChart.bigqueryData
      const currentTable = currentData?.selectedTable
      const currentXField = currentData?.columns?.xAxis?.[0]?.name
      const currentYField = currentData?.columns?.yAxis?.[0]?.name
      const currentAggregation = currentData?.columns?.yAxis?.[0]?.aggregation
      
      // 3. Apply changes (use new values or keep current ones)
      const updatedTable = newTable || currentTable
      const updatedXField = newXField || currentXField
      const updatedYField = newYField || currentYField
      const updatedAggregation = newAggregation || currentAggregation
      const updatedTitle = newTitle || existingChart.name
      
      if (!updatedTable || !updatedXField || !updatedYField || !updatedAggregation) {
        throw new Error('Missing required chart parameters')
      }
      
      log(`Updating ${chartType} chart: ${updatedTable}.${updatedXField} x ${updatedYField} (${updatedAggregation})`)
      
      // 4. Generate and execute new query (same as createChart)
      const query = QueryConstructionPhase.buildChartQuery(updatedTable, updatedXField, updatedYField, updatedAggregation)
      
      log(`Executing: ${query}`)

      const result = await BigQueryExecutionPhase.executeQuery(query)
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = DataTransformationPhase.transformChartData(result.data.data)
        
        // 5. Update Chart using specific action (same as Datasets update flow)
        const updateData = {
          name: updatedTitle,
          bigqueryData: {
            query,
            selectedTable: updatedTable,
            columns: {
              xAxis: [{ name: updatedXField, type: 'STRING', mode: 'NULLABLE' }],
              yAxis: [{ name: updatedYField, type: 'NUMERIC', mode: 'NULLABLE', aggregation: updatedAggregation as 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT' }],
              filters: currentData?.columns?.filters || []
            },
            data: data,
            lastExecuted: new Date(),
            isLoading: false,
            error: null
          }
        }

        // Route to appropriate update action based on detected type
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

        log(`✅ ${chartType} chart "${updatedTitle}" updated successfully with ${data.length} rows`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      log(`❌ Failed to update chart: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Simple Chart creation function
  const createChart = async (type: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar', table: string, xField: string, yField: string, aggregation: string, title?: string) => {
    try {
      // Generate SQL query (same as ChartPreview)
      const query = QueryConstructionPhase.buildChartQuery(table, xField, yField, aggregation)
      
      log(`Executing: ${query}`)

      // Execute BigQuery (same as Datasets)
      const result = await BigQueryExecutionPhase.executeQuery(query)
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = DataTransformationPhase.transformChartData(result.data.data)
        
        // Base chart configuration (without position - it goes in each chart type)
        const baseChartConfig = {
          name: title || `${xField} por ${yField}`,
          bigqueryData: {
            query,
            selectedTable: table,
            columns: {
              xAxis: [{ name: xField, type: 'STRING', mode: 'NULLABLE' }],
              yAxis: [{ name: yField, type: 'NUMERIC', mode: 'NULLABLE', aggregation: aggregation as 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT' }],
              filters: []
            },
            data: data,
            lastExecuted: new Date(),
            isLoading: false,
            error: null
          }
        }

        // Route to appropriate chart action based on type (same as UniversalBuilder)
        switch (type) {
          case 'bar':
            barChartActions.addBarChart({
              ...baseChartConfig,
              chartType: 'bar',
              position: {
                x: 0,
                y: 0,
                w: 60,
                h: 150
              },
              styling: {
                colors: ['#2563eb'],
                showLegend: true,
                showGrid: true,
                title: title || `${xField} por ${yField}`
              }
            })
            break
          case 'line':
            lineChartActions.addLineChart({
              ...baseChartConfig,
              chartType: 'line',
              position: {
                x: 0,
                y: 0,
                w: 60,
                h: 150
              },
              styling: {
                colors: ['#10b981'],
                showLegend: true,
                showGrid: true,
                title: title || `${xField} por ${yField}`
              }
            })
            break
          case 'pie':
            pieChartActions.addPieChart({
              ...baseChartConfig,
              chartType: 'pie',
              position: {
                x: 0,
                y: 0,
                w: 60,
                h: 150
              },
              styling: {
                colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
                showLegend: true,
                showGrid: false,
                title: title || `${xField} por ${yField}`
              }
            })
            break
          case 'area':
            areaChartActions.addAreaChart({
              ...baseChartConfig,
              chartType: 'area',
              position: {
                x: 0,
                y: 0,
                w: 60,
                h: 150
              },
              styling: {
                colors: ['#8b5cf6'],
                showLegend: true,
                showGrid: true,
                title: title || `${xField} por ${yField}`,
                areaOpacity: 0.4
              }
            })
            break
          case 'horizontal-bar':
            horizontalBarChartActions.addHorizontalBarChart({
              ...baseChartConfig,
              chartType: 'horizontal-bar',
              position: {
                x: 0,
                y: 0,
                w: 60,
                h: 150
              },
              styling: {
                colors: ['#10b981'],
                showLegend: true,
                showGrid: true,
                title: title || `${xField} por ${yField}`
              }
            })
            break
        }

        log(`✅ ${type} chart "${baseChartConfig.name}" created with ${data.length} rows`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      log(`❌ Failed to create ${type} chart: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Update Table function (follows Datasets pattern)
  const updateTable = async (tableName: string, newBqTable?: string, newColumns?: string[], newTitle?: string) => {
    try {
      // 1. Find existing Table by name (same as Datasets selection)
      const existingTable = WidgetLookupPhase.findExistingTable(tableName)
      
      if (!existingTable) {
        throw new Error(`Table "${tableName}" not found`)
      }
      
      log(`Found Table to update: ${tableName} (ID: ${existingTable.i})`)
      
      // 2. Get current data (Table doesn't store much - user reconfigures everything)
      const currentColumns = existingTable.config.columns?.map(col => col.id) || []
      
      // 3. Apply changes (use new values or keep current ones)
      const updatedBqTable = newBqTable // No fallback - table doesn't store BigQuery table name
      const updatedColumns = newColumns || currentColumns
      const updatedTitle = newTitle || existingTable.name
      
      if (!updatedBqTable || !updatedColumns.length) {
        throw new Error('BigQuery table and columns are required for table update')
      }
      
      log(`Updating Table: ${updatedBqTable} with columns [${updatedColumns.join(', ')}]`)
      
      // 4. Generate and execute new query (same as createTable)
      const query = QueryConstructionPhase.buildTableQuery(updatedBqTable, updatedColumns)
      
      log(`Executing: ${query}`)

      const result = await BigQueryExecutionPhase.executeQuery(query)
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = DataTransformationPhase.transformTableData(result.data.data)
        
        // 5. Update Table (same as Datasets update flow)
        tableActions.editTable(existingTable.i, {
          name: updatedTitle,
          config: {
            data: data, // Real BigQuery data
            columns: updatedColumns.map(col => ({
              id: col,
              header: col,
              accessorKey: col,
              sortable: true,
              type: 'text' as const // simplified - could be enhanced to detect types
            })),
            showPagination: true,
            showColumnToggle: true,
            pageSize: 10,
            searchPlaceholder: 'Buscar...',
            dataSource: 'BigQuery'
          }
        })

        log(`✅ Table "${updatedTitle}" updated successfully with ${data.length} rows`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      log(`❌ Failed to update table: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Simple Table creation function
  const createTable = async (table: string, columns: string[], title?: string) => {
    try {
      // Generate SQL query (same as TablePreview)
      const query = QueryConstructionPhase.buildTableQuery(table, columns)
      
      log(`Executing: ${query}`)

      // Execute BigQuery (same as Datasets)
      const result = await BigQueryExecutionPhase.executeQuery(query)
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = DataTransformationPhase.transformTableData(result.data.data)
        
        // Create Table using the same action as Datasets
        tableActions.addTable({
          name: title || `${table} - Table`,
          icon: '📋',
          description: `Table from ${table}`,
          position: { x: 0, y: 0 },
          size: { w: 72, h: 200 },
          config: {
            data: data, // Real BigQuery data
            columns: columns.map(col => ({
              id: col,
              header: col,
              accessorKey: col,
              sortable: true,
              type: 'text' as const // simplified - could be enhanced to detect types
            })),
            showPagination: true,
            showColumnToggle: true,
            pageSize: 10,
            searchPlaceholder: 'Buscar...',
            dataSource: 'BigQuery'
          }
        })

        log(`✅ Table "${title || table}" created with ${data.length} rows`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      log(`❌ Failed to create table: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Simple KPI creation function
  const createKPI = async (table: string, field: string, calculation: string, title: string) => {
    try {
      // Generate SQL query automatically (same as Datasets)
      const query = QueryConstructionPhase.buildKPIQuery(table, field, calculation)
      
      log(`Executing: ${query}`)

      // Execute BigQuery (same as Datasets)
      const result = await BigQueryExecutionPhase.executeQuery(query)
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        const value = DataTransformationPhase.transformKPIData(data)
        
        // Create KPI using the same action as Datasets
        kpiActions.addKPI({
          name: title,
          icon: '📈',
          description: `KPI from ${table}`,
          position: { x: 0, y: 0 },
          size: { w: 48, h: 100 },
          config: {
            name: title,
            value: value,
            metric: field,
            calculation: calculation,
            unit: '',
            showTarget: false,
            showTrend: false,
            visualizationType: 'card' as const,
            enableSimulation: false,
            dataSourceType: 'bigquery' as const,
            bigqueryData: {
              selectedTable: table,
              kpiValueFields: [{ 
                name: field, 
                type: 'NUMERIC', 
                mode: 'NULLABLE',
                aggregation: calculation as 'SUM' | 'COUNT' | 'AVG' | 'MIN' | 'MAX' | 'COUNT_DISTINCT'
              }],
              filterFields: [],
              query: query,
              lastExecuted: new Date(),
              isLoading: false,
              error: null
            }
          }
        })

        log(`✅ KPI "${title}" created with value: ${value}`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      log(`❌ Failed to create KPI: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Execute JSON configuration
  const executeJSON = async () => {
    if (!code.trim()) {
      log('❌ No JSON to execute')
      return
    }

    setIsExecuting(true)
    setOutput([])
    log('🚀 Executing JSON...')

    try {
      // Parse JSON
      const jsonData = JSON.parse(code)
      
      // Handle both single object and array of objects
      const items = Array.isArray(jsonData) ? jsonData : [jsonData]
      
      log(`📋 Processing ${items.length} item(s)`)

      // Process each item
      for (const item of items) {
        if (item.action === 'create' && item.type === 'kpi') {
          if (!item.table || !item.field || !item.calculation || !item.title) {
            log('❌ Missing required KPI fields: table, field, calculation, title')
            continue
          }
          
          log(`➕ Creating KPI: ${item.title}`)
          await createKPI(item.table, item.field, item.calculation, item.title)
        } else if (item.action === 'create' && item.type === 'chart') {
          if (!item.chartType || !item.table || !item.xField || !item.yField || !item.aggregation || !item.title) {
            log('❌ Missing required Chart fields: chartType, table, xField, yField, aggregation, title')
            continue
          }
          
          const validChartTypes = ['bar', 'line', 'pie', 'area', 'horizontal-bar']
          if (!validChartTypes.includes(item.chartType)) {
            log(`❌ Invalid chart type: ${item.chartType}. Valid types: ${validChartTypes.join(', ')}`)
            continue
          }
          
          log(`➕ Creating ${item.chartType} chart: ${item.title}`)
          await createChart(item.chartType, item.table, item.xField, item.yField, item.aggregation, item.title)
        } else if (item.action === 'create' && item.type === 'table') {
          if (!item.table || !item.columns || !Array.isArray(item.columns) || item.columns.length === 0 || !item.title) {
            log('❌ Missing required Table fields: table, columns (array), title')
            continue
          }
          
          log(`➕ Creating table: ${item.title}`)
          await createTable(item.table, item.columns, item.title)
        } else {
          log(`⚠️ Unsupported action: ${item.action} ${item.type} (supported: "create kpi", "create chart", "create table")`)
        }
      }
      
      log('✅ JSON executed successfully')
    } catch (error) {
      if (error instanceof SyntaxError) {
        log('❌ Invalid JSON format:', error.message)
      } else {
        log('❌ Execution failed:', error instanceof Error ? error.message : 'Unknown error')
      }
    } finally {
      setIsExecuting(false)
    }
  }

  const clearOutput = () => {
    setOutput([])
  }

  const resetCode = () => {
    setCode(defaultCode)
    setOutput([])
  }

  return (
    <CodeEditorInterface
      code={code}
      output={output}
      isExecuting={isExecuting}
      onCodeChange={setCode}
      onExecute={executeJSON}
      onReset={resetCode}
      onClearOutput={clearOutput}
    />
  )
}