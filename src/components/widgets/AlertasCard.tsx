'use client';

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, X, Check, ChevronDown } from "lucide-react"
import { useState } from "react"
import { useStore } from '@nanostores/react'
import {
  $alertasOrdenados,
  $totalAlertas,
  $alertasAtivos,
  $alertasCriticos,
  markAsResolved,
  markAllAsResolved,
  removeAlerta,
  executeAction,
  type Alerta
} from '@/stores/widgets/alertasStore'

interface AlertasCardProps {
  alertas?: Alerta[]; // Opcional, usa store se não fornecido
  resumo?: string;
  contexto?: string;
  title?: string;
  onActionClick?: (alerta: Alerta, index: number) => void;
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

function getNivelStyles(nivel: 'critico' | 'alto' | 'medio' | 'baixo') {
  switch (nivel) {
    case 'critico':
      return {
        border: 'border-red-700',
        bg: 'bg-red-600',
        icon: 'text-white',
        badge: 'bg-red-800 text-white'
      };
    case 'alto':
      return {
        border: 'border-red-700',
        bg: 'bg-red-500',
        icon: 'text-white',
        badge: 'bg-red-700 text-white'
      };
    case 'medio':
      return {
        border: 'border-orange-700',
        bg: 'bg-orange-600',
        icon: 'text-white',
        badge: 'bg-orange-800 text-white'
      };
    case 'baixo':
      return {
        border: 'border-yellow-700',
        bg: 'bg-yellow-600',
        icon: 'text-white',
        badge: 'bg-yellow-800 text-white'
      };
    default:
      return {
        border: 'border-gray-700',
        bg: 'bg-gray-600',
        icon: 'text-white',
        badge: 'bg-gray-800 text-white'
      };
  }
}

function getNivelIcon(nivel: 'critico' | 'alto' | 'medio' | 'baixo') {
  switch (nivel) {
    case 'critico':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
    case 'alto':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function AlertasCard({
  alertas: propAlertas,
  resumo,
  contexto,
  title = "Alertas",
  onActionClick,
  useGlobalStore = false,
  backgroundColor,
  backgroundGradient,
  borderColor,
  borderAccentColor
}: AlertasCardProps) {
  const storeAlertas = useStore($alertasOrdenados)
  const totalAlertas = useStore($totalAlertas)
  const alertasAtivos = useStore($alertasAtivos)
  const alertasCriticos = useStore($alertasCriticos)

  const alertas = useGlobalStore ? storeAlertas : (propAlertas || [])
  const showActions = useGlobalStore // Só mostra ações quando usa store
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }
  if (!alertas || alertas.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="font-semibold text-green-800">Nenhum alerta encontrado</h3>
        </div>
        <p className="text-green-700 text-sm mt-1">
          Não há alertas no momento. Tudo está funcionando normalmente.
        </p>
      </div>
    );
  }

  // Usar alertas já ordenados da store ou ordenar props
  const alertasOrdenados = useGlobalStore ? alertas : [...alertas].sort((a, b) => {
    const ordem = { critico: 0, alto: 1, medio: 2, baixo: 3 };
    return ordem[a.nivel] - ordem[b.nivel];
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
      <div className="mb-4">
        <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900 break-words min-w-0">{title}</h3>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {useGlobalStore && alertasCriticos.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {alertasCriticos.length} críticos
              </Badge>
            )}
            {useGlobalStore && (
              <Badge variant="outline" className="text-xs">
                {alertasAtivos.length} ativos
              </Badge>
            )}
            <div className="text-sm text-gray-700">
              {useGlobalStore ? totalAlertas : alertas.length} alerta{(useGlobalStore ? totalAlertas : alertas.length) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {contexto && (
          <p className="text-gray-800 text-sm mb-2">{contexto}</p>
        )}

        {useGlobalStore && alertas.length > 0 && (
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsResolved}
              className="text-xs h-7"
            >
              <Check className="h-3 w-3 mr-1" />
              Resolver todos
            </Button>
          </div>
        )}
      </div>

      {/* Resumo Executivo */}
      {resumo && (
        <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">🚨 Resumo dos Alertas</h4>
          <p className="text-gray-800 text-sm">{resumo}</p>
        </div>
      )}

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {alertasOrdenados.map((alerta, index) => {
          const styles = getNivelStyles(alerta.nivel);
          const icon = getNivelIcon(alerta.nivel);
          const cardId = useGlobalStore ? alerta.id : index.toString();
          const isExpanded = expandedCards[cardId] || false;
          const isCritico = alerta.nivel === 'critico';
          const isResolved = useGlobalStore && alerta.resolved;

          return (
            <div
              key={useGlobalStore ? alerta.id : index}
              className={`${styles.bg} ${styles.border} border rounded-lg overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${
                isCritico ? 'ring-2 ring-red-300 shadow-red-500/20' : ''
              } ${isExpanded ? 'shadow-xl' : 'hover:shadow-md'} ${
                isResolved ? 'opacity-60' : ''
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
                    <h5 className="font-semibold text-white text-sm break-words leading-tight">
                      {alerta.titulo}
                    </h5>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isResolved && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Resolvido
                    </Badge>
                  )}
                  <span className={`${styles.badge} px-2 py-1 text-xs font-medium rounded-full ${isCritico ? 'animate-pulse' : ''}`}>
                    {alerta.nivel}
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
                      {alerta.descricao}
                    </p>

                    {alerta.dados && (
                      <div className="bg-white/50 rounded p-3 text-xs text-gray-600 font-mono mb-3 border border-gray-200">
                        📊 {alerta.dados}
                      </div>
                    )}

                    {alerta.acao && (
                      <div className="bg-white/70 rounded p-3 text-xs text-gray-700 border-l-4 border-indigo-400 mb-3">
                        <div className="font-medium text-indigo-800 mb-1">💡 Ação:</div>
                        <div className="mb-2">{alerta.acao}</div>
                        {(onActionClick || showActions) && !alerta.resolved && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs hover:bg-indigo-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onActionClick) {
                                onActionClick(alerta, index)
                              }
                              if (showActions) {
                                executeAction(alerta.id)
                              }
                            }}
                          >
                            Executar
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    )}

                    {showActions && (
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                        <div className="flex gap-2">
                          {!alerta.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsResolved(alerta.id);
                              }}
                              className="h-7 px-3 text-xs hover:bg-green-50"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Resolver
                            </Button>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAlerta(alerta.id);
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

      {useGlobalStore && alertas.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            <strong>Fonte:</strong> Store global • <strong>Ativos:</strong> {alertasAtivos.length} • <strong>Críticos:</strong> {alertasCriticos.length}
          </p>
        </div>
      )}
      </div>
    </div>
  );
}