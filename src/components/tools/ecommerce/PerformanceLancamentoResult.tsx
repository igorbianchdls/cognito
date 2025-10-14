'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Sparkles } from 'lucide-react';

export type PerformanceLancamentoRow = {
  produto: string;
  sku: string | null;
  category: string | null;
  unidades_vendidas: number;
  receita_total: number;
  preco_medio: number;
  estoque_atual: number;
  sell_through_percent: number | null;
};

interface Props {
  success: boolean;
  message: string;
  rows?: PerformanceLancamentoRow[];
  data?: PerformanceLancamentoRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PerformanceLancamentoResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<PerformanceLancamentoRow>[] = useMemo(() => [
    { accessorKey: 'produto', header: 'Produto' },
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'category', header: 'Categoria' },
    { accessorKey: 'unidades_vendidas', header: 'Unidades Vendidas', cell: ({ row }) => row.original.unidades_vendidas.toLocaleString('pt-BR') },
    { accessorKey: 'receita_total', header: 'Receita', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{currency(row.original.receita_total)}</span>
    ) },
    { accessorKey: 'preco_medio', header: 'Preço Médio', cell: ({ row }) => currency(row.original.preco_medio) },
    { accessorKey: 'estoque_atual', header: 'Estoque', cell: ({ row }) => row.original.estoque_atual.toLocaleString('pt-BR') },
    { accessorKey: 'sell_through_percent', header: 'Sell-Through %', cell: ({ row }) =>
      row.original.sell_through_percent !== null ? `${row.original.sell_through_percent.toFixed(2)}%` : 'N/A'
    },
  ], []);

  return (
    <ArtifactDataTable<PerformanceLancamentoRow>
      data={tableRows}
      columns={columns}
      title="Análise de Performance de Lançamento de Coleção"
      icon={Sparkles}
      iconColor="text-pink-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="performance_lancamento_colecao"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'produto',
        valueKeys: ['receita_total', 'unidades_vendidas'],
        metricLabels: {
          receita_total: 'Receita (R$)',
          unidades_vendidas: 'Unidades Vendidas',
        },
        initialChartType: 'bar',
        title: 'Performance de Lançamento',
        xLegend: 'Produto',
      }}
    />
  );
}
