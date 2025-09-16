'use client';

import { mockAnalyses, getStatusIcon } from './mockData';

export default function CardsGlassmorphism() {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 rounded-xl border border-white/20 backdrop-blur-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        ✨ Análises Planejadas
      </h3>

      <div className="grid grid-cols-2 gap-4">
        {mockAnalyses.map((analysis) => (
          <div
            key={analysis.id}
            className="relative bg-white/30 backdrop-blur-md border border-white/40 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-white/40"
          >
            {/* Glass effect overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{getStatusIcon(analysis.status)}</span>
                <span className="font-medium text-gray-800 text-sm">{analysis.title}</span>
              </div>

              <div className="text-xs text-gray-600 mb-2">
                {analysis.status === 'completed' && `${analysis.rows || 0} linhas`}
                {analysis.status === 'running' && `${analysis.progress || 0}% feito`}
                {analysis.status === 'pending' && 'Aguardando'}
              </div>

              {analysis.status === 'running' && (
                <div className="w-full bg-white/40 rounded-full h-2 mb-2">
                  <div
                    className="bg-gradient-to-r from-blue-400 to-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${analysis.progress || 0}%` }}
                  />
                </div>
              )}

              <div className="text-xs font-medium text-gray-700">
                {analysis.duration || analysis.estimation}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}