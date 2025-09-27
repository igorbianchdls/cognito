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
import { AlertTriangle, AlertCircle, Info, CheckCircle, ArrowRight, X, Check } from "lucide-react"
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
  maxHeight?: number;
  onActionClick?: (alerta: Alerta, index: number) => void;
  useStore?: boolean; // Flag para usar store ou props
}

const NivelConfig = {
  critico: {
    color: 'bg-red-100 text-red-800 border-red-200',
    cardBorder: 'border-red-200 bg-red-50',
    icon: AlertTriangle,
    iconColor: 'text-red-600',
    label: 'Crítico',
    badgeVariant: 'destructive' as const
  },
  alto: {
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    cardBorder: 'border-orange-200 bg-orange-50',
    icon: AlertCircle,
    iconColor: 'text-orange-600',
    label: 'Alto',
    badgeVariant: 'destructive' as const
  },
  medio: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    cardBorder: 'border-yellow-200 bg-yellow-50',
    icon: Info,
    iconColor: 'text-yellow-600',
    label: 'Médio',
    badgeVariant: 'outline' as const
  },
  baixo: {
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    cardBorder: 'border-blue-200 bg-blue-50',
    icon: CheckCircle,
    iconColor: 'text-blue-600',
    label: 'Baixo',
    badgeVariant: 'secondary' as const
  }
};

export default function AlertasCard({
  alertas: propAlertas,
  resumo,
  contexto,
  title = "Alertas",
  maxHeight = 400,
  onActionClick,
  useStore = false
}: AlertasCardProps) {
  const storeAlertas = useStore($alertasOrdenados)
  const totalAlertas = useStore($totalAlertas)
  const alertasAtivos = useStore($alertasAtivos)
  const alertasCriticos = useStore($alertasCriticos)

  const alertas = useStore ? storeAlertas : (propAlertas || [])
  const showActions = useStore // Só mostra ações quando usa store
  if (!alertas || alertas.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {title}
          </CardTitle>
          <CardDescription>Nenhum alerta ativo</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Usar alertas já ordenados da store ou ordenar props
  const alertasOrdenados = useStore ? alertas : [...alertas].sort((a, b) => {
    const ordem = { critico: 0, alto: 1, medio: 2, baixo: 3 };
    return ordem[a.nivel] - ordem[b.nivel];
  });

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-600" />
          {title}
          <div className="ml-auto flex items-center gap-2">
            {useStore && alertasCriticos.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {alertasCriticos.length} críticos
              </Badge>
            )}
            {useStore && (
              <Badge variant="outline" className="text-xs">
                {alertasAtivos.length} ativos
              </Badge>
            )}
            <Badge variant="secondary">
              {useStore ? totalAlertas : alertas.length}
            </Badge>
          </div>
        </CardTitle>
        {resumo && (
          <CardDescription className="text-sm">
            {resumo}
          </CardDescription>
        )}

        {useStore && alertas.length > 0 && (
          <div className="flex gap-2">
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
      </CardHeader>

      <CardContent className="pt-0">
        <ScrollArea className="w-full" style={{ height: `${maxHeight}px` }}>
          <div className="space-y-3 pr-4">
            {alertasOrdenados.map((alerta, index) => {
              const config = NivelConfig[alerta.nivel];
              const IconComponent = config.icon;

              return (
                <div
                  key={useStore ? alerta.id : index}
                  className={`p-4 border rounded-lg shadow-sm hover:shadow-md transition-shadow ${config.cardBorder} ${
                    useStore && alerta.resolved ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-full ${config.color}`}>
                      <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className="font-medium text-gray-900 text-sm leading-tight">
                          {alerta.titulo}
                        </h4>
                        <div className="flex items-center gap-1">
                          {useStore && alerta.resolved && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Resolvido
                            </Badge>
                          )}
                          <Badge variant={config.badgeVariant} className="text-xs shrink-0">
                            {config.label}
                          </Badge>
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm leading-relaxed mb-3">
                        {alerta.descricao}
                      </p>

                      {alerta.dados && (
                        <div className="bg-white rounded-md p-2 border border-gray-200 mb-3">
                          <p className="text-xs text-gray-700 font-mono">
                            {alerta.dados}
                          </p>
                        </div>
                      )}

                      {alerta.acao && (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-600">
                            <strong>Ação:</strong> {alerta.acao}
                          </span>
                          {(onActionClick || showActions) && !alerta.resolved && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => {
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
                        <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-gray-100">
                          <div className="flex gap-2">
                            {!alerta.resolved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => markAsResolved(alerta.id)}
                                className="h-6 px-2 text-xs"
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Resolver
                              </Button>
                            )}
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAlerta(alerta.id)}
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

        {useStore && alertas.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              <strong>Fonte:</strong> Store global • <strong>Ativos:</strong> {alertasAtivos.length} • <strong>Críticos:</strong> {alertasCriticos.length}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}