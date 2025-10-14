'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { TrendingUp } from 'lucide-react';

export type ValorVidaClienteRow = {
  canal: string;
  pedidos: number;
  receita_total: number;
  subtotal_total: number;
  desconto_total: number;
  frete_total: number;
  clientes_unicos: number;
  devolucoes: number;
  valor_reembolsado: number;
  ticket_medio: number;
  receita_por_cliente: number;
  participacao_receita_percent: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: ValorVidaClienteRow[];
  data?: ValorVidaClienteRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ValorVidaClienteResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<ValorVidaClienteRow>[] = useMemo(() => [
    { accessorKey: 'canal', header: 'Canal' },
    { accessorKey: 'pedidos', header: 'Pedidos', cell: ({ row }) => row.original.pedidos.toLocaleString('pt-BR') },
    { accessorKey: 'clientes_unicos', header: 'Clientes Únicos', cell: ({ row }) => row.original.clientes_unicos.toLocaleString('pt-BR') },
    { accessorKey: 'receita_total', header: 'Receita Total', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{currency(row.original.receita_total)}</span>
    ) },
    { accessorKey: 'receita_por_cliente', header: 'LTV (Receita/Cliente)', cell: ({ row }) => (
      <span className="font-bold text-blue-600">{currency(row.original.receita_por_cliente)}</span>
    ) },
    { accessorKey: 'ticket_medio', header: 'Ticket Médio', cell: ({ row }) => currency(row.original.ticket_medio) },
    { accessorKey: 'participacao_receita_percent', header: '% Receita', cell: ({ row }) => `${row.original.participacao_receita_percent.toFixed(2)}%` },
  ], []);

  return (
    <ArtifactDataTable<ValorVidaClienteRow>
      data={tableRows}
      columns={columns}
      title="Análise de Valor de Vida do Cliente (LTV - Lifetime Value)"
      icon={TrendingUp}
      iconColor="text-blue-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="valor_vida_cliente_ltv"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'canal',
        valueKeys: ['receita_por_cliente', 'ticket_medio', 'pedidos'],
        metricLabels: {
          receita_por_cliente: 'LTV (R$/Cliente)',
          ticket_medio: 'Ticket Médio (R$)',
          pedidos: 'Pedidos',
        },
        initialChartType: 'bar',
        title: 'Análise de Valor de Vida do Cliente (LTV)',
        xLegend: 'Canal',
      }}
    />
  );
}
