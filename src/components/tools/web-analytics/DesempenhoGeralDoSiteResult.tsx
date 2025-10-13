'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { TrendingUp, Gauge } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface TrafficOverviewRow extends Record<string, unknown> {
  data: string;
  sessoes: number;
  usuarios: number;
  pageviews: number;
  avg_duration_seconds: number;
  bounce_rate_percent: number;
}

interface TrafficOverviewResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  metricas?: {
    total_sessoes: number;
    total_usuarios: number;
    total_pageviews: number;
    bounce_rate: string;
    avg_duration_seconds: number;
    avg_duration_minutos: string;
    pages_per_session: string;
    return_visitor_rate: string;
    classificacao: string;
  };
  rows?: TrafficOverviewRow[];
  sql_query?: string;
  sql_params?: string;
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

const formatDuration = (seconds: number) => {
  if (!seconds) return '0m';
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}m ${secs}s`;
};

export default function DesempenhoGeralDoSiteResult({
  success,
  message,
  periodo_dias,
  metricas,
  rows,
  sql_query,
}: TrafficOverviewResultProps) {
  const data = rows ?? [];

  const summary = metricas
    ? [
        `Sessões: ${formatNumber(metricas.total_sessoes)}`,
        `Usuários: ${formatNumber(metricas.total_usuarios)}`,
        `Pageviews: ${formatNumber(metricas.total_pageviews)}`,
        `Classificação: ${metricas.classificacao}`,
      ].join(' • ')
    : undefined;

  const columns: ColumnDef<TrafficOverviewRow>[] = useMemo(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {new Date(row.original.data).toLocaleDateString('pt-BR')}
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
        accessorKey: 'usuarios',
        header: 'Usuários',
        cell: ({ row }) => (
          <span className="font-semibold text-blue-600">
            {formatNumber(row.original.usuarios)}
          </span>
        ),
      },
      {
        accessorKey: 'pageviews',
        header: 'Pageviews',
        cell: ({ row }) => formatNumber(row.original.pageviews),
      },
      {
        accessorKey: 'avg_duration_seconds',
        header: 'Duração Média',
        cell: ({ row }) => (
          <span>{formatDuration(row.original.avg_duration_seconds)}</span>
        ),
      },
      {
        accessorKey: 'bounce_rate_percent',
        header: 'Bounce Rate',
        cell: ({ row }) => (
          <span className="text-rose-600 font-medium">
            {row.original.bounce_rate_percent.toFixed(2)}%
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      {metricas && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-xs text-slate-500">Período</p>
              <p className="text-sm font-semibold">{periodo_dias} dias</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
            <Gauge className="h-5 w-5 text-emerald-600" />
            <div>
              <p className="text-xs text-emerald-600">Classificação</p>
              <p className="text-sm font-semibold text-emerald-700">
                {metricas.classificacao}
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Páginas por sessão</p>
            <p className="text-sm font-semibold text-slate-900">
              {metricas.pages_per_session}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs text-slate-500">Taxa de retorno</p>
            <p className="text-sm font-semibold text-slate-900">
              {metricas.return_visitor_rate}
            </p>
          </div>
        </div>
      )}

      <ArtifactDataTable
        data={data}
        columns={columns}
        title="Desempenho geral do site"
        icon={TrendingUp}
        message={summary ? `${message} • ${summary}` : message}
        success={success}
        count={data.length}
        iconColor="text-blue-600"
        exportFileName="desempenho_geral_site"
        sqlQuery={sql_query}
      />
    </div>
  );
}
