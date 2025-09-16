'use client';

import { mockAnalyses } from './mockData';

export default function ChecklistTerminal() {
  const getStatusSymbol = (status: string) => {
    switch (status) {
      case 'completed': return '[✓]';
      case 'running': return '[~]';
      case 'pending': return '[-]';
      default: return '[?]';
    }
  };

  const getTaskId = (index: number) => {
    return `task_${String(index + 1).padStart(3, '0')}`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'COMPLETED';
      case 'running': return 'RUNNING';
      case 'pending': return 'QUEUED';
      default: return 'UNKNOWN';
    }
  };

  const getOutput = (analysis: any) => {
    if (analysis.status === 'completed') {
      return `${analysis.rows} rows processed`;
    }
    if (analysis.status === 'running') {
      return `${analysis.progress}% complete`;
    }
    return 'depends_on: previous_task';
  };

  const getEta = (analysis: any) => {
    if (analysis.status === 'completed') {
      return `(${analysis.duration})`;
    }
    if (analysis.status === 'running') {
      return `(${analysis.estimation} remaining)`;
    }
    return '';
  };

  return (
    <div className="bg-black text-green-400 font-mono text-sm p-6 rounded-lg border border-gray-700">
      <div className="mb-4">
        <span className="text-cyan-400">$</span>
        <span className="ml-2">analysis-pipeline --status</span>
      </div>

      <div className="space-y-3">
        {mockAnalyses.map((analysis, index) => (
          <div key={analysis.id} className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={
                analysis.status === 'completed' ? 'text-green-400' :
                analysis.status === 'running' ? 'text-yellow-400' :
                'text-gray-500'
              }>
                {getStatusSymbol(analysis.status)}
              </span>
              <span className="text-cyan-300">
                {getTaskId(index)}:
              </span>
              <span className="text-white">
                {analysis.title.toLowerCase().replace(/\s+/g, '_')}
              </span>
            </div>

            <div className="ml-4 space-y-1 text-xs">
              <div className="flex gap-2">
                <span className="text-gray-400">└── status:</span>
                <span className={
                  analysis.status === 'completed' ? 'text-green-400' :
                  analysis.status === 'running' ? 'text-yellow-400' :
                  'text-gray-500'
                }>
                  {getStatusText(analysis.status)} {getEta(analysis)}
                </span>
              </div>

              <div className="flex gap-2">
                <span className="text-gray-400">└── output:</span>
                <span className="text-gray-300">{getOutput(analysis)}</span>
              </div>

              {analysis.status === 'running' && (
                <div className="flex gap-2">
                  <span className="text-gray-400">└── progress:</span>
                  <span className="text-yellow-400">
                    {'█'.repeat(Math.floor(analysis.progress! / 10))}
                    {'░'.repeat(10 - Math.floor(analysis.progress! / 10))}
                    {' '}
                    {analysis.progress}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center">
        <span className="text-cyan-400">$</span>
        <span className="ml-2 animate-pulse">_</span>
      </div>
    </div>
  );
}