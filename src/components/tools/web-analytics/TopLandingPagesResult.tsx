'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Bookmark } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface LandingPageRow {
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

export default function TopLandingPagesResult({
  success,
  message,
  periodo_dias,
  total_paginas,
  rows,
  sql_query,
}: TopLandingPagesResultProps) {
  const data = rows ?? [];

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
      title="Landing Pages em Destaque"
      icon={Bookmark}
      message={meta ? `${message} • ${meta}` : message}
      success={success}
      count={data.length}
      iconColor="text-amber-600"
      exportFileName="landing_pages_ranking"
      sqlQuery={sql_query}
    />
  );
}
