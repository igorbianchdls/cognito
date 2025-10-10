'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, TrendingUp, Heart, MessageCircle, Share2, Eye } from 'lucide-react';

interface ContentPerformanceResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  metricas_gerais?: {
    total_posts: number;
    total_curtidas: number;
    total_comentarios: number;
    total_compartilhamentos: number;
    total_visualizacoes: number;
    total_alcance: number;
    engagement_total: number;
    engagement_rate: string;
    alcance_medio_por_post: string;
    classificacao: string;
  };
  performance_por_tipo?: Array<{
    tipo: string;
    total_posts: number;
    engagement_total: number;
    alcance_total: number;
    engagement_medio_por_post: string;
    engagement_rate: string;
  }>;
}

export default function ContentPerformanceResult({
  success,
  message,
  periodo_dias,
  plataforma,
  metricas_gerais,
  performance_por_tipo
}: ContentPerformanceResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    if (classification.includes('Excelente')) return 'text-green-600 bg-green-100 border-green-300';
    if (classification.includes('Bom')) return 'text-blue-600 bg-blue-100 border-blue-300';
    if (classification.includes('Regular')) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-purple-900">📊 Análise de Performance de Conteúdo</h3>
              <p className="text-sm text-purple-700 mt-1">
                {plataforma !== 'TODAS' ? `Plataforma: ${plataforma}` : 'Todas as plataformas'} •
                Período: {periodo_dias} dias
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      {/* Métricas Gerais */}
      {metricas_gerais && (
        <>
          <Card className={`border-2 ${getClassificationColor(metricas_gerais.classificacao)}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Engagement Rate Geral</p>
                <p className="text-4xl font-bold mt-2">{metricas_gerais.engagement_rate}</p>
                <p className={`text-sm font-medium mt-2 inline-block px-3 py-1 rounded-full ${getClassificationColor(metricas_gerais.classificacao)}`}>
                  {metricas_gerais.classificacao}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Curtidas</p>
                  <p className="text-2xl font-bold mt-1">{metricas_gerais.total_curtidas.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <MessageCircle className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Comentários</p>
                  <p className="text-2xl font-bold mt-1">{metricas_gerais.total_comentarios.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Share2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Compartilhamentos</p>
                  <p className="text-2xl font-bold mt-1">{metricas_gerais.total_compartilhamentos.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="text-center">
                  <Eye className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Alcance</p>
                  <p className="text-2xl font-bold mt-1">{metricas_gerais.total_alcance.toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Total de Posts</p>
                  <p className="text-xl font-bold text-gray-800">{metricas_gerais.total_posts}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Engagement Total</p>
                  <p className="text-xl font-bold text-gray-800">{metricas_gerais.engagement_total.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alcance Médio/Post</p>
                  <p className="text-xl font-bold text-gray-800">{parseInt(metricas_gerais.alcance_medio_por_post).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Performance por Tipo */}
      {performance_por_tipo && performance_por_tipo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Performance por Tipo de Conteúdo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performance_por_tipo.map((tipo, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border-2 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg capitalize">{tipo.tipo}</p>
                      <p className="text-sm text-gray-600">{tipo.total_posts} posts</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-700">{tipo.engagement_rate}</p>
                      <p className="text-xs text-gray-500">engagement rate</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Engagement Total</p>
                      <p className="font-semibold">{tipo.engagement_total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Alcance Total</p>
                      <p className="font-semibold">{tipo.alcance_total.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Eng. Médio/Post</p>
                      <p className="font-semibold">{parseFloat(tipo.engagement_medio_por_post).toFixed(0)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
