'use client';

import { useState, useEffect } from 'react';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';
import { AreaChart } from '@/components/charts/AreaChart';
import { KPICard } from '@/components/widgets/KPICard';
import type { Widget } from '../visual-builder/ConfigParser';

// Define chart data types
type ChartDataPoint = {
  x: string;
  y: number;
  label: string;
  value: number;
};

type KPIData = {
  value: number;
};

type WidgetData = ChartDataPoint[] | KPIData | null;

interface WidgetRendererProps {
  widget: Widget;
}

export default function WidgetRenderer({ widget }: WidgetRendererProps) {
  const [data, setData] = useState<WidgetData>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔄 Component initialization log
  console.log('🔄 WidgetRenderer mounted:', {
    id: widget.id,
    type: widget.type,
    hasDataSource: !!widget.dataSource,
    dataSource: widget.dataSource
  });

  // Fetch ONLY BigQuery data - no mock data ever
  useEffect(() => {
    const fetchData = async () => {
      // Se não tem dataSource, não busca nada
      if (!widget.dataSource) {
        setError('No dataSource configured');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('📊 Fetching BigQuery data for widget:', widget.id);

        // 📤 API request log
        const requestPayload = {
          type: widget.type,
          dataSource: widget.dataSource
        };
        console.log('📤 Making API request:', {
          url: '/api/dashboard-bigquery',
          payload: requestPayload
        });

        // Chamar API route - SOMENTE BigQuery
        const response = await fetch('/api/dashboard-bigquery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });

        const result = await response.json();

        // 📥 API response log
        console.log('📥 API response received:', {
          success: result.success,
          dataType: typeof result.data,
          isArray: Array.isArray(result.data),
          dataLength: Array.isArray(result.data) ? result.data.length : 'N/A',
          totalRecords: result.totalRecords,
          error: result.error,
          fullResult: result
        });

        if (result.success) {
          setData(result.data);
          console.log(`✅ Widget data set successfully:`, {
            widgetId: widget.id,
            totalRecords: result.totalRecords,
            dataSet: result.data
          });
        } else {
          throw new Error(result.error || 'API request failed');
        }
      } catch (err) {
        console.error('❌ Error fetching widget data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // NO FALLBACK - só dados reais
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [widget.id, widget.dataSource, widget.type]);

  // Type guard function for KPI data
  const isKPIData = (data: WidgetData): data is KPIData => {
    return data !== null && !Array.isArray(data) && 'value' in data;
  };

  // Use ONLY BigQuery data - no mock fallbacks
  const chartData = Array.isArray(data) ? data : [];
  const kpiValue = widget.type === 'kpi' && isKPIData(data)
    ? data.value
    : 0;

  // 🔧 Data processing log
  console.log('🔧 Data processed for widget:', widget.id, {
    originalData: data,
    chartData: chartData,
    chartDataLength: chartData.length,
    kpiValue: kpiValue,
    isKPIData: isKPIData(data),
    widgetType: widget.type,
    finalState: {
      loading,
      error,
      hasData: !!data
    }
  });

  // Get colors from widget-specific config first, then fall back to generic styling
  const getWidgetColors = () => {
    switch (widget.type) {
      case 'bar':
        return widget.barConfig?.styling?.colors;
      case 'line':
        return widget.lineConfig?.styling?.colors;
      case 'pie':
        return widget.pieConfig?.styling?.colors;
      case 'area':
        return widget.areaConfig?.styling?.colors;
      default:
        return null;
    }
  };

  const commonChartProps = {
    data: chartData,
    title: widget.title,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    colors: getWidgetColors() || widget.styling?.colors || ['#2563eb'],
    animate: false,
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full w-full p-2 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">⏳</div>
          <div className="text-sm">Loading data...</div>
        </div>
      </div>
    );
  }

  // Error state - show error, no fallback data
  if (error) {
    return (
      <div className="h-full w-full p-2 flex items-center justify-center bg-red-50 rounded">
        <div className="text-center text-red-600">
          <div className="text-2xl mb-2">⚠️</div>
          <div className="text-sm font-medium mb-1">BigQuery Error</div>
          <div className="text-xs">{error}</div>
        </div>
      </div>
    );
  }

  // Empty data state
  if (!loading && (!data || (Array.isArray(data) && data.length === 0))) {
    return (
      <div className="h-full w-full p-2 flex items-center justify-center bg-gray-50 rounded">
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📊</div>
          <div className="text-sm font-medium mb-1">No Data</div>
          <div className="text-xs">No records found in BigQuery</div>
        </div>
      </div>
    );
  }

  switch (widget.type) {
    case 'bar':
      // Debug: Log glass effect and modern CSS props being passed
      console.log('🎨 WidgetRenderer passing DIRECT CSS props to BarChart:', {
        widgetId: widget.id,
        containerGlassEffect: {
          containerBackground: widget.barConfig?.styling?.containerBackground,
          containerOpacity: widget.barConfig?.styling?.containerOpacity,
          containerBackdropFilter: widget.barConfig?.styling?.containerBackdropFilter,
          containerBoxShadow: widget.barConfig?.styling?.containerBoxShadow,
          containerBorder: widget.barConfig?.styling?.containerBorder
        },
        modernEffects: {
          containerFilter: widget.barConfig?.styling?.containerFilter,
          containerTransform: widget.barConfig?.styling?.containerTransform,
          containerTransition: widget.barConfig?.styling?.containerTransition,
          barBrightness: widget.barConfig?.styling?.barBrightness,
          hoverScale: widget.barConfig?.styling?.hoverScale
        }
      });

      return (
        <div className="h-full w-full p-2">
          <BarChart
            {...commonChartProps}
            // Pass margin and legends from JSON config
            margin={widget.barConfig?.margin || commonChartProps.margin}
            legends={widget.barConfig?.legends}
            // Container Glass Effect & Modern Styles - DIRECT PROPS
            containerBackground={widget.barConfig?.styling?.containerBackground}
            containerOpacity={widget.barConfig?.styling?.containerOpacity}
            containerBackdropFilter={widget.barConfig?.styling?.containerBackdropFilter}
            containerFilter={widget.barConfig?.styling?.containerFilter}
            containerBoxShadow={widget.barConfig?.styling?.containerBoxShadow}
            containerBorder={widget.barConfig?.styling?.containerBorder}
            containerTransform={widget.barConfig?.styling?.containerTransform}
            containerTransition={widget.barConfig?.styling?.containerTransition}
            // Bar Visual Effects - CSS Only
            barBrightness={widget.barConfig?.styling?.barBrightness}
            barSaturate={widget.barConfig?.styling?.barSaturate}
            barContrast={widget.barConfig?.styling?.barContrast}
            barBlur={widget.barConfig?.styling?.barBlur}
            barBoxShadow={widget.barConfig?.styling?.barBoxShadow}
            hoverBrightness={widget.barConfig?.styling?.hoverBrightness}
            hoverSaturate={widget.barConfig?.styling?.hoverSaturate}
            hoverScale={widget.barConfig?.styling?.hoverScale}
            hoverBlur={widget.barConfig?.styling?.hoverBlur}
            transitionDuration={widget.barConfig?.styling?.transitionDuration}
            transitionEasing={widget.barConfig?.styling?.transitionEasing}
            // Typography props - Title (TODAS)
            titleFontFamily={widget.barConfig?.styling?.titleFontFamily}
            titleFontSize={widget.barConfig?.styling?.titleFontSize}
            titleFontWeight={widget.barConfig?.styling?.titleFontWeight}
            titleColor={widget.barConfig?.styling?.titleColor}
            titleMarginTop={widget.barConfig?.styling?.titleMarginTop}
            titleMarginLeft={widget.barConfig?.styling?.titleMarginLeft}
            titleMarginBottom={widget.barConfig?.styling?.titleMarginBottom}
            
            // Typography props - Subtitle (TODAS)
            subtitleFontFamily={widget.barConfig?.styling?.subtitleFontFamily}
            subtitleFontSize={widget.barConfig?.styling?.subtitleFontSize}
            subtitleFontWeight={widget.barConfig?.styling?.subtitleFontWeight}
            subtitleColor={widget.barConfig?.styling?.subtitleColor}
            subtitleMarginTop={widget.barConfig?.styling?.subtitleMarginTop}
            subtitleMarginLeft={widget.barConfig?.styling?.subtitleMarginLeft}
            subtitleMarginBottom={widget.barConfig?.styling?.subtitleMarginBottom}
            // Fallback to styling props if barConfig not provided
            enableGridX={widget.barConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.barConfig?.styling?.enableGridY ?? true}
            borderRadius={widget.barConfig?.styling?.borderRadius ?? widget.styling?.borderRadius}
            backgroundColor={widget.barConfig?.styling?.backgroundColor ?? widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'line':
      return (
        <div className="h-full w-full p-2">
          <LineChart
            {...commonChartProps}
            {...(widget.lineConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.lineConfig?.margin || commonChartProps.margin}
            legends={widget.lineConfig?.legends}
            // Container Glass Effect & Modern Styles - DIRECT PROPS
            containerBackground={widget.lineConfig?.styling?.containerBackground}
            containerOpacity={widget.lineConfig?.styling?.containerOpacity}
            containerBackdropFilter={widget.lineConfig?.styling?.containerBackdropFilter}
            containerBoxShadow={widget.lineConfig?.styling?.containerBoxShadow}
            // Fallback to default props if lineConfig not provided
            enableGridX={widget.lineConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.lineConfig?.styling?.enableGridY ?? true}
            lineWidth={widget.lineConfig?.styling?.lineWidth ?? 2}
            enablePoints={widget.lineConfig?.styling?.enablePoints ?? true}
            pointSize={widget.lineConfig?.styling?.pointSize ?? 6}
            curve={widget.lineConfig?.styling?.curve ?? "cardinal"}
            backgroundColor={widget.lineConfig?.styling?.backgroundColor ?? widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'pie':
      return (
        <div className="h-full w-full p-2">
          <PieChart
            {...commonChartProps}
            {...(widget.pieConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.pieConfig?.margin || commonChartProps.margin}
            legends={widget.pieConfig?.legends}
            // Container Glass Effect & Modern Styles - DIRECT PROPS
            containerBackground={widget.pieConfig?.styling?.containerBackground}
            containerOpacity={widget.pieConfig?.styling?.containerOpacity}
            containerBackdropFilter={widget.pieConfig?.styling?.containerBackdropFilter}
            containerBoxShadow={widget.pieConfig?.styling?.containerBoxShadow}
            // Fallback to default props if pieConfig not provided
            innerRadius={widget.pieConfig?.styling?.innerRadius ?? 0.5}
            padAngle={widget.pieConfig?.styling?.padAngle ?? 1}
            cornerRadius={widget.pieConfig?.styling?.cornerRadius ?? 2}
            backgroundColor={widget.pieConfig?.styling?.backgroundColor ?? widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'area':
      return (
        <div className="h-full w-full p-2">
          <AreaChart
            {...commonChartProps}
            {...(widget.areaConfig?.styling || {})}
            // Pass margin and legends from JSON config
            margin={widget.areaConfig?.margin || commonChartProps.margin}
            legends={widget.areaConfig?.legends}
            // Container Glass Effect & Modern Styles - DIRECT PROPS
            containerBackground={widget.areaConfig?.styling?.containerBackground}
            containerOpacity={widget.areaConfig?.styling?.containerOpacity}
            containerBackdropFilter={widget.areaConfig?.styling?.containerBackdropFilter}
            containerBoxShadow={widget.areaConfig?.styling?.containerBoxShadow}
            // Fallback to default props if areaConfig not provided
            enableGridX={widget.areaConfig?.styling?.enableGridX ?? false}
            enableGridY={widget.areaConfig?.styling?.enableGridY ?? true}
            areaOpacity={widget.areaConfig?.styling?.areaOpacity ?? 0.15}
            lineWidth={widget.areaConfig?.styling?.lineWidth ?? 2}
            enablePoints={widget.areaConfig?.styling?.enablePoints ?? true}
            pointSize={widget.areaConfig?.styling?.pointSize ?? 6}
            curve={widget.areaConfig?.styling?.curve ?? "cardinal"}
            backgroundColor={widget.areaConfig?.styling?.backgroundColor ?? widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'kpi':
      return (
        <div className="h-full w-full p-2">
          <KPICard
            name={widget.title}
            currentValue={kpiValue}
            unit={widget.unit || widget.kpiConfig?.unit}
            success={true}
            {...(widget.kpiConfig || {})}
            // Fallback to styling props if kpiConfig not provided
            kpiContainerBackgroundColor={widget.kpiConfig?.kpiContainerBackgroundColor || widget.styling?.backgroundColor}
            kpiValueColor={widget.kpiConfig?.kpiValueColor || widget.styling?.textColor}
            kpiValueFontSize={widget.kpiConfig?.kpiValueFontSize || widget.styling?.fontSize}
          />
        </div>
      );

    default:
      return (
        <div className="h-full w-full p-2 flex items-center justify-center bg-gray-100 rounded">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">❓</div>
            <div className="text-sm">Unknown widget type: {widget.type}</div>
          </div>
        </div>
      );
  }
}