'use client';

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart } from '@/components/charts/BarChart';
import { Palette } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreativePerformanceResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_criativos?: number;
  status?: {
    aprovados: number;
    rascunhos: number;
    em_revisao: number;
    rejeitados: number;
    taxa_aprovacao: string;
  };
}

type CreativeRow = {
  status: string;
  quantidade: number;
  percentual: string;
};

const METRIC_OPTIONS = [
  {
    value: 'quantidade',
    label: 'Quantidade',
    axisLabel: 'Quantidade',
    description: 'Número absoluto de criativos por status.',
    formatter: (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
  },
  {
    value: 'percentual',
    label: 'Percentual',
    axisLabel: 'Percentual (%)',
    description: 'Percentual de criativos em cada status.',
    formatter: (value: number) => `${value.toFixed(2)}%`,
  },
] as const;

type MetricOption = (typeof METRIC_OPTIONS)[number];
type MetricKey = MetricOption['value'];

const parsePercent = (value: string | number | undefined): number => {
  if (typeof value === 'number') return value;
  if (!value) return 0;

  const normalized = value.replace(/\s/g, '').replace('%', '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default function CreativePerformanceResult({
  success,
  message,
  periodo_dias,
  total_criativos,
  status,
}: CreativePerformanceResultProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('quantidade');

  const tableData: CreativeRow[] = useMemo(() => {
    if (!status || !total_criativos || total_criativos === 0) return [];

    const total = total_criativos;

    const rows: CreativeRow[] = [
      {
        status: 'Aprovados',
        quantidade: status.aprovados,
        percentual: `${((status.aprovados / total) * 100).toFixed(2)}%`,
      },
      {
        status: 'Rascunhos',
        quantidade: status.rascunhos,
        percentual: `${((status.rascunhos / total) * 100).toFixed(2)}%`,
      },
      {
        status: 'Em Revisão',
        quantidade: status.em_revisao,
        percentual: `${((status.em_revisao / total) * 100).toFixed(2)}%`,
      },
      {
        status: 'Rejeitados',
        quantidade: status.rejeitados,
        percentual: `${((status.rejeitados / total) * 100).toFixed(2)}%`,
      },
    ];

    rows.push({
      status: 'Taxa de Aprovação',
      quantidade: status.aprovados,
      percentual: status.taxa_aprovacao,
    });

    return rows;
  }, [status, total_criativos]);

  const columns: ColumnDef<CreativeRow>[] = useMemo(() => [
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <span className="font-medium">{row.original.status}</span>,
    },
    {
      accessorKey: 'quantidade',
      header: 'Quantidade',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-slate-700">
          {row.original.quantidade.toLocaleString('pt-BR')}
        </span>
      ),
    },
    {
      accessorKey: 'percentual',
      header: 'Percentual',
      cell: ({ row }) => (
        <span className="block text-right text-slate-600">{row.original.percentual}</span>
      ),
    },
  ], []);

  const metricValuesByStatus = useMemo(() => {
    if (!status || tableData.length === 0) return [];

    return tableData
      .filter((row) => row.status !== 'Taxa de Aprovação')
      .map((row) => ({
        label: row.status,
        metrics: {
          quantidade: row.quantidade,
          percentual: parsePercent(row.percentual),
        } satisfies Record<MetricKey, number>,
      }));
  }, [status, tableData]);

  const selectedMetricConfig = useMemo<MetricOption>(() => {
    return METRIC_OPTIONS.find((option) => option.value === selectedMetric) ?? METRIC_OPTIONS[0];
  }, [selectedMetric]);

  const chartData = useMemo(
    () =>
      metricValuesByStatus.map(({ label, metrics }) => ({
        x: label,
        y: metrics[selectedMetric] ?? 0,
      })),
    [metricValuesByStatus, selectedMetric]
  );

  const formatForMetric = useCallback(
    (value: number) => {
      const safeValue = Number.isFinite(value) ? value : 0;
      return selectedMetricConfig.formatter(safeValue);
    },
    [selectedMetricConfig]
  );

  const chartRenderer = useCallback(() => {
    if (!chartData.length) {
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
              Compare o mix de criativos por volume ou percentual.
            </p>
          </div>
          <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricKey)}>
            <SelectTrigger size="sm" className="min-w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="h-[320px] w-full">
            <BarChart
              data={chartData}
              seriesLabel={selectedMetricConfig.label}
              title={`Distribuição de Criativos (${selectedMetricConfig.label})`}
              subtitle={selectedMetricConfig.description}
              containerClassName="h-full"
              axisBottom={{
                tickRotation: -25,
                legend: 'Status',
                legendOffset: 36,
              }}
              axisLeft={{
                legend: selectedMetricConfig.axisLabel,
                legendOffset: -60,
                format: (value: string | number) =>
                  formatForMetric(typeof value === 'number' ? value : Number.parseFloat(value)),
              }}
              colors={{ scheme: 'pastel1' }}
              padding={0.4}
              enableLabel
              labelFormat={(value: number) => formatForMetric(value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            A taxa de aprovação considera criativos aprovados sobre o total produzido no período.
          </p>
        </div>
      </div>
    );
  }, [chartData, formatForMetric, selectedMetric, selectedMetricConfig]);

  const periodoTexto = periodo_dias ? `${periodo_dias} dias` : 'período não informado';
  const totalTexto = total_criativos ?? 0;
  const taxaAprovacao = status ? status.taxa_aprovacao : '0%';

  const summaryMessage = success
    ? `${message} • Período: ${periodoTexto} • Total de criativos: ${totalTexto} • Taxa de aprovação: ${taxaAprovacao}`
    : message;

  return (
    <ArtifactDataTable<CreativeRow>
      data={tableData}
      columns={columns}
      title="Performance de Criativos"
      icon={Palette}
      iconColor="text-pink-600"
      message={summaryMessage}
      success={success}
      count={tableData.length}
      exportFileName="paid-traffic-creatives"
      pageSize={Math.min(10, Math.max(tableData.length, 5))}
      chartRenderer={chartRenderer}
    />
  );
}
