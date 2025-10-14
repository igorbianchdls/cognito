'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tantml:function_calls';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Users } from 'lucide-react';

export type ClientesNovosRecorrentesRow = {
  segmento: string;
  clientes: number;
  percentual_clientes: number;
  receita_total: number;
  ticket_medio_cliente: number;
  pedidos_medios: number;
  clientes_recorrentes: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: ClientesNovosRecorrentesRow[];
  data?: ClientesNovosRecorrentesRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function ClientesNovosRecorrentesResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<ClientesNovosRecorrentesRow>[] = useMemo(() => [
    { accessorKey: 'segmento', header: 'Segmento' },
    { accessorKey: 'clientes', header: 'Clientes', cell: ({ row }) => row.original.clientes.toLocaleString('pt-BR') },
    { accessorKey: 'percentual_clientes', header: '% Clientes', cell: ({ row }) => `${row.original.percentual_clientes.toFixed(2)}%` },
    { accessorKey: 'clientes_recorrentes', header: 'Recorrentes', cell: ({ row }) => (
      <span className="font-semibold text-purple-600">{row.original.clientes_recorrentes.toLocaleString('pt-BR')}</span>
    ) },
    { accessorKey: 'receita_total', header: 'Receita Total', cell: ({ row }) => currency(row.original.receita_total) },
    { accessorKey: 'ticket_medio_cliente', header: 'Ticket Médio/Cliente', cell: ({ row }) => currency(row.original.ticket_medio_cliente) },
    { accessorKey: 'pedidos_medios', header: 'Pedidos Médios', cell: ({ row }) => row.original.pedidos_medios.toFixed(2) },
  ], []);

  return (
    <ArtifactDataTable<ClientesNovosRecorrentesRow>
      data={tableRows}
      columns={columns}
      title="Análise de Clientes Novos vs. Recorrentes"
      icon={Users}
      iconColor="text-purple-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="clientes_novos_recorrentes"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'segmento',
        valueKeys: ['clientes', 'clientes_recorrentes', 'receita_total'],
        metricLabels: {
          clientes: 'Total Clientes',
          clientes_recorrentes: 'Clientes Recorrentes',
          receita_total: 'Receita Total (R$)',
        },
        initialChartType: 'bar',
        title: 'Análise de Clientes Novos vs. Recorrentes',
        xLegend: 'Segmento',
      }}
    />
  );
}
