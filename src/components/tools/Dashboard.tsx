'use client';

interface Widget {
  type: string;
  title: string;
  value?: string;
  trend?: string;
  color?: string;
  target?: string;
  chartType?: string;
  size?: string;
  rows?: number;
  items?: string[];
}

interface DashboardProps {
  dashboardId?: string;
  title?: string;
  dashboardType?: string;
  datasetIds?: string[];
  widgets?: Widget[];
  kpis?: string[];
  layout?: {
    columns?: number;
    theme?: string;
    autoRefresh?: boolean;
  };
  metadata?: {
    createdAt?: string;
    lastUpdated?: string;
    version?: string;
  };
  success?: boolean;
  error?: string;
}

export default function Dashboard({
  dashboardId,
  title,
  dashboardType,
  datasetIds,
  widgets,
  kpis,
  layout,
  metadata,
  success,
  error
}: DashboardProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-red-800">Erro ao criar dashboard</h3>
        </div>
        <p className="text-red-700 text-sm mt-1">{error || 'Erro desconhecido'}</p>
      </div>
    );
  }

  const getDashboardTypeColor = () => {
    switch (dashboardType) {
      case 'executive': return 'from-purple-50 to-indigo-50 text-purple-600';
      case 'operational': return 'from-blue-50 to-cyan-50 text-blue-600';
      case 'analytical': return 'from-green-50 to-emerald-50 text-green-600';
      default: return 'from-gray-50 to-slate-50 text-gray-600';
    }
  };

  const renderWidget = (widget: Widget, index: number) => {
    const widgetSizeClass = widget.size === 'large' ? 'col-span-2' : 'col-span-1';
    
    switch (widget.type) {
      case 'kpi':
        return (
          <div key={index} className={`bg-white border border-gray-200 rounded-lg p-4 ${widgetSizeClass}`}>
            <h4 className="text-sm font-medium text-gray-600 mb-2">{widget.title}</h4>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold text-gray-900">{widget.value}</div>
              <div className={`text-sm font-medium ${
                widget.color === 'green' ? 'text-green-600' : 
                widget.color === 'blue' ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {widget.trend}
              </div>
            </div>
          </div>
        );

      case 'metric':
        return (
          <div key={index} className={`bg-white border border-gray-200 rounded-lg p-4 ${widgetSizeClass}`}>
            <h4 className="text-sm font-medium text-gray-600 mb-2">{widget.title}</h4>
            <div className="text-xl font-bold text-gray-900 mb-1">{widget.value}</div>
            {widget.target && (
              <div className="text-xs text-gray-500">Meta: {widget.target}</div>
            )}
          </div>
        );

      case 'chart':
        return (
          <div key={index} className={`bg-white border border-gray-200 rounded-lg p-4 ${widgetSizeClass}`}>
            <h4 className="text-sm font-medium text-gray-600 mb-3">{widget.title}</h4>
            <div className="h-32 bg-gray-50 rounded flex items-center justify-center">
              <div className="text-center text-gray-500">
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {widget.chartType === 'line' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4" />
                  ) : widget.chartType === 'pie' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  )}
                </svg>
                <span className="text-xs capitalize">{widget.chartType} Chart</span>
              </div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div key={index} className={`bg-white border border-gray-200 rounded-lg p-4 ${widgetSizeClass}`}>
            <h4 className="text-sm font-medium text-gray-600 mb-3">{widget.title}</h4>
            <div className="space-y-2">
              {Array.from({ length: widget.rows || 5 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <span className="text-sm text-gray-700">Item {i + 1}</span>
                  <span className="text-sm font-medium text-gray-900">{Math.floor(Math.random() * 1000)}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'insights':
        return (
          <div key={index} className={`bg-white border border-gray-200 rounded-lg p-4 ${widgetSizeClass}`}>
            <h4 className="text-sm font-medium text-gray-600 mb-3">{widget.title}</h4>
            <div className="space-y-2">
              {widget.items?.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div key={index} className={`bg-white border border-gray-200 rounded-lg p-4 ${widgetSizeClass}`}>
            <div className="text-center text-gray-500 py-8">
              <span className="text-sm">Widget: {widget.type}</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${getDashboardTypeColor().split(' ').slice(0, 2).join(' ')} px-6 py-4 border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
              <svg className={`w-6 h-6 ${getDashboardTypeColor().split(' ')[2]}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {title}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              <span className="capitalize">{dashboardType}</span>
              <span>ID: {dashboardId}</span>
              {layout?.autoRefresh && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Auto-refresh
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right text-sm text-gray-600">
            <div>Datasets: {datasetIds?.length || 0}</div>
            <div>Widgets: {widgets?.length || 0}</div>
          </div>
        </div>
      </div>

      {/* KPIs Bar */}
      {kpis && kpis.length > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="flex items-center gap-6">
            <span className="text-sm font-medium text-gray-600">KPIs:</span>
            {kpis.map((kpi, index) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {kpi}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="p-6">
        <div className={`grid grid-cols-${layout?.columns || 3} gap-4`}>
          {widgets?.map(renderWidget)}
        </div>

        {(!widgets || widgets.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <p>Dashboard criado com sucesso</p>
            <p className="text-sm mt-1">Configure widgets para visualizar dados</p>
          </div>
        )}
      </div>

      {/* Footer */}
      {metadata && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>Versão {metadata.version}</span>
              {metadata.createdAt && (
                <span>Criado: {new Date(metadata.createdAt).toLocaleDateString('pt-BR')}</span>
              )}
            </div>
            {metadata.lastUpdated && (
              <span>Atualizado: {new Date(metadata.lastUpdated).toLocaleString('pt-BR')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}