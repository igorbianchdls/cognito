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
import { Lightbulb, TrendingUp, AlertCircle } from "lucide-react"

interface Insight {
  titulo: string;
  descricao: string;
  dados?: string;
  importancia: 'alta' | 'media' | 'baixa';
}

interface InsightsCardProps {
  insights: Insight[];
  resumo?: string;
  contexto?: string;
  title?: string;
  maxHeight?: number;
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
  insights = [],
  resumo,
  contexto,
  title = "Insights",
  maxHeight = 400
}: InsightsCardProps) {
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
          <Badge variant="secondary" className="ml-auto">
            {insights.length}
          </Badge>
        </CardTitle>
        {resumo && (
          <CardDescription className="text-sm">
            {resumo}
          </CardDescription>
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
                  key={index}
                  className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
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
                        <Badge variant="outline" className={`text-xs ${config.color} shrink-0`}>
                          {config.label}
                        </Badge>
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
      </CardContent>
    </Card>
  );
}