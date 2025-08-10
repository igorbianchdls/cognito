'use client';

import { useState } from 'react';
import { WebPreviewNavigationButton } from '@/components/ai-elements/web-preview';
import { Download, Settings, Maximize, FileImage } from 'lucide-react';

interface ChartVisualizationProps {
  chartData?: Array<{
    x?: string;
    y?: number;
    label?: string;
    value?: number;
    color?: string;
  }>;
  chartType?: string;
  title?: string;
  xColumn?: string;
  yColumn?: string;
  datasetId?: string;
  tableId?: string;
  metadata?: {
    totalDataPoints?: number;
    generatedAt?: string;
    executionTime?: number;
  };
  success?: boolean;
  error?: string;
}

export default function ChartVisualization({
  chartData,
  chartType,
  title,
  xColumn,
  yColumn,
  datasetId,
  tableId,
  metadata,
  success,
  error
}: ChartVisualizationProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    // Implementar download do gráfico
    console.log('Download chart');
  };

  const handleExportPNG = () => {
    console.log('Export as PNG');
  };

  const handleSettings = () => {
    console.log('Open chart settings');
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
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

  const getChartIcon = () => {
    switch (chartType) {
      case 'bar':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />;
      case 'line':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />;
      case 'pie':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />;
      case 'scatter':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M12 8m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0M16 16m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />;
      case 'area':
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3v18h18M7 10l4-4 4 4 4-4v8a1 1 0 01-1 1H8a1 1 0 01-1-1V10z" />;
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        {/* Chart Title - Left Side */}
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {getChartIcon()}
          </svg>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {title || `Gráfico ${chartType}`}
            </h2>
            <div className="text-sm text-gray-500 mt-0.5">
              {datasetId}.{tableId} • {xColumn} × {yColumn}
              {metadata?.executionTime && ` • ${metadata.executionTime}ms`}
            </div>
          </div>
        </div>

        {/* Action Buttons - Right Side */}
        <div className="flex items-center gap-1">
          <WebPreviewNavigationButton
            onClick={handleExportPNG}
            tooltip="Export as PNG"
          >
            <FileImage className="h-4 w-4" />
          </WebPreviewNavigationButton>
          
          <WebPreviewNavigationButton
            onClick={handleDownload}
            tooltip="Download Data"
          >
            <Download className="h-4 w-4" />
          </WebPreviewNavigationButton>
          
          <WebPreviewNavigationButton
            onClick={handleSettings}
            tooltip="Chart Settings"
          >
            <Settings className="h-4 w-4" />
          </WebPreviewNavigationButton>
          
          <WebPreviewNavigationButton
            onClick={handleFullscreen}
            tooltip={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            <Maximize className="h-4 w-4" />
          </WebPreviewNavigationButton>
        </div>
      </div>

      {/* Chart Area */}
      <div className={`p-6 ${isFullscreen ? 'h-full' : ''}`}>
        {chartType === 'bar' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-96' : 'h-64'}`}>
              <div className="flex items-end justify-between h-full">
                {chartData?.map((item, index) => (
                  <div key={index} className="flex flex-col items-center h-full justify-end">
                    <div
                      className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-sm transition-all duration-300 hover:from-blue-700 hover:to-blue-500 shadow-sm"
                      style={{
                        width: '32px',
                        height: `${Math.max((item.y || 0) / Math.max(...(chartData?.map(d => d.y || 0) || [1])) * 80, 2)}%`
                      }}
                    />
                    <div className="text-xs text-gray-600 mt-3 font-medium">{item.x || item.label}</div>
                    <div className="text-xs text-gray-800 font-semibold">{item.y?.toLocaleString() || item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {chartType === 'line' && (
          <div className="space-y-4">
            {/* Chart Legend */}
            <div className="flex items-center gap-6 px-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-blue-500"></div>
                <span className="text-sm text-gray-700">Série Principal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-green-500"></div>
                <span className="text-sm text-gray-700">Tendência</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5 bg-orange-500"></div>
                <span className="text-sm text-gray-700">Meta</span>
              </div>
            </div>
            
            {/* Chart Container */}
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-96' : 'h-64'}`}>
              <svg className="w-full h-full" viewBox="0 0 500 200" style={{ overflow: 'visible' }}>
                {/* Grid Lines */}
                <defs>
                  <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                {/* Main Line */}
                <polyline
                  points={chartData?.map((item, index) => 
                    `${(index * 480) / (chartData.length - 1)},${180 - ((item.y || 0) / Math.max(...(chartData?.map(d => d.y || 0) || [1])) * 160)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3"
                  className="drop-shadow-sm"
                />
                
                {/* Data Points */}
                {chartData?.map((item, index) => (
                  <g key={index}>
                    <circle
                      cx={(index * 480) / (chartData.length - 1)}
                      cy={180 - ((item.y || 0) / Math.max(...(chartData?.map(d => d.y || 0) || [1])) * 160)}
                      r="4"
                      fill="#3b82f6"
                      stroke="#fff"
                      strokeWidth="2"
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                    {/* Value Labels */}
                    <text
                      x={(index * 480) / (chartData.length - 1)}
                      y={190}
                      textAnchor="middle"
                      className="fill-gray-600 text-xs font-medium"
                    >
                      {item.x || item.label}
                    </text>
                  </g>
                ))}
                
                {/* Y-axis Labels */}
                {[0, 25, 50, 75, 100].map((percent) => (
                  <text
                    key={percent}
                    x="-10"
                    y={180 - (percent / 100) * 160}
                    textAnchor="end"
                    className="fill-gray-500 text-xs"
                  >
                    {Math.round((percent / 100) * Math.max(...(chartData?.map(d => d.y || 0) || [1])))}
                  </text>
                ))}
              </svg>
            </div>
          </div>
        )}

        {chartType === 'pie' && (
          <div className="flex items-center gap-6">
            <div className="w-48 h-48 bg-gray-50 rounded-full flex items-center justify-center relative">
              <div className="w-40 h-40 rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                  <span className="text-xs font-medium text-gray-600">Total</span>
                </div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {chartData?.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: item.color || '#3b82f6' }}
                  />
                  <span className="text-sm text-gray-700">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900 ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {chartType === 'scatter' && (
          <div className="h-48 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 400 160">
              {chartData?.map((item, index) => {
                const maxX = Math.max(...(chartData?.map(d => parseFloat(d.x || '0')) || [1]));
                const maxY = Math.max(...(chartData?.map(d => d.y || 0) || [1]));
                const x = (parseFloat(item.x || '0') / maxX) * 380;
                const y = 160 - ((item.y || 0) / maxY) * 140;
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="6"
                    fill="#3b82f6"
                    className="hover:fill-blue-700 transition-colors"
                    opacity="0.8"
                  />
                );
              })}
            </svg>
          </div>
        )}

        {chartType === 'area' && (
          <div className="h-48 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 400 160">
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              <polygon
                points={chartData?.map((item, index) => 
                  `${(index * 380) / (chartData.length - 1)},${160 - ((item.y || 0) / Math.max(...(chartData?.map(d => d.y || 0) || [1])) * 140)}`
                ).concat(['380,160', '0,160']).join(' ')}
                fill="url(#areaGradient)"
              />
              <polyline
                points={chartData?.map((item, index) => 
                  `${(index * 380) / (chartData.length - 1)},${160 - ((item.y || 0) / Math.max(...(chartData?.map(d => d.y || 0) || [1])) * 140)}`
                ).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Footer */}
      {metadata && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span><strong>{metadata.totalDataPoints || chartData?.length || 0}</strong> pontos de dados</span>
            {metadata.generatedAt && (
              <span>Gerado em {new Date(metadata.generatedAt).toLocaleString('pt-BR')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}