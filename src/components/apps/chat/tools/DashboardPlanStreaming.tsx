'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon } from 'lucide-react';

interface StreamingWidget {
  numero?: number;
  titulo?: string;
  tipo?: 'kpi' | 'chart' | 'table';
  descricao?: string;
  status?: string;
  queryType?: string;
}

interface DashboardPlanStreamingProps {
  widgets: StreamingWidget[];
  isStreaming: boolean;
}

export default function DashboardPlanStreaming({
  widgets,
  isStreaming
}: DashboardPlanStreamingProps) {

  return (
    <div className={`border rounded-lg p-4 transition-colors ${
      isStreaming ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          ) : (
            <CheckCircleIcon className="w-5 h-5 text-green-600" />
          )}
          <span className="font-semibold text-gray-900">
            {isStreaming ? 'Criando Plano de Dashboard...' : 'Plano de Dashboard Concluído'}
          </span>
          <Badge variant="secondary" className="ml-2">
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
      {isStreaming && (
        <p className="text-blue-800 text-sm mt-2">
          Gerando widgets estruturados em tempo real...
        </p>
      )}
    </div>
  );
}