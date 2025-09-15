'use client';

import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from '@/components/charts/LineChart';
import { PieChart } from '@/components/charts/PieChart';

interface GenerativeChartProps {
  data: any[];
  chartType: 'bar' | 'line' | 'pie';
  title: string;
  xColumn: string;
  yColumn: string;
  sqlQuery: string;
  totalRecords: number;
}

export function GenerativeChart({
  data,
  chartType,
  title,
  xColumn,
  yColumn,
  sqlQuery,
  totalRecords
}: GenerativeChartProps) {

  // Renderização condicional baseada no tipo de gráfico
  const renderChart = () => {
    switch (chartType) {
      case 'bar':
        return <BarChart data={data} />;
      case 'line':
        return <LineChart data={data} />;
      case 'pie':
        return <PieChart data={data} />;
      default:
        return <BarChart data={data} />; // fallback para bar
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 max-w-2xl shadow-sm">
      {/* Título do gráfico */}
      <h3 className="font-semibold text-lg text-gray-800 mb-3">{title}</h3>

      {/* Container do gráfico */}
      <div className="h-64 mb-3">
        {renderChart()}
      </div>

      {/* Informações adicionais */}
      <div className="text-xs text-gray-500 space-y-1 border-t pt-2">
        <p>📊 {totalRecords} registros encontrados</p>
        <p className="font-mono text-gray-400 truncate">🔍 {sqlQuery}</p>
      </div>
    </div>
  );
}