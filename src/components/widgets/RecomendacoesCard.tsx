'use client';

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, X, Check, ChevronDown } from "lucide-react"
import { useState } from "react"
import { useStore } from '@nanostores/react'
import {
  $recomendacoesOrdenadas,
  $totalRecomendacoes,
  $recomendacoesAtivas,
  $recomendacoesAltaPrioridade,
  markAsImplemented,
  markAllAsImplemented,
  removeRecomendacao,
  type Recomendacao
} from '@/stores/widgets/recomendacoesStore'

interface RecomendacoesCardProps {
  recomendacoes?: Recomendacao[]; // Opcional, usa store se não fornecido
  title?: string;
  onActionClick?: (recomendacao: Recomendacao, index: number) => void;
  useGlobalStore?: boolean; // Flag para usar store ou props
  backgroundColor?: string;
  backgroundGradient?: {
    enabled: boolean;
    direction: string;
    startColor: string;
    endColor: string;
  };
  borderColor?: string;
  borderAccentColor?: string;
}

function getImpactoStyles(impacto: 'alto' | 'medio' | 'baixo') {
  const styles = {
    alto: { border: 'border-green-700', bg: 'bg-green-600', icon: 'text-white', badge: 'bg-green-800 text-white' },
    medio: { border: 'border-purple-700', bg: 'bg-purple-600', icon: 'text-white', badge: 'bg-purple-800 text-white' },
    baixo: { border: 'border-gray-700', bg: 'bg-gray-600', icon: 'text-white', badge: 'bg-gray-800 text-white' }
  };
  return styles[impacto];
}

function getImpactoIcon(impacto: 'alto' | 'medio' | 'baixo') {
  switch (impacto) {
    case 'alto':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    case 'medio':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'baixo':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
  }
}


export default function RecomendacoesCard({
  recomendacoes: propRecomendacoes,
  title = "Recomendações",
  onActionClick,
  useGlobalStore = false,
  backgroundColor,
  backgroundGradient,
  borderColor,
  borderAccentColor
}: RecomendacoesCardProps) {
  const storeRecomendacoes = useStore($recomendacoesOrdenadas)
  const totalRecomendacoes = useStore($totalRecomendacoes)
  const recomendacoesAtivas = useStore($recomendacoesAtivas)
  const recomendacoesAltaPrioridade = useStore($recomendacoesAltaPrioridade)

  const recomendacoes = useGlobalStore ? storeRecomendacoes : (propRecomendacoes || [])
  const showActions = useGlobalStore // Só mostra ações quando usa store
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }
  if (!recomendacoes || recomendacoes.length === 0) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-blue-800">Nenhuma recomendação encontrada</h3>
        </div>
        <p className="text-blue-700 text-sm mt-1">
          Não foram geradas recomendações para análise.
        </p>
      </div>
    );
  }

  // Usar recomendações já ordenadas da store ou ordenar props
  const recomendacoesOrdenadas = useGlobalStore ? recomendacoes : [...recomendacoes].sort((a, b) => {
    const calcularPrioridade = (rec: { impacto: 'alto' | 'medio' | 'baixo'; facilidade: 'facil' | 'medio' | 'dificil' }) => {
      const impactoScore = { alto: 3, medio: 2, baixo: 1 }
      const facilidadeScore = { facil: 3, medio: 2, dificil: 1 }
      return (impactoScore[rec.impacto] * 2) + facilidadeScore[rec.facilidade]
    }
    return calcularPrioridade(b) - calcularPrioridade(a)
  });

  return (
    <div className="relative" style={{
      border: `0.5px solid ${borderColor || '#777'}`,
      padding: '16px',
      background: backgroundGradient?.enabled
        ? `linear-gradient(${backgroundGradient.direction}, ${backgroundGradient.startColor}, ${backgroundGradient.endColor})`
        : (backgroundColor || 'linear-gradient(135deg, #f8fafc, #e2e8f0)')
    }}>
      {/* Corner accents - positioned to overlay border */}
      <div
        className="absolute w-3 h-3"
        style={{
          top: '-0.5px',
          left: '-0.5px',
          borderTop: `0.5px solid ${borderAccentColor || '#bbb'}`,
          borderLeft: `0.5px solid ${borderAccentColor || '#bbb'}`
        }}
      ></div>
      <div
        className="absolute w-3 h-3"
        style={{
          top: '-0.5px',
          right: '-0.5px',
          borderTop: `0.5px solid ${borderAccentColor || '#bbb'}`,
          borderRight: `0.5px solid ${borderAccentColor || '#bbb'}`
        }}
      ></div>
      <div
        className="absolute w-3 h-3"
        style={{
          bottom: '-0.5px',
          left: '-0.5px',
          borderBottom: `0.5px solid ${borderAccentColor || '#bbb'}`,
          borderLeft: `0.5px solid ${borderAccentColor || '#bbb'}`
        }}
      ></div>
      <div
        className="absolute w-3 h-3"
        style={{
          bottom: '-0.5px',
          right: '-0.5px',
          borderBottom: `0.5px solid ${borderAccentColor || '#bbb'}`,
          borderRight: `0.5px solid ${borderAccentColor || '#bbb'}`
        }}
      ></div>

      <div className="space-y-4 mb-4">
      {/* Header */}
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <svg className="w-5 h-5 text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="font-semibold text-gray-900 break-words min-w-0">📋 {title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {useGlobalStore && recomendacoesAltaPrioridade.length > 0 && (
              <Badge variant="default" className="text-xs">
                {recomendacoesAltaPrioridade.length} alta prioridade
              </Badge>
            )}
            {useGlobalStore && (
              <Badge variant="outline" className="text-xs">
                {recomendacoesAtivas.length} ativas
              </Badge>
            )}
            <div className="text-sm text-gray-700">
              {useGlobalStore ? totalRecomendacoes : recomendacoes.length} recomendaç{(useGlobalStore ? totalRecomendacoes : recomendacoes.length) !== 1 ? 'ões' : 'ão'}
            </div>
          </div>
        </div>

        <p className="text-gray-800 text-sm mb-2">Ordenadas por prioridade (impacto + facilidade)</p>

        {useGlobalStore && recomendacoes.length > 0 && (
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsImplemented}
              className="text-xs h-7"
            >
              <Check className="h-3 w-3 mr-1" />
              Implementar todas
            </Button>
          </div>
        )}
      </div>

      {/* Lista de Recomendações */}
      <div className="space-y-4">
        {recomendacoesOrdenadas.map((recomendacao, index) => {
          const styles = getImpactoStyles(recomendacao.impacto);
          const icon = getImpactoIcon(recomendacao.impacto);
          const impactoScore = { alto: 3, medio: 2, baixo: 1 };
          const facilidadeScore = { facil: 3, medio: 2, dificil: 1 };
          const priority = (impactoScore[recomendacao.impacto] * 2) + facilidadeScore[recomendacao.facilidade];
          const cardId = useGlobalStore ? recomendacao.id : index.toString();
          const isExpanded = expandedCards[cardId] || false;
          const isHighImpact = recomendacao.impacto === 'alto';
          const isImplemented = useGlobalStore && recomendacao.implemented;

          return (
            <div
              key={useGlobalStore ? recomendacao.id : index}
              className={`${styles.bg} ${styles.border} rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
                isHighImpact ? 'ring-2 ring-green-300 shadow-green-500/20' : ''
              } ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'} ${
                isImplemented ? 'opacity-60' : ''
              }`}
            >
              {/* Header (sempre visível) */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => toggleExpanded(cardId)}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`${styles.icon} flex-shrink-0`}>
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-semibold text-white text-sm truncate">
                      {recomendacao.titulo}
                    </h5>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isImplemented && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Implementada
                    </Badge>
                  )}
                  <span className={`${styles.badge} px-2 py-1 text-xs font-medium rounded-full ${isHighImpact ? 'animate-pulse' : ''}`}>
                    {recomendacao.impacto}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>
              </div>

              {/* Content (colapsável) */}
              <div className={`transition-all duration-300 ease-out ${
                isExpanded
                  ? 'max-h-screen opacity-100'
                  : 'max-h-0 opacity-0'
              }`}>
                <div className="px-4 pb-4 border-t border-gray-100 bg-white">
                  <div className="pt-3">
                    <p className="text-gray-700 text-sm mb-3 leading-relaxed">
                      {recomendacao.descricao}
                    </p>

                    <div className="flex gap-2 mb-3 text-xs">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {recomendacao.impacto} impacto
                      </span>
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {recomendacao.facilidade}
                      </span>
                    </div>

                    {recomendacao.estimativaResultado && (
                      <div className="bg-green-50 rounded p-3 text-xs text-green-700 mb-3 border border-green-200">
                        <div className="font-medium text-green-800 mb-1">🎯 Resultado esperado:</div>
                        {recomendacao.estimativaResultado}
                      </div>
                    )}

                    {recomendacao.proximosPassos && recomendacao.proximosPassos.length > 0 && (
                      <div className="bg-blue-50 rounded p-3 text-xs text-blue-700 border border-blue-200 mb-3">
                        <div className="font-medium text-blue-800 mb-2">📝 Próximos passos:</div>
                        <ul className="space-y-1">
                          {recomendacao.proximosPassos.map((passo, passoIndex) => (
                            <li key={passoIndex} className="flex items-start gap-2">
                              <span className="text-blue-500 mt-0.5 font-bold">•</span>
                              <span>{passo}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {showActions && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                        <div className="flex gap-2">
                          {!recomendacao.implemented && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-3 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onActionClick) {
                                  onActionClick(recomendacao, index)
                                }
                                if (showActions) {
                                  markAsImplemented(recomendacao.id)
                                }
                              }}
                            >
                              Implementar
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecomendacao(recomendacao.id);
                          }}
                          className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {useGlobalStore && recomendacoes.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Fonte:</strong> Store global • <strong>Ativas:</strong> {recomendacoesAtivas.length} • <strong>Alta prioridade:</strong> {recomendacoesAltaPrioridade.length}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}