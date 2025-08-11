'use client';

import { ReactNode, useState } from 'react';
import { WebPreviewNavigationButton } from '@/components/ai-elements/web-preview';
import { Download, Settings, Maximize, FileImage } from 'lucide-react';
import { ChartType, ChartMetadata } from './types';
import { getChartTypeName } from './utils';

interface ChartContainerProps {
  children: ReactNode;
  chartType?: ChartType;
  title?: string;
  metadata?: ChartMetadata;
  height?: number;
  className?: string;
  onDownload?: () => void;
  onExportPNG?: () => void;
  onSettings?: () => void;
}

function getChartIcon(chartType?: ChartType) {
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
    case 'heatmap':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7 20l4-16 4 16M15 4l4 4-4 4" />;
    case 'radar':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />;
    case 'funnel':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 4H3l5 7v6l4 2v-8l5-7z" />;
    case 'treemap':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h6v6H3V3zm8 0h6v3h-6V3zm0 5h6v4h-6V8zm0 6h6v3h-6v-3zM3 11h6v8H3v-8z" />;
    case 'stream':
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15s4-8 8-8 8 8 8 8" />;
    default:
      return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />;
  }
}

export function ChartContainer({ 
  children, 
  chartType, 
  title, 
  metadata,
  height,
  className,
  onDownload,
  onExportPNG,
  onSettings
}: ChartContainerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      console.log('Download chart');
    }
  };

  const handleExportPNG = () => {
    if (onExportPNG) {
      onExportPNG();
    } else {
      console.log('Export as PNG');
    }
  };

  const handleSettings = () => {
    if (onSettings) {
      onSettings();
    } else {
      console.log('Open chart settings');
    }
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${className || ''}`}>
      {/* Chart Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        {/* Chart Title - Left Side */}
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {getChartIcon(chartType)}
          </svg>
          <h2 className="text-lg font-bold text-gray-900">
            {title || `${getChartTypeName(chartType)} Chart`}
          </h2>
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
        <div className={`bg-white border border-gray-100 rounded-lg p-6 min-h-[300px] ${
          isFullscreen ? 'h-[600px]' : 
          height === 600 ? 'h-[600px]' :
          height === 500 ? 'h-[500px]' :
          height === 400 ? 'h-96' :
          'h-80'
        }`}>
          {children}
        </div>
      </div>

      {/* Footer */}
      {metadata && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span><strong>{metadata.totalDataPoints || 0}</strong> pontos de dados</span>
            {metadata.generatedAt && (
              <span>Gerado em {new Date(metadata.generatedAt).toLocaleString('pt-BR')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}