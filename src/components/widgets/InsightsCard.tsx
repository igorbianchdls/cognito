'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Lightbulb, TrendingUp, AlertCircle, Eye, X } from "lucide-react"
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
  maxHeight?: number;
  useGlobalStore?: boolean; // Flag para usar store ou props
}

const ImportanceConfig = {
  alta: {
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: TrendingUp,
    iconColor: 'text-green-600',
    label: 'Alto Impacto'
  },
  media: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Lightbulb,
    iconColor: 'text-yellow-600',
    label: 'Médio Impacto'
  },
  baixa: {
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: AlertCircle,
    iconColor: 'text-gray-600',
    label: 'Baixo Impacto'
  }
};

export default function InsightsCard({
  insights: propInsights,
  resumo,
  contexto,
  title = "Insights",
  maxHeight = 400,
  useGlobalStore = false
}: InsightsCardProps) {
  const storeInsights = useStore($insightsOrdenados)
  const totalInsights = useStore($totalInsights)
  const insightsNaoLidos = useStore($insightsNaoLidos)

  const insights = useGlobalStore ? storeInsights : (propInsights || [])
  const showActions = useGlobalStore // Só mostra ações quando usa store
  if (!insights || insights.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            {title}
          </CardTitle>
          <CardDescription>Nenhum insight disponível</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-blue-600" />
          {title}
          <div className="ml-auto flex items-center gap-2">
            {useGlobalStore && insightsNaoLidos.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {insightsNaoLidos.length} novos
              </Badge>
            )}
            <Badge variant="secondary">
              {useGlobalStore ? totalInsights : insights.length}
            </Badge>
          </div>
        </CardTitle>
        {resumo && (
          <CardDescription className="text-sm">
            {resumo}
          </CardDescription>
        )}

        {useGlobalStore && insights.length > 0 && (
          <div className="flex gap-2">
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
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="w-full" style={{ height: `${maxHeight}px` }}>
          <div className="space-y-3 pr-4">
            {insights.map((insight, index) => {
              const config = ImportanceConfig[insight.importancia];
              const IconComponent = config.icon;

              return (
                <div
                  key={useGlobalStore ? insight.id : index}
                  className={`p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow ${
                    useGlobalStore && !insight.read ? 'border-blue-300 bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${config.color}`}>
                      <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight">
                          {insight.titulo}
                        </h4>
                        <div className="flex items-center gap-1">
                          {useGlobalStore && !insight.read && (
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              Novo
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs ${config.color} shrink-0`}>
                            {config.label}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-2">
                        {insight.descricao}
                      </p>

                      {insight.dados && (
                        <div className="bg-gray-50 rounded-md p-2 border border-gray-100">
                          <p className="text-xs text-gray-700 font-mono">
                            {insight.dados}
                          </p>
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
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {contexto && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Contexto:</strong> {contexto}
            </p>
          </div>
        )}

        {useGlobalStore && insights.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Fonte:</strong> Store global • <strong>Não lidos:</strong> {insightsNaoLidos.length}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}