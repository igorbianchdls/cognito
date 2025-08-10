'use client';

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
      default:
        return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />;
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {getChartIcon()}
            </svg>
            {title || `Gráfico ${chartType}`}
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="capitalize">{chartType}</span>
            {metadata?.executionTime && <span>• {metadata.executionTime}ms</span>}
          </div>
        </div>
        <div className="mt-1 text-sm text-gray-600">
          {datasetId}.{tableId} • {xColumn} × {yColumn}
        </div>
      </div>

      {/* Chart Area */}
      <div className="p-6">
        {chartType === 'bar' && (
          <div className="space-y-3">
            <div className="flex items-end justify-between h-48 bg-gray-50 rounded-lg p-4">
              {chartData?.map((item, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div
                    className="bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-600"
                    style={{
                      width: '24px',
                      height: `${Math.max((item.y || 0) / Math.max(...(chartData?.map(d => d.y || 0) || [1])) * 160, 4)}px`
                    }}
                  />
                  <div className="text-xs text-gray-600 mt-2">{item.x || item.label}</div>
                  <div className="text-xs font-medium text-gray-800">{item.y?.toLocaleString() || item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {chartType === 'line' && (
          <div className="h-48 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 400 160">
              <polyline
                points={chartData?.map((item, index) => 
                  `${(index * 380) / (chartData.length - 1)},${160 - ((item.y || 0) / Math.max(...(chartData?.map(d => d.y || 0) || [1])) * 140)}`
                ).join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                className="drop-shadow-sm"
              />
              {chartData?.map((item, index) => (
                <circle
                  key={index}
                  cx={(index * 380) / (chartData.length - 1)}
                  cy={160 - ((item.y || 0) / Math.max(...(chartData?.map(d => d.y || 0) || [1])) * 140)}
                  r="4"
                  fill="#3b82f6"
                  className="hover:r-6 transition-all"
                />
              ))}
            </svg>
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
      </div>

      {/* Footer */}
      {metadata && (
        <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{metadata.totalDataPoints} pontos de dados</span>
            {metadata.generatedAt && (
              <span>Gerado em {new Date(metadata.generatedAt).toLocaleString('pt-BR')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}