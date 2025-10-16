'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { PieChart } from 'lucide-react';
import { toBRL, toIntegerPT } from '@/lib/format';

export type DesempenhoCanalVendaRow = {
  canal: string;
  total_pedidos: number;
  receita_bruta: number;
  ticket_medio: number;
  comissao_marketplace_estimada: number;
  receita_liquida_estimada: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: DesempenhoCanalVendaRow[];
  data?: DesempenhoCanalVendaRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DesempenhoCanalVendaResult({ success, message, rows, data, sql_query }: Props) {
  const initialRows = rows ?? data ?? [];
  const [tableRows, setTableRows] = useState<DesempenhoCanalVendaRow[]>(initialRows);
  useEffect(() => { setTableRows(initialRows); }, [rows, data]);

  const columns: ColumnDef<DesempenhoCanalVendaRow>[] = useMemo(() => [
    { accessorKey: 'canal', header: 'Canal' },
    { accessorKey: 'total_pedidos', header: 'Pedidos', cell: ({ row }) => toIntegerPT(row.original.total_pedidos) },
    { accessorKey: 'receita_bruta', header: 'Receita Bruta', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{toBRL(row.original.receita_bruta)}</span>
    ) },
    { accessorKey: 'ticket_medio', header: 'Ticket Médio', cell: ({ row }) => toBRL(row.original.ticket_medio) },
    { accessorKey: 'comissao_marketplace_estimada', header: 'Comissão Estimada', cell: ({ row }) => toBRL(row.original.comissao_marketplace_estimada) },
    { accessorKey: 'receita_liquida_estimada', header: 'Receita Líquida', cell: ({ row }) => (
      <span className="font-semibold text-blue-600">{toBRL(row.original.receita_liquida_estimada)}</span>
    ) },
  ], []);

  return (
    <ArtifactDataTable<DesempenhoCanalVendaRow>
      data={tableRows}
      columns={columns}
      title="Análise de Desempenho por Canal de Venda (A Visão de Rentabilidade)"
      icon={PieChart}
      iconColor="text-purple-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="desempenho_canal_venda"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'canal',
        valueKeys: ['receita_bruta', 'ticket_medio', 'receita_liquida_estimada'],
        metricLabels: {
          receita_bruta: 'Receita Bruta (R$)',
          ticket_medio: 'Ticket Médio (R$)',
          receita_liquida_estimada: 'Receita Líquida (R$)',
        },
        initialChartType: 'bar',
        title: 'Desempenho por Canal de Venda',
        xLegend: 'Canal',
        showDateFilter: true,
        onDateRangeChange: async ({ from, to }) => {
          try {
            const params = new URLSearchParams();
            if (from) params.set('data_de', from);
            if (to) params.set('data_ate', to);
            const res = await fetch(`/api/tools/ecommerce/desempenho-canal?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const json = await res.json();
            if (json?.success && Array.isArray(json.rows)) setTableRows(json.rows as DesempenhoCanalVendaRow[]);
          } catch (e) {
            console.error('Erro ao buscar Desempenho por Canal por período:', e);
          }
        }
      }}
    />
  );
}
