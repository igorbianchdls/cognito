'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { TrendingUp, Gauge } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';

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
  const [tableRows, setTableRows] = useState<TrafficOverviewRow[]>(rows ?? []);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setTableRows(rows ?? []); setSqlQuery(sql_query); }, [rows, sql_query]);

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
        data={tableRows}
        columns={columns}
        title="Desempenho geral do site"
        icon={TrendingUp}
        message={summary ? `${message} • ${summary}` : message}
        success={success}
        count={tableRows.length}
        iconColor="text-blue-600"
        exportFileName="desempenho_geral_site"
        sqlQuery={sqlQuery}
        chartRenderer={() => {
          if (!tableRows.length) return null;
          const xKey = 'data';
          // Métricas conhecidas do dataset desta tela
          const valueKeys = [
            'sessoes',
            'usuarios',
            'pageviews',
            'avg_duration_seconds',
            'bounce_rate_percent',
          ];
          const metricLabels: Record<string, string> = {
            sessoes: 'Sessões',
            usuarios: 'Usuários',
            pageviews: 'Pageviews',
            avg_duration_seconds: 'Duração média (s)',
            bounce_rate_percent: 'Bounce (%)',
          };
          return (
            <ChartSwitcher
              rows={tableRows as Array<Record<string, unknown>>}
              options={{
                xKey,
                valueKeys,
                metricLabels,
                title: 'Métricas diárias',
                xLegend: 'Dia',
                yLegend: 'Valor',
                initialChartType: 'line',
              }}
            />
          );
        }}
        headerDateFilter
        onHeaderDateRangeChange={async ({ from, to, preset }) => {
          try {
            let qs = '';
            if (preset === '7d') qs = '?days=7';
            else if (preset === '30d') qs = '?days=30';
            else if (preset === 'this-month') {
              const today = new Date();
              const start = new Date(today.getFullYear(), today.getMonth(), 1);
              const days = Math.max(1, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);
              qs = `?days=${days}`;
            } else if (preset !== 'all' && from && to) {
              const p = new URLSearchParams();
              p.set('data_de', from);
              p.set('data_ate', to);
              qs = `?${p.toString()}`;
            }
            const res = await fetch(`/api/tools/web-analytics/overview${qs}`, { cache: 'no-store' });
            if (!res.ok) return;
            const json = await res.json();
            if (json?.success && Array.isArray(json.rows)) {
              setTableRows(json.rows as TrafficOverviewRow[]);
              setSqlQuery(json.sql_query);
            }
          } catch (e) {
            console.error('Erro ao buscar visão geral de tráfego por período:', e);
          }
        }}
      />
    </div>
  );
}
