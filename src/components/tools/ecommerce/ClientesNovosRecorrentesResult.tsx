'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Users } from 'lucide-react';

export type ClientesNovosRecorrentesRow = {
  tipo_de_cliente: string; // 'Novo Cliente' | 'Cliente Recorrente'
  total_de_pedidos: number;
  receita_total: number;
  ticket_medio: number;
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
  const initialRows = rows ?? data ?? [];
  const [tableRows, setTableRows] = useState<ClientesNovosRecorrentesRow[]>(initialRows);
  useEffect(() => { setTableRows(initialRows); }, [rows, data]);

  const columns: ColumnDef<ClientesNovosRecorrentesRow>[] = useMemo(() => [
    { accessorKey: 'tipo_de_cliente', header: 'Tipo de Cliente' },
    { accessorKey: 'total_de_pedidos', header: 'Pedidos', cell: ({ row }) => row.original.total_de_pedidos.toLocaleString('pt-BR') },
    { accessorKey: 'receita_total', header: 'Receita Total', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{currency(row.original.receita_total)}</span>
    ) },
    { accessorKey: 'ticket_medio', header: 'Ticket Médio', cell: ({ row }) => currency(row.original.ticket_medio) },
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
        xKey: 'tipo_de_cliente',
        valueKeys: ['total_de_pedidos', 'receita_total', 'ticket_medio'],
        metricLabels: {
          total_de_pedidos: 'Pedidos',
          receita_total: 'Receita (R$)',
          ticket_medio: 'Ticket Médio (R$)',
        },
        initialChartType: 'bar',
        title: 'Clientes Novos vs. Recorrentes',
        xLegend: 'Tipo de Cliente',
        showDateFilter: true,
        onDateRangeChange: async ({ from, to }) => {
          try {
            const params = new URLSearchParams();
            if (from) params.set('data_de', from);
            if (to) params.set('data_ate', to);
            const res = await fetch(`/api/tools/ecommerce/clientes-novos-recorrentes?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const json = await res.json();
            if (json?.success && Array.isArray(json.rows)) setTableRows(json.rows as ClientesNovosRecorrentesRow[]);
          } catch (e) {
            console.error('Erro ao buscar Clientes Novos vs Recorrentes por período:', e);
          }
        }
      }}
    />
  );
}
