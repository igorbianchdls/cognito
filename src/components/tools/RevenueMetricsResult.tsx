'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart3 } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface RevenueMetricsRow extends Record<string, unknown> {
  canal?: string;
  pedidos?: number;
  receita_total?: number;
  subtotal_total?: number;
  desconto_total?: number;
  frete_total?: number;
  clientes_unicos?: number;
  devolucoes?: number;
  valor_reembolsado?: number;
  ticket_medio?: number;
  receita_por_cliente?: number;
  participacao_receita_percent?: number;
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

const formatCurrency = (value?: number) =>
  typeof value === 'number'
    ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : '—';

const formatPercent = (value?: number) =>
  typeof value === 'number'
    ? `${value.toFixed(2)}%`
    : '—';

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

  const columns: ColumnDef<RevenueMetricsRow>[] = useMemo(
    () => [
      {
        accessorKey: 'canal',
        header: 'Canal',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.canal ?? 'Sem canal'}
          </span>
        ),
      },
      {
        accessorKey: 'pedidos',
        header: 'Pedidos',
        cell: ({ row }) => row.original.pedidos?.toLocaleString('pt-BR') ?? '0',
      },
      {
        accessorKey: 'receita_total',
        header: 'Receita',
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600">
            {formatCurrency(row.original.receita_total)}
          </span>
        ),
      },
      {
        accessorKey: 'devolucoes',
        header: 'Devoluções',
        cell: ({ row }) => row.original.devolucoes?.toLocaleString('pt-BR') ?? '0',
      },
      {
        accessorKey: 'valor_reembolsado',
        header: 'Reembolsado',
        cell: ({ row }) => formatCurrency(row.original.valor_reembolsado),
      },
      {
        accessorKey: 'ticket_medio',
        header: 'Ticket Médio',
        cell: ({ row }) => formatCurrency(row.original.ticket_medio),
      },
      {
        accessorKey: 'receita_por_cliente',
        header: 'Receita por Cliente',
        cell: ({ row }) => formatCurrency(row.original.receita_por_cliente),
      },
      {
        accessorKey: 'participacao_receita_percent',
        header: '% Receita',
        cell: ({ row }) => formatPercent(row.original.participacao_receita_percent),
      },
    ],
    [],
  );

  const subtitle = periodo_dias ? `${message} • Período: ${periodo_dias} dias` : message;

  return (
    <ArtifactDataTable
      data={tableData as RevenueMetricsRow[]}
      columns={columns}
      title="Métricas de Receita por Canal"
      icon={BarChart3}
      iconColor="text-indigo-600"
      message={subtitle}
      success={success}
      count={tableData.length}
      error={error}
      sqlQuery={sql_query}
      exportFileName="ecommerce_revenue_metrics"
    />
  );
}
