"use client";

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart3 } from 'lucide-react';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';

interface AnaliseDeCampanhasProps {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

type Row = Record<string, unknown> & {
  campanha?: string;
  plataforma?: string;
};

export default function AnaliseDeCampanhas({ success, message, rows = [], count, sql_query }: AnaliseDeCampanhasProps) {
  const data: Row[] = useMemo(() => rows as Row[], [rows]);

  const columns: ColumnDef<Row>[] = useMemo(() => {
    if (!data.length) return [ { accessorKey: 'info', header: 'Info' } as ColumnDef<Row> ];
    const sample = data[0];
    return Object.keys(sample).map((key) => ({
      accessorKey: key,
      header: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      cell: ({ row }) => String(row.getValue(key) ?? ''),
    })) as ColumnDef<Row>[];
  }, [data]);

  const chartRenderer = () => (
    <ChartSwitcher
      rows={data}
      options={{
        xKey: 'campanha',
        valueKeys: [
          'total_impressoes', 'total_cliques', 'total_conversoes',
          'total_gasto', 'total_receita', 'ctr', 'taxa_conversao', 'cpc', 'cpa', 'roas', 'lucro', 'cpm', 'ticket_medio', 'frequencia_media', 'engajamento_total'
        ],
        metricLabels: {
          total_impressoes: 'Impressões', total_cliques: 'Cliques', total_conversoes: 'Conversões',
          total_gasto: 'Gasto', total_receita: 'Receita', ctr: 'CTR', taxa_conversao: 'Taxa de Conversão', cpc: 'CPC', cpa: 'CPA', roas: 'ROAS', lucro: 'Lucro', cpm: 'CPM', ticket_medio: 'Ticket Médio', frequencia_media: 'Frequência', engajamento_total: 'Engajamento'
        },
        title: 'Métricas por Campanha/Plataforma',
        xLegend: 'Campanha/Plataforma',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Análise de Campanhas"
      icon={BarChart3}
      iconColor="text-purple-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="analise-campanhas"
      pageSize={Math.min(10, Math.max(data.length, 5))}
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

