'use client';

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye, X } from "lucide-react"
import { useStore } from '@nanostores/react'
import {
  $insightsOrdenados,
  $totalInsights,
  $insightsNaoLidos,
  markAsRead,
  markAllAsRead,
  removeInsight,
  type Insight
} from '@/stores/widgets/insightsStore'

interface InsightsCardProps {
  insights?: Insight[]; // Opcional, usa store se não fornecido
  resumo?: string;
  contexto?: string;
  title?: string;
  useGlobalStore?: boolean; // Flag para usar store ou props
}

function getImportanceStyles(importancia: 'alta' | 'media' | 'baixa') {
  switch (importancia) {
    case 'alta':
      return {
        border: 'border-blue-300',
        bg: 'bg-blue-100',
        icon: 'text-blue-600',
        badge: 'bg-blue-200 text-blue-900'
      };
    case 'media':
      return {
        border: 'border-indigo-200',
        bg: 'bg-indigo-50',
        icon: 'text-indigo-600',
        badge: 'bg-indigo-100 text-indigo-800'
      };
    case 'baixa':
      return {
        border: 'border-slate-200',
        bg: 'bg-slate-50',
        icon: 'text-slate-600',
        badge: 'bg-slate-100 text-slate-800'
      };
    default:
      return {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        icon: 'text-gray-500',
        badge: 'bg-gray-100 text-gray-800'
      };
  }
}

function getImportanceIcon(importancia: 'alta' | 'media' | 'baixa') {
  switch (importancia) {
    case 'alta':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3l1.09 3.26L16 9l-2.91 1.74L12 21l-1.09-3.26L8 15l2.91-1.74L12 3z" />
        </svg>
      );
    case 'media':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    case 'baixa':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function InsightsCard({
  insights: propInsights,
  resumo,
  contexto,
  title = "Insights",
  useGlobalStore = false
}: InsightsCardProps) {
  const storeInsights = useStore($insightsOrdenados)
  const totalInsights = useStore($totalInsights)
  const insightsNaoLidos = useStore($insightsNaoLidos)

  const insights = useGlobalStore ? storeInsights : (propInsights || [])
  const showActions = useGlobalStore // Só mostra ações quando usa store
  if (!insights || insights.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-yellow-800">Nenhum insight encontrado</h3>
        </div>
        <p className="text-yellow-700 text-sm mt-1">
          Não foram gerados insights para análise.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-4">
      {/* Header */}
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="font-semibold text-gray-900">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            {useGlobalStore && insightsNaoLidos.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {insightsNaoLidos.length} novos
              </Badge>
            )}
            <div className="text-sm text-gray-700">
              {useGlobalStore ? totalInsights : insights.length} insight{(useGlobalStore ? totalInsights : insights.length) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {contexto && (
          <p className="text-gray-800 text-sm mb-2">{contexto}</p>
        )}

        {useGlobalStore && insights.length > 0 && (
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs h-7"
            >
              <Eye className="h-3 w-3 mr-1" />
              Marcar todos como lidos
            </Button>
          </div>
        )}
      </div>

      {/* Resumo Executivo */}
      {resumo && (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">📋 Resumo Executivo</h4>
          <p className="text-gray-800 text-sm">{resumo}</p>
        </div>
      )}

      {/* Lista de Insights */}
      <div className="space-y-4">
        {insights.map((insight, index) => {
          const styles = getImportanceStyles(insight.importancia);
          const icon = getImportanceIcon(insight.importancia);

          return (
            <div
              key={useGlobalStore ? insight.id : index}
              className={`${styles.bg} ${styles.border} border rounded-lg p-4 ${
                useGlobalStore && !insight.read ? 'ring-2 ring-blue-300' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${styles.icon} flex-shrink-0`}>
                  {icon}
                </div>
                <div className="flex items-center gap-1">
                  {useGlobalStore && !insight.read && (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                      Novo
                    </Badge>
                  )}
                  <span className={`${styles.badge} px-2 py-1 text-xs font-medium rounded-full`}>
                    {insight.importancia}
                  </span>
                </div>
              </div>

              <h5 className="font-semibold text-gray-900 mb-2">{insight.titulo}</h5>

              <p className="text-gray-700 text-sm mb-3">{insight.descricao}</p>

              {insight.dados && (
                <div className="bg-white/50 rounded p-2 text-xs text-gray-600 font-mono mb-3">
                  📊 {insight.dados}
                </div>
              )}

              {showActions && (
                <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-100">
                  <div className="flex gap-2">
                    {!insight.read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(insight.id)}
                        className="h-6 px-2 text-xs"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Marcar como lido
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInsight(insight.id)}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {useGlobalStore && insights.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Fonte:</strong> Store global • <strong>Não lidos:</strong> {insightsNaoLidos.length}
          </p>
        </div>
      )}
    </div>
  );
}