'use client';

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, X, Check } from "lucide-react"
import { useStore } from '@nanostores/react'
import {
  $recomendacoesOrdenadas,
  $totalRecomendacoes,
  $recomendacoesAtivas,
  $recomendacoesAltaPrioridade,
  markAsImplemented,
  markAllAsImplemented,
  removeRecomendacao,
  getPrioridadeRecomendacao,
  type Recomendacao
} from '@/stores/widgets/recomendacoesStore'

interface RecomendacoesCardProps {
  recomendacoes?: Recomendacao[]; // Opcional, usa store se não fornecido
  title?: string;
  maxHeight?: number;
  onActionClick?: (recomendacao: Recomendacao, index: number) => void;
  useGlobalStore?: boolean; // Flag para usar store ou props
}

function getPriorityStyles(impacto: 'alto' | 'medio' | 'baixo', facilidade: 'facil' | 'medio' | 'dificil') {
  const impactoScore = { alto: 3, medio: 2, baixo: 1 };
  const facilidadeScore = { facil: 3, medio: 2, dificil: 1 };
  const priority = (impactoScore[impacto] * 2) + facilidadeScore[facilidade];

  if (priority >= 7) {
    return {
      border: 'border-green-300',
      bg: 'bg-green-100',
      icon: 'text-green-600',
      badge: 'bg-green-200 text-green-900'
    };
  } else if (priority >= 5) {
    return {
      border: 'border-teal-200',
      bg: 'bg-teal-50',
      icon: 'text-teal-600',
      badge: 'bg-teal-100 text-teal-800'
    };
  } else {
    return {
      border: 'border-lime-200',
      bg: 'bg-lime-50',
      icon: 'text-lime-600',
      badge: 'bg-lime-100 text-lime-800'
    };
  }
}

function getPriorityIcon(impacto: 'alto' | 'medio' | 'baixo', facilidade: 'facil' | 'medio' | 'dificil') {
  const impactoScore = { alto: 3, medio: 2, baixo: 1 };
  const facilidadeScore = { facil: 3, medio: 2, dificil: 1 };
  const priority = (impactoScore[impacto] * 2) + facilidadeScore[facilidade];

  if (priority >= 7) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    );
  } else if (priority >= 5) {
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    );
  } else {
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
  maxHeight,
  onActionClick,
  useGlobalStore = false
}: RecomendacoesCardProps) {
  const storeRecomendacoes = useStore($recomendacoesOrdenadas)
  const totalRecomendacoes = useStore($totalRecomendacoes)
  const recomendacoesAtivas = useStore($recomendacoesAtivas)
  const recomendacoesAltaPrioridade = useStore($recomendacoesAltaPrioridade)

  const recomendacoes = useGlobalStore ? storeRecomendacoes : (propRecomendacoes || [])
  const showActions = useGlobalStore // Só mostra ações quando usa store
  if (!recomendacoes || recomendacoes.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {title}
          </CardTitle>
          <CardDescription>Nenhuma recomendação disponível</CardDescription>
        </CardHeader>
      </Card>
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
    <div className="space-y-4 mb-4">
      {/* Header */}
      <div className="bg-gray-100 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="font-semibold text-gray-900">📋 {title}</h3>
          </div>
          <div className="flex items-center gap-2">
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

      {/* Grid de Recomendações */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recomendacoesOrdenadas.map((recomendacao, index) => {
          const styles = getPriorityStyles(recomendacao.impacto, recomendacao.facilidade);
          const icon = getPriorityIcon(recomendacao.impacto, recomendacao.facilidade);
          const impactoScore = { alto: 3, medio: 2, baixo: 1 };
          const facilidadeScore = { facil: 3, medio: 2, dificil: 1 };
          const priority = (impactoScore[recomendacao.impacto] * 2) + facilidadeScore[recomendacao.facilidade];

          return (
            <div
              key={useGlobalStore ? recomendacao.id : index}
              className={`${styles.bg} ${styles.border} border rounded-lg p-4 ${
                useGlobalStore && recomendacao.implemented ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${styles.icon} flex-shrink-0`}>
                  {icon}
                </div>
                <div className="flex items-center gap-1">
                  {useGlobalStore && recomendacao.implemented && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Implementada
                    </Badge>
                  )}
                  <span className={`${styles.badge} px-2 py-1 text-xs font-medium rounded-full`}>
                    P{priority}
                  </span>
                </div>
              </div>

              <h5 className="font-semibold text-gray-900 mb-2">{recomendacao.titulo}</h5>

              <p className="text-gray-700 text-sm mb-3">{recomendacao.descricao}</p>

              {recomendacao.categoria && (
                <div className="mb-3">
                  <span className="bg-green-100 text-green-800 px-2 py-1 text-xs font-medium rounded-full">
                    {recomendacao.categoria}
                  </span>
                </div>
              )}

              {recomendacao.estimativaResultado && (
                <div className="bg-green-50 rounded p-2 text-xs text-green-700 mb-3 border border-green-200">
                  <div className="font-medium text-green-800">🎯 Resultado esperado:</div>
                  {recomendacao.estimativaResultado}
                </div>
              )}

              {recomendacao.proximosPassos && recomendacao.proximosPassos.length > 0 && (
                <div className="bg-blue-50 rounded p-2 text-xs text-blue-700 border border-blue-200 mb-3">
                  <div className="font-medium text-blue-800 mb-1">📝 Próximos passos:</div>
                  <ul className="space-y-1">
                    {recomendacao.proximosPassos.map((passo, passoIndex) => (
                      <li key={passoIndex} className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>{passo}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-between items-center mt-3 text-xs">
                <div className="flex gap-2">
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {recomendacao.impacto} impacto
                  </span>
                  <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    {recomendacao.facilidade}
                  </span>
                </div>
                {(onActionClick || showActions) && !recomendacao.implemented && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 px-2 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                    onClick={() => {
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
                {showActions && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRecomendacao(recomendacao.id)}
                    className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
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
  );
}