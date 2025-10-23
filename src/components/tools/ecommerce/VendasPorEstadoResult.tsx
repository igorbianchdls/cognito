'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { MapPin } from 'lucide-react';
import { toBRL, toIntegerPT } from '@/lib/format';

export type VendasPorEstadoRow = {
  estado: string;
  receita_total: number;
  total_pedidos: number;
  clientes_distintos: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: VendasPorEstadoRow[];
  data?: VendasPorEstadoRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function VendasPorEstadoResult({ success, message, rows, data, sql_query }: Props) {
  const initialRows = rows ?? data ?? [];
  const [tableRows, setTableRows] = useState<VendasPorEstadoRow[]>(initialRows);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setTableRows(initialRows); setSqlQuery(sql_query); }, [rows, data, sql_query]);

  const columns: ColumnDef<VendasPorEstadoRow>[] = useMemo(() => [
    { accessorKey: 'estado', header: 'Estado' },
    { accessorKey: 'total_pedidos', header: 'Pedidos', cell: ({ row }) => toIntegerPT(row.original.total_pedidos) },
    { accessorKey: 'clientes_distintos', header: 'Clientes', cell: ({ row }) => toIntegerPT(row.original.clientes_distintos) },
    { accessorKey: 'receita_total', header: 'Receita Total', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{toBRL(row.original.receita_total)}</span>
    ) },
  ], []);

  return (
    <ArtifactDataTable<VendasPorEstadoRow>
      data={tableRows}
      columns={columns}
      title="Análise de Vendas por Estado (Visão Geográfica)"
      icon={MapPin}
      iconColor="text-teal-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="vendas_por_estado"
      sqlQuery={sqlQuery}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'estado',
        valueKeys: ['receita_total', 'total_pedidos', 'clientes_distintos'],
        metricLabels: {
          receita_total: 'Receita Total (R$)',
          total_pedidos: 'Pedidos',
          clientes_distintos: 'Clientes',
        },
        initialChartType: 'bar',
        title: 'Vendas por Estado',
        xLegend: 'Estado',
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
          const res = await fetch(`/api/tools/ecommerce/vendas-por-estado${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setTableRows(json.rows as VendasPorEstadoRow[]);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar Vendas por Estado por período:', e);
        }
      }}
    />
  );
}
