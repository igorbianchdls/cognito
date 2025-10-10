'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Ticket, TrendingUp, DollarSign, Percent, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface CupomMetrica {
  coupon_id: string;
  coupon_code?: string;
  coupon_type?: string;
  coupon_value?: number;
  vezes_usado: number;
  receita_gerada: number;
  desconto_concedido: number;
  aov: number;
}

interface CouponEffectiveness {
  periodo: { data_de: string; data_ate: string };
  resumo: {
    total_pedidos: number;
    pedidos_com_cupom: number;
    pedidos_sem_cupom: number;
    taxa_uso_cupons_percentual: number;
    receita_com_cupom: number;
    receita_sem_cupom: number;
    desconto_total_concedido: number;
    aov_com_cupom: number;
    aov_sem_cupom: number;
    impacto_aov_percentual: number;
    roi_medio_percentual: number;
  };
  top_cupons_por_uso: CupomMetrica[];
  top_cupons_por_receita: CupomMetrica[];
}

interface CouponEffectivenessResultProps {
  success: boolean;
  data: CouponEffectiveness | null;
  error?: string;
  message?: string;
}

export default function CouponEffectivenessResult({
  success,
  data,
  error,
  message
}: CouponEffectivenessResultProps) {
  const [showTopPorUso, setShowTopPorUso] = useState(false);
  const [showTopPorReceita, setShowTopPorReceita] = useState(false);

  if (!success || !data) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <CardTitle className="text-red-700">Erro ao Analisar Efetividade de Cupons</CardTitle>
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

  const impactoPositivo = data.resumo.impacto_aov_percentual >= 0;
  const roiPositivo = data.resumo.roi_medio_percentual > 0;

  return (
    <div className="space-y-4">
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Efetividade de Cupons</CardTitle>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300">
              {new Date(data.periodo.data_de).toLocaleDateString('pt-BR')} - {new Date(data.periodo.data_ate).toLocaleDateString('pt-BR')}
            </Badge>
          </div>
          <CardDescription className="text-amber-700">
            {message || 'Análise de ROI, impacto no AOV e taxa de uso'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* ROI Médio e Taxa de Uso - Destaque */}
          <div className="grid grid-cols-2 gap-4">
            <div className={`rounded-lg p-6 border-2 ${roiPositivo ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">ROI Médio</p>
                <p className={`text-4xl font-bold ${roiPositivo ? 'text-green-600' : 'text-red-600'}`}>
                  {data.resumo.roi_medio_percentual.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Retorno sobre investimento
                </p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-300">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600 mb-2">Taxa de Uso</p>
                <p className="text-4xl font-bold text-blue-600">
                  {data.resumo.taxa_uso_cupons_percentual.toFixed(1)}%
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {data.resumo.pedidos_com_cupom} de {data.resumo.total_pedidos} pedidos
                </p>
              </div>
            </div>
          </div>

          {/* Comparação de AOV - Destaque */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm font-semibold text-purple-800 mb-4">Impacto no Ticket Médio (AOV)</p>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="bg-white rounded-lg p-3 border border-purple-100">
                <p className="text-xs text-gray-600 mb-1">AOV COM Cupom</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.resumo.aov_com_cupom)}
                </p>
              </div>

              <div className="bg-white rounded-lg p-3 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">AOV SEM Cupom</p>
                <p className="text-2xl font-bold text-gray-700">
                  {formatCurrency(data.resumo.aov_sem_cupom)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2">
              <Badge className={`${impactoPositivo ? 'bg-green-100 text-green-800 border-green-300' : 'bg-red-100 text-red-800 border-red-300'}`}>
                {impactoPositivo ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                Impacto: {impactoPositivo ? '+' : ''}{data.resumo.impacto_aov_percentual.toFixed(1)}% no AOV
              </Badge>
            </div>
          </div>

          {/* Métricas de Receita */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm font-semibold text-gray-600 mb-3">DISTRIBUIÇÃO DE RECEITA</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-gray-500">Com Cupom</p>
                <p className="text-lg font-bold text-green-600">
                  {formatCurrency(data.resumo.receita_com_cupom)}
                </p>
                <p className="text-xs text-gray-500">
                  {data.resumo.pedidos_com_cupom} pedidos
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Sem Cupom</p>
                <p className="text-lg font-bold text-blue-600">
                  {formatCurrency(data.resumo.receita_sem_cupom)}
                </p>
                <p className="text-xs text-gray-500">
                  {data.resumo.pedidos_sem_cupom} pedidos
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Desconto Total</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatCurrency(data.resumo.desconto_total_concedido)}
                </p>
                <p className="text-xs text-gray-500">
                  Concedido
                </p>
              </div>
            </div>
          </div>

          {/* Top Cupons por Uso */}
          {data.top_cupons_por_uso && data.top_cupons_por_uso.length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowTopPorUso(!showTopPorUso)}
                className="flex items-center gap-2 text-sm font-semibold text-amber-700 hover:text-amber-900 w-full"
              >
                {showTopPorUso ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <Ticket className="h-4 w-4" />
                Top {data.top_cupons_por_uso.length} Cupons Mais Usados
              </button>

              {showTopPorUso && (
                <div className="mt-4 bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {data.top_cupons_por_uso.map((cupom, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-amber-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-amber-100 text-amber-800 text-xs">#{idx + 1}</Badge>
                              <p className="font-semibold text-gray-900">
                                {cupom.coupon_code || `Cupom ${cupom.coupon_id.substring(0, 8)}`}
                              </p>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-500">
                              {cupom.coupon_type && <span>Tipo: {cupom.coupon_type}</span>}
                              {cupom.coupon_value && <span>Valor: {formatCurrency(cupom.coupon_value)}</span>}
                            </div>
                            <p className="text-sm font-medium text-amber-600 mt-1">
                              Usado {cupom.vezes_usado}x
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500">Receita gerada</p>
                            <p className="text-lg font-bold text-green-600">
                              {formatCurrency(cupom.receita_gerada)}
                            </p>
                            <p className="text-xs text-gray-500">
                              AOV: {formatCurrency(cupom.aov)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Top Cupons por Receita */}
          {data.top_cupons_por_receita && data.top_cupons_por_receita.length > 0 && (
            <div className="border-t pt-4">
              <button
                onClick={() => setShowTopPorReceita(!showTopPorReceita)}
                className="flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 w-full"
              >
                {showTopPorReceita ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <DollarSign className="h-4 w-4" />
                Top {data.top_cupons_por_receita.length} Cupons por Receita Gerada
              </button>

              {showTopPorReceita && (
                <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {data.top_cupons_por_receita.map((cupom, idx) => (
                      <div key={idx} className="bg-white p-3 rounded border border-green-100">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className="bg-green-100 text-green-800 text-xs">#{idx + 1}</Badge>
                              <p className="font-semibold text-gray-900">
                                {cupom.coupon_code || `Cupom ${cupom.coupon_id.substring(0, 8)}`}
                              </p>
                            </div>
                            <div className="flex gap-3 text-xs text-gray-500">
                              <span>Usado {cupom.vezes_usado}x</span>
                              <span>Desconto: {formatCurrency(cupom.desconto_concedido)}</span>
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500">Receita Total</p>
                            <p className="text-xl font-bold text-green-600">
                              {formatCurrency(cupom.receita_gerada)}
                            </p>
                            <p className="text-xs text-green-600">
                              {formatCurrency(cupom.receita_gerada / cupom.vezes_usado)} por uso
                            </p>
                          </div>
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
