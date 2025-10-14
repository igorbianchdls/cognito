'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart3 } from 'lucide-react';

export type DesempenhoVendasMensalRow = {
  canal: string;
  receita_liquida: number;
  pedidos: number;
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
    { accessorKey: 'canal', header: 'Canal' },
    { accessorKey: 'pedidos', header: 'Pedidos', cell: ({ row }) => row.original.pedidos.toLocaleString('pt-BR') },
    { accessorKey: 'receita_liquida', header: 'Receita Líquida', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{formatCurrency(row.original.receita_liquida)}</span>
    ) },
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
        xKey: 'canal',
        valueKeys: ['receita_liquida', 'pedidos'],
        metricLabels: {
          receita_liquida: 'Receita Líquida (R$)',
          pedidos: 'Pedidos',
        },
        initialChartType: 'bar',
        title: 'Desempenho de Vendas Mensal (O Pulso do Negócio)',
        xLegend: 'Canal',
      }}
    />
  );
}
