'use client';

import { mockAnalyses } from './mockData';

export default function ChecklistNotion() {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '☑️';
      case 'running': return '🔄';
      case 'pending': return '⏸️';
      default: return '⭕';
    }
  };

  const getStatusBadge = (analysis: any) => {
    if (analysis.status === 'completed') {
      return <span className="text-xs text-green-600">✨ Concluído em {analysis.duration}</span>;
    }
    if (analysis.status === 'running') {
      return <span className="text-xs text-orange-600">⚡ Executando... {analysis.progress}% completo</span>;
    }
    return <span className="text-xs text-gray-500">⏳ Aguardando análise anterior</span>;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        📋 Roteiro de Análise
      </h3>

      <div className="space-y-4">
        {mockAnalyses.map((analysis, index) => (
          <div key={analysis.id} className="group">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-lg mt-0.5">{getStatusIcon(analysis.status)}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">
                    📊 {analysis.title}
                  </span>
                </div>

                <div className="ml-4 border-l-2 border-gray-200 pl-3">
                  <div className="text-sm text-gray-600 mb-1">
                    ↳ {analysis.description}
                  </div>
                  <div className="text-xs">
                    ↳ {getStatusBadge(analysis)}
                  </div>

                  {analysis.status === 'running' && (
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${analysis.progress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}