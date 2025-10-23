"use client";

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart3 } from 'lucide-react';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';

interface CreativeAdsPerformanceResultProps {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

type Row = Record<string, unknown> & {
  anuncio?: string;
  plataforma?: string;
};

export default function CreativeAdsPerformanceResult({ success, message, rows = [], count, sql_query }: CreativeAdsPerformanceResultProps) {
  const [rowsState, setRowsState] = useState(rows);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setRowsState(rows); setSqlQuery(sql_query); }, [rows, sql_query]);
  const data: Row[] = useMemo(() => rowsState as Row[], [rowsState]);

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
      rows={data.map(r => ({ ...r, anuncio: r.plataforma ? `${r.anuncio ?? ''} (${r.plataforma})` : (r.anuncio ?? '') }))}
      options={{
        xKey: 'anuncio',
        valueKeys: [
          'total_impressoes', 'total_cliques', 'total_conversoes',
          'total_gasto', 'total_receita', 'ctr', 'taxa_conversao', 'cpc', 'cpa', 'roas', 'lucro', 'cpm', 'ticket_medio', 'frequencia_media', 'engajamento_total'
        ],
        metricLabels: {
          total_impressoes: 'Impressões', total_cliques: 'Cliques', total_conversoes: 'Conversões',
          total_gasto: 'Gasto', total_receita: 'Receita', ctr: 'CTR', taxa_conversao: 'Taxa de Conversão', cpc: 'CPC', cpa: 'CPA', roas: 'ROAS', lucro: 'Lucro', cpm: 'CPM', ticket_medio: 'Ticket Médio', frequencia_media: 'Frequência', engajamento_total: 'Engajamento'
        },
        title: 'Métricas por Anúncio/Plataforma',
        xLegend: 'Anúncio/Plataforma',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Desempenho por Anúncio"
      icon={BarChart3}
      iconColor="text-purple-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="desempenho-anuncios"
      pageSize={Math.min(10, Math.max(data.length, 5))}
      sqlQuery={sqlQuery}
      chartRenderer={chartRenderer}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to, preset }) => {
        try {
          const params = new URLSearchParams();
          if (preset !== 'all') {
            if (from) params.set('data_de', from);
            if (to) params.set('data_ate', to);
          }
          const qs = params.toString();
          const res = await fetch(`/api/tools/paid-traffic/creative-performance${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setRowsState(json.rows);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar desempenho de criativos por período:', e);
        }
      }}
    />
  );
}
