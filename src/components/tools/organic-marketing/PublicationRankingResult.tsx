'use client';

import { useMemo } from 'react';
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
  const data = useMemo(() => rows as Row[], [rows]);

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
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}

