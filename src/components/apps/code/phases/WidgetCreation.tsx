import { kpiActions } from '@/stores/apps/kpiStore'
import { tableActions } from '@/stores/apps/tableStore'
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

      // Layout & Appearance properties (from KPICard)
      backgroundColor?: string,
      backgroundOpacity?: number,
      borderColor?: string,
      borderOpacity?: number,
      borderWidth?: number,
      borderRadius?: number,
      padding?: number,
      textAlign?: 'left' | 'center' | 'right',
      shadow?: boolean,

      // Typography - Value properties
      valueFontSize?: number,
      valueColor?: string,
      valueFontWeight?: number,
      valueFontFamily?: string,

      // Typography - Name properties
      nameFontSize?: number,
      nameColor?: string,
      nameFontWeight?: number,
      nameFontFamily?: string,

      // Color properties
      changeColor?: string,
      targetColor?: string,

      // Title-specific properties
      titleAlign?: 'left' | 'center' | 'right',
      titleMarginTop?: number,
      titleMarginBottom?: number,
      titleLetterSpacing?: number,
      titleLineHeight?: number,

      // Subtitle-specific properties
      subtitleAlign?: 'left' | 'center' | 'right',
      subtitleMarginTop?: number,
      subtitleMarginBottom?: number,
      subtitleLetterSpacing?: number,
      subtitleLineHeight?: number
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

            // Layout & Appearance properties (from KPICard)
            backgroundColor: styling?.backgroundColor,
            backgroundOpacity: styling?.backgroundOpacity,
            borderColor: styling?.borderColor,
            borderOpacity: styling?.borderOpacity,
            borderWidth: styling?.borderWidth,
            borderRadius: styling?.borderRadius,
            padding: styling?.padding,
            textAlign: styling?.textAlign,
            shadow: styling?.shadow,

            // Typography - Value properties
            valueFontSize: styling?.valueFontSize,
            valueColor: styling?.valueColor,
            valueFontWeight: styling?.valueFontWeight,
            valueFontFamily: styling?.valueFontFamily,

            // Typography - Name properties
            nameFontSize: styling?.nameFontSize,
            nameColor: styling?.nameColor,
            nameFontWeight: styling?.nameFontWeight,
            nameFontFamily: styling?.nameFontFamily,

            // Color properties
            changeColor: styling?.changeColor,
            targetColor: styling?.targetColor,

            // Title-specific properties
            titleAlign: styling?.titleAlign,
            titleMarginTop: styling?.titleMarginTop,
            titleMarginBottom: styling?.titleMarginBottom,
            titleLetterSpacing: styling?.titleLetterSpacing,
            titleLineHeight: styling?.titleLineHeight,

            // Subtitle-specific properties
            subtitleAlign: styling?.subtitleAlign,
            subtitleMarginTop: styling?.subtitleMarginTop,
            subtitleMarginBottom: styling?.subtitleMarginBottom,
            subtitleLetterSpacing: styling?.subtitleLetterSpacing,
            subtitleLineHeight: styling?.subtitleLineHeight,
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
}