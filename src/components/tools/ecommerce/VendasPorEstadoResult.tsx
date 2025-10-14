'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { MapPin } from 'lucide-react';

export type VendasPorEstadoRow = {
  canal: string;
  pedidos: number;
  receita_total: number;
  receita_confirmada: number;
  desconto_total: number;
  frete_total: number;
  clientes_unicos: number;
  devolucoes: number;
  ticket_medio: number;
  pedidos_por_cliente: number;
  taxa_devolucao_percent: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: VendasPorEstadoRow[];
  data?: VendasPorEstadoRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function VendasPorEstadoResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<VendasPorEstadoRow>[] = useMemo(() => [
    { accessorKey: 'canal', header: 'Canal/Estado' },
    { accessorKey: 'pedidos', header: 'Pedidos', cell: ({ row }) => row.original.pedidos.toLocaleString('pt-BR') },
    { accessorKey: 'receita_total', header: 'Receita Total', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{currency(row.original.receita_total)}</span>
    ) },
    { accessorKey: 'receita_confirmada', header: 'Receita Confirmada', cell: ({ row }) => currency(row.original.receita_confirmada) },
    { accessorKey: 'clientes_unicos', header: 'Clientes Únicos', cell: ({ row }) => row.original.clientes_unicos.toLocaleString('pt-BR') },
    { accessorKey: 'ticket_medio', header: 'Ticket Médio', cell: ({ row }) => currency(row.original.ticket_medio) },
    { accessorKey: 'devolucoes', header: 'Devoluções', cell: ({ row }) => row.original.devolucoes.toLocaleString('pt-BR') },
    { accessorKey: 'taxa_devolucao_percent', header: '% Devolução', cell: ({ row }) => `${row.original.taxa_devolucao_percent.toFixed(2)}%` },
  ], []);

  return (
    <ArtifactDataTable<VendasPorEstadoRow>
      data={tableRows}
      columns={columns}
      title="Análise de Vendas por Estado (Visão Geográfica)"
      icon={MapPin}
      iconColor="text-teal-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="vendas_por_estado"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'canal',
        valueKeys: ['receita_total', 'pedidos', 'clientes_unicos'],
        metricLabels: {
          receita_total: 'Receita Total (R$)',
          pedidos: 'Pedidos',
          clientes_unicos: 'Clientes Únicos',
        },
        initialChartType: 'bar',
        title: 'Vendas por Estado',
        xLegend: 'Canal/Estado',
      }}
    />
  );
}
