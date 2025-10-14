'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Users } from 'lucide-react';

export type LTVClienteRow = {
  nome: string;
  email: string;
  ltv_total_gasto: number;
  total_de_pedidos: number;
  ticket_medio_cliente: number;
  data_primeira_compra: string; // ISO date
  data_ultima_compra: string;   // ISO date
};

interface Props {
  success: boolean;
  message: string;
  rows?: LTVClienteRow[];
  data?: LTVClienteRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

export default function LTVClienteResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<LTVClienteRow>[] = useMemo(() => [
    { accessorKey: 'nome', header: 'Nome' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'total_de_pedidos', header: 'Pedidos', cell: ({ row }) => row.original.total_de_pedidos.toLocaleString('pt-BR') },
    { accessorKey: 'ltv_total_gasto', header: 'LTV Total', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{currency(row.original.ltv_total_gasto)}</span>
    ) },
    { accessorKey: 'ticket_medio_cliente', header: 'Ticket Médio', cell: ({ row }) => currency(row.original.ticket_medio_cliente) },
    { accessorKey: 'data_primeira_compra', header: 'Primeira Compra', cell: ({ row }) => formatDate(row.original.data_primeira_compra) },
    { accessorKey: 'data_ultima_compra', header: 'Última Compra', cell: ({ row }) => formatDate(row.original.data_ultima_compra) },
  ], []);

  return (
    <ArtifactDataTable<LTVClienteRow>
      data={tableRows}
      columns={columns}
      title="Análise de LTV por Cliente"
      icon={Users}
      iconColor="text-indigo-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="analise_ltv_cliente"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'nome',
        valueKeys: ['ltv_total_gasto', 'ticket_medio_cliente', 'total_de_pedidos'],
        metricLabels: {
          ltv_total_gasto: 'LTV (R$)',
          ticket_medio_cliente: 'Ticket Médio (R$)',
          total_de_pedidos: 'Pedidos',
        },
        initialChartType: 'bar',
        title: 'LTV por Cliente',
        xLegend: 'Cliente',
      }}
    />
  );
}

