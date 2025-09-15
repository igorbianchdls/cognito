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
      "backgroundColor": "#f0f9ff",
      "borderColor": "#0ea5e9",
      "borderWidth": 2,
      "borderRadius": 16,
      "padding": 20,
      "shadow": true,
      "valueFontSize": 36,
      "valueColor": "#0f172a",
      "valueFontWeight": 700,
      "titleAlign": "center"
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
      "backgroundColor": "#fefce8",
      "borderColor": "#eab308",
      "borderWidth": 1,
      "borderRadius": 12,
      "padding": 16,
      "valueFontSize": 32,
      "valueColor": "#854d0e",
      "nameFontSize": 12,
      "nameColor": "#a16207",
      "titleAlign": "left"
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
      "containerPadding": 16
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
      "containerPadding": 16
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



  // Update Chart function (follows Datasets pattern)
  const updateChart = async (
    chartName: string,
    newTable?: string,
    newXField?: string,
    newYField?: string,
    newAggregation?: string,
    newTitle?: string,
    styling?: {
      // ========== COMPARTILHADAS ==========
      colors?: string[],
      showLegend?: boolean,
      showGrid?: boolean,
      enableGridX?: boolean,
      enableGridY?: boolean,
      title?: string,
      style?: string,
      legendPosition?: 'top' | 'top-right' | 'right' | 'bottom-right' | 'bottom' | 'bottom-left' | 'left' | 'top-left',
      legendDirection?: 'row' | 'column',
      legendSpacing?: number,
      legendSymbolSize?: number,
      legendSymbolShape?: 'circle' | 'square' | 'triangle',
      borderRadius?: number,
      borderWidth?: number,
      borderColor?: string,
      marginTop?: number,
      marginRight?: number,
      marginBottom?: number,
      marginLeft?: number,
      xAxisTitle?: string,
      yAxisTitle?: string,
      xAxisLegend?: string,
      xAxisLegendPosition?: 'start' | 'middle' | 'end',
      xAxisLegendOffset?: number,
      xAxisTickRotation?: number,
      xAxisTickSize?: number,
      xAxisTickPadding?: number,
      yAxisLegend?: string,
      yAxisLegendOffset?: number,
      yAxisTickRotation?: number,
      yAxisTickSize?: number,
      yAxisTickPadding?: number,

      // Typography - Axis
      axisFontFamily?: string,
      axisFontSize?: number,
      axisFontWeight?: number,
      axisTextColor?: string,
      axisLegendFontSize?: number,
      axisLegendFontWeight?: number,

      // Typography - Labels
      labelsFontFamily?: string,
      labelsFontSize?: number,
      labelsFontWeight?: number,
      labelsTextColor?: string,

      // Typography - Legends
      legendsFontFamily?: string,
      legendsFontSize?: number,
      legendsFontWeight?: number,
      legendsTextColor?: string,

      // Typography - Tooltip
      tooltipFontSize?: number,
      tooltipFontFamily?: string,

      // Container Border
      containerBorderWidth?: number,
      containerBorderColor?: string,
      containerBorderRadius?: number,
      containerPadding?: number,

      // Container Shadow
      containerShadowColor?: string,
      containerShadowOpacity?: number,
      containerShadowBlur?: number,
      containerShadowOffsetX?: number,
      containerShadowOffsetY?: number,

      // ========== BAR ESPECÍFICAS ==========
      groupMode?: 'grouped' | 'stacked',
      layout?: 'horizontal' | 'vertical',
      padding?: number,
      innerPadding?: number,
      enableLabel?: boolean,
      labelPosition?: 'start' | 'middle' | 'end',
      labelSkipWidth?: number,
      labelSkipHeight?: number,
      labelTextColor?: string,
      barLabelFormat?: string,
      labelOffset?: number,

      // ========== PIE ESPECÍFICAS ==========
      innerRadius?: number,
      outerRadius?: number,
      padAngle?: number,
      cornerRadius?: number,
      activeOuterRadiusOffset?: number,
      enableLabels?: boolean,
      labelFormat?: 'percentage' | 'value' | 'both',
      enableArcLabels?: boolean,
      enableArcLinkLabels?: boolean,
      arcLabelsSkipAngle?: number,
      arcLabelsTextColor?: string,
      arcLinkLabelsSkipAngle?: number,
      arcLinkLabelsTextColor?: string,

      // ========== LINE ESPECÍFICAS ==========
      lineWidth?: number,
      enablePoints?: boolean,
      pointSize?: number,
      curve?: 'linear' | 'cardinal' | 'catmullRom' | 'monotoneX',
      enableArea?: boolean,
      enablePointLabels?: boolean,
      pointLabelTextColor?: string,

      // ========== AREA ESPECÍFICAS ==========
      areaOpacity?: number,

      // ========== GERAL ==========
      icon?: string
    },
    position?: {
      x?: number,
      y?: number,
      w?: number,
      h?: number
    }
  ) => {
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

        // Merge styling properties with existing styling (similar to updateKPI)
        let stylingUpdate = {}
        if (styling && Object.keys(styling).length > 0) {
          stylingUpdate = { styling: { ...(existingChart.styling || {}), ...styling } }
        }

        // Merge position properties with existing position
        let positionUpdate = {}
        if (position && Object.keys(position).length > 0) {
          positionUpdate = {
            position: {
              ...(existingChart.position || {}),
              ...(position.x !== undefined && { x: position.x }),
              ...(position.y !== undefined && { y: position.y }),
              ...(position.w !== undefined && { w: position.w }),
              ...(position.h !== undefined && { h: position.h })
            }
          }
        }

        // Combine all updates
        const finalUpdateData = { ...updateData, ...stylingUpdate, ...positionUpdate }

        // Route to appropriate update action based on detected type
        switch (chartType) {
          case 'bar':
            barChartActions.updateBarChart(existingChart.id, finalUpdateData)
            break
          case 'line':
            lineChartActions.updateLineChart(existingChart.id, finalUpdateData)
            break
          case 'pie':
            pieChartActions.updatePieChart(existingChart.id, finalUpdateData)
            break
          case 'area':
            areaChartActions.updateAreaChart(existingChart.id, finalUpdateData)
            break
          case 'horizontal-bar':
            horizontalBarChartActions.updateHorizontalBarChart(existingChart.id, finalUpdateData)
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


  // Update Table function (follows Datasets pattern)
  const updateTable = async (
    tableName: string,
    newBqTable?: string,
    newColumns?: string[],
    newTitle?: string,
    styling?: {
      // Display options
      searchPlaceholder?: string,
      showColumnToggle?: boolean,
      showPagination?: boolean,
      pageSize?: number,

      // Visual styling
      headerBackground?: string,
      headerTextColor?: string,
      rowHoverColor?: string,
      borderColor?: string,
      borderRadius?: number,
      borderWidth?: number,
      padding?: number,

      // Typography - Header
      headerFontSize?: number,
      headerFontFamily?: string,
      headerFontWeight?: string,

      // Typography - Cell
      cellFontSize?: number,
      cellFontFamily?: string,
      cellFontWeight?: string,
      cellTextColor?: string,
      lineHeight?: number,
      letterSpacing?: number,
      defaultTextAlign?: 'left' | 'center' | 'right' | 'justify',

      // Functionality
      enableSearch?: boolean,
      enableSorting?: boolean,
      enableExport?: boolean,
      exportFormats?: ('csv' | 'excel' | 'pdf')[],
      enableFiltering?: boolean,
      enableMultiSort?: boolean,

      // Row selection
      enableRowSelection?: boolean,
      selectionMode?: 'single' | 'multiple',

      // Editing
      editableMode?: boolean,
      editableCells?: string[] | 'all' | 'none',
      editingCellColor?: string,
      validationErrorColor?: string,
      modifiedCellColor?: string,

      // Performance
      searchDebounce?: number,
      enableVirtualization?: boolean,
      enableAutoRefresh?: boolean,
      autoRefreshInterval?: number,

      // Export options
      exportButtonPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
      csvSeparator?: string,
      exportFilePrefix?: string,
      exportIncludeTimestamp?: boolean,

      // Icon
      icon?: string
    },
    position?: {
      x?: number,
      y?: number,
      w?: number,
      h?: number
    }
  ) => {
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
              sortable: styling?.enableSorting !== undefined ? styling.enableSorting : (existingTable.config.enableSorting !== undefined ? existingTable.config.enableSorting : true),
              type: 'text' as const // simplified - could be enhanced to detect types
            })),

            // Display options (merge with existing or use new values)
            searchPlaceholder: styling?.searchPlaceholder !== undefined ? styling.searchPlaceholder : (existingTable.config.searchPlaceholder || 'Buscar...'),
            showColumnToggle: styling?.showColumnToggle !== undefined ? styling.showColumnToggle : (existingTable.config.showColumnToggle !== undefined ? existingTable.config.showColumnToggle : true),
            showPagination: styling?.showPagination !== undefined ? styling.showPagination : (existingTable.config.showPagination !== undefined ? existingTable.config.showPagination : true),
            pageSize: styling?.pageSize !== undefined ? styling.pageSize : (existingTable.config.pageSize || 10),

            // Visual styling
            headerBackground: styling?.headerBackground !== undefined ? styling.headerBackground : existingTable.config.headerBackground,
            headerTextColor: styling?.headerTextColor !== undefined ? styling.headerTextColor : existingTable.config.headerTextColor,
            rowHoverColor: styling?.rowHoverColor !== undefined ? styling.rowHoverColor : existingTable.config.rowHoverColor,
            borderColor: styling?.borderColor !== undefined ? styling.borderColor : existingTable.config.borderColor,
            borderRadius: styling?.borderRadius !== undefined ? styling.borderRadius : existingTable.config.borderRadius,
            borderWidth: styling?.borderWidth !== undefined ? styling.borderWidth : existingTable.config.borderWidth,
            padding: styling?.padding !== undefined ? styling.padding : existingTable.config.padding,

            // Typography - Header
            headerFontSize: styling?.headerFontSize !== undefined ? styling.headerFontSize : existingTable.config.headerFontSize,
            headerFontFamily: styling?.headerFontFamily !== undefined ? styling.headerFontFamily : existingTable.config.headerFontFamily,
            headerFontWeight: styling?.headerFontWeight !== undefined ? styling.headerFontWeight : existingTable.config.headerFontWeight,

            // Typography - Cell
            cellFontSize: styling?.cellFontSize !== undefined ? styling.cellFontSize : existingTable.config.cellFontSize,
            cellFontFamily: styling?.cellFontFamily !== undefined ? styling.cellFontFamily : existingTable.config.cellFontFamily,
            cellFontWeight: styling?.cellFontWeight !== undefined ? styling.cellFontWeight : existingTable.config.cellFontWeight,
            cellTextColor: styling?.cellTextColor !== undefined ? styling.cellTextColor : existingTable.config.cellTextColor,
            lineHeight: styling?.lineHeight !== undefined ? styling.lineHeight : existingTable.config.lineHeight,
            letterSpacing: styling?.letterSpacing !== undefined ? styling.letterSpacing : existingTable.config.letterSpacing,
            defaultTextAlign: styling?.defaultTextAlign !== undefined ? styling.defaultTextAlign : existingTable.config.defaultTextAlign,

            // Functionality
            enableSearch: styling?.enableSearch !== undefined ? styling.enableSearch : (existingTable.config.enableSearch !== undefined ? existingTable.config.enableSearch : true),
            enableSorting: styling?.enableSorting !== undefined ? styling.enableSorting : (existingTable.config.enableSorting !== undefined ? existingTable.config.enableSorting : true),
            enableExport: styling?.enableExport !== undefined ? styling.enableExport : existingTable.config.enableExport,
            exportFormats: styling?.exportFormats !== undefined ? styling.exportFormats : existingTable.config.exportFormats,
            enableFiltering: styling?.enableFiltering !== undefined ? styling.enableFiltering : existingTable.config.enableFiltering,
            enableMultiSort: styling?.enableMultiSort !== undefined ? styling.enableMultiSort : existingTable.config.enableMultiSort,

            // Row selection
            enableRowSelection: styling?.enableRowSelection !== undefined ? styling.enableRowSelection : existingTable.config.enableRowSelection,
            selectionMode: styling?.selectionMode !== undefined ? styling.selectionMode : existingTable.config.selectionMode,

            // Editing
            editableMode: styling?.editableMode !== undefined ? styling.editableMode : existingTable.config.editableMode,
            editableCells: styling?.editableCells !== undefined ? styling.editableCells : existingTable.config.editableCells,
            editingCellColor: styling?.editingCellColor !== undefined ? styling.editingCellColor : existingTable.config.editingCellColor,
            validationErrorColor: styling?.validationErrorColor !== undefined ? styling.validationErrorColor : existingTable.config.validationErrorColor,
            modifiedCellColor: styling?.modifiedCellColor !== undefined ? styling.modifiedCellColor : existingTable.config.modifiedCellColor,

            // Performance
            searchDebounce: styling?.searchDebounce !== undefined ? styling.searchDebounce : existingTable.config.searchDebounce,
            enableVirtualization: styling?.enableVirtualization !== undefined ? styling.enableVirtualization : existingTable.config.enableVirtualization,
            enableAutoRefresh: styling?.enableAutoRefresh !== undefined ? styling.enableAutoRefresh : existingTable.config.enableAutoRefresh,
            autoRefreshInterval: styling?.autoRefreshInterval !== undefined ? styling.autoRefreshInterval : existingTable.config.autoRefreshInterval,

            // Export options
            exportButtonPosition: styling?.exportButtonPosition !== undefined ? styling.exportButtonPosition : existingTable.config.exportButtonPosition,
            csvSeparator: styling?.csvSeparator !== undefined ? styling.csvSeparator : existingTable.config.csvSeparator,
            exportFilePrefix: styling?.exportFilePrefix !== undefined ? styling.exportFilePrefix : existingTable.config.exportFilePrefix,
            exportIncludeTimestamp: styling?.exportIncludeTimestamp !== undefined ? styling.exportIncludeTimestamp : existingTable.config.exportIncludeTimestamp,

            // Data source
            dataSource: 'BigQuery'
          }
        })

        // Update position and size if provided
        if (position && (position.x !== undefined || position.y !== undefined || position.w !== undefined || position.h !== undefined)) {
          tableActions.editTable(existingTable.i, {
            x: position.x !== undefined ? position.x : existingTable.x,
            y: position.y !== undefined ? position.y : existingTable.y,
            w: position.w !== undefined ? position.w : existingTable.w,
            h: position.h !== undefined ? position.h : existingTable.h
          })
        }

        // Update icon if provided
        if (styling?.icon !== undefined) {
          tableActions.editTable(existingTable.i, {
            icon: styling.icon
          })
        }

        log(`✅ Table "${updatedTitle}" updated successfully with ${data.length} rows`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      log(`❌ Failed to update table: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
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
          await updateChart(item.name, item.table, item.xField, item.yField, item.aggregation, item.title, item.styling, item.position)
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
          await updateTable(item.name, item.table, item.columns, item.title, item.styling, item.position)
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