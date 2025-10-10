'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle } from 'lucide-react';

interface Produto {
  product_id: string;
  valor: number;
  quantidade: number;
  margem: number;
  percentual_acumulado: string;
  classe_abc: 'A' | 'B' | 'C';
}

interface ClasseInfo {
  produtos: number;
  percentual_produtos: string;
  contribuicao_valor: string;
  recomendacao: string;
}

interface ABCAnalysisResultProps {
  success: boolean;
  message: string;
  criteria?: string;
  period_days?: number;
  total_produtos?: number;
  distribuicao?: {
    classe_a: ClasseInfo;
    classe_b: ClasseInfo;
    classe_c: ClasseInfo;
  };
  produtos_classificados?: Produto[];
}

export default function ABCAnalysisResult({ success, message, criteria, period_days, total_produtos, distribuicao, produtos_classificados }: ABCAnalysisResultProps) {
  if (!success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Erro na Análise ABC
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{message}</p>
        </CardContent>
      </Card>
    );
  }

  const criteriaLabels: Record<string, string> = {
    value: 'Valor',
    quantity: 'Quantidade',
    margin: 'Margem'
  };

  const getClasseColor = (classe: string) => {
    if (classe === 'A') return 'bg-green-100 text-green-800 border-green-300';
    if (classe === 'B') return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  return (
    <div className="space-y-4">
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg text-green-900">📊 Análise ABC (Curva de Pareto)</h3>
              <p className="text-sm text-green-700 mt-1">
                Critério: {criteriaLabels[criteria || 'value']} • Período: {period_days} dias • {total_produtos} produtos
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Distribuição ABC */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-green-300 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Classe A</span>
              <span className="text-2xl font-bold">{distribuicao?.classe_a.produtos}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">% dos Produtos</p>
                <p className="font-semibold">{distribuicao?.classe_a.percentual_produtos}</p>
              </div>
              <div>
                <p className="text-gray-600">Contribuição Valor</p>
                <p className="font-semibold text-green-700">{distribuicao?.classe_a.contribuicao_valor}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600">{distribuicao?.classe_a.recomendacao}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Classe B</span>
              <span className="text-2xl font-bold">{distribuicao?.classe_b.produtos}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">% dos Produtos</p>
                <p className="font-semibold">{distribuicao?.classe_b.percentual_produtos}</p>
              </div>
              <div>
                <p className="text-gray-600">Contribuição Valor</p>
                <p className="font-semibold text-blue-700">{distribuicao?.classe_b.contribuicao_valor}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600">{distribuicao?.classe_b.recomendacao}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-300 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>Classe C</span>
              <span className="text-2xl font-bold">{distribuicao?.classe_c.produtos}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">% dos Produtos</p>
                <p className="font-semibold">{distribuicao?.classe_c.percentual_produtos}</p>
              </div>
              <div>
                <p className="text-gray-600">Contribuição Valor</p>
                <p className="font-semibold text-gray-700">{distribuicao?.classe_c.contribuicao_valor}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-xs text-gray-600">{distribuicao?.classe_c.recomendacao}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Produtos (Top 20) */}
      {produtos_classificados && produtos_classificados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Produtos Classificados (Top 20)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {produtos_classificados.slice(0, 20).map((produto, idx) => (
                <div key={idx} className={`p-3 rounded-lg border-2 ${getClasseColor(produto.classe_abc)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold">{produto.classe_abc}</span>
                      <div>
                        <p className="font-semibold text-sm">{produto.product_id}</p>
                        <p className="text-xs text-gray-600">Acumulado: {produto.percentual_acumulado}%</p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold">R$ {produto.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-gray-600">{produto.quantidade.toLocaleString()} un</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold text-blue-900 mb-3">💡 Princípio de Pareto (80/20):</h4>
          <ul className="space-y-2 text-sm text-blue-800">
            <li><strong>Classe A:</strong> 80% do valor com apenas 20% dos produtos → Controle rigoroso!</li>
            <li><strong>Classe B:</strong> 15% do valor com 30% dos produtos → Controle moderado</li>
            <li><strong>Classe C:</strong> 5% do valor com 50% dos produtos → Controle simplificado</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
