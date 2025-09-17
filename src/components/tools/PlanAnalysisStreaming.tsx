'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircleIcon } from 'lucide-react';

interface StreamingAnalise {
  numero?: number;
  titulo?: string;
  descricao?: string;
  status?: string;
  tipo?: string;
}

interface PlanAnalysisStreamingProps {
  analises: StreamingAnalise[];
  isStreaming: boolean;
}

export default function PlanAnalysisStreaming({
  analises,
  isStreaming
}: PlanAnalysisStreamingProps) {

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
            {isStreaming ? 'Criando Plano de Análise...' : 'Plano de Análise Concluído'}
          </span>
          <Badge variant="secondary" className="ml-2">
            {analises.length} análise{analises.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>
      {isStreaming && (
        <p className="text-blue-800 text-sm mt-2">
          Gerando análises estruturadas em tempo real...
        </p>
      )}
    </div>
  );
}