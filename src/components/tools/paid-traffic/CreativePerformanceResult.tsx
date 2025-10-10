'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Palette, CheckCircle, XCircle, Clock, FileEdit } from 'lucide-react';

interface CreativePerformanceResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_criativos?: number;
  status?: {
    aprovados: number;
    rascunhos: number;
    em_revisao: number;
    rejeitados: number;
    taxa_aprovacao: string;
  };
}

export default function CreativePerformanceResult({
  success,
  message,
  periodo_dias,
  total_criativos,
  status
}: CreativePerformanceResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Criativos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const taxaAprovacao = status ? parseFloat(status.taxa_aprovacao) : 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-pink-200 bg-pink-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-pink-900">🎨 Performance de Criativos</h3>
              <p className="text-sm text-pink-700 mt-1">
                {total_criativos} criativos • Período: {periodo_dias} dias
              </p>
            </div>
            <Palette className="h-8 w-8 text-pink-600" />
          </div>
        </CardContent>
      </Card>

      {/* Taxa de Aprovação */}
      {status && (
        <>
          <Card className={`border-2 ${taxaAprovacao >= 70 ? 'border-green-300 bg-green-50' : taxaAprovacao >= 50 ? 'border-yellow-300 bg-yellow-50' : 'border-red-300 bg-red-50'}`}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600">Taxa de Aprovação</p>
                <p className={`text-5xl font-bold mt-2 ${taxaAprovacao >= 70 ? 'text-green-700' : taxaAprovacao >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                  {status.taxa_aprovacao}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {status.aprovados} de {total_criativos} aprovados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status dos Criativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-green-50 rounded-lg border-2 border-green-300">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-green-900">Aprovados</p>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{status.aprovados}</p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <FileEdit className="h-5 w-5 text-gray-600" />
                    <p className="font-semibold text-gray-900">Rascunhos</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-700">{status.rascunhos}</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <p className="font-semibold text-blue-900">Em Revisão</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{status.em_revisao}</p>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border-2 border-red-300">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <p className="font-semibold text-red-900">Rejeitados</p>
                  </div>
                  <p className="text-3xl font-bold text-red-700">{status.rejeitados}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200">
            <CardContent className="pt-6">
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-pink-900">💡 Insights:</p>
                {taxaAprovacao >= 70 && (
                  <p className="text-gray-700">✅ Excelente taxa de aprovação! Seus criativos estão bem alinhados.</p>
                )}
                {taxaAprovacao < 50 && (
                  <p className="text-gray-700">⚠️ Taxa de aprovação baixa. Revise compliance e diretrizes das plataformas.</p>
                )}
                {status.rejeitados > total_criativos! * 0.2 && (
                  <p className="text-gray-700">⚠️ Mais de 20% de criativos rejeitados. Considere ajustar copy e imagens.</p>
                )}
                {status.em_revisao > status.aprovados && (
                  <p className="text-gray-700">⏳ Muitos criativos em revisão. Acompanhe para aprovar rapidamente.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
