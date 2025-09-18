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

  // Generate sample data for fallback
  const generateSampleData = () => {
    return [
      { x: 'Jan', y: 65, label: 'January', value: 65 },
      { x: 'Feb', y: 59, label: 'February', value: 59 },
      { x: 'Mar', y: 80, label: 'March', value: 80 },
      { x: 'Apr', y: 81, label: 'April', value: 81 },
      { x: 'May', y: 56, label: 'May', value: 56 },
      { x: 'Jun', y: 55, label: 'June', value: 55 },
    ];
  };

  // Fetch real data from BigQuery via API route
  useEffect(() => {
    const fetchData = async () => {
      // Se não tem dataSource, usa dados mock
      if (!widget.dataSource) {
        setData(generateSampleData());
        return;
      }

      setLoading(true);
      setError(null);

      try {
        console.log('📊 Fetching BigQuery data for widget:', widget.id);

        // Chamar API route ao invés de BigQuery diretamente
        const response = await fetch('/api/dashboard-bigquery', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: widget.type,
            dataSource: widget.dataSource
          })
        });

        const result = await response.json();
        console.log('🔍 API response for widget:', widget.id, result);

        if (result.success) {
          setData(result.data);
          console.log(`✅ Widget data fetched: ${result.totalRecords} records for`, widget.id);
        } else {
          throw new Error(result.error || 'API request failed');
        }
      } catch (err) {
        console.error('❌ Error fetching widget data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        // Fallback para dados mock em caso de erro
        setData(generateSampleData());
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

  // Separate data preparation for charts vs KPIs
  const chartData = Array.isArray(data) ? data : generateSampleData();
  const kpiValue = widget.type === 'kpi' && isKPIData(data)
    ? data.value
    : (widget.value || 0);

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

  // Error state (but still show data with fallback)
  if (error && widget.dataSource) {
    console.warn(`⚠️ Widget ${widget.id} using fallback data due to error:`, error);
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
            unit={widget.unit}
            success={true}
            kpiContainerBackgroundColor={widget.styling?.backgroundColor}
            kpiValueColor={widget.styling?.textColor}
            kpiValueFontSize={widget.styling?.fontSize}
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