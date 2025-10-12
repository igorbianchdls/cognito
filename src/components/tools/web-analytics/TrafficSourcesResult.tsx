'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart3, Award } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface TrafficSourceRow {
  fonte: string;
  sessoes: number;
  percentual_trafego: string;
  pages_per_session: string;
  avg_duration_seconds: number;
  conversoes: number;
  conversion_rate: string;
  quality_score: string;
  classificacao: string;
}

interface TrafficSourcesResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_fontes?: number;
  melhor_fonte?: string;
  pior_fonte?: string;
  fontes?: TrafficSourceRow[];
  sql_query?: string;
  sql_params?: string;
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

export default function TrafficSourcesResult({
  success,
  message,
  periodo_dias,
  total_fontes,
  melhor_fonte,
  pior_fonte,
  fontes,
  sql_query,
}: TrafficSourcesResultProps) {
  const data = fontes ?? [];

  const metaInfo = [
    periodo_dias ? `${periodo_dias} dias analisados` : null,
    total_fontes ? `${total_fontes} fontes` : null,
    melhor_fonte ? `🥇 Melhor: ${melhor_fonte}` : null,
    pior_fonte ? `⚠️ Atenção: ${pior_fonte}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const columns: ColumnDef<TrafficSourceRow>[] = useMemo(
    () => [
      {
        accessorKey: 'fonte',
        header: 'Fonte',
        cell: ({ row }) => (
          <span className="font-semibold text-foreground">
            {row.original.fonte}
          </span>
        ),
      },
      {
        accessorKey: 'sessoes',
        header: 'Sessões',
        cell: ({ row }) => (
          <span className="font-semibold text-purple-600">
            {formatNumber(row.original.sessoes)}
          </span>
        ),
      },
      {
        accessorKey: 'percentual_trafego',
        header: 'Participação',
        cell: ({ row }) => row.original.percentual_trafego,
      },
      {
        accessorKey: 'pages_per_session',
        header: 'Páginas/Sessão',
        cell: ({ row }) => row.original.pages_per_session,
      },
      {
        accessorKey: 'avg_duration_seconds',
        header: 'Duração Média (s)',
        cell: ({ row }) => row.original.avg_duration_seconds.toFixed(0),
      },
      {
        accessorKey: 'conversoes',
        header: 'Conversões',
        cell: ({ row }) => formatNumber(row.original.conversoes),
      },
      {
        accessorKey: 'conversion_rate',
        header: 'Taxa de Conversão',
        cell: ({ row }) => row.original.conversion_rate,
      },
      {
        accessorKey: 'quality_score',
        header: 'Quality Score',
        cell: ({ row }) => (
          <span className="font-semibold text-blue-600">
            {row.original.quality_score}
          </span>
        ),
      },
      {
        accessorKey: 'classificacao',
        header: 'Classificação',
        cell: ({ row }) => (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-700">
            {row.original.classificacao}
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
      title="Fontes de Tráfego"
      icon={BarChart3}
      message={metaInfo ? `${message} • ${metaInfo}` : message}
      success={success}
      count={data.length}
      iconColor="text-indigo-600"
      exportFileName="traffic_sources"
      sqlQuery={sql_query}
      chartRenderer={(rows) => {
        const topThree = rows.slice(0, 3);
        if (!topThree.length) return null;

        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
              <Award className="h-4 w-4 text-amber-500" />
              Top 3 fontes por quality score
            </div>
            <ul className="space-y-1 text-sm">
              {topThree.map((row, index) => (
                <li key={row.fonte} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2">
                  <span className="font-medium text-slate-800">
                    #{index + 1} {row.fonte}
                  </span>
                  <span className="text-sm text-indigo-600 font-semibold">
                    {row.quality_score}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      }}
    />
  );
}
