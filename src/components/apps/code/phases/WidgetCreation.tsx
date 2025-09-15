import { kpiActions } from '@/stores/apps/kpiStore'
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
}