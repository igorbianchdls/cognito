'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { DollarSign } from 'lucide-react';

export type TicketMedioRow = {
  pedidos: number;
  receita: number;
  ticket_medio: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: TicketMedioRow[];
  data?: TicketMedioRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function TicketMedioVendasResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<TicketMedioRow>[] = useMemo(() => [
    { accessorKey: 'pedidos', header: 'Pedidos', cell: ({ row }) => row.original.pedidos.toLocaleString('pt-BR') },
    { accessorKey: 'receita', header: 'Receita', cell: ({ row }) => currency(row.original.receita) },
    { accessorKey: 'ticket_medio', header: 'Ticket Médio', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{currency(row.original.ticket_medio)}</span>
    ) },
  ], []);

  // Para charts, normalizamos em pares métrica/valor a partir da primeira linha
  return (
    <ArtifactDataTable<TicketMedioRow>
      data={tableRows}
      columns={columns}
      title="Ticket Médio de Vendas"
      icon={DollarSign}
      iconColor="text-emerald-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="ticket_medio_vendas"
      sqlQuery={sql_query}
      enableAutoChart={false}
      chartRenderer={(rows) => {
        const r = rows?.[0];
        const metrics = r
          ? [
              { metric: 'Ticket Médio', valor: r.ticket_medio },
              { metric: 'Receita', valor: r.receita },
              { metric: 'Pedidos', valor: r.pedidos },
            ]
          : [] as Array<{ metric: string; valor: number }>;
        return (
          <ChartSwitcher
            rows={metrics}
            options={{
              xKey: 'metric',
              valueKeys: ['valor'],
              metricLabels: { valor: 'Valor' },
              initialChartType: 'bar',
              title: 'Resumo de Vendas',
              xLegend: 'Métrica',
            }}
          />
        );
      }}
    />
  );
}
