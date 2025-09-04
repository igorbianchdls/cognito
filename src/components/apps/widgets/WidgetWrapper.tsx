'use client'

import { useState, useEffect, useMemo } from 'react'
import { KPICard } from '@/components/widgets/KPICard'
import { DataTable, createSortableHeader, type TableData } from '@/components/widgets/Table'
import { BarChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { ColumnDef } from '@tanstack/react-table'
import type { DroppedWidget, KPIConfig, LegacyChartConfigWithKPI, ChartConfig } from '@/types/apps/droppedWidget'
import type { TableConfig } from '@/types/apps/tableWidgets'

interface WidgetWrapperProps {
  widget: DroppedWidget
}

// Type guard to check if chartConfig has legacy KPI properties
function isLegacyChartConfigWithKPI(config: ChartConfig | undefined): config is LegacyChartConfigWithKPI {
  return config !== undefined && (
    'kpiName' in config ||
    'kpiValue' in config ||
    'kpiUnit' in config ||
    'kpiTarget' in config ||
    'kpiChange' in config ||
    'kpiTrend' in config ||
    'kpiStatus' in config ||
    'showTarget' in config ||
    'showTrend' in config ||
    'kpiVisualizationType' in config ||
    'kpiColorScheme' in config ||
    'kpiMetric' in config ||
    'kpiCalculation' in config ||
    'kpiTimeRange' in config ||
    'kpiValueFontSize' in config ||
    'kpiValueColor' in config ||
    'kpiValueFontWeight' in config ||
    'kpiNameFontSize' in config ||
    'kpiNameColor' in config ||
    'kpiNameFontWeight' in config ||
    'kpiBackgroundColor' in config ||
    'kpiBorderColor' in config ||
    'kpiBorderWidth' in config ||
    'kpiBorderRadius' in config ||
    'kpiPadding' in config ||
    'kpiTextAlign' in config ||
    'kpiShadow' in config ||
    'kpiChangeColor' in config ||
    'kpiTargetColor' in config
  )
}

export default function WidgetWrapper({ widget }: WidgetWrapperProps) {
  // KPI Widget Logic
  if (widget.type === 'kpi' && widget.kpiConfig) {
    const kpiConfig: KPIConfig = useMemo(() => {
      console.log('🔄 KPIWidget kpiConfig recalculated for widget:', widget.i)
      return widget.kpiConfig || 
        // Backward compatibility: extract KPI props from old chartConfig
        (isLegacyChartConfigWithKPI(widget.chartConfig) ? {
          name: widget.chartConfig.kpiName,
          value: widget.chartConfig.kpiValue,
          unit: widget.chartConfig.kpiUnit,
          target: widget.chartConfig.kpiTarget,
          change: widget.chartConfig.kpiChange,
          trend: widget.chartConfig.kpiTrend,
          status: widget.chartConfig.kpiStatus,
          showTarget: widget.chartConfig.showTarget,
          showTrend: widget.chartConfig.showTrend,
          visualizationType: widget.chartConfig.kpiVisualizationType,
          colorScheme: widget.chartConfig.kpiColorScheme,
          metric: widget.chartConfig.kpiMetric,
          calculation: widget.chartConfig.kpiCalculation,
          timeRange: widget.chartConfig.kpiTimeRange,
          valueFontSize: widget.chartConfig.kpiValueFontSize,
          valueColor: widget.chartConfig.kpiValueColor,
          valueFontWeight: widget.chartConfig.kpiValueFontWeight,
          nameFontSize: widget.chartConfig.kpiNameFontSize,
          nameColor: widget.chartConfig.kpiNameColor,
          nameFontWeight: widget.chartConfig.kpiNameFontWeight,
          backgroundColor: widget.chartConfig.kpiBackgroundColor,
          borderColor: widget.chartConfig.kpiBorderColor,
          borderWidth: widget.chartConfig.kpiBorderWidth,
          borderRadius: widget.chartConfig.kpiBorderRadius,
          padding: widget.chartConfig.kpiPadding,
          textAlign: widget.chartConfig.kpiTextAlign,
          shadow: widget.chartConfig.kpiShadow,
          changeColor: widget.chartConfig.kpiChangeColor,
          targetColor: widget.chartConfig.kpiTargetColor,
        } : {}) || {}
    }, [widget.kpiConfig, widget.chartConfig, widget.i])

    // Determine KPI status based on current value vs target
    const getKpiStatus = useMemo(() => {
      if (kpiConfig.status) return kpiConfig.status
      
      const currentValue = kpiConfig.value || 0
      const target = kpiConfig.target
      
      if (!target) return 'unknown'
      
      const percentage = (currentValue / target) * 100
      if (percentage >= 100) return 'on-target'
      if (percentage >= 80) return 'above-target'
      if (percentage >= 60) return 'below-target'
      return 'critical'
    }, [kpiConfig.status, kpiConfig.value, kpiConfig.target])

    // Determine trend based on change
    const getKpiTrend = useMemo(() => {
      if (kpiConfig.trend) return kpiConfig.trend
      
      const change = kpiConfig.change || 0
      if (Math.abs(change) < 0.5) return 'stable'
      return change > 0 ? 'increasing' : 'decreasing'
    }, [kpiConfig.trend, kpiConfig.change])

    // Prepare props for KPI components
    const kpiProps = useMemo(() => {
      console.log('🔄 KPIWidget kpiProps recalculated')
      return {
        kpiId: `kpi-${widget.i}`,
        name: kpiConfig.name || 'KPI',
        metric: kpiConfig.metric || 'metric',
        calculation: kpiConfig.calculation || 'VALUE',
        currentValue: kpiConfig.value || 0,
        previousValue: kpiConfig.previousValue || 0,
        target: kpiConfig.target || undefined,
        unit: kpiConfig.unit || '',
        change: kpiConfig.change || 0,
        trend: getKpiTrend,
        status: getKpiStatus,
        timeRange: kpiConfig.timeRange || 'Current Period',
        visualization: {
          chartType: kpiConfig.visualizationType === 'gauge' ? 'gauge' : 'default',
          color: kpiConfig.colorScheme || 'blue',
          showTrend: kpiConfig.showTrend ?? true,
          showTarget: kpiConfig.showTarget ?? true,
        },
        metadata: {
          dataSource: kpiConfig.dataSource || 'BigQuery',
          refreshRate: kpiConfig.refreshRate || '5 minutes',
          lastUpdated: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
        success: true,
      }
    }, [widget.i, kpiConfig, getKpiTrend, getKpiStatus])

    return (
      <div className="h-full w-full">
        <KPICard 
          {...kpiProps}
          backgroundColor={kpiConfig.backgroundColor}
          backgroundOpacity={(kpiConfig as Record<string, unknown>).backgroundOpacity as number}
          borderColor={kpiConfig.borderColor}
          borderOpacity={(kpiConfig as Record<string, unknown>).borderOpacity as number}
          borderWidth={kpiConfig.borderWidth}
          borderRadius={kpiConfig.borderRadius}
          padding={kpiConfig.padding}
          textAlign={kpiConfig.textAlign}
          shadow={kpiConfig.shadow}
          valueFontSize={kpiConfig.valueFontSize}
          valueColor={kpiConfig.valueColor}
          valueFontWeight={kpiConfig.valueFontWeight}
          nameFontSize={kpiConfig.nameFontSize}
          nameColor={kpiConfig.nameColor}
          nameFontWeight={kpiConfig.nameFontWeight}
          changeColor={kpiConfig.changeColor}
          targetColor={kpiConfig.targetColor}
        />
      </div>
    )
  }

  // Table Widget Logic
  if (widget.type === 'table' && widget.tableConfig) {
    const tableConfig: TableConfig = widget.tableConfig || {}
    const [data, setData] = useState<TableData[]>([])

    // Initialize table data
    useEffect(() => {
      // PRIORITY 1: Real BigQuery data from TableConfigEditor
      if (tableConfig.data && tableConfig.data.length > 0) {
        const configData = tableConfig.data.map((row, index) => ({
          id: row.id || index + 1,
          ...row
        }))
        setData(configData as TableData[])
        console.log('📋 TableWidget using REAL BigQuery data from config:', configData.length, 'rows')
      }
      // PRIORITY 2: BigQuery data from Universal Builder
      else if (widget.bigqueryData && widget.bigqueryData.data && Array.isArray(widget.bigqueryData.data)) {
        const bigqueryData = widget.bigqueryData.data as Array<Record<string, unknown>>
        const tableData = bigqueryData.map((row, index) => ({
          id: index + 1,
          ...row
        }))
        setData(tableData as TableData[])
        console.log('📋 TableWidget using BigQuery data from Universal Builder:', tableData.length, 'rows')
      } 
      // FALLBACK: Default sample data
      else {
        const defaultData = [
          { id: 1, name: 'João Silva', email: 'joao@email.com', status: 'Ativo', score: 85 },
          { id: 2, name: 'Maria Santos', email: 'maria@email.com', status: 'Inativo', score: 92 },
          { id: 3, name: 'Pedro Costa', email: 'pedro@email.com', status: 'Ativo', score: 78 },
          { id: 4, name: 'Ana Oliveira', email: 'ana@email.com', status: 'Pendente', score: 88 },
          { id: 5, name: 'Carlos Lima', email: 'carlos@email.com', status: 'Ativo', score: 95 },
        ]
        setData(defaultData)
        console.log('📋 TableWidget using fallback sample data')
      }
    }, [widget.tableConfig, widget.bigqueryData, tableConfig.data])

    // Generate columns from data or use config columns
    const columns: ColumnDef<TableData>[] = useMemo(() => {
      if (tableConfig.columns && tableConfig.columns.length > 0) {
        return tableConfig.columns.map(col => ({
          accessorKey: col.accessorKey,
          header: col.sortable !== false ? createSortableHeader(col.header, {
            fontSize: tableConfig.headerFontSize,
            fontFamily: tableConfig.headerFontFamily,
            fontWeight: tableConfig.headerFontWeight
          }) : col.header,
          size: typeof col.width === 'number' ? col.width : undefined,
        }))
      }

      // Generate from data
      if (data.length === 0) return []
      
      const firstRow = data[0]
      return Object.keys(firstRow)
        .filter(key => key !== 'id')
        .map(key => ({
          accessorKey: key,
          header: createSortableHeader(key.charAt(0).toUpperCase() + key.slice(1), {
            fontSize: tableConfig.headerFontSize,
            fontFamily: tableConfig.headerFontFamily,
            fontWeight: tableConfig.headerFontWeight
          }),
          cell: ({ row }) => {
            const value = row.getValue(key)
            if (typeof value === 'number') {
              return <div className="text-right">{value}</div>
            }
            if (key === 'status' || key === 'estado') {
              return (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  String(value).toLowerCase().includes('ativo') 
                    ? 'bg-green-100 text-green-800'
                    : String(value).toLowerCase().includes('inativo')
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {String(value)}
                </span>
              )
            }
            return String(value)
          },
        }))
    }, [data, tableConfig])

    return (
      <div className="h-full w-full">
        <DataTable 
          data={data}
          columns={columns}
          searchPlaceholder={tableConfig.searchPlaceholder || 'Buscar...'}
          showColumnToggle={tableConfig.showColumnToggle ?? true}
          showPagination={tableConfig.showPagination ?? true}
          pageSize={tableConfig.pageSize || 10}
          headerBackground={tableConfig.headerBackground}
          headerTextColor={tableConfig.headerTextColor}
          rowHoverColor={tableConfig.rowHoverColor}
          borderColor={tableConfig.borderColor}
          fontSize={tableConfig.fontSize}
          padding={tableConfig.padding}
          headerFontSize={tableConfig.headerFontSize}
          headerFontFamily={tableConfig.headerFontFamily}
          headerFontWeight={tableConfig.headerFontWeight}
          cellFontSize={tableConfig.cellFontSize}
          cellFontFamily={tableConfig.cellFontFamily}
          cellFontWeight={tableConfig.cellFontWeight}
          cellTextColor={tableConfig.cellTextColor}
          enableSearch={tableConfig.enableSearch ?? true}
          enableFiltering={tableConfig.enableFiltering ?? false}
          enableRowSelection={tableConfig.enableRowSelection ?? false}
          selectionMode={tableConfig.selectionMode || 'single'}
          defaultSortColumn={tableConfig.defaultSortColumn}
          defaultSortDirection={tableConfig.defaultSortDirection || 'asc'}
        />
      </div>
    )
  }

  // BarChart Widget Logic
  if (widget.type === 'chart-bar' && widget.barChartConfig) {
    const [data, setData] = useState<ChartData[]>([])

    useEffect(() => {
      const barChartConfig = widget.barChartConfig
      
      console.log('🐛 DEBUG - BarChartWrapper (DIRECT):', {
        widgetId: widget.i,
        hasBarChartConfig: !!barChartConfig,
        hasBigQueryData: !!barChartConfig?.bigqueryData,
        hasData: !!barChartConfig?.bigqueryData?.data,
        dataType: typeof barChartConfig?.bigqueryData?.data,
        dataLength: Array.isArray(barChartConfig?.bigqueryData?.data) ? barChartConfig.bigqueryData.data.length : 'not array',
        dataSample: barChartConfig?.bigqueryData?.data,
        xAxisField: barChartConfig?.bigqueryData?.columns?.xAxis?.[0]?.name,
        yAxisField: barChartConfig?.bigqueryData?.columns?.yAxis?.[0]?.name,
        directAccess: true
      })
      
      if (barChartConfig?.bigqueryData?.data && Array.isArray(barChartConfig.bigqueryData.data)) {
        const bigqueryData = barChartConfig.bigqueryData.data
        const xAxisField = barChartConfig.bigqueryData.columns.xAxis[0]?.name
        const yAxisField = barChartConfig.bigqueryData.columns.yAxis[0]?.name
        
        if (xAxisField && yAxisField) {
          const chartData = bigqueryData.map((item: Record<string, unknown>) => ({
            x: String(item[xAxisField] || ''),
            y: Number(item[yAxisField] || 0),
            label: String(item[xAxisField] || ''),
            value: Number(item[yAxisField] || 0)
          }))
          
          setData(chartData)
          console.log('📊 BarChartWrapper usando dados reais do barChartStore:', chartData)
        } else {
          console.log('🐛 BarChartWrapper: Campos xAxis/yAxis não encontrados')
          setData([])
        }
      } else {
        setData([])
        console.log('📊 BarChartWrapper: Nenhum dado disponível')
      }
    }, [widget.barChartConfig])

    return (
      <div className="h-full w-full">
        <BarChart 
          data={data}
          colors={widget.barChartConfig?.styling?.colors || ['#2563eb']}
          enableGridX={false}
          enableGridY={widget.barChartConfig?.styling?.showGrid ?? true}
          title={widget.barChartConfig?.styling?.title}
          margin={{ top: 12, right: 12, bottom: 60, left: 50 }}
          animate={false}
        />
      </div>
    )
  }

  // Fallback for unsupported widget types
  return (
    <div className="h-full w-full flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2">❓</div>
        <p>Widget type '{widget.type}' not supported</p>
      </div>
    </div>
  )
}