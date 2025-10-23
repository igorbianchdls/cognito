'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MonitorSmartphone } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';

interface DevicePerformanceRow extends Record<string, unknown> {
  tipo: string;
  segmento: string;
  sessoes: number;
  percentual: number;
  avg_duration_seconds: number;
  avg_pageviews: number;
}

interface DevicePerformanceResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  rows?: DevicePerformanceRow[];
  sql_query?: string;
  sql_params?: string;
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

export default function DesempenhoMobileVsDesktopResult({
  success,
  message,
  periodo_dias,
  rows,
  sql_query,
}: DevicePerformanceResultProps) {
  const [rowsState, setRowsState] = useState<DevicePerformanceRow[]>(rows ?? []);
  const [sqlQuery, setSqlQuery] = useState<string | undefined>(sql_query);
  useEffect(() => { setRowsState(rows ?? []); setSqlQuery(sql_query); }, [rows, sql_query]);
  const data = rowsState ?? [];

  const meta = periodo_dias ? `${periodo_dias} dias analisados` : undefined;

  const columns: ColumnDef<DevicePerformanceRow>[] = useMemo(
    () => [
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => (
          <span className="font-semibold uppercase tracking-wide text-slate-500">
            {row.original.tipo}
          </span>
        ),
      },
      {
        accessorKey: 'segmento',
        header: 'Segmento',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.segmento}
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
        accessorKey: 'percentual',
        header: 'Participação',
        cell: ({ row }) => `${row.original.percentual.toFixed(2)}%`,
      },
      {
        accessorKey: 'avg_duration_seconds',
        header: 'Duração Média (s)',
        cell: ({ row }) => row.original.avg_duration_seconds.toFixed(0),
      },
      {
        accessorKey: 'avg_pageviews',
        header: 'Páginas/Sessão',
        cell: ({ row }) => row.original.avg_pageviews.toFixed(2),
      },
    ],
    [],
  );

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Performance por Dispositivo e Browser"
      icon={MonitorSmartphone}
      message={meta ? `${message} • ${meta}` : message}
      success={success}
      count={data.length}
      iconColor="text-cyan-600"
      exportFileName="device_performance"
      sqlQuery={sqlQuery}
      chartRenderer={() => {
        if (!data.length) return null;
        const sample = data[0] as Record<string, unknown>;
        const xKey = (['tipo','segmento','navegador','sistema_operacional','tipo_dispositivo'] as const).find((k) => k in sample) || 'tipo';
        const candidates = ['sessoes','percentual','avg_duration_seconds','avg_pageviews','duracao_media','taxa_conversao','receita_total'];
        const valueKeys = candidates.filter((k) => k in sample);
        const metricLabels: Record<string,string> = {
          sessoes: 'Sessões',
          percentual: 'Participação (%)',
          avg_duration_seconds: 'Duração (s)',
          avg_pageviews: 'Páginas/Sessão',
          duracao_media: 'Duração (min)',
          taxa_conversao: 'Conversão (%)',
          receita_total: 'Receita',
        };
        return (
          <ChartSwitcher
            rows={data}
            options={{
              xKey,
              valueKeys,
              metricLabels,
              title: 'Comparativo por dispositivo/segmento',
              xLegend: 'Segmento',
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
          const res = await fetch(`/api/tools/web-analytics/mobile-vs-desktop?${params.toString()}`, { cache: 'no-store' });
          if (!res.ok) return;
          const json = await res.json();
          if (json?.success && Array.isArray(json.rows)) {
            setRowsState(json.rows as DevicePerformanceRow[]);
            setSqlQuery(json.sql_query);
          }
        } catch (e) {
          console.error('Erro ao buscar Mobile vs Desktop por período:', e);
        }
      }}
    />
  );
}
