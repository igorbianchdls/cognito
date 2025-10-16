'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { DollarSign } from 'lucide-react';
import { toBRL, toIntegerPT } from '@/lib/format';

export type AnalisePerformanceCategoriaRow = {
  categoria: string;
  receita_total: number;
  total_unidades_vendidas: number;
  pedidos_distintos: number;
  preco_medio_do_item: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: AnalisePerformanceCategoriaRow[];
  data?: AnalisePerformanceCategoriaRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function AnalisePerformanceCategoriaResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<AnalisePerformanceCategoriaRow>[] = useMemo(() => [
    { accessorKey: 'categoria', header: 'Categoria' },
    { accessorKey: 'total_unidades_vendidas', header: 'Unidades', cell: ({ row }) => toIntegerPT(row.original.total_unidades_vendidas) },
    { accessorKey: 'pedidos_distintos', header: 'Pedidos', cell: ({ row }) => toIntegerPT(row.original.pedidos_distintos) },
    { accessorKey: 'receita_total', header: 'Receita Total', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{toBRL(row.original.receita_total)}</span>
    ) },
    { accessorKey: 'preco_medio_do_item', header: 'Preço Médio do Item', cell: ({ row }) => toBRL(row.original.preco_medio_do_item) },
  ], []);

  // Para charts, normalizamos em pares métrica/valor a partir da primeira linha
  return (
    <ArtifactDataTable<AnalisePerformanceCategoriaRow>
      data={tableRows}
      columns={columns}
      title="Análise de Performance por Categoria de Produto (A Visão Estratégica)"
      icon={DollarSign}
      iconColor="text-emerald-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="analise_performance_categoria"
      sqlQuery={sql_query}
      enableAutoChart={false}
      chartRenderer={(rows) => {
        const metrics = (rows ?? []).map((r) => ({
          categoria: r.categoria,
          receita_total: r.receita_total,
          pedidos: r.pedidos_distintos,
          unidades: r.total_unidades_vendidas,
        }));
        return (
          <ChartSwitcher
            rows={metrics as Array<{ categoria: string; receita_total: number; pedidos: number; unidades: number }>}
            options={{
              xKey: 'categoria',
              valueKeys: ['receita_total', 'pedidos', 'unidades'],
              metricLabels: {
                receita_total: 'Receita (R$)',
                pedidos: 'Pedidos',
                unidades: 'Unidades',
              },
              initialChartType: 'bar',
              title: 'Performance por Categoria',
              xLegend: 'Categoria',
            }}
          />
        );
      }}
    />
  );
}
