'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { PieChart } from 'lucide-react';

export type AnaliseDesempenhoCanalRow = {
  categoria: string;
  receita: number;
  pct_receita: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: AnaliseDesempenhoCanalRow[];
  data?: AnaliseDesempenhoCanalRow[];
  sql_query?: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AnaliseDesempenhoCanalResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<AnaliseDesempenhoCanalRow>[] = useMemo(() => [
    { accessorKey: 'categoria', header: 'Categoria' },
    { accessorKey: 'receita', header: 'Receita', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{formatCurrency(row.original.receita)}</span>
    ) },
    { accessorKey: 'pct_receita', header: '% Receita', cell: ({ row }) => `${row.original.pct_receita.toFixed(2)}%` },
  ], []);

  return (
    <ArtifactDataTable<AnaliseDesempenhoCanalRow>
      data={tableRows}
      columns={columns}
      title="Análise de Desempenho por Canal de Venda (A Visão de Rentabilidade)"
      icon={PieChart}
      iconColor="text-purple-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="analise_desempenho_canal"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'categoria',
        valueKeys: ['receita', 'pct_receita'],
        metricLabels: {
          receita: 'Receita (R$)',
          pct_receita: '% Receita',
        },
        initialChartType: 'pie',
        title: 'Análise de Desempenho por Canal de Venda (A Visão de Rentabilidade)',
        xLegend: 'Categoria',
      }}
    />
  );
}
