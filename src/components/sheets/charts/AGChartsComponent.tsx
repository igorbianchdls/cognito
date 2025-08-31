'use client';

import { useState } from 'react';

interface RowData {
  id: number;
  produto: string;
  categoria: string;
  preco: number;
  estoque: number;
  vendas: number;
  ativo: boolean;
  dataLancamento: string;
}

interface AGChartsComponentProps {
  data: RowData[];
  selectedRows?: RowData[];
}

export default function AGChartsComponent({ data, selectedRows }: AGChartsComponentProps) {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  
  const dataToUse = selectedRows && selectedRows.length > 0 ? selectedRows : data;

  // Processar dados para gráficos
  const vendasPorCategoria = dataToUse.reduce((acc: Record<string, number>, item) => {
    acc[item.categoria] = (acc[item.categoria] || 0) + item.vendas;
    return acc;
  }, {});

  const estoquePorCategoria = dataToUse.reduce((acc: Record<string, number>, item) => {
    acc[item.categoria] = (acc[item.categoria] || 0) + item.estoque;
    return acc;
  }, {});

  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Vendas por Categoria</h3>
            <div className="space-y-2">
              {Object.entries(vendasPorCategoria).map(([categoria, vendas]) => (
                <div key={categoria} className="flex items-center gap-2">
                  <div className="w-20 text-sm font-medium">{categoria}:</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                    <div 
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs font-medium"
                      style={{ 
                        width: `${Math.max(10, (vendas / Math.max(...Object.values(vendasPorCategoria))) * 100)}%` 
                      }}
                    >
                      {vendas.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'line':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tabela: Preço vs Vendas</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium">Produto</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Preço (R$)</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Vendas</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Estoque</th>
                  </tr>
                </thead>
                <tbody>
                  {dataToUse.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-4 py-2 text-sm">{item.produto}</td>
                      <td className="px-4 py-2 text-sm">R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-2 text-sm">{item.vendas.toLocaleString()}</td>
                      <td className="px-4 py-2 text-sm">{item.estoque}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'pie':
        const total = Object.values(estoquePorCategoria).reduce((sum, value) => sum + value, 0);
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Distribuição de Estoque</h3>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(estoquePorCategoria).map(([categoria, estoque]) => {
                const percentage = ((estoque / total) * 100).toFixed(1);
                return (
                  <div key={categoria} className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm font-medium">{categoria}</div>
                    <div className="text-2xl font-bold text-blue-600">{estoque}</div>
                    <div className="text-sm text-gray-600">{percentage}% do total</div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Nenhum dado disponível para gráficos
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Chart Type Selector */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setChartType('bar')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            chartType === 'bar'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📊 Barras
        </button>
        <button
          onClick={() => setChartType('line')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            chartType === 'line'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📈 Dispersão
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            chartType === 'pie'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🥧 Pizza
        </button>
      </div>

      {/* Chart Info */}
      <div className="mb-3 text-sm text-gray-600">
        {selectedRows && selectedRows.length > 0 ? (
          <span>📋 Mostrando dados de {selectedRows.length} linha(s) selecionada(s)</span>
        ) : (
          <span>📊 Mostrando todos os {data.length} produtos</span>
        )}
      </div>

      {/* Chart */}
      <div className="border border-gray-200 rounded-lg p-4 bg-white">
        {renderChart()}
      </div>
    </div>
  );
}