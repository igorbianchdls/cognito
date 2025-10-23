'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Users } from 'lucide-react';
import { toBRL, toIntegerPT } from '@/lib/format';

export type LTVClienteRow = {
  nome: string;
  email: string;
  ltv_total_gasto: number;
  total_de_pedidos: number;
  ticket_medio_cliente: number;
  data_primeira_compra: string; // ISO date
  data_ultima_compra: string;   // ISO date
};

interface Props {
  success: boolean;
  message: string;
  rows?: LTVClienteRow[];
  data?: LTVClienteRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

export default function LTVClienteResult({ success, message, rows, data, sql_query }: Props) {
  const initialRows = rows ?? data ?? [];
  const [tableRows, setTableRows] = useState<LTVClienteRow[]>(initialRows);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setTableRows(initialRows); setSqlQuery(sql_query); }, [rows, data, sql_query]);

  const columns: ColumnDef<LTVClienteRow>[] = useMemo(() => [
    { accessorKey: 'nome', header: 'Nome' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'total_de_pedidos', header: 'Pedidos', cell: ({ row }) => toIntegerPT(row.original.total_de_pedidos) },
    { accessorKey: 'ltv_total_gasto', header: 'LTV Total', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{toBRL(row.original.ltv_total_gasto)}</span>
    ) },
    { accessorKey: 'ticket_medio_cliente', header: 'Ticket Médio', cell: ({ row }) => toBRL(row.original.ticket_medio_cliente) },
    { accessorKey: 'data_primeira_compra', header: 'Primeira Compra', cell: ({ row }) => formatDate(row.original.data_primeira_compra) },
    { accessorKey: 'data_ultima_compra', header: 'Última Compra', cell: ({ row }) => formatDate(row.original.data_ultima_compra) },
  ], []);

  return (
    <ArtifactDataTable<LTVClienteRow>
      data={tableRows}
      columns={columns}
      title="Análise de LTV por Cliente"
      icon={Users}
      iconColor="text-indigo-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="analise_ltv_cliente"
      sqlQuery={sqlQuery}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'nome',
        valueKeys: ['ltv_total_gasto', 'ticket_medio_cliente', 'total_de_pedidos'],
        metricLabels: {
          ltv_total_gasto: 'LTV (R$)',
          ticket_medio_cliente: 'Ticket Médio (R$)',
          total_de_pedidos: 'Pedidos',
        },
        initialChartType: 'bar',
        title: 'LTV por Cliente',
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
          const qs = params.toString();
          const res = await fetch(`/api/tools/ecommerce/ltv-cliente${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setTableRows(json.rows as LTVClienteRow[]);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar LTV por período:', e);
        }
      }}
    />
  );
}
