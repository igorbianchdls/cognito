'use client'

import { useState, useEffect } from 'react'
import { Editor } from '@monaco-editor/react'
import { Play, RotateCcw, Terminal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { kpiActions, $kpiWidgets } from '@/stores/apps/kpiStore'
import { tableActions, $tableWidgets } from '@/stores/apps/tableStore'
import { barChartActions, $barChartStore } from '@/stores/apps/barChartStore'
import { lineChartActions, $lineChartStore } from '@/stores/apps/lineChartStore'
import { pieChartActions, $pieChartStore } from '@/stores/apps/pieChartStore'
import { areaChartActions, $areaChartStore } from '@/stores/apps/areaChartStore'
import { horizontalBarChartActions, $horizontalBarChartStore } from '@/stores/apps/horizontalBarChartStore'
import type { BigQueryField } from '../builder/TablesExplorer'

export default function CodeEditor() {
  const [code, setCode] = useState('')
  const [output, setOutput] = useState<string[]>([])
  const [isExecuting, setIsExecuting] = useState(false)

  // Default example code
  const defaultCode = `// Criar e atualizar KPIs, Tables e Charts programaticamente

// Exemplo: Criar KPIs
createKPI('ecommerce', 'id', 'COUNT', 'Total de Registros')
createKPI('vendas_2024', 'valor_total', 'SUM', 'Vendas Totais')

// Exemplo: Atualizar KPI existente (parâmetros opcionais)
// updateKPI('Total de Registros', 'nova_tabela', 'novo_campo', 'AVG', 'Novo Título')

// Exemplo: Criar e Atualizar Table
createTable('ecommerce', ['id', 'nome', 'email', 'categoria'], 'Dados de E-commerce')
// updateTable('Dados de E-commerce', 'nova_tabela', ['col1', 'col2'], 'Novo Título')

// Exemplo: Criar e Atualizar Charts
createChart('bar', 'vendas_2024', 'categoria', 'valor_total', 'SUM', 'Vendas por Categoria')
createChart('pie', 'vendas_2024', 'regiao', 'valor_total', 'SUM', 'Vendas por Região')
// updateChart('Vendas por Categoria', 'nova_tabela', 'novo_x', 'novo_y', 'AVG', 'Novo Título')

console.log('Widgets criados!')
`

  useEffect(() => {
    setCode(defaultCode)
  }, [defaultCode])

  // Log function for output
  const log = (...args: unknown[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ')
    setOutput(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }


  // Update KPI function (follows Datasets pattern)
  const updateKPI = async (kpiName: string, newTable?: string, newField?: string, newCalculation?: string, newTitle?: string) => {
    try {
      // 1. Find existing KPI by name (same as Datasets selection)
      const currentKPIs = $kpiWidgets.get()
      const existingKPI = currentKPIs.find(kpi => kpi.config.name === kpiName)
      
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
      const query = `SELECT ${updatedCalculation}(${updatedField}) as value FROM \`creatto-463117.biquery_data.${updatedTable}\``
      
      log(`Executing: ${query}`)

      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute',
          query: query 
        })
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`Query failed: ${response.statusText} - ${responseText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        const newValue = data[0]?.value || 0
        
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
      let existingChart: any = null
      let chartType: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar' | null = null
      
      // Search in all chart stores
      const barCharts = $barChartStore.get().barCharts
      const lineCharts = $lineChartStore.get().lineCharts
      const pieCharts = $pieChartStore.get().pieCharts
      const areaCharts = $areaChartStore.get().areaCharts
      const horizontalBarCharts = $horizontalBarChartStore.get().horizontalBarCharts
      
      existingChart = barCharts.find(chart => chart.name === chartName)
      if (existingChart) chartType = 'bar'
      
      if (!existingChart) {
        existingChart = lineCharts.find(chart => chart.name === chartName)
        if (existingChart) chartType = 'line'
      }
      
      if (!existingChart) {
        existingChart = pieCharts.find(chart => chart.name === chartName)
        if (existingChart) chartType = 'pie'
      }
      
      if (!existingChart) {
        existingChart = areaCharts.find(chart => chart.name === chartName)
        if (existingChart) chartType = 'area'
      }
      
      if (!existingChart) {
        existingChart = horizontalBarCharts.find(chart => chart.name === chartName)
        if (existingChart) chartType = 'horizontal-bar'
      }
      
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
      const query = `SELECT ${updatedXField}, ${updatedAggregation}(${updatedYField}) as ${updatedYField} FROM \`creatto-463117.biquery_data.${updatedTable}\` GROUP BY ${updatedXField} ORDER BY ${updatedYField} DESC LIMIT 20`
      
      log(`Executing: ${query}`)

      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute',
          query: query 
        })
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`Query failed: ${response.statusText} - ${responseText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        
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
      const query = `SELECT ${xField}, ${aggregation}(${yField}) as ${yField} FROM \`creatto-463117.biquery_data.${table}\` GROUP BY ${xField} ORDER BY ${yField} DESC LIMIT 20`
      
      log(`Executing: ${query}`)

      // Execute BigQuery (same as Datasets)
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute',
          query: query 
        })
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`Query failed: ${response.statusText} - ${responseText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        
        // Base chart configuration
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
          },
          position: {
            x: 0,
            y: 0,
            w: 60,
            h: 150
          }
        }

        // Route to appropriate chart action based on type (same as UniversalBuilder)
        switch (type) {
          case 'bar':
            barChartActions.addBarChart({
              ...baseChartConfig,
              chartType: 'bar',
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
      const currentTables = $tableWidgets.get()
      const existingTable = currentTables.find(table => table.name === tableName)
      
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
      const query = `SELECT ${updatedColumns.join(', ')} FROM \`creatto-463117.biquery_data.${updatedBqTable}\` LIMIT 100`
      
      log(`Executing: ${query}`)

      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute',
          query: query 
        })
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`Query failed: ${response.statusText} - ${responseText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        
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
      const query = `SELECT ${columns.join(', ')} FROM \`creatto-463117.biquery_data.${table}\` LIMIT 100`
      
      log(`Executing: ${query}`)

      // Execute BigQuery (same as Datasets)
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute',
          query: query 
        })
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`Query failed: ${response.statusText} - ${responseText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        
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
      const query = `SELECT ${calculation}(${field}) as value FROM \`creatto-463117.biquery_data.${table}\``
      
      log(`Executing: ${query}`)

      // Execute BigQuery (same as Datasets)
      const response = await fetch('/api/bigquery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'execute',
          query: query 
        })
      })

      if (!response.ok) {
        const responseText = await response.text()
        throw new Error(`Query failed: ${response.statusText} - ${responseText}`)
      }

      const result = await response.json()
      
      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        const value = data[0]?.value || 0
        
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

  // Execute the code
  const executeCode = async () => {
    if (!code.trim()) {
      log('❌ No code to execute')
      return
    }

    setIsExecuting(true)
    setOutput([])
    log('🚀 Executing code...')

    try {
      // Create execution context
      const context = {
        createKPI,
        updateKPI,
        createTable,
        updateTable,
        createChart,
        updateChart,
        console: { log }
      }

      // Execute code
      const asyncFunction = new Function(
        'context',
        `
        const { createKPI, updateKPI, createTable, updateTable, createChart, updateChart, console } = context;
        return (async () => {
          ${code}
        })();
        `
      )

      await asyncFunction(context)
      log('✅ Code executed successfully')
    } catch (error) {
      log('❌ Execution failed:', error instanceof Error ? error.message : 'Unknown error')
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="text-base font-semibold">Code Editor - Full CRUD (KPI, Table, Chart)</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetCode}
            className="gap-2"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
          <Button
            onClick={executeCode}
            disabled={isExecuting}
            size="sm"
            className="gap-2"
          >
            <Play className="w-3 h-3" />
            {isExecuting ? 'Executing...' : 'Execute'}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Code Editor */}
        <div className="flex-1 min-h-0">
          <Editor
            height="100%"
            defaultLanguage="javascript"
            value={code}
            onChange={(value) => setCode(value || '')}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              automaticLayout: true,
              scrollBeyondLastLine: false,
              folding: true
            }}
          />
        </div>

        {/* Output Console */}
        <Card className="m-4 mt-0 border-t-0 rounded-t-none">
          <CardHeader className="py-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Terminal className="w-3 h-3" />
                Console Output
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearOutput}
                className="h-6 px-2 text-xs"
              >
                Clear
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-2">
            <ScrollArea className="h-24 w-full">
              <div className="space-y-1">
                {output.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No output yet. Execute some code to see results.</p>
                ) : (
                  output.map((line, index) => (
                    <p key={index} className="text-xs font-mono text-foreground whitespace-pre-wrap">
                      {line}
                    </p>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}