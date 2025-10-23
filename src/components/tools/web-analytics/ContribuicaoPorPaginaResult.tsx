'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Bookmark } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';

interface LandingPageRow extends Record<string, unknown> {
  categoria: string;
  pagina: string;
  pageviews: number;
  rank: number;
}

interface TopLandingPagesResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_paginas?: number;
  rows?: LandingPageRow[];
  sql_query?: string;
  sql_params?: string;
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

export default function ContribuicaoPorPaginaResult({
  success,
  message,
  periodo_dias,
  total_paginas,
  rows,
  sql_query,
}: TopLandingPagesResultProps) {
  const [rowsState, setRowsState] = useState<LandingPageRow[]>(rows ?? []);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setRowsState(rows ?? []); setSqlQuery(sql_query); }, [rows, sql_query]);
  const data = rowsState ?? [];

  const meta = [
    periodo_dias ? `${periodo_dias} dias` : null,
    total_paginas ? `${total_paginas} páginas destacadas` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const columns: ColumnDef<LandingPageRow>[] = useMemo(
    () => [
      {
        accessorKey: 'categoria',
        header: 'Categoria',
        cell: ({ row }) => (
          <span
            className={`rounded-full border px-2 py-0.5 text-xs font-medium uppercase tracking-wide ${
              row.original.categoria === 'Top'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-rose-200 bg-rose-50 text-rose-600'
            }`}
          >
            {row.original.categoria}
          </span>
        ),
      },
      {
        accessorKey: 'rank',
        header: '#',
        cell: ({ row }) => (
          <span className="font-semibold text-slate-500">
            #{row.original.rank}
          </span>
        ),
      },
      {
        accessorKey: 'pagina',
        header: 'Página',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.pagina}
          </span>
        ),
      },
      {
        accessorKey: 'pageviews',
        header: 'Pageviews',
        cell: ({ row }) => (
          <span className="font-semibold text-indigo-600">
            {formatNumber(row.original.pageviews)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Contribuição por página"
      icon={Bookmark}
      message={meta ? `${message} • ${meta}` : message}
      success={success}
      count={data.length}
      iconColor="text-amber-600"
      exportFileName="contribuicao_por_pagina"
      sqlQuery={sqlQuery}
      chartRenderer={() => {
        if (!data.length) return null;
        const sample = data[0] as Record<string, unknown>;
        const xKey = ('url_pagina' in sample) ? 'url_pagina' : ('pagina' in sample ? 'pagina' : 'url_pagina');
        const candidates = ['receita','sessoes','transacoes','receita_por_visita','pageviews'];
        const valueKeys = candidates.filter((k) => k in sample);
        const metricLabels: Record<string,string> = {
          receita: 'Receita',
          sessoes: 'Sessões',
          transacoes: 'Transações',
          receita_por_visita: 'Receita por visita',
          pageviews: 'Pageviews',
        };
        return (
          <ChartSwitcher
            rows={data}
            options={{
              xKey,
              valueKeys,
              metricLabels,
              title: 'Top páginas por receita/sessões',
              xLegend: 'Página',
              yLegend: 'Valor',
              initialChartType: 'bar',
            }}
          />
        );
      }}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to, preset }) => {
        try {
          const params = new URLSearchParams();
          if (preset !== 'all') {
            if (from) params.set('data_de', from);
            if (to) params.set('data_ate', to);
          }
          params.set('limit', String(total_paginas ?? 20));
          const res = await fetch(`/api/tools/web-analytics/contribuicao-por-pagina?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setRowsState(json.rows as LandingPageRow[]);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar contribuição por página por período:', e);
        }
      }}
    />
  );
}
