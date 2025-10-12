'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart3 } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

export interface RevenueMetricsRow extends Record<string, unknown> {
  canal?: string | null;
  pedidos?: number | string | null;
  receita_total?: number | string | null;
  subtotal_total?: number | string | null;
  desconto_total?: number | string | null;
  frete_total?: number | string | null;
  clientes_unicos?: number | string | null;
  devolucoes?: number | string | null;
  valor_reembolsado?: number | string | null;
  ticket_medio?: number | string | null;
  receita_por_cliente?: number | string | null;
  participacao_receita_percent?: number | string | null;
}

interface RevenueMetricsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: RevenueMetricsRow[];
  rows?: RevenueMetricsRow[];
  sql_query?: string;
  error?: string;
}

const toNumber = (value: number | string | null | undefined): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function RevenueMetricsResult({
  success,
  message,
  periodo_dias,
  data,
  rows,
  sql_query,
  error,
}: RevenueMetricsResultProps) {
  const tableData = useMemo(
    () => (data && data.length ? data : rows) ?? [],
    [data, rows],
  );

  const normalizedRows = useMemo(
    () =>
      tableData.map((row, index) => ({
        index,
        canal: row.canal ?? 'Sem canal',
        pedidos: toNumber(row.pedidos),
        receita_total: toNumber(row.receita_total),
        subtotal_total: toNumber(row.subtotal_total),
        desconto_total: toNumber(row.desconto_total),
        frete_total: toNumber(row.frete_total),
        clientes_unicos: toNumber(row.clientes_unicos),
        devolucoes: toNumber(row.devolucoes),
        valor_reembolsado: toNumber(row.valor_reembolsado),
        ticket_medio: toNumber(row.ticket_medio),
        receita_por_cliente: toNumber(row.receita_por_cliente),
        participacao_receita_percent: toNumber(row.participacao_receita_percent),
      })),
    [tableData],
  );

  const columns: ColumnDef<(typeof normalizedRows)[number]>[] = useMemo(
    () => [
      {
        accessorKey: 'canal',
        header: 'Canal',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.canal}
          </span>
        ),
      },
      {
        accessorKey: 'pedidos',
        header: 'Pedidos',
        cell: ({ row }) => row.original.pedidos.toLocaleString('pt-BR'),
      },
      {
        accessorKey: 'receita_total',
        header: 'Receita',
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600">
            {row.original.receita_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        ),
      },
      {
        accessorKey: 'devolucoes',
        header: 'Devoluções',
        cell: ({ row }) => row.original.devolucoes.toLocaleString('pt-BR'),
      },
      {
        accessorKey: 'valor_reembolsado',
        header: 'Reembolsado',
        cell: ({ row }) =>
          row.original.valor_reembolsado.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      },
      {
        accessorKey: 'ticket_medio',
        header: 'Ticket Médio',
        cell: ({ row }) =>
          row.original.ticket_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      },
      {
        accessorKey: 'receita_por_cliente',
        header: 'Receita por Cliente',
        cell: ({ row }) =>
          row.original.receita_por_cliente.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
      },
      {
        accessorKey: 'participacao_receita_percent',
        header: '% Receita',
        cell: ({ row }) => `${row.original.participacao_receita_percent.toFixed(2)}%`,
      },
    ],
    [],
  );

  const subtitle = periodo_dias ? `${message} • Período: ${periodo_dias} dias` : message;

  return (
    <ArtifactDataTable
      data={normalizedRows}
      columns={columns}
      title="Métricas de Receita por Canal"
      icon={BarChart3}
      iconColor="text-indigo-600"
      message={subtitle}
      success={success}
      count={normalizedRows.length}
      error={error}
      sqlQuery={sql_query}
      exportFileName="ecommerce_revenue_metrics"
    />
  );
}
