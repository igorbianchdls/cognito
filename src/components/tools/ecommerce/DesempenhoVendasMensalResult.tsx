'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart3 } from 'lucide-react';

export type DesempenhoVendasMensalRow = {
  mes: string; // YYYY-MM-01
  receita_total: number;
  total_pedidos: number;
  ticket_medio: number;
  itens_por_pedido: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: DesempenhoVendasMensalRow[];
  data?: DesempenhoVendasMensalRow[];
  sql_query?: string;
}

const formatCurrency = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DesempenhoVendasMensalResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<DesempenhoVendasMensalRow>[] = useMemo(() => [
    { accessorKey: 'mes', header: 'Mês', cell: ({ row }) => new Date(row.original.mes).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short' }) },
    { accessorKey: 'total_pedidos', header: 'Pedidos', cell: ({ row }) => row.original.total_pedidos.toLocaleString('pt-BR') },
    { accessorKey: 'receita_total', header: 'Receita Total', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{formatCurrency(row.original.receita_total)}</span>
    ) },
    { accessorKey: 'ticket_medio', header: 'Ticket Médio', cell: ({ row }) => formatCurrency(row.original.ticket_medio) },
    { accessorKey: 'itens_por_pedido', header: 'Itens por Pedido', cell: ({ row }) => row.original.itens_por_pedido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
  ], []);

  return (
    <ArtifactDataTable<DesempenhoVendasMensalRow>
      data={tableRows}
      columns={columns}
      title="Desempenho de Vendas Mensal (O Pulso do Negócio)"
      icon={BarChart3}
      iconColor="text-blue-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="desempenho_vendas_mensal"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'mes',
        valueKeys: ['receita_total', 'total_pedidos', 'ticket_medio', 'itens_por_pedido'],
        metricLabels: {
          receita_total: 'Receita Total (R$)',
          total_pedidos: 'Pedidos',
          ticket_medio: 'Ticket Médio (R$)',
          itens_por_pedido: 'Itens por Pedido',
        },
        initialChartType: 'bar',
        title: 'Desempenho de Vendas Mensal (O Pulso do Negócio)',
        xLegend: 'Mês',
      }}
    />
  );
}
