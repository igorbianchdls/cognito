import { kpiActions } from '@/stores/apps/kpiStore'
import { tableActions } from '@/stores/apps/tableStore'
import { barChartActions } from '@/stores/apps/barChartStore'
import { lineChartActions } from '@/stores/apps/lineChartStore'
import { pieChartActions } from '@/stores/apps/pieChartStore'
import { areaChartActions } from '@/stores/apps/areaChartStore'
import { horizontalBarChartActions } from '@/stores/apps/horizontalBarChartStore'
import { QueryConstructionPhase } from './QueryConstructionPhase'
import { WidgetLookupPhase } from './WidgetLookupPhase'
import { BigQueryExecutionPhase } from './BigQueryExecutionPhase'
import { DataTransformationPhase } from './DataTransformationPhase'

export class WidgetUpdate {
  // Update KPI function (follows Datasets pattern)
  static async updateKPI(
    kpiName: string,
    newTable?: string,
    newField?: string,
    newCalculation?: string,
    newTitle?: string,
    styling?: {
      // Data display properties
      unit?: string,
      showTarget?: boolean,
      target?: number,
      showTrend?: boolean,
      visualizationType?: 'card',
      icon?: string,

      // Container styling properties
      kpiContainerBackgroundColor?: string,
      kpiContainerBackgroundOpacity?: number,
      kpiContainerBorderColor?: string,
      kpiContainerBorderOpacity?: number,
      kpiContainerBorderWidth?: number,
      kpiContainerBorderRadius?: number,
      kpiContainerPadding?: number,
      kpiContainerTextAlign?: 'left' | 'center' | 'right',
      kpiContainerShadow?: boolean,

      // KPI Value styling properties (number display)
      kpiValueColor?: string,
      kpiValueFontSize?: number,
      kpiValueFontWeight?: number,
      kpiValueFontFamily?: string,
      kpiValueAlign?: 'left' | 'center' | 'right',
      kpiValueMarginTop?: number,
      kpiValueMarginBottom?: number,
      kpiValueLetterSpacing?: number,
      kpiValueLineHeight?: number,

      // KPI Name styling properties (label display)
      kpiNameColor?: string,
      kpiNameFontSize?: number,
      kpiNameFontWeight?: number,
      kpiNameFontFamily?: string,
      kpiNameAlign?: 'left' | 'center' | 'right',
      kpiNameMarginTop?: number,
      kpiNameMarginBottom?: number,
      kpiNameLetterSpacing?: number,
      kpiNameLineHeight?: number,

      // Special color properties
      changeColor?: string,
      targetColor?: string,

      // Background Advanced
      backgroundColor?: string,
      backgroundOpacity?: number,
      backgroundGradient?: {
        enabled: boolean,
        type: 'linear' | 'radial' | 'conic',
        direction: string,
        startColor: string,
        endColor: string
      },
      backdropFilter?: {
        enabled: boolean,
        blur: number
      },

      // Typography - Title/Subtitle (for KPI container)
      titleFontSize?: number,
      titleFontWeight?: number,
      titleColor?: string,
      subtitleFontSize?: number,
      subtitleFontWeight?: number,
      subtitleColor?: string,

      // Spacing - Title/Subtitle
      titleMarginTop?: number,
      titleMarginRight?: number,
      titleMarginBottom?: number,
      titleMarginLeft?: number,
      titlePaddingTop?: number,
      titlePaddingRight?: number,
      titlePaddingBottom?: number,
      titlePaddingLeft?: number,
      subtitleMarginTop?: number,
      subtitleMarginRight?: number,
      subtitleMarginBottom?: number,
      subtitleMarginLeft?: number,
      subtitlePaddingTop?: number,
      subtitlePaddingRight?: number,
      subtitlePaddingBottom?: number,
      subtitlePaddingLeft?: number,

      // Tailwind Classes
      titleClassName?: string,
      subtitleClassName?: string,
      containerClassName?: string,

      // Container Border & Shadow (additional to existing kpi properties)
      containerBorderWidth?: number,
      containerBorderColor?: string,
      containerBorderRadius?: number,
      containerPadding?: number,
      containerShadowColor?: string,
      containerShadowOpacity?: number,
      containerShadowBlur?: number,
      containerShadowOffsetX?: number,
      containerShadowOffsetY?: number
    },
    position?: {
      x?: number,
      y?: number,
      w?: number,
      h?: number
    },
    log?: (...args: unknown[]) => void
  ) {
    try {
      // 1. Find existing KPI by name (same as Datasets selection)
      const existingKPI = WidgetLookupPhase.findExistingKPI(kpiName)

      if (!existingKPI) {
        throw new Error(`KPI "${kpiName}" not found`)
      }

      if (log) log(`Found KPI to update: ${kpiName} (ID: ${existingKPI.i})`)

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

      if (log) log(`Updating KPI: ${updatedTable}.${updatedField} (${updatedCalculation})`)

      // 4. Generate and execute new query (same as createKPI)
      const query = QueryConstructionPhase.buildKPIQuery(updatedTable, updatedField, updatedCalculation)

      if (log) log(`Executing: ${query}`)

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

          // Apply styling if provided (merge with existing or use new values)
          unit: styling?.unit !== undefined ? styling.unit : existingKPI.config.unit,
          showTarget: styling?.showTarget !== undefined ? styling.showTarget : existingKPI.config.showTarget,
          showTrend: styling?.showTrend !== undefined ? styling.showTrend : existingKPI.config.showTrend,
          target: styling?.target !== undefined ? styling.target : existingKPI.config.target,
          visualizationType: styling?.visualizationType !== undefined ? styling.visualizationType : existingKPI.config.visualizationType,

          // Container styling properties
          kpiContainerBackgroundColor: styling?.kpiContainerBackgroundColor !== undefined ? styling.kpiContainerBackgroundColor : existingKPI.config.kpiContainerBackgroundColor,
          kpiContainerBackgroundOpacity: styling?.kpiContainerBackgroundOpacity !== undefined ? styling.kpiContainerBackgroundOpacity : existingKPI.config.kpiContainerBackgroundOpacity,
          kpiContainerBorderColor: styling?.kpiContainerBorderColor !== undefined ? styling.kpiContainerBorderColor : existingKPI.config.kpiContainerBorderColor,
          kpiContainerBorderOpacity: styling?.kpiContainerBorderOpacity !== undefined ? styling.kpiContainerBorderOpacity : existingKPI.config.kpiContainerBorderOpacity,
          kpiContainerBorderWidth: styling?.kpiContainerBorderWidth !== undefined ? styling.kpiContainerBorderWidth : existingKPI.config.kpiContainerBorderWidth,
          kpiContainerBorderRadius: styling?.kpiContainerBorderRadius !== undefined ? styling.kpiContainerBorderRadius : existingKPI.config.kpiContainerBorderRadius,
          kpiContainerPadding: styling?.kpiContainerPadding !== undefined ? styling.kpiContainerPadding : existingKPI.config.kpiContainerPadding,
          kpiContainerTextAlign: styling?.kpiContainerTextAlign !== undefined ? styling.kpiContainerTextAlign : existingKPI.config.kpiContainerTextAlign,
          kpiContainerShadow: styling?.kpiContainerShadow !== undefined ? styling.kpiContainerShadow : existingKPI.config.kpiContainerShadow,

          // KPI Value styling properties
          kpiValueColor: styling?.kpiValueColor !== undefined ? styling.kpiValueColor : existingKPI.config.kpiValueColor,
          kpiValueFontSize: styling?.kpiValueFontSize !== undefined ? styling.kpiValueFontSize : existingKPI.config.kpiValueFontSize,
          kpiValueFontWeight: styling?.kpiValueFontWeight !== undefined ? styling.kpiValueFontWeight : existingKPI.config.kpiValueFontWeight,
          kpiValueFontFamily: styling?.kpiValueFontFamily !== undefined ? styling.kpiValueFontFamily : existingKPI.config.kpiValueFontFamily,
          kpiValueAlign: styling?.kpiValueAlign !== undefined ? styling.kpiValueAlign : existingKPI.config.kpiValueAlign,
          kpiValueMarginTop: styling?.kpiValueMarginTop !== undefined ? styling.kpiValueMarginTop : existingKPI.config.kpiValueMarginTop,
          kpiValueMarginBottom: styling?.kpiValueMarginBottom !== undefined ? styling.kpiValueMarginBottom : existingKPI.config.kpiValueMarginBottom,
          kpiValueLetterSpacing: styling?.kpiValueLetterSpacing !== undefined ? styling.kpiValueLetterSpacing : existingKPI.config.kpiValueLetterSpacing,
          kpiValueLineHeight: styling?.kpiValueLineHeight !== undefined ? styling.kpiValueLineHeight : existingKPI.config.kpiValueLineHeight,

          // KPI Name styling properties
          kpiNameColor: styling?.kpiNameColor !== undefined ? styling.kpiNameColor : existingKPI.config.kpiNameColor,
          kpiNameFontSize: styling?.kpiNameFontSize !== undefined ? styling.kpiNameFontSize : existingKPI.config.kpiNameFontSize,
          kpiNameFontWeight: styling?.kpiNameFontWeight !== undefined ? styling.kpiNameFontWeight : existingKPI.config.kpiNameFontWeight,
          kpiNameFontFamily: styling?.kpiNameFontFamily !== undefined ? styling.kpiNameFontFamily : existingKPI.config.kpiNameFontFamily,
          kpiNameAlign: styling?.kpiNameAlign !== undefined ? styling.kpiNameAlign : existingKPI.config.kpiNameAlign,
          kpiNameMarginTop: styling?.kpiNameMarginTop !== undefined ? styling.kpiNameMarginTop : existingKPI.config.kpiNameMarginTop,
          kpiNameMarginBottom: styling?.kpiNameMarginBottom !== undefined ? styling.kpiNameMarginBottom : existingKPI.config.kpiNameMarginBottom,
          kpiNameLetterSpacing: styling?.kpiNameLetterSpacing !== undefined ? styling.kpiNameLetterSpacing : existingKPI.config.kpiNameLetterSpacing,
          kpiNameLineHeight: styling?.kpiNameLineHeight !== undefined ? styling.kpiNameLineHeight : existingKPI.config.kpiNameLineHeight,

          // Special color properties
          changeColor: styling?.changeColor !== undefined ? styling.changeColor : existingKPI.config.changeColor,
          targetColor: styling?.targetColor !== undefined ? styling.targetColor : existingKPI.config.targetColor,

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

        // Update position and size if provided
        if (position && (position.x !== undefined || position.y !== undefined || position.w !== undefined || position.h !== undefined)) {
          kpiActions.editKPI(existingKPI.i, {
            x: position.x !== undefined ? position.x : existingKPI.x,
            y: position.y !== undefined ? position.y : existingKPI.y,
            w: position.w !== undefined ? position.w : existingKPI.w,
            h: position.h !== undefined ? position.h : existingKPI.h
          })
        }

        // Update icon if provided
        if (styling?.icon !== undefined) {
          kpiActions.editKPI(existingKPI.i, {
            icon: styling.icon
          })
        }

        if (log) log(`✅ KPI "${updatedTitle}" updated successfully with value: ${newValue}`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      if (log) log(`❌ Failed to update KPI: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Update Chart function (follows Datasets pattern)
  static async updateChart(
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

      // Background Advanced
      backgroundColor?: string,
      backgroundOpacity?: number,
      backgroundGradient?: {
        enabled: boolean,
        type: 'linear' | 'radial' | 'conic',
        direction: string,
        startColor: string,
        endColor: string
      },
      backdropFilter?: {
        enabled: boolean,
        blur: number
      },

      // Typography - Title/Subtitle
      titleFontSize?: number,
      titleFontWeight?: number,
      titleColor?: string,
      subtitleFontSize?: number,
      subtitleFontWeight?: number,
      subtitleColor?: string,

      // Spacing - Title/Subtitle
      titleMarginTop?: number,
      titleMarginRight?: number,
      titleMarginBottom?: number,
      titleMarginLeft?: number,
      titlePaddingTop?: number,
      titlePaddingRight?: number,
      titlePaddingBottom?: number,
      titlePaddingLeft?: number,
      subtitleMarginTop?: number,
      subtitleMarginRight?: number,
      subtitleMarginBottom?: number,
      subtitleMarginLeft?: number,
      subtitlePaddingTop?: number,
      subtitlePaddingRight?: number,
      subtitlePaddingBottom?: number,
      subtitlePaddingLeft?: number,

      // Tailwind Classes - Title/Subtitle
      titleClassName?: string,
      subtitleClassName?: string,
      containerClassName?: string,

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
    },
    log?: (...args: unknown[]) => void
  ) {
    try {
      // 1. Find existing Chart by name (search all chart types)
      const { existingChart, chartType } = WidgetLookupPhase.findExistingChart(chartName)

      if (!existingChart || !chartType) {
        throw new Error(`Chart "${chartName}" not found`)
      }

      if (log) log(`Found ${chartType} chart to update: ${chartName} (ID: ${existingChart.id})`)

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

      if (log) log(`Updating ${chartType} chart: ${updatedTable}.${updatedXField} x ${updatedYField} (${updatedAggregation})`)

      // 4. Generate and execute new query (same as createChart)
      const query = QueryConstructionPhase.buildChartQuery(updatedTable, updatedXField, updatedYField, updatedAggregation)

      if (log) log(`Executing: ${query}`)

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

        if (log) log(`✅ ${chartType} chart "${updatedTitle}" updated successfully with ${data.length} rows`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      if (log) log(`❌ Failed to update chart: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Update Table function (follows Datasets pattern)
  static async updateTable(
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
    },
    log?: (...args: unknown[]) => void
  ) {
    try {
      // 1. Find existing Table by name (same as Datasets selection)
      const existingTable = WidgetLookupPhase.findExistingTable(tableName)

      if (!existingTable) {
        throw new Error(`Table "${tableName}" not found`)
      }

      if (log) log(`Found Table to update: ${tableName} (ID: ${existingTable.i})`)

      // 2. Get current data (Table doesn't store much - user reconfigures everything)
      const currentColumns = existingTable.config.columns?.map(col => col.id) || []

      // 3. Apply changes (use new values or keep current ones)
      const updatedBqTable = newBqTable // No fallback - table doesn't store BigQuery table name
      const updatedColumns = newColumns || currentColumns
      const updatedTitle = newTitle || existingTable.name

      if (!updatedBqTable || !updatedColumns.length) {
        throw new Error('BigQuery table and columns are required for table update')
      }

      if (log) log(`Updating Table: ${updatedBqTable} with columns [${updatedColumns.join(', ')}]`)

      // 4. Generate and execute new query (same as createTable)
      const query = QueryConstructionPhase.buildTableQuery(updatedBqTable, updatedColumns)

      if (log) log(`Executing: ${query}`)

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

        if (log) log(`✅ Table "${updatedTitle}" updated successfully with ${data.length} rows`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      if (log) log(`❌ Failed to update table: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}