import { kpiActions } from '@/stores/apps/kpiStore'
import { tableActions } from '@/stores/apps/tableStore'
import { barChartActions } from '@/stores/apps/barChartStore'
import { lineChartActions } from '@/stores/apps/lineChartStore'
import { pieChartActions } from '@/stores/apps/pieChartStore'
import { areaChartActions } from '@/stores/apps/areaChartStore'
import { horizontalBarChartActions } from '@/stores/apps/horizontalBarChartStore'
import { QueryConstructionPhase } from './QueryConstructionPhase'
import { BigQueryExecutionPhase } from './BigQueryExecutionPhase'
import { DataTransformationPhase } from './DataTransformationPhase'

export class WidgetCreation {
  // Simple KPI creation function
  static async createKPI(
    table: string,
    field: string,
    calculation: string,
    title: string,
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
      // Generate SQL query automatically (same as Datasets)
      const query = QueryConstructionPhase.buildKPIQuery(table, field, calculation)

      if (log) log(`Executing: ${query}`)

      // Execute BigQuery (same as Datasets)
      const result = await BigQueryExecutionPhase.executeQuery(query)

      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = result.data.data
        const value = DataTransformationPhase.transformKPIData(data)

        // Create KPI using the same action as Datasets
        kpiActions.addKPI({
          name: title,
          icon: styling?.icon || '📈',
          description: `KPI from ${table}`,
          position: { x: position?.x || 0, y: position?.y || 0 },
          size: { w: position?.w || 48, h: position?.h || 100 },
          config: {
            name: title,
            value: value,
            metric: field,
            calculation: calculation,
            unit: styling?.unit || '',
            showTarget: styling?.showTarget || false,
            showTrend: styling?.showTrend || false,
            target: styling?.target || 0,
            visualizationType: styling?.visualizationType || 'card' as const,
            enableSimulation: false,
            dataSourceType: 'bigquery' as const,

            // Container styling properties
            kpiContainerBackgroundColor: styling?.kpiContainerBackgroundColor,
            kpiContainerBackgroundOpacity: styling?.kpiContainerBackgroundOpacity,
            kpiContainerBorderColor: styling?.kpiContainerBorderColor,
            kpiContainerBorderOpacity: styling?.kpiContainerBorderOpacity,
            kpiContainerBorderWidth: styling?.kpiContainerBorderWidth,
            kpiContainerBorderRadius: styling?.kpiContainerBorderRadius,
            kpiContainerPadding: styling?.kpiContainerPadding,
            kpiContainerTextAlign: styling?.kpiContainerTextAlign,
            kpiContainerShadow: styling?.kpiContainerShadow,

            // KPI Value styling properties
            kpiValueColor: styling?.kpiValueColor,
            kpiValueFontSize: styling?.kpiValueFontSize,
            kpiValueFontWeight: styling?.kpiValueFontWeight,
            kpiValueFontFamily: styling?.kpiValueFontFamily,
            kpiValueAlign: styling?.kpiValueAlign,
            kpiValueMarginTop: styling?.kpiValueMarginTop,
            kpiValueMarginBottom: styling?.kpiValueMarginBottom,
            kpiValueLetterSpacing: styling?.kpiValueLetterSpacing,
            kpiValueLineHeight: styling?.kpiValueLineHeight,

            // KPI Name styling properties
            kpiNameColor: styling?.kpiNameColor,
            kpiNameFontSize: styling?.kpiNameFontSize,
            kpiNameFontWeight: styling?.kpiNameFontWeight,
            kpiNameFontFamily: styling?.kpiNameFontFamily,
            kpiNameAlign: styling?.kpiNameAlign,
            kpiNameMarginTop: styling?.kpiNameMarginTop,
            kpiNameMarginBottom: styling?.kpiNameMarginBottom,
            kpiNameLetterSpacing: styling?.kpiNameLetterSpacing,
            kpiNameLineHeight: styling?.kpiNameLineHeight,

            // Special color properties
            changeColor: styling?.changeColor,
            targetColor: styling?.targetColor,
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

        if (log) log(`✅ KPI "${title}" created with value: ${value}`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      if (log) log(`❌ Failed to create KPI: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Simple Table creation function
  static async createTable(
    table: string,
    columns: string[],
    title?: string,
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
      // Generate SQL query (same as TablePreview)
      const query = QueryConstructionPhase.buildTableQuery(table, columns)

      if (log) log(`Executing: ${query}`)

      // Execute BigQuery (same as Datasets)
      const result = await BigQueryExecutionPhase.executeQuery(query)

      if (result.success && result.data?.data && Array.isArray(result.data.data)) {
        const data = DataTransformationPhase.transformTableData(result.data.data)

        // Create Table using the same action as Datasets
        tableActions.addTable({
          name: title || `${table} - Table`,
          icon: styling?.icon || '📋',
          description: `Table from ${table}`,
          position: { x: position?.x || 0, y: position?.y || 0 },
          size: { w: position?.w || 72, h: position?.h || 200 },
          config: {
            data: data, // Real BigQuery data
            columns: columns.map(col => ({
              id: col,
              header: col,
              accessorKey: col,
              sortable: styling?.enableSorting !== undefined ? styling.enableSorting : true,
              type: 'text' as const // simplified - could be enhanced to detect types
            })),

            // Display options
            searchPlaceholder: styling?.searchPlaceholder || 'Buscar...',
            showColumnToggle: styling?.showColumnToggle !== undefined ? styling.showColumnToggle : true,
            showPagination: styling?.showPagination !== undefined ? styling.showPagination : true,
            pageSize: styling?.pageSize || 10,

            // Visual styling
            headerBackground: styling?.headerBackground,
            headerTextColor: styling?.headerTextColor,
            rowHoverColor: styling?.rowHoverColor,
            borderColor: styling?.borderColor,
            borderRadius: styling?.borderRadius,
            borderWidth: styling?.borderWidth,
            padding: styling?.padding,

            // Typography - Header
            headerFontSize: styling?.headerFontSize,
            headerFontFamily: styling?.headerFontFamily,
            headerFontWeight: styling?.headerFontWeight,

            // Typography - Cell
            cellFontSize: styling?.cellFontSize,
            cellFontFamily: styling?.cellFontFamily,
            cellFontWeight: styling?.cellFontWeight,
            cellTextColor: styling?.cellTextColor,
            lineHeight: styling?.lineHeight,
            letterSpacing: styling?.letterSpacing,
            defaultTextAlign: styling?.defaultTextAlign,

            // Functionality
            enableSearch: styling?.enableSearch !== undefined ? styling.enableSearch : true,
            enableSorting: styling?.enableSorting !== undefined ? styling.enableSorting : true,
            enableExport: styling?.enableExport,
            exportFormats: styling?.exportFormats,
            enableFiltering: styling?.enableFiltering,
            enableMultiSort: styling?.enableMultiSort,

            // Row selection
            enableRowSelection: styling?.enableRowSelection,
            selectionMode: styling?.selectionMode,

            // Editing
            editableMode: styling?.editableMode,
            editableCells: styling?.editableCells,
            editingCellColor: styling?.editingCellColor,
            validationErrorColor: styling?.validationErrorColor,
            modifiedCellColor: styling?.modifiedCellColor,

            // Performance
            searchDebounce: styling?.searchDebounce,
            enableVirtualization: styling?.enableVirtualization,
            enableAutoRefresh: styling?.enableAutoRefresh,
            autoRefreshInterval: styling?.autoRefreshInterval,

            // Export options
            exportButtonPosition: styling?.exportButtonPosition,
            csvSeparator: styling?.csvSeparator,
            exportFilePrefix: styling?.exportFilePrefix,
            exportIncludeTimestamp: styling?.exportIncludeTimestamp,

            // Data source
            dataSource: 'BigQuery'
          }
        })

        if (log) log(`✅ Table "${title || table}" created with ${data.length} rows`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      if (log) log(`❌ Failed to create table: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Simple Chart creation function
  static async createChart(
    type: 'bar' | 'line' | 'pie' | 'area' | 'horizontal-bar',
    table: string,
    xField: string,
    yField: string,
    aggregation: string,
    title?: string,
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
      // Generate SQL query (same as ChartPreview)
      const query = QueryConstructionPhase.buildChartQuery(table, xField, yField, aggregation)

      if (log) log(`Executing: ${query}`)

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
                x: position?.x || 0,
                y: position?.y || 0,
                w: position?.w || 60,
                h: position?.h || 150
              },
              styling: {
                // Apply styling directly - barChart will use what it recognizes and ignore the rest
                colors: styling?.colors || ['#2563eb'],
                showLegend: styling?.showLegend !== undefined ? styling.showLegend : true,
                showGrid: styling?.showGrid !== undefined ? styling.showGrid : true,
                title: styling?.title || title || `${xField} por ${yField}`,
                ...styling // Pass all styling props - store will filter what it needs
              }
            })
            break
          case 'line':
            lineChartActions.addLineChart({
              ...baseChartConfig,
              chartType: 'line',
              position: {
                x: position?.x || 0,
                y: position?.y || 0,
                w: position?.w || 60,
                h: position?.h || 150
              },
              styling: {
                // Apply styling directly - lineChart will use what it recognizes and ignore the rest
                colors: styling?.colors || ['#10b981'],
                showLegend: styling?.showLegend !== undefined ? styling.showLegend : true,
                showGrid: styling?.showGrid !== undefined ? styling.showGrid : true,
                title: styling?.title || title || `${xField} por ${yField}`,
                ...styling // Pass all styling props - store will filter what it needs
              }
            })
            break
          case 'pie':
            pieChartActions.addPieChart({
              ...baseChartConfig,
              chartType: 'pie',
              position: {
                x: position?.x || 0,
                y: position?.y || 0,
                w: position?.w || 60,
                h: position?.h || 150
              },
              styling: {
                // Apply styling directly - pieChart will use what it recognizes and ignore the rest
                colors: styling?.colors || ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'],
                showLegend: styling?.showLegend !== undefined ? styling.showLegend : true,
                showGrid: styling?.showGrid !== undefined ? styling.showGrid : false,
                title: styling?.title || title || `${xField} por ${yField}`,
                ...styling // Pass all styling props - store will filter what it needs
              }
            })
            break
          case 'area':
            areaChartActions.addAreaChart({
              ...baseChartConfig,
              chartType: 'area',
              position: {
                x: position?.x || 0,
                y: position?.y || 0,
                w: position?.w || 60,
                h: position?.h || 150
              },
              styling: {
                // Apply styling directly - areaChart will use what it recognizes and ignore the rest
                colors: styling?.colors || ['#8b5cf6'],
                showLegend: styling?.showLegend !== undefined ? styling.showLegend : true,
                showGrid: styling?.showGrid !== undefined ? styling.showGrid : true,
                title: styling?.title || title || `${xField} por ${yField}`,
                areaOpacity: styling?.areaOpacity !== undefined ? styling.areaOpacity : 0.4,
                ...styling // Pass all styling props - store will filter what it needs
              }
            })
            break
          case 'horizontal-bar':
            horizontalBarChartActions.addHorizontalBarChart({
              ...baseChartConfig,
              chartType: 'horizontal-bar',
              position: {
                x: position?.x || 0,
                y: position?.y || 0,
                w: position?.w || 60,
                h: position?.h || 150
              },
              styling: {
                // Apply styling directly - horizontalBarChart will use what it recognizes and ignore the rest
                colors: styling?.colors || ['#10b981'],
                showLegend: styling?.showLegend !== undefined ? styling.showLegend : true,
                showGrid: styling?.showGrid !== undefined ? styling.showGrid : true,
                title: styling?.title || title || `${xField} por ${yField}`,
                ...styling // Pass all styling props - store will filter what it needs
              }
            })
            break
        }

        if (log) log(`✅ ${type} chart "${baseChartConfig.name}" created with ${data.length} rows`)
      } else {
        throw new Error(result.error || 'No data returned')
      }
    } catch (error) {
      if (log) log(`❌ Failed to create ${type} chart: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}