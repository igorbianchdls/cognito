'use client';

import {
  ChartContainer,
  BarChart,
  LineChart,
  PieChart,
  ScatterChart,
  AreaChart,
  FunnelChart,
  TreeMapChart,
  HeatmapChart,
  RadarChart,
  StreamChart,
  ChartData,
  ChartType,
  ChartMetadata,
  processDataForChart
} from '@/components/charts';

interface ChartVisualizationProps {
  chartData?: ChartData[];
  chartType?: ChartType;
  title?: string;
  xColumn?: string;
  yColumn?: string;
  metadata?: ChartMetadata;
  success?: boolean;
  error?: string;
}

export default function ChartVisualization({
  chartData,
  chartType = 'bar',
  title,
  xColumn,
  yColumn,
  metadata,
  success = true,
  error
}: ChartVisualizationProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao gerar gráfico</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  // Process data if available
  const processedData = chartData ? processDataForChart(chartData, chartType) : [];

  const renderChart = () => {
    const commonProps = {
      data: processedData,
      xColumn,
      yColumn,
      isFullscreen: false
    };

    switch (chartType) {
      case 'bar':
        return <BarChart {...commonProps} />;
      case 'line':
        return <LineChart {...commonProps} />;
      case 'pie':
        return <PieChart {...commonProps} />;
      case 'scatter':
        return <ScatterChart {...commonProps} />;
      case 'area':
        return <AreaChart {...commonProps} />;
      case 'funnel':
        return <FunnelChart {...commonProps} />;
      case 'treemap':
        return <TreeMapChart {...commonProps} />;
      case 'heatmap':
        return <HeatmapChart {...commonProps} />;
      case 'radar':
        return <RadarChart {...commonProps} />;
      case 'stream':
        return <StreamChart {...commonProps} />;
      default:
        return <BarChart {...commonProps} />;
    }
  };

  return (
    <ChartContainer
      chartType={chartType}
      title={title}
      metadata={metadata}
    >
      {renderChart()}
    </ChartContainer>
  );
}