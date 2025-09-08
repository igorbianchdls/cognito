'use client'

import { useState, useEffect, useMemo } from 'react'
import { KPICard } from '@/components/widgets/KPICard'
import type { DroppedWidget, KPIConfig, LegacyChartConfigWithKPI, ChartConfig } from '@/types/apps/droppedWidget'


interface KPIWidgetProps {
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

export default function KPIWrapper({ widget }: KPIWidgetProps) {
  // Get KPI configuration with backward compatibility - with reatividade
  const kpiConfig: KPIConfig = useMemo(() => {
    console.log('🔄 KPIWidget kpiConfig recalculated for widget:', widget.i, {
      hasKpiConfig: !!widget.kpiConfig,
      hasNestedKpiConfig: !!widget.config?.kpiConfig,
      hasLegacyChartConfig: isLegacyChartConfigWithKPI(widget.chartConfig),
      configKeys: widget.kpiConfig ? Object.keys(widget.kpiConfig) : [],
      timestamp: Date.now()
    })
    
    const config = widget.kpiConfig || widget.config?.kpiConfig || 
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
    
    console.log('🔄 KPIWidget final config:', config)
    return config
  }, [widget.config, widget.chartConfig, widget.kpiConfig, widget.i])

  // Default simulation data (only used if no real data provided)
  const [simulatedData, setSimulatedData] = useState({
    currentValue: 1247,
    previousValue: 1156,
    target: 1500,
    change: 7.9,
  })

  // Never use simulation - only real data from BigQuery
  const hasRealData = kpiConfig.value !== undefined || 
                      kpiConfig.target !== undefined || 
                      kpiConfig.change !== undefined
  const shouldSimulate = false // Always disable simulation

  // Simulate real-time KPI updates (only if simulation is enabled and no real data)
  useEffect(() => {
    if (!shouldSimulate) return

    const interval = setInterval(() => {
      const minValue = kpiConfig.simulationRange?.min ?? 800
      const maxValue = kpiConfig.simulationRange?.max ?? 1400
      const range = maxValue - minValue
      const variation = Math.random() * range + minValue
      const newValue = Math.floor(variation)
      const newChange = ((newValue - simulatedData.previousValue) / simulatedData.previousValue) * 100
      
      setSimulatedData(prev => ({
        ...prev,
        currentValue: newValue,
        change: Number(newChange.toFixed(1))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [shouldSimulate, simulatedData.previousValue, kpiConfig.simulationRange])
  
  // Determine KPI status based on current value vs target - com reatividade
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

  // Determine trend based on change - com reatividade
  const getKpiTrend = useMemo(() => {
    if (kpiConfig.trend) return kpiConfig.trend
    
    const change = kpiConfig.change || 0
    if (Math.abs(change) < 0.5) return 'stable'
    return change > 0 ? 'increasing' : 'decreasing'
  }, [kpiConfig.trend, kpiConfig.change])

  // Prepare props for KPI components - com reatividade
  const kpiProps = useMemo(() => {
    console.log('🔄 KPIWidget kpiProps recalculated for widget:', widget.i, {
      configChanged: true,
      hasName: !!kpiConfig.name,
      hasValue: kpiConfig.value !== undefined,
      hasTarget: kpiConfig.target !== undefined,
      colorScheme: kpiConfig.colorScheme,
      visualizationType: kpiConfig.visualizationType,
      timestamp: Date.now()
    })
    
    const props = {
      kpiId: `kpi-${widget.i}`,
      name: kpiConfig.name || 'KPI',
      metric: kpiConfig.metric || 'metric',
      calculation: kpiConfig.calculation || 'VALUE',
      currentValue: kpiConfig.value || 0, // Use only real data
      previousValue: kpiConfig.previousValue || 0, // Use only real data
      target: kpiConfig.target || undefined, // Use only real data
      unit: kpiConfig.unit || '',
      change: kpiConfig.change || 0, // Use only real data
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
    
    console.log('🔄 KPIWidget final props:', props)
    return props
  }, [widget.i, kpiConfig, getKpiTrend, getKpiStatus])


  // Log the styling props being passed to KPICard for debugging
  console.log('🎨 KPIWrapper render - styling props:', {
    widgetId: widget.i,
    backgroundColor: kpiConfig.backgroundColor,
    backgroundOpacity: (kpiConfig as Record<string, unknown>).backgroundOpacity,
    borderColor: kpiConfig.borderColor,
    borderOpacity: (kpiConfig as Record<string, unknown>).borderOpacity,
    borderWidth: kpiConfig.borderWidth,
    borderRadius: kpiConfig.borderRadius,
    padding: kpiConfig.padding,
    textAlign: kpiConfig.textAlign,
    shadow: kpiConfig.shadow,
    valueFontSize: kpiConfig.valueFontSize,
    valueColor: kpiConfig.valueColor,
    valueFontWeight: kpiConfig.valueFontWeight,
    nameFontSize: kpiConfig.nameFontSize,
    nameColor: kpiConfig.nameColor,
    nameFontWeight: kpiConfig.nameFontWeight,
    changeColor: kpiConfig.changeColor,
    targetColor: kpiConfig.targetColor,
    timestamp: Date.now()
  })

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
        nameFontFamily={(kpiConfig as Record<string, unknown>).nameFontFamily as string}
        valueFontFamily={(kpiConfig as Record<string, unknown>).valueFontFamily as string}
        titleAlign={(kpiConfig as Record<string, unknown>).titleAlign as 'left' | 'center' | 'right'}
        titleMarginTop={(kpiConfig as Record<string, unknown>).titleMarginTop as number}
        titleMarginBottom={(kpiConfig as Record<string, unknown>).titleMarginBottom as number}
        titleLetterSpacing={(kpiConfig as Record<string, unknown>).titleLetterSpacing as number}
        titleLineHeight={(kpiConfig as Record<string, unknown>).titleLineHeight as number}
        subtitleAlign={(kpiConfig as Record<string, unknown>).subtitleAlign as 'left' | 'center' | 'right'}
        subtitleMarginTop={(kpiConfig as Record<string, unknown>).subtitleMarginTop as number}
        subtitleMarginBottom={(kpiConfig as Record<string, unknown>).subtitleMarginBottom as number}
        subtitleLetterSpacing={(kpiConfig as Record<string, unknown>).subtitleLetterSpacing as number}
        subtitleLineHeight={(kpiConfig as Record<string, unknown>).subtitleLineHeight as number}
      />
    </div>
  )
}