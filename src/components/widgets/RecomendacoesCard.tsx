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
import { Target, TrendingUp, Zap, Star, ArrowRight, CheckCircle } from "lucide-react"

interface Recomendacao {
  titulo: string;
  descricao: string;
  impacto: 'alto' | 'medio' | 'baixo';
  facilidade: 'facil' | 'medio' | 'dificil';
  categoria?: string;
  proximosPassos?: string[];
  estimativaResultado?: string;
}

interface RecomendacoesCardProps {
  recomendacoes: Recomendacao[];
  title?: string;
  maxHeight?: number;
  onActionClick?: (recomendacao: Recomendacao, index: number) => void;
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

// Função para calcular prioridade (impacto vs facilidade)
const calcularPrioridade = (recomendacao: Recomendacao): number => {
  const impactoScore = { alto: 3, medio: 2, baixo: 1 };
  const facilidadeScore = { facil: 3, medio: 2, dificil: 1 };

  return (impactoScore[recomendacao.impacto] * 2) + facilidadeScore[recomendacao.facilidade];
};

export default function RecomendacoesCard({
  recomendacoes = [],
  title = "Recomendações",
  maxHeight = 400,
  onActionClick
}: RecomendacoesCardProps) {
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

  // Ordenar recomendações por prioridade (impacto + facilidade)
  const recomendacoesOrdenadas = [...recomendacoes].sort((a, b) =>
    calcularPrioridade(b) - calcularPrioridade(a)
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          {title}
          <Badge variant="secondary" className="ml-auto">
            {recomendacoes.length}
          </Badge>
        </CardTitle>
        <CardDescription className="text-sm">
          Ordenadas por prioridade (impacto + facilidade)
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="w-full" style={{ height: `${maxHeight}px` }}>
          <div className="space-y-3 pr-4">
            {recomendacoesOrdenadas.map((recomendacao, index) => {
              const impactoConfig = ImpactoConfig[recomendacao.impacto];
              const facilidadeConfig = FacilidadeConfig[recomendacao.facilidade];
              const ImpactoIcon = impactoConfig.icon;
              const prioridade = calcularPrioridade(recomendacao);

              return (
                <div
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
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

                        {onActionClick && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-3 text-xs bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                            onClick={() => onActionClick(recomendacao, index)}
                          >
                            Implementar
                            <ArrowRight className="h-3 w-3 ml-1" />
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
      </CardContent>
    </Card>
  );
}