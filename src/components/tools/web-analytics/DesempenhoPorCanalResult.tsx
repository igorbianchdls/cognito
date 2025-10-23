'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { BarChart3, Award } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';

interface TrafficSourceRow extends Record<string, unknown> {
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

export default function DesempenhoPorCanalResult({
  success,
  message,
  periodo_dias,
  total_fontes,
  melhor_fonte,
  pior_fonte,
  fontes,
  sql_query,
}: TrafficSourcesResultProps) {
  const [rowsState, setRowsState] = useState< TrafficSourceRow[] >(fontes ?? []);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setRowsState(fontes ?? []); setSqlQuery(sql_query); }, [fontes, sql_query]);
  const data = rowsState ?? [];

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
      title="Desempenho por canal"
      icon={BarChart3}
      message={metaInfo ? `${message} • ${metaInfo}` : message}
      success={success}
      count={data.length}
      iconColor="text-indigo-600"
      exportFileName="desempenho_por_canal"
      sqlQuery={sqlQuery}
      chartRenderer={() => {
        if (!data.length) return null;
        const sample = data[0] as Record<string, unknown>;
        const xKey = (['canal_trafego','utm_source','fonte'] as const).find((k) => k in sample) || 'canal_trafego';
        const candidates = ['receita_total','sessoes','visitantes','conversoes','taxa_conversao_pct','receita_por_sessao','receita_por_usuario','pages_per_session','avg_duration_seconds','quality_score'];
        const valueKeys = candidates.filter((k) => k in sample);
        const metricLabels: Record<string, string> = {
          receita_total: 'Receita',
          sessoes: 'Sessões',
          visitantes: 'Visitantes',
          conversoes: 'Conversões',
          taxa_conversao_pct: 'Taxa de conversão (%)',
          receita_por_sessao: 'Receita/sessão',
          receita_por_usuario: 'Receita/usuário',
          pages_per_session: 'Páginas/sessão',
          avg_duration_seconds: 'Duração (s)',
          quality_score: 'Quality score',
        };
        return (
          <ChartSwitcher
            rows={data}
            options={{
              xKey,
              valueKeys,
              metricLabels,
              title: 'Comparativo por canal',
              xLegend: 'Canal',
              yLegend: 'Valor',
              initialChartType: 'bar',
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
          const res = await fetch(`/api/tools/web-analytics/por-canal${qs}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.fontes)) {
            setRowsState(json.fontes as TrafficSourceRow[]);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar desempenho por canal por período:', e);
        }
      }}
    />
  );
}
