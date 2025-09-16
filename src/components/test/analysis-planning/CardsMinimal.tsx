'use client';

import { mockAnalyses, MockAnalysis } from './mockData';

export default function CardsMinimal() {
  const getStatusDots = (status: string, progress?: number) => {
    if (status === 'completed') return '●●●●●';
    if (status === 'running') {
      const filled = Math.floor((progress || 0) / 20);
      return '●'.repeat(filled) + '○'.repeat(5 - filled);
    }
    return '○○○○○';
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'concluída';
      case 'running': return 'executando';
      case 'pending': return 'pendente';
      default: return 'waiting';
    }
  };

  const getStatusValue = (analysis: MockAnalysis) => {
    if (analysis.status === 'completed') return `${((analysis.rows || 0) / 1000).toFixed(1)}k`;
    if (analysis.status === 'running') return `${analysis.progress || 0}%`;
    return 'queue';
  };

  return (
    <div className="bg-white p-6 border border-gray-200 rounded-sm">
      <h3 className="text-sm font-normal text-gray-700 mb-6 lowercase tracking-wide">
        análises planejadas
      </h3>

      <div className="grid grid-cols-2 gap-6">
        {mockAnalyses.map((analysis) => (
          <div key={analysis.id} className="text-center">
            <div className="text-sm font-light text-gray-900 mb-2 lowercase">
              {analysis.title.toLowerCase()}
            </div>

            <div className="text-xs font-mono text-gray-600 mb-2 tracking-wider">
              {getStatusDots(analysis.status, analysis.progress)}
            </div>

            <div className="text-xs text-gray-500 mb-1 lowercase">
              {getStatusText(analysis.status)}
            </div>

            <div className="text-xs font-mono text-gray-700">
              {getStatusValue(analysis)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}