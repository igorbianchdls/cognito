'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Flame, Heart, MessageCircle, Share2, Eye } from 'lucide-react';

interface TopContentResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_analisados?: number;
  top_posts?: Array<{
    publicacao_id: string;
    titulo: string;
    tipo_post: string;
    plataforma: string;
    publicado_em: string;
    curtidas: number;
    comentarios: number;
    compartilhamentos: number;
    visualizacoes: number;
    alcance: number;
    engagement_total: number;
    engagement_rate: string;
    virality_score: string;
    classificacao: string;
  }>;
}

export default function TopContentResult({
  success,
  message,
  periodo_dias,
  total_analisados,
  top_posts
}: TopContentResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Identificação de Top Conteúdos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    if (classification === 'Viral') return 'bg-red-100 text-red-700 border-red-300';
    if (classification === 'Excelente') return 'bg-green-100 text-green-700 border-green-300';
    if (classification === 'Muito Bom') return 'bg-blue-100 text-blue-700 border-blue-300';
    if (classification === 'Bom') return 'bg-purple-100 text-purple-700 border-purple-300';
    return 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const getMedalIcon = (idx: number) => {
    if (idx === 0) return '🥇';
    if (idx === 1) return '🥈';
    if (idx === 2) return '🥉';
    return `#${idx + 1}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-orange-900">🔥 Top Performers</h3>
              <p className="text-sm text-orange-700 mt-1">
                {top_posts?.length} melhores posts • Período: {periodo_dias} dias • {total_analisados} analisados
              </p>
            </div>
            <Flame className="h-8 w-8 text-orange-600" />
          </div>
        </CardContent>
      </Card>

      {/* Top Posts */}
      {top_posts && top_posts.length > 0 && (
        <div className="space-y-3">
          {top_posts.map((post, idx) => (
            <Card
              key={idx}
              className={`${idx < 3 ? 'border-2 border-yellow-300 shadow-lg' : ''} hover:shadow-xl transition-shadow`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  {/* Ranking */}
                  <div className="text-center min-w-[60px]">
                    <div className="text-3xl mb-1">{getMedalIcon(idx)}</div>
                    <div className="text-xs text-gray-500">Rank</div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg mb-1">{post.titulo}</h4>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="capitalize">{post.tipo_post}</span>
                          <span>•</span>
                          <span>{post.plataforma}</span>
                          <span>•</span>
                          <span>{post.publicado_em}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getClassificationColor(post.classificacao)}`}>
                          {post.classificacao}
                        </div>
                      </div>
                    </div>

                    {/* Métricas principais */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        <div>
                          <p className="text-xs text-gray-500">Curtidas</p>
                          <p className="font-semibold">{post.curtidas.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="text-xs text-gray-500">Comentários</p>
                          <p className="font-semibold">{post.comentarios.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Share2 className="h-4 w-4 text-green-500" />
                        <div>
                          <p className="text-xs text-gray-500">Compartilh.</p>
                          <p className="font-semibold">{post.compartilhamentos.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="text-xs text-gray-500">Alcance</p>
                          <p className="font-semibold">{post.alcance.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="flex items-center gap-4 pt-3 border-t">
                      <div className="flex-1 text-center p-2 bg-purple-50 rounded">
                        <p className="text-xs text-gray-600">Engagement Rate</p>
                        <p className="text-lg font-bold text-purple-700">{post.engagement_rate}</p>
                      </div>
                      <div className="flex-1 text-center p-2 bg-orange-50 rounded">
                        <p className="text-xs text-gray-600">Virality Score</p>
                        <p className="text-lg font-bold text-orange-700">{post.virality_score}</p>
                      </div>
                      <div className="flex-1 text-center p-2 bg-blue-50 rounded">
                        <p className="text-xs text-gray-600">Engagement Total</p>
                        <p className="text-lg font-bold text-blue-700">{post.engagement_total.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info adicional */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-sm text-blue-900">
            💡 <span className="font-semibold">Dica:</span> Analise os padrões dos top performers (tipo de conteúdo, horários, formato) para replicar o sucesso em futuras publicações.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
