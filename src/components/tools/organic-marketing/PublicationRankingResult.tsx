'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { BarChart3 } from 'lucide-react';

interface Row extends Record<string, unknown> {
  titulo?: string;
  plataforma?: string;
  engajamento_pct?: number | string;
  curtidas?: number | string;
  comentarios?: number | string;
  compartilhamentos?: number | string;
}

interface Props {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
  sql_query?: string;
}

export default function PublicationRankingResult({ success, message, rows = [], count, sql_query }: Props) {
  const [rowsState, setRowsState] = useState(rows);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setRowsState(rows); setSqlQuery(sql_query); }, [rows, sql_query]);
  const data = useMemo(() => rowsState as Row[], [rowsState]);

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
        xKey: (data.some(r => typeof r.titulo === 'string') ? 'titulo' : 'plataforma'),
        valueKeys: ['engajamento_pct','curtidas','comentarios','compartilhamentos'],
        metricLabels: {
          engajamento_pct: 'Engajamento (%)',
          curtidas: 'Curtidas',
          comentarios: 'Comentários',
          compartilhamentos: 'Compartilhamentos',
        },
        title: 'Ranking por publicação',
        xLegend: 'Publicação',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  return (
    <ArtifactDataTable<Row>
      data={data}
      columns={columns}
      title="Ranking por publicação"
      icon={BarChart3}
      iconColor="text-emerald-600"
      message={message}
      success={success}
      count={typeof count === 'number' ? count : data.length}
      exportFileName="ranking-por-publicacao"
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
          params.set('limit', '50');
          const res = await fetch(`/api/tools/organic-marketing/ranking-publicacao?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setRowsState(json.rows);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar ranking de publicações (orgânico):', e);
        }
      }}
    />
  );
}
