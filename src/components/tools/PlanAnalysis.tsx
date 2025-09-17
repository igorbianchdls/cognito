'use client';

import { AlertCircleIcon, ChevronDownIcon, CheckCircleIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { useState } from 'react';

interface PlanAnalysisProps {
  plano: Array<{
    numero: number;
    titulo: string;
    descricao: string;
    status: string;
    tipo: string;
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
  const [openCards, setOpenCards] = useState<Record<number, boolean>>({});

  const toggleCard = (index: number) => {
    setOpenCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

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
        {plano.map((analise, index) => {
          const isOpen = openCards[index] || false;

          return (
            <Collapsible key={index} open={isOpen} onOpenChange={() => toggleCard(index)}>
              <div className="border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow">
                {/* Header with number, title and chevron in single line */}
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-gray-700">{analise.numero}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 leading-tight">{analise.titulo}</h4>
                    </div>
                    {/* Collapsible trigger - just the icon */}
                    <CollapsibleTrigger className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-all duration-200">
                      <ChevronDownIcon
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : 'rotate-0'
                        }`}
                      />
                    </CollapsibleTrigger>
                  </div>
                </div>

                {/* Collapsible Description block */}
                <CollapsibleContent className="px-4 pb-4">
                  <div className="border-t border-gray-100 pt-3">
                    <div className="text-sm bg-gray-50 border rounded-md p-3 text-gray-800 leading-relaxed">
                      {analise.descricao}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}