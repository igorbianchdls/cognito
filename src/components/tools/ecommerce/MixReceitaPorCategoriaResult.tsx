'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { PieChart } from 'lucide-react';

export type MixCategoriaRow = {
  categoria: string;
  receita: number;
  pct_receita: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: MixCategoriaRow[];
  data?: MixCategoriaRow[];
  sql_query?: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function MixReceitaPorCategoriaResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<MixCategoriaRow>[] = useMemo(() => [
    { accessorKey: 'categoria', header: 'Categoria' },
    { accessorKey: 'receita', header: 'Receita', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{formatCurrency(row.original.receita)}</span>
    ) },
    { accessorKey: 'pct_receita', header: '% Receita', cell: ({ row }) => `${row.original.pct_receita.toFixed(2)}%` },
  ], []);

  return (
    <ArtifactDataTable<MixCategoriaRow>
      data={tableRows}
      columns={columns}
      title="Mix de Receita por Categoria"
      icon={PieChart}
      iconColor="text-purple-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="mix_receita_categoria"
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
        title: 'Distribuição de Receita por Categoria',
        xLegend: 'Categoria',
      }}
    />
  );
}

