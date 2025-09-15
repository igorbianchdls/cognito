import { kpiActions } from '@/stores/apps/kpiStore'
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
}