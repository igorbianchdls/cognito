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

  const commonChartProps = {
    data: chartData,
    title: widget.title,
    margin: { top: 20, right: 20, bottom: 40, left: 40 },
    colors: widget.styling?.colors || ['#2563eb'],
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
      return (
        <div className="h-full w-full p-2">
          <BarChart
            {...commonChartProps}
            enableGridX={false}
            enableGridY={true}
            borderRadius={widget.styling?.borderRadius}
            backgroundColor={widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'line':
      return (
        <div className="h-full w-full p-2">
          <LineChart
            {...commonChartProps}
            enableGridX={false}
            enableGridY={true}
            lineWidth={2}
            enablePoints={true}
            pointSize={6}
            curve="cardinal"
            backgroundColor={widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'pie':
      return (
        <div className="h-full w-full p-2">
          <PieChart
            {...commonChartProps}
            innerRadius={0.5}
            padAngle={1}
            cornerRadius={2}
            backgroundColor={widget.styling?.backgroundColor}
          />
        </div>
      );

    case 'area':
      return (
        <div className="h-full w-full p-2">
          <AreaChart
            {...commonChartProps}
            enableGridX={false}
            enableGridY={true}
            areaOpacity={0.15}
            lineWidth={2}
            enablePoints={true}
            pointSize={6}
            curve="cardinal"
            backgroundColor={widget.styling?.backgroundColor}
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