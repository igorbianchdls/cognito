'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Users, UserPlus, UserCheck } from 'lucide-react';

interface UserBehaviorResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  comportamento?: {
    total_visitantes: number;
    novos_visitantes: number;
    visitantes_recorrentes: number;
    percentual_novos: string;
    percentual_recorrentes: string;
    frequencia_media_visitas: string;
    engagement_rate: string;
    classificacao: string;
  };
}

export default function UserBehaviorResult({
  success,
  message,
  periodo_dias,
  comportamento
}: UserBehaviorResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Comportamento
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
      <Card className="border-teal-200 bg-teal-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-teal-900">👥 Comportamento de Usuários</h3>
              <p className="text-sm text-teal-700 mt-1">
                Período: {periodo_dias} dias
              </p>
            </div>
            <Users className="h-8 w-8 text-teal-600" />
          </div>
        </CardContent>
      </Card>

      {comportamento && (
        <>
          {/* Classificação de Engagement */}
          <Card className={`border-2 ${getClassificationColor(comportamento.classificacao)}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Nível de Engagement</p>
                <p className="text-4xl font-bold mt-2">{comportamento.classificacao}</p>
                <p className="text-lg font-semibold mt-2">{comportamento.engagement_rate}</p>
                <p className="text-xs text-gray-500">engagement rate</p>
              </div>
            </CardContent>
          </Card>

          {/* Visitantes Overview */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Total de Visitantes</p>
                <p className="text-4xl font-bold text-gray-800 mt-1">
                  {comportamento.total_visitantes.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <div className="flex items-center gap-3 mb-2">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                    <p className="font-semibold text-blue-900">Novos Visitantes</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">
                    {comportamento.novos_visitantes.toLocaleString()}
                  </p>
                  <p className="text-sm text-blue-600 mt-1">{comportamento.percentual_novos}</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                  <div className="flex items-center gap-3 mb-2">
                    <UserCheck className="h-6 w-6 text-green-600" />
                    <p className="font-semibold text-green-900">Visitantes Recorrentes</p>
                  </div>
                  <p className="text-3xl font-bold text-green-700">
                    {comportamento.visitantes_recorrentes.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 mt-1">{comportamento.percentual_recorrentes}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Frequência */}
          <Card className="bg-gray-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Frequência Média de Visitas</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">
                  {comportamento.frequencia_media_visitas}
                </p>
                <p className="text-xs text-gray-500 mt-1">visitas por visitante</p>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-blue-900">💡 Insights:</p>
                {parseFloat(comportamento.percentual_recorrentes) > 40 && (
                  <p className="text-gray-700">✅ Alta taxa de retorno indica conteúdo engajador e relevante.</p>
                )}
                {parseFloat(comportamento.percentual_recorrentes) < 20 && (
                  <p className="text-gray-700">⚠️ Baixa taxa de retorno. Considere estratégias de retenção.</p>
                )}
                {parseFloat(comportamento.engagement_rate) > 70 && (
                  <p className="text-gray-700">✅ Excelente engagement! Usuários estão interagindo ativamente.</p>
                )}
                {parseFloat(comportamento.engagement_rate) < 30 && (
                  <p className="text-gray-700">⚠️ Baixo engagement. Revise UX e relevância do conteúdo.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
