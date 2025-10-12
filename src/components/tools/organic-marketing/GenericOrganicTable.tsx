'use client';

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart } from '@/components/charts/BarChart';
import type { LucideIcon } from 'lucide-react';

export type OrganicTableRow = {
  plataforma: string | null;
  contas_vinculadas: number | string | null;
  campanhas_vinculadas: number | string | null;
  gasto_total: number | string | null;
  receita_total: number | string | null;
  conversoes_total: number | string | null;
  roas: number | string | null;
  taxa_conversao_percent: number | string | null;
  ctr_percent: number | string | null;
};

type ArtifactRow = {
  rank: number;
  plataforma: string;
  contas_vinculadas: number;
  campanhas_vinculadas: number;
  gasto_total: number;
  receita_total: number;
  conversoes_total: number;
  roas: number;
  taxa_conversao_percent: number;
  ctr_percent: number;
};

const METRIC_OPTIONS = [
  {
    value: 'roas',
    label: 'ROAS',
    formatter: (value: number) => `${value.toFixed(2)}x`,
  },
  {
    value: 'gasto_total',
    label: 'Gasto Total',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'receita_total',
    label: 'Receita Total',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'conversoes_total',
    label: 'Conversões',
    formatter: (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
  },
  {
    value: 'taxa_conversao_percent',
    label: 'Taxa Conversão',
    formatter: (value: number) => `${value.toFixed(2)}%`,
  },
  {
    value: 'ctr_percent',
    label: 'CTR',
    formatter: (value: number) => `${value.toFixed(2)}%`,
  },
] as const;

type MetricKey = (typeof METRIC_OPTIONS)[number]['value'];

interface GenericOrganicTableProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

function toNumber(value: number | string | null | undefined): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(/\s/g, '').replace('.', '').replace(',', '.');
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function GenericOrganicTable({
  title,
  icon,
  iconColor = 'text-blue-600',
  success,
  message,
  periodo_dias,
  data,
  sql_query,
}: GenericOrganicTableProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('roas');

  const tableData: ArtifactRow[] = useMemo(() => {
    if (!data || data.length === 0) return [];

    return data.map((row, index) => ({
      rank: index + 1,
      plataforma: row.plataforma?.trim() ? row.plataforma : 'Desconhecida',
      contas_vinculadas: toNumber(row.contas_vinculadas),
      campanhas_vinculadas: toNumber(row.campanhas_vinculadas),
      gasto_total: toNumber(row.gasto_total),
      receita_total: toNumber(row.receita_total),
      conversoes_total: toNumber(row.conversoes_total),
      roas: toNumber(row.roas),
      taxa_conversao_percent: toNumber(row.taxa_conversao_percent),
      ctr_percent: toNumber(row.ctr_percent),
    }));
  }, [data]);

  const columns: ColumnDef<ArtifactRow>[] = useMemo(() => [
    {
      accessorKey: 'rank',
      header: '#',
      enableSorting: false,
      size: 40,
      cell: ({ row }) => (
        <span className="font-semibold text-sm text-muted-foreground">
          #{row.original.rank}
        </span>
      ),
    },
    {
      accessorKey: 'plataforma',
      header: 'Categoria',
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.plataforma}
        </span>
      ),
    },
    {
      accessorKey: 'contas_vinculadas',
      header: 'Contas',
      cell: ({ row }) => (
        <span className="block text-right">
          {row.original.contas_vinculadas.toLocaleString('pt-BR')}
        </span>
      ),
    },
    {
      accessorKey: 'campanhas_vinculadas',
      header: 'Campanhas',
      cell: ({ row }) => (
        <span className="block text-right">
          {row.original.campanhas_vinculadas.toLocaleString('pt-BR')}
        </span>
      ),
    },
    {
      accessorKey: 'gasto_total',
      header: 'Gasto Total',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-rose-600">
          R$ {row.original.gasto_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'receita_total',
      header: 'Receita Total',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-emerald-600">
          R$ {row.original.receita_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      accessorKey: 'conversoes_total',
      header: 'Conversões',
      cell: ({ row }) => (
        <span className="block text-right">
          {row.original.conversoes_total.toLocaleString('pt-BR')}
        </span>
      ),
    },
    {
      accessorKey: 'roas',
      header: 'ROAS',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-purple-600">
          {row.original.roas.toFixed(2)}x
        </span>
      ),
    },
    {
      accessorKey: 'taxa_conversao_percent',
      header: 'Taxa Conversão',
      cell: ({ row }) => (
        <span className="block text-right">
          {row.original.taxa_conversao_percent.toFixed(2)}%
        </span>
      ),
    },
    {
      accessorKey: 'ctr_percent',
      header: 'CTR',
      cell: ({ row }) => (
        <span className="block text-right">
          {row.original.ctr_percent.toFixed(2)}%
        </span>
      ),
    },
  ], []);

  const chartData = useMemo(() => {
    const metric = METRIC_OPTIONS.find((option) => option.value === selectedMetric) ?? METRIC_OPTIONS[0];

    return tableData.map((row) => ({
      x: row.plataforma,
      y: row[metric.value],
    }));
  }, [selectedMetric, tableData]);

  const formatMetric = useCallback(
    (value: number) => {
      const metric = METRIC_OPTIONS.find((option) => option.value === selectedMetric) ?? METRIC_OPTIONS[0];
      const safe = Number.isFinite(value) ? value : 0;
      return metric.formatter(safe);
    },
    [selectedMetric]
  );

  const summaryMessage = useMemo(() => {
    const period = periodo_dias ? `${periodo_dias} dias` : 'período não informado';
    return `${message} • Período analisado: ${period} • Total de linhas: ${tableData.length}`;
  }, [message, periodo_dias, tableData.length]);

  return (
    <div className="space-y-4">
      <ArtifactDataTable
        data={tableData}
        columns={columns}
        title={title}
        icon={icon}
        iconColor={iconColor}
        message={summaryMessage}
        success={success}
        count={tableData.length}
        exportFileName="organic-marketing-data"
        pageSize={Math.min(10, Math.max(tableData.length, 5))}
        sqlQuery={sql_query}
        chartRenderer={() => {
          if (!tableData.length) {
            return (
              <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-muted-foreground">
                Não há dados suficientes para gerar o gráfico agora.
              </div>
            );
          }

          return (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">Métrica do gráfico</p>
                  <p className="text-xs text-muted-foreground">
                    Compare as categorias pela métrica desejada.
                  </p>
                </div>
                <select
                  className="h-8 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                  value={selectedMetric}
                  onChange={(event) => setSelectedMetric(event.target.value as MetricKey)}
                >
                  {METRIC_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                <div className="h-[360px] w-full">
                  <BarChart
                    data={chartData}
                    seriesLabel={METRIC_OPTIONS.find((option) => option.value === selectedMetric)?.label ?? 'Métrica'}
                    title={`${METRIC_OPTIONS.find((option) => option.value === selectedMetric)?.label ?? 'Métrica'} por Categoria`}
                    subtitle="Visualização gerada a partir da consulta padrão."
                    containerClassName="h-full"
                    axisBottom={{
                      tickRotation: -25,
                      legend: 'Categoria',
                      legendOffset: 36,
                    }}
                    axisLeft={{
                      legend: METRIC_OPTIONS.find((option) => option.value === selectedMetric)?.label ?? 'Valor',
                      legendOffset: -60,
                      format: (value: string | number) =>
                        formatMetric(typeof value === 'number' ? value : Number.parseFloat(value)),
                    }}
                    colors={{ scheme: 'tableau10' }}
                    padding={0.3}
                    enableLabel
                    labelFormat={(value: number) => formatMetric(value)}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Dados apresentados a partir da consulta de referência reutilizada em todas as ferramentas do agente orgânico.
                </p>
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}
