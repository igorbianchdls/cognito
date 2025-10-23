'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart3 } from 'lucide-react';
import { toBRL, toIntegerPT } from '@/lib/format';

export type TopClienteRow = {
  cliente_id: number | null;
  nome_cliente: string | null;
  pedidos: number;
  receita: number;
  ticket_medio: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: TopClienteRow[];
  data?: TopClienteRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TopClientesPorReceitaResult({ success, message, rows, data, sql_query }: Props) {
  const initialRows = rows ?? data ?? [];
  const [tableRows, setTableRows] = useState<TopClienteRow[]>(initialRows);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setTableRows(initialRows); setSqlQuery(sql_query); }, [rows, data, sql_query]);

  const columns: ColumnDef<TopClienteRow>[] = useMemo(() => [
    { accessorKey: 'cliente_id', header: 'Cliente ID' },
    { accessorKey: 'nome_cliente', header: 'Cliente' },
    { accessorKey: 'pedidos', header: 'Pedidos', cell: ({ row }) => toIntegerPT(row.original.pedidos) },
    { accessorKey: 'receita', header: 'Receita', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{toBRL(row.original.receita)}</span>
    ) },
    { accessorKey: 'ticket_medio', header: 'Ticket Médio', cell: ({ row }) => toBRL(row.original.ticket_medio) },
  ], []);

  return (
    <ArtifactDataTable<TopClienteRow>
      data={tableRows}
      columns={columns}
      title="Top Clientes por Receita"
      icon={BarChart3}
      iconColor="text-sky-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="top_clientes_receita"
      sqlQuery={sqlQuery}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'nome_cliente',
        valueKeys: ['receita', 'pedidos', 'ticket_medio'],
        metricLabels: {
          receita: 'Receita (R$)',
          pedidos: 'Pedidos',
          ticket_medio: 'Ticket Médio (R$)'
        },
        title: 'Receita por Cliente',
        xLegend: 'Cliente',
      }}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to, preset }) => {
        try {
          const params = new URLSearchParams();
          if (preset !== 'all') {
            if (from) params.set('data_de', from);
            if (to) params.set('data_ate', to);
          }
          params.set('limit', '50');
          const qs = params.toString();
          const res = await fetch(`/api/tools/ecommerce/top-clientes${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setTableRows(json.rows as TopClienteRow[]);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar Top Clientes por período:', e);
        }
      }}
    />
  );
}
