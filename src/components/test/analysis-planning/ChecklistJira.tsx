'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react';
import { mockAnalyses } from './mockData';

export default function ChecklistJira() {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (analysisId: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(analysisId)) {
        newSet.delete(analysisId);
      } else {
        newSet.add(analysisId);
      }
      return newSet;
    });
  };

  const isExpanded = (analysisId: string) => expandedItems.has(analysisId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">DONE</span>;
      case 'running':
        return <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">PROG</span>;
      case 'pending':
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">TODO</span>;
      default:
        return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">UNKN</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'running': return '🔄';
      case 'pending': return '📋';
      default: return '⭕';
    }
  };

  const getTaskIcon = (title: string) => {
    if (title.includes('Receita')) return '📊';
    if (title.includes('Produto')) return '🛍️';
    if (title.includes('Cliente')) return '👥';
    if (title.includes('Retenção')) return '📈';
    if (title.includes('Dashboard')) return '📊';
    return '📋';
  };

  const completedTasks = mockAnalyses.filter(a => a.status === 'completed').length;
  const totalTasks = mockAnalyses.length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          🎯 <span>SPRINT: Análise de Vendas Q4</span>
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {completedTasks}/{totalTasks} tasks ({progressPercent}% complete)
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {mockAnalyses.map((analysis, index) => (
          <div key={analysis.id} className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Clickable Header */}
            <div
              className="flex items-center gap-4 p-3 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => toggleExpanded(analysis.id)}
            >
              <span className="text-lg">{getStatusIcon(analysis.status)}</span>

              <span className="font-mono text-sm text-gray-600 w-16">
                AN-{String(index + 1).padStart(3, '0')}
              </span>

              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-gray-900">
                  {analysis.title}
                </span>
              </div>

              <span className="text-lg">{getTaskIcon(analysis.title)}</span>

              {getStatusBadge(analysis.status)}

              {/* Expansion Indicator */}
              <div className="text-gray-400 transition-transform duration-200">
                {isExpanded(analysis.id) ? (
                  <ChevronDownIcon className="w-4 h-4 transform rotate-0 transition-transform duration-200" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 transform transition-transform duration-200" />
                )}
              </div>
            </div>

            {/* Expandable Content */}
            {isExpanded(analysis.id) && (
              <div className="px-3 pb-3 border-t border-gray-100 bg-gray-50/50 animate-in slide-in-from-top-2 duration-200">
                <div className="pt-3 space-y-2">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium text-gray-900">Descrição:</span>
                    <p className="mt-1">{analysis.description}</p>
                  </div>

                  <div className="flex gap-4 text-xs text-gray-600">
                    {analysis.duration && (
                      <span>⏱️ Executado em: {analysis.duration}</span>
                    )}
                    {analysis.estimation && (
                      <span>⏱️ Tempo estimado: {analysis.estimation}</span>
                    )}
                    {analysis.rows && (
                      <span>📊 Registros: {analysis.rows.toLocaleString()}</span>
                    )}
                    {analysis.progress && (
                      <span>📈 Progresso: {analysis.progress}%</span>
                    )}
                  </div>

                  <div className="mt-2 p-2 bg-white rounded border text-xs font-mono text-gray-600">
                    <span className="text-gray-800 font-medium">SQL Query:</span>
                    <div className="mt-1 text-gray-600">
                      SELECT * FROM analysis_{analysis.title.toLowerCase().replace(/\s+/g, '_')}
                      WHERE date_range = 'last_30_days'
                      ORDER BY relevance DESC;
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            🎉 <span className="font-medium">Burndown:</span> On track
          </span>
          <span className="flex items-center gap-2">
            ⚡ <span className="font-medium">Velocity:</span> 2.1/day
          </span>
        </div>
      </div>
    </div>
  );
}