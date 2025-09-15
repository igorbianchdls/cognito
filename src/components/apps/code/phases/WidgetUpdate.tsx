import { kpiActions } from '@/stores/apps/kpiStore'
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

          // Layout & Appearance properties (from KPICard)
          backgroundColor: styling?.backgroundColor !== undefined ? styling.backgroundColor : existingKPI.config.backgroundColor,
          backgroundOpacity: styling?.backgroundOpacity !== undefined ? styling.backgroundOpacity : existingKPI.config.backgroundOpacity,
          borderColor: styling?.borderColor !== undefined ? styling.borderColor : existingKPI.config.borderColor,
          borderOpacity: styling?.borderOpacity !== undefined ? styling.borderOpacity : existingKPI.config.borderOpacity,
          borderWidth: styling?.borderWidth !== undefined ? styling.borderWidth : existingKPI.config.borderWidth,
          borderRadius: styling?.borderRadius !== undefined ? styling.borderRadius : existingKPI.config.borderRadius,
          padding: styling?.padding !== undefined ? styling.padding : existingKPI.config.padding,
          textAlign: styling?.textAlign !== undefined ? styling.textAlign : existingKPI.config.textAlign,
          shadow: styling?.shadow !== undefined ? styling.shadow : existingKPI.config.shadow,

          // Typography - Value properties
          valueFontSize: styling?.valueFontSize !== undefined ? styling.valueFontSize : existingKPI.config.valueFontSize,
          valueColor: styling?.valueColor !== undefined ? styling.valueColor : existingKPI.config.valueColor,
          valueFontWeight: styling?.valueFontWeight !== undefined ? styling.valueFontWeight : existingKPI.config.valueFontWeight,
          valueFontFamily: styling?.valueFontFamily !== undefined ? styling.valueFontFamily : existingKPI.config.valueFontFamily,

          // Typography - Name properties
          nameFontSize: styling?.nameFontSize !== undefined ? styling.nameFontSize : existingKPI.config.nameFontSize,
          nameColor: styling?.nameColor !== undefined ? styling.nameColor : existingKPI.config.nameColor,
          nameFontWeight: styling?.nameFontWeight !== undefined ? styling.nameFontWeight : existingKPI.config.nameFontWeight,
          nameFontFamily: styling?.nameFontFamily !== undefined ? styling.nameFontFamily : existingKPI.config.nameFontFamily,

          // Color properties
          changeColor: styling?.changeColor !== undefined ? styling.changeColor : existingKPI.config.changeColor,
          targetColor: styling?.targetColor !== undefined ? styling.targetColor : existingKPI.config.targetColor,

          // Title-specific properties
          titleAlign: styling?.titleAlign !== undefined ? styling.titleAlign : existingKPI.config.titleAlign,
          titleMarginTop: styling?.titleMarginTop !== undefined ? styling.titleMarginTop : existingKPI.config.titleMarginTop,
          titleMarginBottom: styling?.titleMarginBottom !== undefined ? styling.titleMarginBottom : existingKPI.config.titleMarginBottom,
          titleLetterSpacing: styling?.titleLetterSpacing !== undefined ? styling.titleLetterSpacing : existingKPI.config.titleLetterSpacing,
          titleLineHeight: styling?.titleLineHeight !== undefined ? styling.titleLineHeight : existingKPI.config.titleLineHeight,

          // Subtitle-specific properties
          subtitleAlign: styling?.subtitleAlign !== undefined ? styling.subtitleAlign : existingKPI.config.subtitleAlign,
          subtitleMarginTop: styling?.subtitleMarginTop !== undefined ? styling.subtitleMarginTop : existingKPI.config.subtitleMarginTop,
          subtitleMarginBottom: styling?.subtitleMarginBottom !== undefined ? styling.subtitleMarginBottom : existingKPI.config.subtitleMarginBottom,
          subtitleLetterSpacing: styling?.subtitleLetterSpacing !== undefined ? styling.subtitleLetterSpacing : existingKPI.config.subtitleLetterSpacing,
          subtitleLineHeight: styling?.subtitleLineHeight !== undefined ? styling.subtitleLineHeight : existingKPI.config.subtitleLineHeight,

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
}