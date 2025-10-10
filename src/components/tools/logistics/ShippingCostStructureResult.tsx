'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, DollarSign, Package, TrendingUp } from 'lucide-react';

interface FaixaPeso {
  faixa: string;
  envios: number;
  custo_total: string;
  custo_medio: string;
  percentual_volume: string;
}

interface ShippingCostStructureResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  custo_total?: string;
  custo_medio_por_envio?: string;
  cost_per_kg?: string;
  peso_total_kg?: string;
  shipping_cost_percentage?: {
    percentual: string;
    classificacao: string;
  };
  distribuicao_por_faixa_peso?: FaixaPeso[];
  oportunidades_economia?: string[];
}

export default function ShippingCostStructureResult({
  success,
  message,
  periodo_dias,
  custo_total,
  custo_medio_por_envio,
  cost_per_kg,
  peso_total_kg,
  shipping_cost_percentage,
  distribuicao_por_faixa_peso,
  oportunidades_economia
}: ShippingCostStructureResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise de Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const getClassificationColor = (classification: string) => {
    if (classification.includes('Ótimo')) return 'text-green-600 bg-green-100 border-green-300';
    if (classification.includes('Bom')) return 'text-blue-600 bg-blue-100 border-blue-300';
    return 'text-red-600 bg-red-100 border-red-300';
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-green-900">💰 Estrutura de Custos de Frete</h3>
              <p className="text-sm text-green-700 mt-1">
                Período: {periodo_dias} dias • Análise detalhada por faixa de peso
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Custo Total</p>
            <p className="text-2xl font-bold text-green-700">R$ {custo_total}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Custo Médio/Envio</p>
            <p className="text-2xl font-bold text-blue-700">R$ {custo_medio_por_envio}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Cost per Kg</p>
            <p className="text-2xl font-bold text-purple-700">R$ {cost_per_kg}</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="pt-6">
            <p className="text-sm text-gray-600">Peso Total</p>
            <p className="text-2xl font-bold text-orange-700">{peso_total_kg} kg</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Cost Percentage */}
      {shipping_cost_percentage && (
        <Card className={`border-2 ${getClassificationColor(shipping_cost_percentage.classificacao)}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Custo de Frete % do Pedido</p>
                <p className="text-3xl font-bold mt-2">{shipping_cost_percentage.percentual}</p>
              </div>
              <div className={`px-4 py-2 rounded-lg ${getClassificationColor(shipping_cost_percentage.classificacao)}`}>
                <p className="font-semibold">{shipping_cost_percentage.classificacao}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribuição por Faixa de Peso */}
      {distribuicao_por_faixa_peso && distribuicao_por_faixa_peso.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-5 w-5" />
              Distribuição por Faixa de Peso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {distribuicao_por_faixa_peso.map((faixa, idx) => (
                <div key={idx} className="p-4 rounded-lg border-2 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-semibold text-lg">{faixa.faixa}</p>
                      <p className="text-xs text-gray-500">{faixa.envios} envios ({faixa.percentual_volume})</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Custo Médio</p>
                      <p className="text-xl font-bold text-green-700">R$ {faixa.custo_medio}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Custo Total da Faixa</p>
                      <p className="font-semibold">R$ {faixa.custo_total}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">% do Volume</p>
                      <p className="font-semibold">{faixa.percentual_volume}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: faixa.percentual_volume }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Oportunidades de Economia */}
      {oportunidades_economia && oportunidades_economia.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-yellow-900">
              <TrendingUp className="h-5 w-5" />
              Oportunidades de Economia
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {oportunidades_economia.map((oportunidade, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm text-yellow-900">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span>{oportunidade}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-gray-700 mb-3">💡 Benchmarks do Mercado:</h4>
          <ul className="space-y-1 text-sm text-gray-600">
            <li><strong>Shipping Cost % Ideal:</strong> &lt; 10% do valor do pedido</li>
            <li><strong>Aceitável:</strong> 10-15% do valor do pedido</li>
            <li><strong>Alto (Requer Ação):</strong> &gt; 15% do valor do pedido</li>
            <li><strong>Cost per Kg Competitivo:</strong> R$ 3-5/kg (varia por região)</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
