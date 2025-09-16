'use client';

import { mockAnalyses } from './mockData';

export default function CardsNeon() {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-400 bg-green-900/20 shadow-green-400/50';
      case 'running':
        return 'border-orange-400 bg-orange-900/20 shadow-orange-400/50';
      case 'pending':
        return 'border-gray-400 bg-gray-900/20 shadow-gray-400/30';
      default:
        return 'border-gray-400 bg-gray-900/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '[COMPLETE]';
      case 'running': return '[RUNNING]';
      case 'pending': return '[QUEUE]';
      default: return '[WAIT]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '⚡';
      case 'running': return '🎯';
      case 'pending': return '🤖';
      default: return '○';
    }
  };

  return (
    <div className="bg-black/90 p-6 rounded-lg border-2 border-cyan-500/50 shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-cyan-400 font-mono font-bold">▓▓</span>
        <h3 className="text-cyan-300 font-mono font-bold tracking-wider">
          ANÁLISES PLANEJADAS
        </h3>
        <span className="text-cyan-400 font-mono font-bold">▓▓</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {mockAnalyses.map((analysis) => (
          <div
            key={analysis.id}
            className={`border-2 rounded-lg p-4 transition-all duration-300 hover:shadow-xl ${getStatusStyle(analysis.status)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg">{getStatusIcon(analysis.status)}</span>
              <span className="text-xs font-mono text-cyan-300 bg-black/50 px-2 py-1 rounded">
                {getStatusText(analysis.status)}
              </span>
            </div>

            <div className="font-mono text-sm font-bold text-white mb-2 uppercase tracking-wide">
              {analysis.title.replace(' ', '\n')}
            </div>

            {analysis.status === 'running' && (
              <div className="mb-2">
                <div className="flex justify-between text-xs font-mono text-orange-300 mb-1">
                  <span>PROGRESS</span>
                  <span>{analysis.progress}%</span>
                </div>
                <div className="w-full bg-black/50 border border-orange-400/50 rounded h-2">
                  <div
                    className="bg-gradient-to-r from-orange-500 to-yellow-400 h-full rounded transition-all duration-500"
                    style={{ width: `${analysis.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="text-center">
              <span className="font-mono text-xs font-bold text-cyan-200">
                {analysis.status === 'completed' && `>> ${analysis.rows}k <<`}
                {analysis.status === 'running' && `>> ${analysis.progress}% <<`}
                {analysis.status === 'pending' && '>> WAIT <<'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}