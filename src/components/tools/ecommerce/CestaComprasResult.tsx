'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ShoppingCart } from 'lucide-react';

export type CestaComprasRow = {
  code: string;
  discount_type: string;
  discount_value: number;
  valid_from: string | null;
  valid_until: string | null;
  usage_limit: number | null;
  times_used: number;
  pedidos_periodo: number;
  receita_associada: number;
  desconto_concedido: number;
  utilizacao_total_percent: number | null;
};

interface Props {
  success: boolean;
  message: string;
  rows?: CestaComprasRow[];
  data?: CestaComprasRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CestaComprasResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<CestaComprasRow>[] = useMemo(() => [
    { accessorKey: 'code', header: 'Código' },
    { accessorKey: 'discount_type', header: 'Tipo' },
    { accessorKey: 'discount_value', header: 'Valor Desconto', cell: ({ row }) => currency(row.original.discount_value) },
    { accessorKey: 'times_used', header: 'Usos', cell: ({ row }) => row.original.times_used.toLocaleString('pt-BR') },
    { accessorKey: 'pedidos_periodo', header: 'Pedidos', cell: ({ row }) => row.original.pedidos_periodo.toLocaleString('pt-BR') },
    { accessorKey: 'receita_associada', header: 'Receita Associada', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{currency(row.original.receita_associada)}</span>
    ) },
    { accessorKey: 'desconto_concedido', header: 'Desconto Concedido', cell: ({ row }) => currency(row.original.desconto_concedido) },
    { accessorKey: 'utilizacao_total_percent', header: '% Utilização', cell: ({ row }) =>
      row.original.utilizacao_total_percent !== null ? `${row.original.utilizacao_total_percent.toFixed(2)}%` : 'N/A'
    },
  ], []);

  return (
    <ArtifactDataTable<CestaComprasRow>
      data={tableRows}
      columns={columns}
      title="Análise de Cesta de Compras (Produtos Comprados Juntos)"
      icon={ShoppingCart}
      iconColor="text-orange-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="cesta_compras"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'code',
        valueKeys: ['receita_associada', 'pedidos_periodo'],
        metricLabels: {
          receita_associada: 'Receita Associada (R$)',
          pedidos_periodo: 'Pedidos no Período',
        },
        initialChartType: 'bar',
        title: 'Análise de Cesta de Compras',
        xLegend: 'Código do Cupom',
      }}
    />
  );
}
