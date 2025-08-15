'use client'

import { useState, useEffect } from 'react'
import { KPICard } from '@/components/widgets/KPICard'
import KPIDisplay from '@/components/tools/KPIDisplay'
import type { DroppedWidget, KPIConfig } from '@/types/widget'

interface KPIWidgetProps {
  widget: DroppedWidget
}

export default function KPIWidget({ widget }: KPIWidgetProps) {
  const [kpiData, setKpiData] = useState({
    currentValue: 1247,
    previousValue: 1156,
    target: 1500,
    change: 7.9,
  })

  // Simulate real-time KPI updates
  useEffect(() => {
    const interval = setInterval(() => {
      const baseValue = 1200
      const variation = Math.random() * 600 + 800 // Range: 800-1400
      const newValue = Math.floor(variation)
      const newChange = ((newValue - kpiData.previousValue) / kpiData.previousValue) * 100
      
      setKpiData(prev => ({
        ...prev,
        currentValue: newValue,
        change: Number(newChange.toFixed(1))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [kpiData.previousValue])

  // Get KPI configuration with backward compatibility
  const kpiConfig: KPIConfig = widget.config?.kpiConfig || 
    // Backward compatibility: extract KPI props from old chartConfig
    (widget.chartConfig ? {
      name: (widget.chartConfig as any).kpiName,
      value: (widget.chartConfig as any).kpiValue,
      unit: (widget.chartConfig as any).kpiUnit,
      target: (widget.chartConfig as any).kpiTarget,
      change: (widget.chartConfig as any).kpiChange,
      trend: (widget.chartConfig as any).kpiTrend,
      status: (widget.chartConfig as any).kpiStatus,
      showTarget: (widget.chartConfig as any).showTarget,
      showTrend: (widget.chartConfig as any).showTrend,
      visualizationType: (widget.chartConfig as any).kpiVisualizationType,
      colorScheme: (widget.chartConfig as any).kpiColorScheme,
      metric: (widget.chartConfig as any).kpiMetric,
      calculation: (widget.chartConfig as any).kpiCalculation,
      timeRange: (widget.chartConfig as any).kpiTimeRange,
      valueFontSize: (widget.chartConfig as any).kpiValueFontSize,
      valueColor: (widget.chartConfig as any).kpiValueColor,
      valueFontWeight: (widget.chartConfig as any).kpiValueFontWeight,
      nameFontSize: (widget.chartConfig as any).kpiNameFontSize,
      nameColor: (widget.chartConfig as any).kpiNameColor,
      nameFontWeight: (widget.chartConfig as any).kpiNameFontWeight,
      backgroundColor: (widget.chartConfig as any).kpiBackgroundColor,
      borderColor: (widget.chartConfig as any).kpiBorderColor,
      borderWidth: (widget.chartConfig as any).kpiBorderWidth,
      borderRadius: (widget.chartConfig as any).kpiBorderRadius,
      padding: (widget.chartConfig as any).kpiPadding,
      textAlign: (widget.chartConfig as any).kpiTextAlign,
      shadow: (widget.chartConfig as any).kpiShadow,
      changeColor: (widget.chartConfig as any).kpiChangeColor,
      targetColor: (widget.chartConfig as any).kpiTargetColor,
    } : {}) || {}
  
  // Determine KPI status based on current value vs target
  const getKpiStatus = () => {
    if (kpiConfig.status) return kpiConfig.status
    
    const currentValue = kpiConfig.value ?? kpiData.currentValue
    const target = kpiConfig.target ?? kpiData.target
    
    if (!target) return 'unknown'
    
    const percentage = (currentValue / target) * 100
    if (percentage >= 100) return 'on-target'
    if (percentage >= 80) return 'above-target'
    if (percentage >= 60) return 'below-target'
    return 'critical'
  }

  // Determine trend based on change
  const getKpiTrend = () => {
    if (kpiConfig.trend) return kpiConfig.trend
    
    const change = kpiConfig.change ?? kpiData.change
    if (Math.abs(change) < 0.5) return 'stable'
    return change > 0 ? 'increasing' : 'decreasing'
  }

  // Prepare props for KPI components
  const kpiProps = {
    kpiId: `kpi-${widget.i}`,
    name: kpiConfig.name || 'Total Revenue',
    metric: kpiConfig.metric || 'revenue',
    calculation: kpiConfig.calculation || 'SUM(sales_amount)',
    currentValue: kpiConfig.value ?? kpiData.currentValue,
    previousValue: kpiData.previousValue,
    target: kpiConfig.target ?? kpiData.target,
    unit: kpiConfig.unit || '$',
    change: kpiConfig.change ?? kpiData.change,
    trend: getKpiTrend(),
    status: getKpiStatus(),
    timeRange: kpiConfig.timeRange || 'Last 30 days',
    visualization: {
      chartType: kpiConfig.visualizationType === 'gauge' ? 'gauge' : 'default',
      color: kpiConfig.colorScheme || 'blue',
      showTrend: kpiConfig.showTrend ?? true,
      showTarget: kpiConfig.showTarget ?? true,
    },
    metadata: {
      dataSource: 'Sales Database',
      refreshRate: '5 minutes',
      lastUpdated: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    success: true,
  }

  // Choose component based on visualization type
  const visualizationType = kpiConfig.visualizationType || 'card'

  // Custom styled KPI component for design props
  const CustomKPI = () => {
    const containerStyle: React.CSSProperties = {
      backgroundColor: kpiConfig.backgroundColor || '#ffffff',
      borderColor: kpiConfig.borderColor || '#e5e7eb',
      borderWidth: `${kpiConfig.borderWidth || 1}px`,
      borderRadius: `${kpiConfig.borderRadius || 8}px`,
      padding: `${kpiConfig.padding || 16}px`,
      textAlign: kpiConfig.textAlign || 'center',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: kpiConfig.textAlign === 'left' ? 'flex-start' : 
                  kpiConfig.textAlign === 'right' ? 'flex-end' : 'center',
      borderStyle: 'solid',
      boxShadow: kpiConfig.shadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1)' : 'none',
    }

    const valueStyle: React.CSSProperties = {
      fontSize: `${kpiConfig.valueFontSize || 36}px`,
      color: kpiConfig.valueColor || '#1f2937',
      fontWeight: kpiConfig.valueFontWeight || 700,
      lineHeight: 1.2,
      marginBottom: '8px',
    }

    const nameStyle: React.CSSProperties = {
      fontSize: `${kpiConfig.nameFontSize || 14}px`,
      color: kpiConfig.nameColor || '#6b7280',
      fontWeight: kpiConfig.nameFontWeight || 500,
      marginBottom: '12px',
    }

    const changeStyle: React.CSSProperties = {
      fontSize: `${(kpiConfig.nameFontSize || 14) * 0.85}px`,
      color: kpiConfig.changeColor || (kpiData.change >= 0 ? '#16a34a' : '#dc2626'),
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      justifyContent: kpiConfig.textAlign === 'left' ? 'flex-start' : 
                     kpiConfig.textAlign === 'right' ? 'flex-end' : 'center',
    }

    const targetStyle: React.CSSProperties = {
      fontSize: `${(kpiConfig.nameFontSize || 14) * 0.75}px`,
      color: kpiConfig.targetColor || '#9ca3af',
      marginTop: '8px',
    }

    const formatValue = (value: number | undefined, unit: string = '') => {
      if (value === undefined || value === null) return 'N/A'
      
      const formattedNumber = value.toLocaleString('pt-BR', {
        minimumFractionDigits: unit === '%' || unit === 'rating' ? 1 : 0,
        maximumFractionDigits: unit === '%' || unit === 'rating' ? 1 : 0,
      })
      
      return unit === '$' ? `${unit}${formattedNumber}` : `${formattedNumber} ${unit}`
    }

    return (
      <div style={containerStyle}>
        {/* KPI Name */}
        <div style={nameStyle}>
          {kpiConfig.name || 'Total Revenue'}
        </div>
        
        {/* Main KPI Value */}
        <div style={valueStyle}>
          {formatValue(kpiConfig.value ?? kpiData.currentValue, kpiConfig.unit || '$')}
        </div>
        
        {/* Change indicator */}
        {(kpiConfig.showTrend ?? true) && (
          <div style={changeStyle}>
            <span style={{ fontSize: '16px' }}>
              {(kpiConfig.change ?? kpiData.change) >= 0 ? '↗' : '↘'}
            </span>
            <span>
              {Math.abs(kpiConfig.change ?? kpiData.change).toFixed(1)}%
            </span>
          </div>
        )}
        
        {/* Target */}
        {(kpiConfig.showTarget ?? true) && (
          <div style={targetStyle}>
            Meta: {formatValue(kpiConfig.target ?? kpiData.target, kpiConfig.unit || '$')}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      {/* Use custom component when design props are configured */}
      {(kpiConfig.backgroundColor || kpiConfig.valueColor || kpiConfig.valueFontSize || 
        kpiConfig.nameColor || kpiConfig.nameFontSize || kpiConfig.borderColor) ? (
        <CustomKPI />
      ) : visualizationType === 'display' ? (
        <KPIDisplay {...kpiProps} />
      ) : (
        <KPICard {...kpiProps} />
      )}
    </div>
  )
}