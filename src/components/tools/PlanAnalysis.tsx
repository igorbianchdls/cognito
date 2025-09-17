'use client';

import { AlertCircleIcon, CheckCircleIcon, ClockIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PlanAnalysisProps {
  plano: Array<{
    numero: number;
    titulo: string;
    query: string;
    status: string;
    queryType: string;
  }>;
  totalAnalises: number;
  message: string;
  success: boolean;
  error?: string;
}

export default function PlanAnalysis({
  plano,
  totalAnalises,
  message,
  success,
  error
}: PlanAnalysisProps) {
  if (error || !success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <AlertCircleIcon className="w-5 h-5 text-red-500" />
          <span className="font-medium text-red-800">Erro no Planejamento</span>
        </div>
        <p className="text-red-700 mt-2">{error || 'Erro desconhecido ao criar plano de análise'}</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planejado':
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
      case 'executando':
        return <ClockIcon className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'concluido':
        return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planejado':
        return 'bg-blue-100 text-blue-800';
      case 'executando':
        return 'bg-yellow-100 text-yellow-800';
      case 'concluido':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getQueryTypeColor = (queryType: string) => {
    switch (queryType) {
      case 'SELECT':
        return 'bg-purple-100 text-purple-800';
      case 'INSERT':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-yellow-100 text-yellow-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-blue-900">Plano de Análise</span>
            <Badge variant="secondary" className="ml-2">
              {totalAnalises} análise{totalAnalises !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        <p className="text-blue-800 text-sm mt-2">{message}</p>
      </div>

      {/* Analysis Cards */}
      <div className="space-y-3">
        {plano.map((analise, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-sm transition-shadow">
            {/* Header with number and title */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-gray-700">{analise.numero}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 leading-tight">{analise.titulo}</h4>
              </div>
            </div>

            {/* Query block */}
            <div className="mb-3">
              <pre className="text-xs bg-gray-50 border rounded-md p-3 overflow-x-auto whitespace-pre-wrap font-mono text-gray-800">
                {analise.query}
              </pre>
            </div>

            {/* Status and badges */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {getStatusIcon(analise.status)}
                <Badge variant="secondary" className={getStatusColor(analise.status)}>
                  {analise.status}
                </Badge>
              </div>
              <Badge variant="outline" className={getQueryTypeColor(analise.queryType)}>
                {analise.queryType}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}