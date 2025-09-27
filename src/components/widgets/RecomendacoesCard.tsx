'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Target, TrendingUp, Zap, Star, ArrowRight, CheckCircle, X, Check } from "lucide-react"
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
  useStore?: boolean; // Flag para usar store ou props
}

const ImpactoConfig = {
  alto: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Star,
    iconColor: 'text-green-600',
    label: 'Alto Impacto'
  },
  medio: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: TrendingUp,
    iconColor: 'text-yellow-600',
    label: 'Médio Impacto'
  },
  baixo: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Target,
    iconColor: 'text-gray-600',
    label: 'Baixo Impacto'
  }
};

const FacilidadeConfig = {
  facil: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Fácil',
    icon: Zap
  },
  medio: {
    color: 'bg-orange-100 text-orange-800',
    label: 'Médio',
    icon: Target
  },
  dificil: {
    color: 'bg-red-100 text-red-800',
    label: 'Difícil',
    icon: Star
  }
};


export default function RecomendacoesCard({
  recomendacoes: propRecomendacoes,
  title = "Recomendações",
  maxHeight = 400,
  onActionClick,
  useStore = false
}: RecomendacoesCardProps) {
  const storeRecomendacoes = useStore($recomendacoesOrdenadas)
  const totalRecomendacoes = useStore($totalRecomendacoes)
  const recomendacoesAtivas = useStore($recomendacoesAtivas)
  const recomendacoesAltaPrioridade = useStore($recomendacoesAltaPrioridade)

  const recomendacoes = useStore ? storeRecomendacoes : (propRecomendacoes || [])
  const showActions = useStore // Só mostra ações quando usa store
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
  const recomendacoesOrdenadas = useStore ? recomendacoes : [...recomendacoes].sort((a, b) => {
    const calcularPrioridade = (rec: any) => {
      const impactoScore = { alto: 3, medio: 2, baixo: 1 }
      const facilidadeScore = { facil: 3, medio: 2, dificil: 1 }
      return (impactoScore[rec.impacto] * 2) + facilidadeScore[rec.facilidade]
    }
    return calcularPrioridade(b) - calcularPrioridade(a)
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          {title}
          <div className="ml-auto flex items-center gap-2">
            {useStore && recomendacoesAltaPrioridade.length > 0 && (
              <Badge variant="default" className="text-xs">
                {recomendacoesAltaPrioridade.length} alta prioridade
              </Badge>
            )}
            {useStore && (
              <Badge variant="outline" className="text-xs">
                {recomendacoesAtivas.length} ativas
              </Badge>
            )}
            <Badge variant="secondary">
              {useStore ? totalRecomendacoes : recomendacoes.length}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-sm">
          Ordenadas por prioridade (impacto + facilidade)
        </CardDescription>

        {useStore && recomendacoes.length > 0 && (
          <div className="flex gap-2">
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
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="w-full" style={{ height: `${maxHeight}px` }}>
          <div className="space-y-3 pr-4">
            {recomendacoesOrdenadas.map((recomendacao, index) => {
              const impactoConfig = ImpactoConfig[recomendacao.impacto];
              const facilidadeConfig = FacilidadeConfig[recomendacao.facilidade];
              const ImpactoIcon = impactoConfig.icon;
              const prioridade = useStore ? getPrioridadeRecomendacao(recomendacao) : (() => {
                const impactoScore = { alto: 3, medio: 2, baixo: 1 }
                const facilidadeScore = { facil: 3, medio: 2, dificil: 1 }
                return (impactoScore[recomendacao.impacto] * 2) + facilidadeScore[recomendacao.facilidade]
              })();

              return (
                <div
                  key={useStore ? recomendacao.id : index}
                  className={`p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow ${
                    useStore && recomendacao.implemented ? 'opacity-50 border-green-300 bg-green-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${impactoConfig.color}`}>
                      <ImpactoIcon className={`h-4 w-4 ${impactoConfig.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight">
                          {recomendacao.titulo}
                        </h4>
                        <div className="flex gap-1 shrink-0">
                          {useStore && recomendacao.implemented && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Implementada
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${facilidadeConfig.color}`}>
                            {facilidadeConfig.label}
                          </Badge>
                          <Badge
                            variant={prioridade >= 7 ? "default" : "secondary"}
                            className="text-xs"
                          >
                            P{prioridade}
                          </Badge>
                        </div>
                      </div>

                      {recomendacao.categoria && (
                        <Badge variant="outline" className="text-xs mb-2 bg-purple-50 text-purple-700 border-purple-200">
                          {recomendacao.categoria}
                        </Badge>
                      )}

                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {recomendacao.descricao}
                      </p>

                      {recomendacao.estimativaResultado && (
                        <div className="bg-green-50 rounded-md p-2 border border-green-200 mb-3">
                          <p className="text-xs text-green-700">
                            <strong>Resultado esperado:</strong> {recomendacao.estimativaResultado}
                          </p>
                        </div>
                      )}

                      {recomendacao.proximosPassos && recomendacao.proximosPassos.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-gray-700 mb-1">Próximos passos:</p>
                          <ul className="space-y-1">
                            {recomendacao.proximosPassos.map((passo, passoIndex) => (
                              <li key={passoIndex} className="flex items-start gap-2 text-xs text-gray-600">
                                <CheckCircle className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
                                <span>{passo}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 mt-3">
                        <div className="flex gap-2">
                          <Badge variant="outline" className={`text-xs ${impactoConfig.color}`}>
                            {impactoConfig.label}
                          </Badge>
                        </div>

                        {(onActionClick || showActions) && !recomendacao.implemented && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
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
                            className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {useStore && recomendacoes.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Fonte:</strong> Store global • <strong>Ativas:</strong> {recomendacoesAtivas.length} • <strong>Alta prioridade:</strong> {recomendacoesAltaPrioridade.length}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}