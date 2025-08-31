'use client'

import { useState, useEffect, useMemo } from 'react'
import { PieChart } from '@/components/charts'
import type { ChartData } from '@/components/charts/types'
import type { DroppedWidget } from '@/types/apps/widget'
import type { PieChartConfig } from '@/types/apps/chartWidgets'

interface PieChartWidgetProps {
  widget: DroppedWidget
}

export default function PieChartWidget({ widget }: PieChartWidgetProps) {
  const [data, setData] = useState<ChartData[]>([
    { x: 'Desktop', y: 42 },
    { x: 'Mobile', y: 35 },
    { x: 'Tablet', y: 18 },
    { x: 'Other', y: 5 },
  ])

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prevData => {
        const total = 100
        const newData = prevData.map((item, index) => {
          const variation = (Math.random() - 0.5) * 10 // ±5%
          const newValue = Math.max(5, Math.min(50, (item.y || 0) + variation))
          return { ...item, y: newValue }
        })
        
        // Normalize to 100%
        const sum = newData.reduce((acc, item) => acc + (item.y || 0), 0)
        return newData.map(item => ({
          ...item,
          y: Math.round(((item.y || 0) / sum) * total)
        }))
      })
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  // Get chart configuration with backward compatibility
  const chartConfig = useMemo(() => {
    let config: Partial<PieChartConfig> = {}
    
    // Priorizar configuração especializada (nova arquitetura)
    if (widget.config && typeof widget.config === 'object' && widget.config.chartConfig) {
      config = widget.config.chartConfig as PieChartConfig
      console.log('🎯 PieChartWidget usando config.chartConfig:', config)
    }
    // Fallback para legacy chartConfig
    else if (widget.chartConfig) {
      config = widget.chartConfig as PieChartConfig
      console.log('🎯 PieChartWidget usando chartConfig legacy:', config)
    }
    
    console.log('📊 PieChartWidget final config:', config)
    return config
  }, [widget.config, widget.chartConfig])
  
  // Prepare props for PieChart
  const chartProps = {
    data,
    xColumn: 'x',
    yColumn: 'y',
    isFullscreen: false,
    colors: chartConfig.colors,
    // Visual & Colors
    backgroundColor: chartConfig.backgroundColor,
    backgroundOpacity: chartConfig.backgroundOpacity,
    borderColor: chartConfig.borderColor,
    borderOpacity: chartConfig.borderOpacity,
    // Pie-specific settings
    innerRadius: chartConfig.innerRadius ?? 0.5,
    padAngle: chartConfig.padAngle ?? 1,
    cornerRadius: chartConfig.cornerRadius ?? 2,
    activeOuterRadiusOffset: chartConfig.activeOuterRadiusOffset ?? 4,
    borderWidth: chartConfig.borderWidth ?? 0,
    enableArcLinkLabels: chartConfig.enableArcLinkLabels ?? false,
    arcLabelsSkipAngle: chartConfig.arcLabelsSkipAngle ?? 15,
    animate: chartConfig.animate ?? false,
    motionConfig: chartConfig.motionConfig || 'gentle',
    legends: chartConfig.legends,
    margin: {
      top: chartConfig.margin?.top ?? 20,
      right: chartConfig.margin?.right ?? 8,
      bottom: chartConfig.margin?.bottom ?? 80,
      left: chartConfig.margin?.left ?? 8,
    },
  }

  return (
    <div className="h-full w-full flex flex-col">
      {/* Title and Subtitle */}
      {(chartConfig.showTitle !== false && chartConfig.title) && (
        <div style={{ 
          paddingTop: `${typeof chartConfig.titlePadding === 'object' ? chartConfig.titlePadding?.top ?? 8 : chartConfig.titlePadding ?? 8}px`,
          paddingRight: `${typeof chartConfig.titlePadding === 'object' ? chartConfig.titlePadding?.right ?? 8 : chartConfig.titlePadding ?? 8}px`,
          paddingBottom: `${typeof chartConfig.titlePadding === 'object' ? chartConfig.titlePadding?.bottom ?? 8 : chartConfig.titlePadding ?? 8}px`,
          paddingLeft: `${typeof chartConfig.titlePadding === 'object' ? chartConfig.titlePadding?.left ?? 8 : chartConfig.titlePadding ?? 8}px`
        }}>
          <h3 
            style={{
              fontSize: `${chartConfig.titleFontSize ?? 18}px`,
              color: chartConfig.titleColor ?? '#111827',
              fontWeight: chartConfig.titleFontWeight ?? 700,
              lineHeight: 1.2,
              margin: 0,
              textAlign: 'left'
            }}
          >
            {chartConfig.title}
          </h3>
        </div>
      )}
      {(chartConfig.showSubtitle !== false && chartConfig.subtitle) && (
        <div style={{ 
          paddingTop: `${typeof chartConfig.subtitlePadding === 'object' ? chartConfig.subtitlePadding?.top ?? 8 : chartConfig.subtitlePadding ?? 8}px`,
          paddingRight: `${typeof chartConfig.subtitlePadding === 'object' ? chartConfig.subtitlePadding?.right ?? 8 : chartConfig.subtitlePadding ?? 8}px`,
          paddingBottom: `${typeof chartConfig.subtitlePadding === 'object' ? chartConfig.subtitlePadding?.bottom ?? 8 : chartConfig.subtitlePadding ?? 8}px`,
          paddingLeft: `${typeof chartConfig.subtitlePadding === 'object' ? chartConfig.subtitlePadding?.left ?? 8 : chartConfig.subtitlePadding ?? 8}px`
        }}>
          <p 
            style={{
              fontSize: `${chartConfig.subtitleFontSize ?? 14}px`,
              color: chartConfig.subtitleColor ?? '#6B7280',
              fontWeight: chartConfig.subtitleFontWeight ?? 400,
              lineHeight: 1.4,
              margin: 0,
              textAlign: 'left'
            }}
          >
            {chartConfig.subtitle}
          </p>
        </div>
      )}
      
      {/* Chart */}
      <div className="flex-1">
        <PieChart {...{
          ...chartProps,
          margin: {
            top: (chartProps.margin?.top ?? 20) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.top ?? 0 : chartConfig.chartPadding ?? 0),
            right: (chartProps.margin?.right ?? 8) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.right ?? 0 : chartConfig.chartPadding ?? 0),
            bottom: (chartProps.margin?.bottom ?? 80) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.bottom ?? 0 : chartConfig.chartPadding ?? 0),
            left: (chartProps.margin?.left ?? 8) + (typeof chartConfig.chartPadding === 'object' ? chartConfig.chartPadding?.left ?? 0 : chartConfig.chartPadding ?? 0),
          }
        }} />
      </div>
    </div>
  )
}