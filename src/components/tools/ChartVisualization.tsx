'use client';

import { useState } from 'react';
import { WebPreviewNavigationButton } from '@/components/ai-elements/web-preview';
import { Download, Settings, Maximize, FileImage } from 'lucide-react';
import { ResponsiveBar } from '@nivo/bar';
import { ResponsiveLine } from '@nivo/line';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveScatterPlot } from '@nivo/scatterplot';
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { ResponsiveRadar } from '@nivo/radar';
import { ResponsiveFunnel } from '@nivo/funnel';
import { ResponsiveTreeMap } from '@nivo/treemap';
import { ResponsiveStream } from '@nivo/stream';

interface ChartVisualizationProps {
  chartData?: Array<{
    x?: string;
    y?: number;
    label?: string;
    value?: number;
    color?: string;
  }>;
  chartType?: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'heatmap' | 'radar' | 'funnel' | 'treemap' | 'stream';
  title?: string;
  xColumn?: string;
  yColumn?: string;
  metadata?: {
    totalDataPoints?: number;
    generatedAt?: string;
    executionTime?: number;
    dataSource?: string;
  };
  success?: boolean;
  error?: string;
}

function getChartTypeName(chartType?: string): string {
  switch (chartType) {
    case 'bar': return 'Bar';
    case 'line': return 'Line';
    case 'pie': return 'Pie';
    case 'scatter': return 'Scatter Plot';
    case 'area': return 'Area';
    case 'heatmap': return 'Heatmap';
    case 'radar': return 'Radar';
    case 'funnel': return 'Funnel';
    case 'treemap': return 'TreeMap';
    case 'stream': return 'Stream';
    default: return 'Chart';
  }
}

// Common theme for all Nivo charts
const nivoTheme = {
  axis: {
    ticks: {
      text: { fontSize: 12, fill: '#6b7280' }
    },
    legend: {
      text: { fontSize: 14, fill: '#374151', fontWeight: 500 }
    }
  },
  labels: {
    text: { fontSize: 11, fill: '#1f2937', fontWeight: 500 }
  },
  tooltip: {
    container: {
      background: '#ffffff',
      color: '#1f2937',
      fontSize: 12,
      borderRadius: 8,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e7eb'
    }
  }
};

export default function ChartVisualization({
  chartData,
  chartType,
  title,
  xColumn,
  yColumn,
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
        {chartType === 'bar' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveBar
                  data={chartData.map(item => ({
                    id: item.x || item.label || 'Unknown',
                    value: item.y || item.value || 0,
                    label: item.x || item.label || 'Unknown'
                  }))}
                  keys={['value']}
                  indexBy="id"
                  margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                  padding={0.2}
                  colors={{ scheme: 'blue_green' }}
                  borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: xColumn || 'X Axis',
                    legendPosition: 'middle',
                    legendOffset: 50
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: yColumn || 'Y Axis',
                    legendPosition: 'middle',
                    legendOffset: -60,
                    format: (value) => Number(value).toLocaleString('pt-BR')
                  }}
                  enableLabel={true}
                  label={(d) => Number(d.value).toLocaleString('pt-BR')}
                  labelSkipWidth={12}
                  labelSkipHeight={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
                  animate={true}
                  motionConfig="gentle"
                  theme={{
                    axis: {
                      ticks: {
                        text: { fontSize: 12, fill: '#6b7280' }
                      },
                      legend: {
                        text: { fontSize: 14, fill: '#374151', fontWeight: 500 }
                      }
                    },
                    labels: {
                      text: { fontSize: 11, fill: '#1f2937', fontWeight: 500 }
                    }
                  }}
                  tooltip={({ id, value }) => (
                    <div className="bg-white px-3 py-2 shadow-lg rounded border text-sm">
                      <div className="font-semibold">{id}</div>
                      <div className="text-blue-600">{Number(value).toLocaleString('pt-BR')}</div>
                    </div>
                  )}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-2">Sem dados para exibir</div>
                    <div className="text-sm">Verifique se os dados foram carregados corretamente</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'line' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveLine
                  data={[
                    {
                      id: 'series',
                      data: chartData.map(item => ({
                        x: item.x || item.label || 'Unknown',
                        y: item.y || item.value || 0
                      }))
                    }
                  ]}
                  margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                  xScale={{ type: 'point' }}
                  yScale={{
                    type: 'linear',
                    min: 'auto',
                    max: 'auto',
                    stacked: false,
                    reverse: false
                  }}
                  yFormat={(value) => Number(value).toLocaleString('pt-BR')}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: xColumn || 'X Axis',
                    legendOffset: 50,
                    legendPosition: 'middle'
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: yColumn || 'Y Axis',
                    legendOffset: -60,
                    legendPosition: 'middle',
                    format: (value) => Number(value).toLocaleString('pt-BR')
                  }}
                  pointSize={8}
                  pointColor={{ from: 'color' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  pointLabel={(point) => `${point.data.y}`}
                  pointLabelYOffset={-12}
                  useMesh={true}
                  theme={nivoTheme}
                  colors={{ scheme: 'blue_green' }}
                  animate={true}
                  motionConfig="gentle"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-2">Sem dados para exibir</div>
                    <div className="text-sm">Verifique se os dados foram carregados corretamente</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'pie' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              {chartData && chartData.length > 0 ? (
                <ResponsivePie
                  data={chartData.map(item => ({
                    id: item.x || item.label || 'Unknown',
                    label: item.x || item.label || 'Unknown',
                    value: item.y || item.value || 0
                  }))}
                  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                  innerRadius={0.5}
                  padAngle={0.7}
                  cornerRadius={3}
                  activeOuterRadiusOffset={8}
                  colors={{ scheme: 'blue_green' }}
                  borderWidth={1}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
                  arcLinkLabelsSkipAngle={10}
                  arcLinkLabelsTextColor="#333333"
                  arcLinkLabelsThickness={2}
                  arcLinkLabelsColor={{ from: 'color' }}
                  arcLabelsSkipAngle={10}
                  arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  theme={nivoTheme}
                  animate={true}
                  motionConfig="gentle"
                  valueFormat={(value) => Number(value).toLocaleString('pt-BR')}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-2">Sem dados para exibir</div>
                    <div className="text-sm">Verifique se os dados foram carregados corretamente</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'scatter' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveScatterPlot
                  data={[
                    {
                      id: 'series',
                      data: chartData.map(item => ({
                        x: parseFloat(String(item.x)) || 0,
                        y: item.y || item.value || 0
                      }))
                    }
                  ]}
                  margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                  xScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                  yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
                  colors={{ scheme: 'blue_green' }}
                  blendMode="multiply"
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: xColumn || 'X Axis',
                    legendOffset: 46,
                    legendPosition: 'middle',
                    format: (value) => Number(value).toLocaleString('pt-BR')
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: yColumn || 'Y Axis',
                    legendOffset: -60,
                    legendPosition: 'middle',
                    format: (value) => Number(value).toLocaleString('pt-BR')
                  }}
                  theme={nivoTheme}
                  animate={true}
                  motionConfig="gentle"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-2">Sem dados para exibir</div>
                    <div className="text-sm">Verifique se os dados foram carregados corretamente</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'area' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveLine
                  data={[
                    {
                      id: 'series',
                      data: chartData.map(item => ({
                        x: item.x || item.label || 'Unknown',
                        y: item.y || item.value || 0
                      }))
                    }
                  ]}
                  margin={{ top: 20, right: 20, bottom: 60, left: 80 }}
                  xScale={{ type: 'point' }}
                  yScale={{ type: 'linear', min: 0, max: 'auto' }}
                  enableArea={true}
                  areaOpacity={0.3}
                  colors={{ scheme: 'blue_green' }}
                  axisTop={null}
                  axisRight={null}
                  axisBottom={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: -45,
                    legend: xColumn || 'X Axis',
                    legendOffset: 50,
                    legendPosition: 'middle'
                  }}
                  axisLeft={{
                    tickSize: 5,
                    tickPadding: 5,
                    tickRotation: 0,
                    legend: yColumn || 'Y Axis',
                    legendOffset: -60,
                    legendPosition: 'middle',
                    format: (value) => Number(value).toLocaleString('pt-BR')
                  }}
                  pointSize={6}
                  pointColor={{ from: 'color' }}
                  pointBorderWidth={2}
                  pointBorderColor={{ from: 'serieColor' }}
                  useMesh={true}
                  theme={nivoTheme}
                  animate={true}
                  motionConfig="gentle"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-2">Sem dados para exibir</div>
                    <div className="text-sm">Verifique se os dados foram carregados corretamente</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'heatmap' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">Heatmap Chart</div>
                  <div className="text-sm">Heatmap requires matrix data format - coming soon!</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {chartType === 'radar' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">Radar Chart</div>
                  <div className="text-sm">Radar requires multi-dimensional data - coming soon!</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {chartType === 'funnel' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveFunnel
                  data={chartData.map(item => ({
                    id: item.x || item.label || 'Unknown',
                    value: item.y || item.value || 0,
                    label: item.x || item.label || 'Unknown'
                  }))}
                  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  valueFormat={(value) => Number(value).toLocaleString('pt-BR')}
                  colors={{ scheme: 'blue_green' }}
                  borderWidth={20}
                  labelColor={{ from: 'color', modifiers: [['darker', 3]] }}
                  beforeSeparatorLength={100}
                  beforeSeparatorOffset={20}
                  afterSeparatorLength={100}
                  afterSeparatorOffset={20}
                  currentPartSizeExtension={10}
                  currentBorderWidth={40}
                  theme={nivoTheme}
                  animate={true}
                  motionConfig="gentle"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-2">Sem dados para exibir</div>
                    <div className="text-sm">Verifique se os dados foram carregados corretamente</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'treemap' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              {chartData && chartData.length > 0 ? (
                <ResponsiveTreeMap
                  data={{
                    name: "root",
                    children: chartData.map(item => ({
                      name: item.x || item.label || 'Unknown',
                      value: item.y || item.value || 0
                    }))
                  }}
                  identity="name"
                  value="value"
                  valueFormat={(value) => Number(value).toLocaleString('pt-BR')}
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  labelSkipSize={12}
                  labelTextColor={{ from: 'color', modifiers: [['darker', 1.2]] }}
                  parentLabelPosition="left"
                  parentLabelTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
                  borderColor={{ from: 'color', modifiers: [['darker', 0.1]] }}
                  colors={{ scheme: 'blue_green' }}
                  theme={nivoTheme}
                  animate={true}
                  motionConfig="gentle"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="text-lg font-semibold mb-2">Sem dados para exibir</div>
                    <div className="text-sm">Verifique se os dados foram carregados corretamente</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {chartType === 'stream' && (
          <div className="space-y-4">
            <div className={`bg-white border border-gray-100 rounded-lg p-6 ${isFullscreen ? 'h-[600px]' : 'h-80'}`}>
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-lg font-semibold mb-2">Stream Chart</div>
                  <div className="text-sm">Stream requires time-series data - coming soon!</div>
                </div>
              </div>
            </div>
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