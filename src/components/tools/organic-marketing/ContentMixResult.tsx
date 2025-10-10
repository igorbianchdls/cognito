'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, PieChart, Calendar, AlertCircle } from 'lucide-react';

interface ContentMixResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_posts?: number;
  frequencia?: {
    posts_por_dia: string;
    posts_por_semana: string;
    dias_com_postagem: number;
    dias_sem_postagem: number;
    consistencia: string;
    classificacao: string;
  };
  distribuicao_por_tipo?: Array<{
    tipo: string;
    quantidade: number;
    percentual: string;
  }>;
  recomendacoes?: string[];
}

export default function ContentMixResult({
  success,
  message,
  periodo_dias,
  total_posts,
  frequencia,
  distribuicao_por_tipo,
  recomendacoes
}: ContentMixResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Mix de Conteúdo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getFrequencyColor = (classification: string) => {
    if (classification.includes('Alta')) return 'text-green-600 bg-green-100 border-green-300';
    if (classification.includes('Boa')) return 'text-blue-600 bg-blue-100 border-blue-300';
    if (classification.includes('Moderada')) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, string> = {
      'carrossel': '🎠',
      'imagem': '🖼️',
      'video': '🎬',
      'reels': '🎥',
      'story': '📱',
      'outros': '📄'
    };
    return icons[tipo.toLowerCase()] || '📄';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-teal-200 bg-teal-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-teal-900">🎨 Análise de Mix de Conteúdo</h3>
              <p className="text-sm text-teal-700 mt-1">
                {total_posts} posts • Período: {periodo_dias} dias
              </p>
            </div>
            <PieChart className="h-8 w-8 text-teal-600" />
          </div>
        </CardContent>
      </Card>

      {/* Frequência de Postagem */}
      {frequencia && (
        <Card className={`border-2 ${getFrequencyColor(frequencia.classificacao)}`}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Frequência de Postagem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-sm text-gray-600">Posts por Dia</p>
                <p className="text-2xl font-bold mt-1">{frequencia.posts_por_dia}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Posts por Semana</p>
                <p className="text-2xl font-bold mt-1">{frequencia.posts_por_semana}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Dias com Postagem</p>
                <p className="text-2xl font-bold mt-1 text-green-600">{frequencia.dias_com_postagem}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Dias sem Postagem</p>
                <p className="text-2xl font-bold mt-1 text-red-600">{frequencia.dias_sem_postagem}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                <p className="text-sm text-gray-600">Consistência</p>
                <p className="text-xl font-bold">{frequencia.consistencia}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${getFrequencyColor(frequencia.classificacao)}`}>
                <p className="font-semibold">{frequencia.classificacao}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Tipo */}
      {distribuicao_por_tipo && distribuicao_por_tipo.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-600" />
              Distribuição por Tipo de Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribuicao_por_tipo.map((tipo, idx) => {
                const percentNum = parseFloat(tipo.percentual);
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{getTipoIcon(tipo.tipo)}</span>
                        <span className="font-semibold capitalize">{tipo.tipo}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-lg">{tipo.quantidade}</span>
                        <span className="text-sm text-gray-600 ml-2">({tipo.percentual})</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          idx === 0 ? 'bg-purple-600' :
                          idx === 1 ? 'bg-blue-600' :
                          idx === 2 ? 'bg-green-600' :
                          idx === 3 ? 'bg-yellow-600' :
                          'bg-gray-600'
                        }`}
                        style={{ width: tipo.percentual }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recomendações */}
      {recomendacoes && recomendacoes.length > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              💡 Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recomendacoes.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-600 font-bold">→</span>
                  <span className="flex-1">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
