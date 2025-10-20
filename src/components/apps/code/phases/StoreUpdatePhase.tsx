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
import { WidgetCreation } from './WidgetCreation'
import { WidgetUpdate } from './WidgetUpdate'

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
    "title": "Total de Registros",
    "styling": {
      "unit": "registros",
      "showTarget": true,
      "target": 1000,
      "icon": "📊",
      "kpiContainerBackgroundColor": "#f0f9ff",
      "kpiContainerBorderColor": "#0ea5e9",
      "kpiContainerBorderWidth": 2,
      "kpiContainerBorderRadius": 16,
      "kpiContainerPadding": 20,
      "kpiContainerShadow": true,
      "kpiValueFontSize": 36,
      "kpiValueColor": "#0f172a",
      "kpiValueFontWeight": 700,
      "kpiValueAlign": "center",
      "backgroundGradient": {
        "enabled": true,
        "type": "linear",
        "direction": "135deg",
        "startColor": "#e0f2fe",
        "endColor": "#f0f9ff"
      },
      "titleFontSize": 14,
      "titleColor": "#334155",
      "containerClassName": "shadow-lg hover:shadow-xl transition-shadow"
    },
    "position": {
      "x": 0,
      "y": 0,
      "w": 48,
      "h": 100
    }
  },
  {
    "action": "create",
    "type": "kpi",
    "table": "ecommerce",
    "field": "event_name",
    "calculation": "COUNT_DISTINCT",
    "title": "Eventos Únicos",
    "styling": {
      "unit": "eventos",
      "showTrend": true,
      "icon": "🎯",
      "kpiContainerBackgroundColor": "#fefce8",
      "kpiContainerBorderColor": "#eab308",
      "kpiContainerBorderWidth": 1,
      "kpiContainerBorderRadius": 12,
      "kpiContainerPadding": 16,
      "kpiValueFontSize": 32,
      "kpiValueColor": "#854d0e",
      "kpiNameFontSize": 12,
      "kpiNameColor": "#a16207",
      "kpiValueAlign": "left",
      "backdropFilter": {
        "enabled": true,
        "blur": 8
      },
      "backgroundColor": "#fffbeb",
      "backgroundOpacity": 0.8,
      "subtitleFontSize": 10,
      "subtitleColor": "#92400e",
      "titleMarginBottom": 8
    },
    "position": {
      "x": 50,
      "y": 0,
      "w": 48,
      "h": 100
    }
  },
  {
    "action": "create",
    "type": "chart",
    "chartType": "bar",
    "table": "ecommerce",
    "xField": "event_name",
    "yField": "id",
    "aggregation": "COUNT",
    "title": "Eventos por Quantidade",
    "styling": {
      "colors": ["#3b82f6", "#06b6d4", "#10b981"],
      "showLegend": true,
      "legendPosition": "top",
      "showGrid": true,
      "enableGridY": true,
      "borderRadius": 4,
      "marginTop": 20,
      "marginBottom": 60,
      "xAxisTitle": "Eventos",
      "yAxisTitle": "Quantidade",
      "groupMode": "grouped",
      "enableLabel": true,
      "labelPosition": "end",
      "axisFontSize": 12,
      "axisFontWeight": 600,
      "axisTextColor": "#374151",
      "labelsFontSize": 11,
      "labelsTextColor": "#6b7280",
      "containerBorderRadius": 8,
      "containerPadding": 16,
      "backgroundColor": "#f8fafc",
      "backgroundOpacity": 0.9,
      "titleFontSize": 16,
      "titleColor": "#1e293b",
      "titleClassName": "font-bold text-center"
    },
    "position": {
      "x": 0,
      "y": 110,
      "w": 60,
      "h": 200
    }
  },
  {
    "action": "create",
    "type": "chart",
    "chartType": "pie",
    "table": "ecommerce",
    "xField": "event_name",
    "yField": "id",
    "aggregation": "COUNT",
    "title": "Distribuição de Eventos",
    "styling": {
      "colors": ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#8b5cf6"],
      "showLegend": true,
      "legendPosition": "right",
      "innerRadius": 60,
      "padAngle": 2,
      "cornerRadius": 3,
      "enableArcLabels": true,
      "enableArcLinkLabels": true,
      "arcLabelsSkipAngle": 10,
      "labelFormat": "percentage",
      "marginTop": 20,
      "marginRight": 120,
      "marginBottom": 20,
      "marginLeft": 20,
      "legendsFontSize": 12,
      "legendsTextColor": "#374151",
      "containerBorderRadius": 8,
      "containerPadding": 16,
      "backgroundGradient": {
        "enabled": true,
        "type": "linear",
        "direction": "45deg",
        "startColor": "#fef3f2",
        "endColor": "#fefce8"
      },
      "subtitleFontSize": 12,
      "subtitleColor": "#6b7280",
      "containerShadowColor": "#f59e0b",
      "containerShadowOpacity": 0.2
    },
    "position": {
      "x": 65,
      "y": 110,
      "w": 50,
      "h": 200
    }
  },
  {
    "action": "create",
    "type": "table",
    "table": "ecommerce",
    "columns": ["id", "event_name", "user_pseudo_id"],
    "title": "Dados E-commerce",
    "styling": {
      "headerBackground": "#f8fafc",
      "headerTextColor": "#1e293b",
      "borderColor": "#e2e8f0",
      "borderRadius": 8,
      "pageSize": 15,
      "enableExport": true,
      "exportFormats": ["csv", "excel"],
      "headerFontWeight": "600",
      "cellFontSize": 13,
      "icon": "📊"
    },
    "position": {
      "x": 0,
      "y": 220,
      "w": 100,
      "h": 250
    }
  },
  {
    "action": "update",
    "type": "kpi",
    "name": "Total de Registros",
    "field": "user_pseudo_id",
    "calculation": "COUNT_DISTINCT",
    "title": "Usuários Únicos",
    "styling": {
      "unit": "usuários",
      "showTarget": true,
      "target": 500,
      "backgroundColor": "#fef3f2",
      "borderColor": "#f87171",
      "borderWidth": 2,
      "borderRadius": 12,
      "valueColor": "#dc2626",
      "valueFontWeight": 800,
      "icon": "👥"
    },
    "position": {
      "x": 0,
      "y": 110,
      "w": 48,
      "h": 100
    }
  },
  {
    "action": "update",
    "type": "chart",
    "name": "Eventos por Quantidade",
    "xField": "user_pseudo_id",
    "yField": "event_name",
    "aggregation": "COUNT_DISTINCT",
    "title": "Usuários por Evento",
    "styling": {
      "colors": ["#10b981", "#06b6d4", "#3b82f6"],
      "showLegend": false,
      "showGrid": true,
      "enableGridX": true,
      "borderRadius": 6,
      "xAxisTitle": "Usuários",
      "yAxisTitle": "Eventos",
      "groupMode": "stacked",
      "enableLabel": true,
      "labelPosition": "middle",
      "labelTextColor": "#ffffff",
      "axisFontSize": 11,
      "axisTextColor": "#6b7280",
      "containerBorderWidth": 1,
      "containerBorderColor": "#e5e7eb",
      "containerBorderRadius": 12
    },
    "position": {
      "x": 0,
      "y": 320,
      "w": 100,
      "h": 180
    }
  },
  {
    "action": "update",
    "type": "table",
    "name": "Dados E-commerce",
    "table": "ecommerce",
    "columns": ["id", "event_name", "user_pseudo_id", "event_timestamp"],
    "title": "Dados Completos E-commerce",
    "styling": {
      "headerBackground": "#ecfdf5",
      "headerTextColor": "#065f46",
      "rowHoverColor": "#f0fdf4",
      "borderColor": "#10b981",
      "borderWidth": 2,
      "borderRadius": 12,
      "pageSize": 20,
      "enableSearch": true,
      "enableFiltering": true,
      "cellFontSize": 12,
      "headerFontSize": 14,
      "cellTextColor": "#374151",
      "icon": "📋"
    },
    "position": {
      "x": 0,
      "y": 480,
      "w": 120,
      "h": 300
    }
  }
]`

  useEffect(() => {
    setCode(initialCode || defaultCode)
  }, [initialCode, defaultCode])

  // Log function for output
  const log = (...args: unknown[]) => {
    LoggingPhase.log(setOutput, ...args)
  }








  // Execute JSON configuration
  const executeJSON = async () => {
    if (!code.trim()) {
      log('❌ No JSON to execute')
      return
    }

    setIsExecuting(true)
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
          await WidgetCreation.createKPI(item.table, item.field, item.calculation, item.title, item.styling, item.position, log)
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
          await WidgetCreation.createChart(item.chartType, item.table, item.xField, item.yField, item.aggregation, item.title, item.styling, item.position, log)
        } else if (item.action === 'create' && item.type === 'table') {
          if (!item.table || !item.columns || !Array.isArray(item.columns) || item.columns.length === 0 || !item.title) {
            log('❌ Missing required Table fields: table, columns (array), title')
            continue
          }
          
          log(`➕ Creating table: ${item.title}`)
          await WidgetCreation.createTable(item.table, item.columns, item.title, item.styling, item.position, log)
        } else if (item.action === 'update' && item.type === 'kpi') {
          if (!item.name) {
            log('❌ Missing required field: name (KPI name to update)')
            continue
          }
          
          // Check if at least one field to update is provided
          if (!item.table && !item.field && !item.calculation && !item.title) {
            log('❌ No fields to update. Provide at least one: table, field, calculation, title')
            continue
          }
          
          log(`🔄 Updating KPI: ${item.name}`)
          await WidgetUpdate.updateKPI(item.name, item.table, item.field, item.calculation, item.title, item.styling, item.position, log)
        } else if (item.action === 'update' && item.type === 'chart') {
          if (!item.name) {
            log('❌ Missing required field: name (chart name to update)')
            continue
          }
          
          // Check if at least one field to update is provided
          if (!item.table && !item.xField && !item.yField && !item.aggregation && !item.title) {
            log('❌ No fields to update. Provide at least one: table, xField, yField, aggregation, title')
            continue
          }
          
          log(`🔄 Updating chart: ${item.name}`)
          await WidgetUpdate.updateChart(item.name, item.table, item.xField, item.yField, item.aggregation, item.title, item.styling, item.position, log)
        } else if (item.action === 'update' && item.type === 'table') {
          if (!item.name) {
            log('❌ Missing required field: name (table name to update)')
            continue
          }
          
          if (!item.table) {
            log('❌ Missing required field: table (BigQuery table is required for table updates)')
            continue
          }
          
          // Check if at least one optional field is provided
          if (!item.columns && !item.title) {
            log('❌ No fields to update. Provide at least one: columns, title')
            continue
          }
          
          log(`🔄 Updating table: ${item.name}`)
          await WidgetUpdate.updateTable(item.name, item.table, item.columns, item.title, item.styling, item.position, log)
        } else {
          log(`⚠️ Unsupported action: ${item.action} ${item.type} (supported: "create kpi", "create chart", "create table", "update kpi", "update chart", "update table")`)
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