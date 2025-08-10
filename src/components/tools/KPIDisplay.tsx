'use client';

interface KPIDisplayProps {
  kpiId?: string;
  name?: string;
  datasetId?: string;
  tableId?: string;
  metric?: string;
  calculation?: string;
  currentValue?: number;
  previousValue?: number;
  target?: number;
  unit?: string;
  change?: number;
  trend?: string;
  status?: string;
  timeRange?: string;
  visualization?: {
    chartType?: string;
    color?: string;
    showTrend?: boolean;
    showTarget?: boolean;
  };
  metadata?: {
    createdAt?: string;
    lastUpdated?: string;
    refreshRate?: string;
    dataSource?: string;
  };
  success?: boolean;
  error?: string;
}

export default function KPIDisplay({
  kpiId,
  name,
  datasetId,
  tableId,
  metric,
  calculation,
  currentValue,
  previousValue,
  target,
  unit,
  change,
  trend,
  status,
  timeRange,
  visualization,
  metadata,
  success,
  error
}: KPIDisplayProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao criar KPI</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  const getStatusColor = () => {
    switch (status) {
      case 'on-target': return 'text-green-600 bg-green-50';
      case 'above-target': return 'text-blue-600 bg-blue-50';
      case 'below-target': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        );
      case 'decreasing':
        return (
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7L7.8 16.2M7 7v10h10" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h8" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
    }
  };

  const formatValue = (value: number | undefined, unit: string) => {
    if (value === undefined || value === null) return 'N/A';
    
    const formattedNumber = value.toLocaleString('pt-BR', {
      minimumFractionDigits: unit === '%' || unit === 'rating' ? 1 : 0,
      maximumFractionDigits: unit === '%' || unit === 'rating' ? 1 : 0,
    });
    
    return unit === '$' ? `${unit}${formattedNumber}` : `${formattedNumber} ${unit}`;
  };

  const getProgressPercentage = () => {
    if (!currentValue || !target) return 0;
    return Math.min((currentValue / target) * 100, 100);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`${getStatusColor()} px-4 py-3 border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {name}
          </h3>
          <div className="flex items-center gap-2">
            {getTrendIcon()}
            <span className="text-sm font-medium capitalize">
              {status?.replace('-', ' ')}
            </span>
          </div>
        </div>
        <div className="mt-1 text-sm opacity-80">
          KPI ID: {kpiId} • {timeRange}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Main KPI Value */}
        <div className="text-center">
          <div className="text-4xl font-bold text-gray-900 mb-2">
            {formatValue(currentValue, unit || '')}
          </div>
          {change !== undefined && (
            <div className={`flex items-center justify-center gap-1 text-sm font-medium ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              <svg className={`w-4 h-4 ${change >= 0 ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
              </svg>
              {Math.abs(change).toFixed(1)}% vs período anterior
            </div>
          )}
        </div>

        {/* Progress to Target */}
        {target && visualization?.showTarget && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso para Meta</span>
              <span className="text-sm text-gray-500">{formatValue(target, unit || '')}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  visualization?.color === 'green' ? 'bg-green-500' : 
                  visualization?.color === 'orange' ? 'bg-orange-500' : 'bg-blue-500'
                }`}
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <div className="text-right text-xs text-gray-500 mt-1">
              {getProgressPercentage().toFixed(0)}% da meta
            </div>
          </div>
        )}

        {/* KPI Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Valor Atual</div>
            <div className="font-semibold text-gray-900">{formatValue(currentValue, unit || '')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Valor Anterior</div>
            <div className="font-semibold text-gray-900">{formatValue(previousValue, unit || '')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Meta</div>
            <div className="font-semibold text-gray-900">{formatValue(target, unit || '')}</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-xs text-gray-600 mb-1">Métrica</div>
            <div className="font-semibold text-gray-900 capitalize">{metric}</div>
          </div>
        </div>

        {/* Calculation Details */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Cálculo
          </h4>
          <p className="text-blue-700 text-sm font-mono">{calculation}</p>
          <p className="text-blue-600 text-xs mt-1">
            Fonte: {datasetId}.{tableId}
          </p>
        </div>

        {/* Visualization Preview */}
        {visualization?.chartType === 'gauge' && (
          <div className="flex items-center justify-center">
            <div className="relative w-32 h-16">
              <svg className="w-32 h-16" viewBox="0 0 128 64">
                <path
                  d="M 16 48 A 32 32 0 0 1 112 48"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                  fill="none"
                />
                <path
                  d="M 16 48 A 32 32 0 0 1 112 48"
                  stroke={visualization.color === 'green' ? '#22c55e' : visualization.color === 'orange' ? '#f59e0b' : '#3b82f6'}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(getProgressPercentage() / 100) * 150.8} 150.8`}
                  className="transition-all duration-500"
                />
                <circle cx="64" cy="48" r="2" fill="#6b7280" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {metadata && (
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {metadata.refreshRate && <span>Atualiza: {metadata.refreshRate}</span>}
              {metadata.dataSource && <span>Fonte: {metadata.dataSource}</span>}
            </div>
            <div className="flex items-center gap-4">
              {metadata.createdAt && (
                <span>Criado: {new Date(metadata.createdAt).toLocaleString('pt-BR')}</span>
              )}
              {metadata.lastUpdated && (
                <span>Atualizado: {new Date(metadata.lastUpdated).toLocaleString('pt-BR')}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}