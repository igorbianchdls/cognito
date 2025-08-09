'use client';

import { useState } from 'react';

interface ChartDataPoint {
  x: string;
  y: number;
  label: string;
  value: number;
}

interface BigQueryChartGeneratorProps {
  chartData?: ChartDataPoint[];
  chartType?: 'bar' | 'line' | 'pie' | 'scatter';
  xColumn?: string;
  yColumn?: string;
  title?: string;
  query?: string;
  executionTime?: number;
  dataCount?: number;
  success?: boolean;
  error?: string;
}

export default function BigQueryChartGenerator({
  chartData,
  chartType = 'bar',
  xColumn = '',
  yColumn = '',
  title = '',
  query,
  executionTime,
  dataCount = 0,
  success,
  error
}: BigQueryChartGeneratorProps) {
  const [selectedChartType, setSelectedChartType] = useState<'bar' | 'line' | 'pie' | 'scatter'>(chartType);

  console.log('📊 BigQueryChartGenerator component received:', {
    hasChartData: !!chartData,
    dataLength: chartData?.length,
    chartType,
    success,
    error,
    title,
    xColumn,
    yColumn
  });

  if (error || !success) {
    return (
      <div className="my-4 p-4 border-2 border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 13.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao gerar gráfico</h3>
        </div>
        <p className="text-sm text-red-700 mb-2">{error || 'Falha desconhecida'}</p>
        {query && (
          <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
            <div className="text-xs text-red-600 font-medium mb-1">Query executada:</div>
            <code className="text-xs text-red-800 font-mono break-all">{query}</code>
          </div>
        )}
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="my-4 p-4 border-2 border-gray-200 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="font-semibold text-gray-700">Nenhum dado encontrado para o gráfico</h3>
        </div>
        <p className="text-sm text-gray-600">A query não retornou dados suficientes para gerar o gráfico.</p>
      </div>
    );
  }

  // Calculate chart dimensions and stats
  const maxValue = Math.max(...chartData.map(d => d.y));
  const minValue = Math.min(...chartData.map(d => d.y));
  const totalValue = chartData.reduce((sum, d) => sum + d.y, 0);

  // Chart rendering functions
  const BarChart = () => (
    <div className="space-y-3">
      {chartData.slice(0, 20).map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-32 text-sm text-gray-700 truncate font-medium" title={item.label}>
            {item.label}
          </div>
          <div className="flex-1 bg-gray-200 rounded-full h-8 relative overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-3"
              style={{ width: `${Math.max(5, (item.y / maxValue) * 100)}%` }}
            >
              <span className="text-xs font-medium text-white">
                {item.y.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      ))}
      {chartData.length > 20 && (
        <div className="text-sm text-gray-500 text-center mt-3">
          ... mostrando top 20 de {chartData.length} itens
        </div>
      )}
    </div>
  );

  const PieChart = () => {
    // Show top 8 items and group rest as "Others"
    const topItems = chartData.slice(0, 8);
    const otherItems = chartData.slice(8);
    const otherSum = otherItems.reduce((sum, item) => sum + item.y, 0);
    
    const displayData = [...topItems];
    if (otherSum > 0) {
      displayData.push({ x: 'Outros', y: otherSum, label: 'Outros', value: otherSum });
    }
    
    let cumulativePercentage = 0;
    
    return (
      <div className="flex items-center justify-center space-x-8">
        <div className="relative w-48 h-48">
          <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
            {displayData.map((item, index) => {
              const percentage = (item.y / totalValue) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              const color = `hsl(${(index * 360) / displayData.length}, 70%, 50%)`;
              
              cumulativePercentage += percentage;
              
              return (
                <circle
                  key={index}
                  cx="50"
                  cy="50"
                  r="15.915"
                  fill="transparent"
                  stroke={color}
                  strokeWidth="12"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-1000"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">{displayData.length}</div>
              <div className="text-xs text-gray-600">categorias</div>
            </div>
          </div>
        </div>
        <div className="space-y-2 max-w-xs">
          {displayData.map((item, index) => {
            const percentage = ((item.y / totalValue) * 100).toFixed(1);
            return (
              <div key={index} className="flex items-center space-x-2 text-sm">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: `hsl(${(index * 360) / displayData.length}, 70%, 50%)` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium text-gray-700" title={item.label}>
                    {item.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.y.toLocaleString('pt-BR')} ({percentage}%)
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const LineChart = () => {
    const width = 400;
    const height = 200;
    const padding = 40;
    
    const points = chartData.slice(0, 50).map((item, index) => {
      const x = padding + (index / (Math.min(chartData.length, 50) - 1)) * (width - 2 * padding);
      const y = height - padding - ((item.y - minValue) / (maxValue - minValue)) * (height - 2 * padding);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="flex flex-col items-center space-y-4">
        <svg width={width} height={height} className="border border-gray-200 rounded bg-white">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Data line */}
          <polyline
            points={points}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="3"
            className="transition-all duration-1000"
          />
          
          {/* Data points */}
          {chartData.slice(0, 50).map((item, index) => {
            const x = padding + (index / (Math.min(chartData.length, 50) - 1)) * (width - 2 * padding);
            const y = height - padding - ((item.y - minValue) / (maxValue - minValue)) * (height - 2 * padding);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="#3b82f6"
                className="transition-all duration-1000"
              >
                <title>{`${item.label}: ${item.y}`}</title>
              </circle>
            );
          })}
        </svg>
        
        {chartData.length > 50 && (
          <div className="text-sm text-gray-500">
            Mostrando primeiros 50 de {chartData.length} pontos
          </div>
        )}
      </div>
    );
  };

  const ScatterChart = () => {
    const width = 400;
    const height = 200;
    const padding = 40;
    
    return (
      <div className="flex flex-col items-center space-y-4">
        <svg width={width} height={height} className="border border-gray-200 rounded bg-white">
          {/* Grid lines */}
          <defs>
            <pattern id="scatter-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#scatter-grid)" />
          
          {/* Data points */}
          {chartData.slice(0, 100).map((item, index) => {
            const x = padding + (index / (Math.min(chartData.length, 100) - 1)) * (width - 2 * padding);
            const y = height - padding - ((item.y - minValue) / (maxValue - minValue)) * (height - 2 * padding);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="5"
                fill="#3b82f6"
                fillOpacity="0.7"
                className="transition-all duration-1000 hover:fill-opacity-100"
              >
                <title>{`${item.label}: ${item.y}`}</title>
              </circle>
            );
          })}
        </svg>
      </div>
    );
  };

  const renderChart = () => {
    switch (selectedChartType) {
      case 'bar':
        return <BarChart />;
      case 'pie':
        return <PieChart />;
      case 'line':
        return <LineChart />;
      case 'scatter':
        return <ScatterChart />;
      default:
        return <BarChart />;
    }
  };

  return (
    <div className="my-4 p-4 border-2 border-blue-200 bg-blue-50 rounded-lg">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <div>
          <h3 className="text-lg font-semibold text-blue-800">{title}</h3>
          <div className="flex flex-wrap gap-4 text-sm text-blue-600 mt-1">
            <span>📊 {dataCount} pontos de dados</span>
            {executionTime && <span>⏱️ {executionTime}ms</span>}
            <span>📈 {xColumn} × {yColumn}</span>
          </div>
        </div>
      </div>

      {/* Chart Type Selector */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedChartType('bar')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedChartType === 'bar'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          📊 Barras
        </button>
        <button
          onClick={() => setSelectedChartType('pie')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedChartType === 'pie'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          🥧 Pizza
        </button>
        <button
          onClick={() => setSelectedChartType('line')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedChartType === 'line'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          📈 Linha
        </button>
        <button
          onClick={() => setSelectedChartType('scatter')}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedChartType === 'scatter'
              ? 'bg-blue-600 text-white'
              : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
          }`}
        >
          🔵 Dispersão
        </button>
      </div>

      {/* Chart Container */}
      <div className="bg-white border border-blue-300 rounded-lg p-6 overflow-x-auto">
        {renderChart()}
      </div>

      {/* Statistics Footer */}
      <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-4 h-4 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-700">
            <div className="font-medium mb-1">📊 Estatísticas do gráfico:</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <div><strong>Máximo:</strong> {maxValue.toLocaleString('pt-BR')}</div>
              <div><strong>Mínimo:</strong> {minValue.toLocaleString('pt-BR')}</div>
              <div><strong>Total:</strong> {totalValue.toLocaleString('pt-BR')}</div>
              <div><strong>Média:</strong> {(totalValue / chartData.length).toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Query Display */}
      {query && (
        <div className="mt-3 p-3 bg-blue-100 border border-blue-300 rounded-lg">
          <div className="text-sm font-medium text-blue-700 mb-1">🔍 Query executada:</div>
          <code className="text-xs text-blue-800 font-mono block overflow-x-auto whitespace-pre">
            {query}
          </code>
        </div>
      )}
    </div>
  );
}