'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, UserCheck, UserPlus, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface TopCliente {
  customer_id: string;
  total_pedidos: number;
  total_gasto: number;
  primeiro_pedido: string;
  ultimo_pedido: string;
}

interface CustomerMetrics {
  periodo: { data_de: string; data_ate: string };
  total_clientes: number;
  ltv_medio: number;
  taxa_recompra_percentual: number;
  clientes_com_recompra: number;
  segmentacao_periodo: {
    novos_clientes: number;
    clientes_recorrentes: number;
    total_clientes_periodo: number;
  };
  top_clientes: TopCliente[];
}

interface CustomerMetricsResultProps {
  success: boolean;
  data: CustomerMetrics | null;
  error?: string;
  message?: string;
}

export default function CustomerMetricsResult({
  success,
  data,
  error,
  message
}: CustomerMetricsResultProps) {
  const [showTopClientes, setShowTopClientes] = useState(false);

  if (!success || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao Calcular Métricas de Clientes</CardTitle>
          </div>
          <CardDescription className="text-red-600">
            {error || message || 'Erro desconhecido'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const formatCurrency = (value: number) =>
    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const percentualNovos = data.segmentacao_periodo.total_clientes_periodo > 0
    ? (data.segmentacao_periodo.novos_clientes / data.segmentacao_periodo.total_clientes_periodo) * 100
    : 0;

  const percentualRecorrentes = data.segmentacao_periodo.total_clientes_periodo > 0
    ? (data.segmentacao_periodo.clientes_recorrentes / data.segmentacao_periodo.total_clientes_periodo) * 100
    : 0;

  return (
    <div className="space-y-4">
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-800">Métricas de Clientes</CardTitle>
            </div>
            <Badge className="bg-purple-100 text-purple-800 border-purple-300">
              {new Date(data.periodo.data_de).toLocaleDateString('pt-BR')} - {new Date(data.periodo.data_ate).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
          <CardDescription className="text-purple-700">
            {message || 'Análise de retenção e valor do cliente'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* LTV Médio - Destaque */}
          <div className="bg-white rounded-lg p-6 border-2 border-purple-300">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 mb-2">LTV Médio (Lifetime Value)</p>
              <p className="text-5xl font-bold text-purple-600">
                {formatCurrency(data.ltv_medio)}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Valor médio de cada cliente ao longo do tempo
              </p>
            </div>
          </div>

          {/* Grid de Métricas */}
          <div className="grid grid-cols-2 gap-4">
            {/* Taxa de Recompra */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <p className="text-sm font-semibold text-green-700">Taxa de Recompra</p>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {data.taxa_recompra_percentual.toFixed(1)}%
              </p>
              <p className="text-xs text-green-600 mt-1">
                {data.clientes_com_recompra} clientes recompraram
              </p>
            </div>

            {/* Total de Clientes */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-700">Total de Clientes</p>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {data.total_clientes.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Base total cadastrada
              </p>
            </div>
          </div>

          {/* Segmentação do Período */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 border border-teal-200">
            <p className="text-sm font-semibold text-teal-800 mb-3">Segmentação de Clientes no Período</p>

            {/* Barra Visual */}
            <div className="mb-4">
              <div className="flex h-8 w-full rounded-lg overflow-hidden">
                <div
                  className="bg-teal-500 flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${percentualNovos}%` }}
                >
                  {percentualNovos > 10 ? `${percentualNovos.toFixed(0)}%` : ''}
                </div>
                <div
                  className="bg-cyan-500 flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${percentualRecorrentes}%` }}
                >
                  {percentualRecorrentes > 10 ? `${percentualRecorrentes.toFixed(0)}%` : ''}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Novos Clientes */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserPlus className="h-4 w-4 text-teal-600" />
                  <p className="text-xs font-medium text-teal-700">Novos Clientes</p>
                </div>
                <p className="text-xl font-bold text-teal-600">
                  {data.segmentacao_periodo.novos_clientes}
                </p>
                <p className="text-xs text-teal-500">
                  {percentualNovos.toFixed(1)}% do total
                </p>
              </div>

              {/* Clientes Recorrentes */}
              <div className="bg-white rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <UserCheck className="h-4 w-4 text-cyan-600" />
                  <p className="text-xs font-medium text-cyan-700">Recorrentes</p>
                </div>
                <p className="text-xl font-bold text-cyan-600">
                  {data.segmentacao_periodo.clientes_recorrentes}
                </p>
                <p className="text-xs text-cyan-500">
                  {percentualRecorrentes.toFixed(1)}% do total
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-teal-200 text-center">
              <p className="text-xs text-teal-600">
                Total de clientes ativos no período: <span className="font-bold">{data.segmentacao_periodo.total_clientes_periodo}</span>
              </p>
            </div>
          </div>

          {/* Top Clientes - Seção Expansível */}
          {data.top_clientes && data.top_clientes.length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowTopClientes(!showTopClientes)}
                className="flex items-center gap-2 text-sm font-semibold text-purple-700 hover:text-purple-900 w-full"
              >
                {showTopClientes ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                Top {data.top_clientes.length} Clientes por Valor Total
              </button>

              {showTopClientes && (
                <div className="mt-4 bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {data.top_clientes.map((cliente, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-purple-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-purple-100 text-purple-800 text-xs">#{idx + 1}</Badge>
                            <p className="font-medium text-gray-900 text-sm">
                              ID: {cliente.customer_id.substring(0, 8)}...
                            </p>
                          </div>
                          <div className="mt-1 flex gap-4 text-xs text-gray-500">
                            <span>{cliente.total_pedidos} pedidos</span>
                            <span>1º pedido: {new Date(cliente.primeiro_pedido).toLocaleDateString('pt-BR')}</span>
                            <span>Último: {new Date(cliente.ultimo_pedido).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(cliente.total_gasto)}
                          </p>
                          <p className="text-xs text-purple-500">
                            {formatCurrency(cliente.total_gasto / cliente.total_pedidos)} por pedido
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
