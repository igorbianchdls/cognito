'use client';

import { mockAnalyses } from './mockData';

export default function CardsMaterial() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-orange-500';
      case 'pending': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✓';
      case 'running': return '⟳';
      case 'pending': return '○';
      default: return '○';
    }
  };

  const getBgColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50 border-green-200';
      case 'running': return 'bg-orange-50 border-orange-200';
      case 'pending': return 'bg-gray-50 border-gray-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        📊 Análises Planejadas
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {mockAnalyses.map((analysis) => (
          <div
            key={analysis.id}
            className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${getBgColor(analysis.status)}`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-full ${getStatusColor(analysis.status)} flex items-center justify-center text-white text-xl font-bold mb-3`}>
                {getStatusIcon(analysis.status)}
              </div>

              <h4 className="font-medium text-gray-900 text-sm mb-1">
                {analysis.title}
              </h4>

              <div className="text-xs text-gray-600 mb-2">
                {analysis.status === 'completed' && 'Concluída'}
                {analysis.status === 'running' && 'Executando'}
                {analysis.status === 'pending' && 'Aguardando'}
              </div>

              {analysis.status === 'running' && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.progress}%` }}
                  />
                </div>
              )}

              <div className="text-xs font-medium text-gray-700">
                {analysis.status === 'completed' && `${analysis.rows} linhas`}
                {analysis.status === 'running' && `${analysis.progress}% feito`}
                {analysis.status === 'pending' && 'Na fila'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}