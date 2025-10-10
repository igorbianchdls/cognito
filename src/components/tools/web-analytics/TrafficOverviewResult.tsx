'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Users, Eye, MousePointer } from 'lucide-react';

interface TrafficOverviewResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  metricas?: {
    total_sessoes: number;
    total_usuarios: number;
    total_pageviews: number;
    bounce_rate: string;
    avg_duration_seconds: number;
    avg_duration_minutos: string;
    pages_per_session: string;
    return_visitor_rate: string;
    classificacao: string;
  };
}

export default function TrafficOverviewResult({
  success,
  message,
  periodo_dias,
  metricas
}: TrafficOverviewResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Tráfego
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    if (classification === 'Excelente') return 'text-green-600 bg-green-100 border-green-300';
    if (classification === 'Bom') return 'text-blue-600 bg-blue-100 border-blue-300';
    if (classification === 'Regular') return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-blue-900">📊 Visão Geral de Tráfego</h3>
              <p className="text-sm text-blue-700 mt-1">
                Período: {periodo_dias} dias
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      {/* Classificação */}
      {metricas && (
        <>
          <Card className={`border-2 ${getClassificationColor(metricas.classificacao)}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Saúde do Tráfego</p>
                <p className={`text-4xl font-bold mt-2 ${getClassificationColor(metricas.classificacao)}`}>
                  {metricas.classificacao}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Métricas principais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <MousePointer className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Sessões</p>
                  <p className="text-3xl font-bold mt-1 text-purple-700">{metricas.total_sessoes.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Usuários Únicos</p>
                  <p className="text-3xl font-bold mt-1 text-blue-700">{metricas.total_usuarios.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Eye className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Pageviews</p>
                  <p className="text-3xl font-bold mt-1 text-green-700">{metricas.total_pageviews.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* KPIs secundários */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Bounce Rate</p>
                  <p className="text-xl font-bold text-gray-800">{metricas.bounce_rate}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Duração Média</p>
                  <p className="text-xl font-bold text-gray-800">{metricas.avg_duration_minutos} min</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Páginas/Sessão</p>
                  <p className="text-xl font-bold text-gray-800">{metricas.pages_per_session}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Taxa de Retorno</p>
                  <p className="text-xl font-bold text-gray-800">{metricas.return_visitor_rate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
