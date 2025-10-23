'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Users } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';

interface BehaviorRow extends Record<string, unknown> {
  metrica: string;
  valor: number | string;
  percentual: string;
}

interface UserBehaviorResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  comportamento?: {
    total_visitantes: number;
    novos_visitantes: number;
    visitantes_recorrentes: number;
    percentual_novos: string;
    percentual_recorrentes: string;
    frequencia_media_visitas: string;
    engagement_rate: string;
    classificacao: string;
  };
  rows?: BehaviorRow[];
  sql_query?: string;
  sql_params?: string;
}

const formatNumber = (value: number | string) => {
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
  return value;
};

export default function VisitantesRecorrentesResult({
  success,
  message,
  periodo_dias,
  comportamento,
  rows,
  sql_query,
}: UserBehaviorResultProps) {
  const [rowsState, setRowsState] = useState(rows ?? []);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setRowsState(rows ?? []); setSqlQuery(sql_query); }, [rows, sql_query]);
  const data = rowsState ?? [];

  const summary = comportamento
    ? [
        `Visitantes: ${comportamento.total_visitantes.toLocaleString('pt-BR')}`,
        `Classificação: ${comportamento.classificacao}`,
        comportamento.engagement_rate ? `Engajamento: ${comportamento.engagement_rate}` : null,
        periodo_dias ? `${periodo_dias} dias` : null,
      ]
        .filter(Boolean)
        .join(' • ')
    : undefined;

  const columns: ColumnDef<BehaviorRow>[] = useMemo(
    () => [
      {
        accessorKey: 'metrica',
        header: 'Métrica',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.metrica}</span>
        ),
      },
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="font-semibold text-indigo-600">
            {formatNumber(row.original.valor)}
          </span>
        ),
      },
      {
        accessorKey: 'percentual',
        header: 'Percentual',
        cell: ({ row }) => (
          <span className="text-slate-600">{row.original.percentual}</span>
        ),
      },
    ],
    [],
  );

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Comportamento de Visitantes"
      icon={Users}
      message={summary ? `${message} • ${summary}` : message}
      success={success}
      count={data.length}
      iconColor="text-sky-600"
      exportFileName="user_behavior"
      sqlQuery={sqlQuery}
      chartRenderer={() => (
        <ChartSwitcher
          rows={data as Array<Record<string, unknown>>}
          options={{
            xKey: 'metrica',
            valueKeys: ['valor'],
            metricLabels: { valor: 'Valor' },
            title: 'Indicadores de recorrência',
            xLegend: 'Métrica',
            yLegend: 'Valor',
            initialChartType: 'bar',
          }}
        />
      )}
      headerDateFilter
      onHeaderDateRangeChange={async ({ from, to, preset }) => {
        try {
          const params = new URLSearchParams();
          if (preset !== 'all') {
            if (from) params.set('data_de', from);
            if (to) params.set('data_ate', to);
          }
          const res = await fetch(`/api/tools/web-analytics/visitantes-recorrentes?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setRowsState(json.rows as BehaviorRow[]);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar visitantes recorrentes por período:', e);
        }
      }}
    />
  );
}
