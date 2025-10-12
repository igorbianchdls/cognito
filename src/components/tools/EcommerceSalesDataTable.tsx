'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ShoppingCart } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface DailySalesRow extends Record<string, unknown> {
  dia: string;
  pedidos: number;
  subtotal_total: number;
  desconto_total: number;
  frete_total: number;
  receita_total: number;
  receita_liquida: number;
  devolucoes: number;
  valor_reembolsado: number;
  ticket_medio: number;
  fulfillment_rate_percent: number;
}

interface EcommerceSalesDataTableProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  rows?: DailySalesRow[];
  sql_query?: string;
  sql_params?: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function EcommerceSalesDataTable({
  success,
  message,
  periodo_dias,
  rows,
  sql_query,
}: EcommerceSalesDataTableProps) {
  const data = rows ?? [];

  const columns: ColumnDef<DailySalesRow>[] = useMemo(
    () => [
      {
        accessorKey: 'dia',
        header: 'Data',
        cell: ({ row }) => new Date(row.original.dia).toLocaleDateString('pt-BR'),
      },
      {
        accessorKey: 'pedidos',
        header: 'Pedidos',
        cell: ({ row }) => row.original.pedidos.toLocaleString('pt-BR'),
      },
      {
        accessorKey: 'receita_total',
        header: 'Receita (R$)',
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600">
            {formatCurrency(row.original.receita_total)}
          </span>
        ),
      },
      {
        accessorKey: 'receita_liquida',
        header: 'Receita Líquida',
        cell: ({ row }) => formatCurrency(row.original.receita_liquida),
      },
      {
        accessorKey: 'desconto_total',
        header: 'Desconto',
        cell: ({ row }) => formatCurrency(row.original.desconto_total),
      },
      {
        accessorKey: 'frete_total',
        header: 'Frete',
        cell: ({ row }) => formatCurrency(row.original.frete_total),
      },
      {
        accessorKey: 'devolucoes',
        header: 'Devoluções',
        cell: ({ row }) => row.original.devolucoes.toLocaleString('pt-BR'),
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
        accessorKey: 'fulfillment_rate_percent',
        header: 'Fulfillment %',
        cell: ({ row }) => `${row.original.fulfillment_rate_percent.toFixed(2)}%`,
      },
    ],
    [],
  );

  const subtitle = periodo_dias ? `${message} • Período: ${periodo_dias} dias` : message;

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Resumo de Vendas"
      icon={ShoppingCart}
      iconColor="text-slate-600"
      message={subtitle}
      success={success}
      count={data.length}
      exportFileName="ecommerce_sales_daily"
      sqlQuery={sql_query}
    />
  );
}
