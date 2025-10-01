'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';

interface FluxoCaixaResultProps {
  success: boolean;
  periodo_dias?: number;
  saldo_inicial?: number;
  entradas_previstas?: number;
  saidas_previstas?: number;
  saldo_projetado?: number;
  status_fluxo?: string;
  entradas_vencidas?: number;
  saidas_vencidas?: number;
  total_contas_receber?: number;
  total_contas_pagar?: number;
  error?: string;
  message?: string;
}

export default function FluxoCaixaResult({
  success,
  periodo_dias,
  saldo_inicial,
  entradas_previstas,
  saidas_previstas,
  saldo_projetado,
  status_fluxo,
  entradas_vencidas,
  saidas_vencidas,
  total_contas_receber,
  total_contas_pagar,
  error,
  message
}: FluxoCaixaResultProps) {

  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao Calcular Fluxo de Caixa</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            {error || message || 'Erro desconhecido'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isPositivo = status_fluxo === 'positivo';
  const cardColor = isPositivo ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50';
  const titleColor = isPositivo ? 'text-green-700' : 'text-red-700';
  const descColor = isPositivo ? 'text-green-600' : 'text-red-600';
  const badgeColor = isPositivo ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300';

  return (
    <div className="space-y-4">
      {/* Card Principal */}
      <Card className={cardColor}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={`h-5 w-5 ${isPositivo ? 'text-green-500' : 'text-red-500'}`} />
              <CardTitle className={titleColor}>
                Projeção de Fluxo de Caixa - {periodo_dias} dias
              </CardTitle>
            </div>
            <Badge className={badgeColor}>
              {status_fluxo === 'positivo' ? '✓ Positivo' : '⚠ Deficit'}
            </Badge>
          </div>
          <CardDescription className={descColor}>
            {message || `Análise do fluxo de caixa para os próximos ${periodo_dias} dias`}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Saldo Projetado - Destaque */}
          <div className="bg-white rounded-lg p-6 border-2 border-gray-200">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-2">Saldo Projetado ({periodo_dias} dias)</p>
              <p className={`text-4xl font-bold ${isPositivo ? 'text-green-600' : 'text-red-600'}`}>
                {saldo_projetado !== undefined
                  ? `R$ ${saldo_projetado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                  : '-'}
              </p>
              {saldo_inicial !== undefined && (
                <p className="text-xs text-gray-500 mt-2">
                  Saldo Inicial: R$ {saldo_inicial.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          {/* Entradas e Saídas */}
          <div className="grid grid-cols-2 gap-4">
            {/* Entradas */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold text-green-700">Entradas Previstas</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {entradas_previstas !== undefined
                  ? `R$ ${entradas_previstas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : '-'}
              </p>
              {total_contas_receber !== undefined && total_contas_receber > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {total_contas_receber} conta{total_contas_receber !== 1 ? 's' : ''} a receber
                </p>
              )}
            </div>

            {/* Saídas */}
            <div className="bg-red-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-red-600" />
                <p className="text-sm font-semibold text-red-700">Saídas Previstas</p>
              </div>
              <p className="text-2xl font-bold text-red-600">
                {saidas_previstas !== undefined
                  ? `R$ ${saidas_previstas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : '-'}
              </p>
              {total_contas_pagar !== undefined && total_contas_pagar > 0 && (
                <p className="text-xs text-red-600 mt-1">
                  {total_contas_pagar} conta{total_contas_pagar !== 1 ? 's' : ''} a pagar
                </p>
              )}
            </div>
          </div>

          {/* Contas Vencidas (se houver) */}
          {((entradas_vencidas && entradas_vencidas > 0) || (saidas_vencidas && saidas_vencidas > 0)) && (
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-700">Contas Vencidas</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {entradas_vencidas !== undefined && entradas_vencidas > 0 && (
                  <div>
                    <p className="text-yellow-600">Receber Vencido:</p>
                    <p className="font-semibold text-yellow-700">
                      R$ {entradas_vencidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
                {saidas_vencidas !== undefined && saidas_vencidas > 0 && (
                  <div>
                    <p className="text-yellow-600">Pagar Vencido:</p>
                    <p className="font-semibold text-yellow-700">
                      R$ {saidas_vencidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Resumo */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 mb-2">RESUMO DA PROJEÇÃO</p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Período de Análise:</span>
                <span className="font-medium text-gray-900">{periodo_dias} dias</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status do Fluxo:</span>
                <span className={`font-medium ${isPositivo ? 'text-green-600' : 'text-red-600'}`}>
                  {status_fluxo === 'positivo' ? 'Positivo' : 'Deficit'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Resultado Líquido:</span>
                <span className={`font-medium ${(entradas_previstas || 0) - (saidas_previstas || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {((entradas_previstas || 0) - (saidas_previstas || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
