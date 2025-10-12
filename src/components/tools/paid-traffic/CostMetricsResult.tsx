'use client';

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart } from '@/components/charts/BarChart';
import { Gauge } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CostMetricsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  metricas?: {
    total_gasto: string;
    total_impressoes: number;
    total_cliques: number;
    total_conversoes: number;
    cpm: string;
    cpc: string;
    cpa: string;
    ctr: string;
    classificacao_eficiencia: string;
  };
}

type MetricRow = {
  indicador: string;
  valor: string;
  categoria: 'visao_geral' | 'custos_unitarios';
};

const BENCHMARKS = {
  cpm: 25, // referência média para plataformas sociais
  cpc: 2, // CPC esperado em campanhas bem otimizadas
  cpa: 100, // Meta genérica para conversões (ajuste conforme negócio)
  ctr: 2, // CTR saudável (%)
} as const;

const METRIC_OPTIONS = [
  {
    value: 'cpm',
    label: 'CPM',
    axisLabel: 'CPM (R$)',
    description: 'Custo por mil impressões. Menor é melhor.',
    benchmark: BENCHMARKS.cpm,
    extractor: (metricas: CostMetricsResultProps['metricas']) =>
      metricas ? parseCurrency(metricas.cpm) : 0,
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'cpc',
    label: 'CPC',
    axisLabel: 'CPC (R$)',
    description: 'Custo por clique. Indicador de eficiência do tráfego.',
    benchmark: BENCHMARKS.cpc,
    extractor: (metricas) =>
      metricas ? parseCurrency(metricas.cpc) : 0,
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'cpa',
    label: 'CPA',
    axisLabel: 'CPA (R$)',
    description: 'Custo por aquisição. Mostra quanto custa converter.',
    benchmark: BENCHMARKS.cpa,
    extractor: (metricas) =>
      metricas ? parseCurrency(metricas.cpa) : 0,
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'ctr',
    label: 'CTR',
    axisLabel: 'CTR (%)',
    description: 'Taxa de cliques. Indica relevância do anúncio.',
    benchmark: BENCHMARKS.ctr,
    extractor: (metricas) =>
      metricas ? parsePercentage(metricas.ctr) : 0,
    formatter: (value: number) => `${value.toFixed(2)}%`,
  },
] as const;

type MetricOption = (typeof METRIC_OPTIONS)[number];
type MetricKey = MetricOption['value'];

function parseCurrency(value: string | undefined): number {
  if (!value) return 0;
  const normalized = value.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parsePercentage(value: string | undefined): number {
  if (!value) return 0;
  const normalized = value.replace(/\s/g, '').replace('%', '').replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function CostMetricsResult({
  success,
  message,
  periodo_dias,
  plataforma,
  metricas,
}: CostMetricsResultProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('cpm');

  const tableData: MetricRow[] = useMemo(() => {
    if (!metricas) return [];

    const overview: MetricRow[] = [
      {
        indicador: 'Gasto Total',
        valor: `R$ ${metricas.total_gasto}`,
        categoria: 'visao_geral',
      },
      {
        indicador: 'Impressões',
        valor: metricas.total_impressoes.toLocaleString('pt-BR'),
        categoria: 'visao_geral',
      },
      {
        indicador: 'Cliques',
        valor: metricas.total_cliques.toLocaleString('pt-BR'),
        categoria: 'visao_geral',
      },
      {
        indicador: 'Conversões',
        valor: metricas.total_conversoes.toLocaleString('pt-BR'),
        categoria: 'visao_geral',
      },
    ];

    const unitCosts: MetricRow[] = [
      {
        indicador: 'CPM',
        valor: `R$ ${metricas.cpm}`,
        categoria: 'custos_unitarios',
      },
      {
        indicador: 'CPC',
        valor: `R$ ${metricas.cpc}`,
        categoria: 'custos_unitarios',
      },
      {
        indicador: 'CPA',
        valor: `R$ ${metricas.cpa}`,
        categoria: 'custos_unitarios',
      },
      {
        indicador: 'CTR',
        valor: `${metricas.ctr}`,
        categoria: 'custos_unitarios',
      },
      {
        indicador: 'Classificação de Eficiência',
        valor: metricas.classificacao_eficiencia,
        categoria: 'custos_unitarios',
      },
    ];

    return [...overview, ...unitCosts];
  }, [metricas]);

  const columns: ColumnDef<MetricRow>[] = useMemo(() => [
    {
      accessorKey: 'indicador',
      header: 'Indicador',
      cell: ({ row }) => <span className="font-medium">{row.original.indicador}</span>,
    },
    {
      accessorKey: 'valor',
      header: 'Valor',
      cell: ({ row }) => <span className="block text-right text-slate-700">{row.original.valor}</span>,
    },
  ], []);

  const selectedMetricConfig = useMemo<MetricOption>(() => {
    return METRIC_OPTIONS.find((option) => option.value === selectedMetric) ?? METRIC_OPTIONS[0];
  }, [selectedMetric]);

  const chartData = useMemo(() => {
    if (!metricas) return [];

    const atual = selectedMetricConfig.extractor(metricas);
    const benchmark = selectedMetricConfig.benchmark;

    return [
      { x: 'Atual', y: atual },
      { x: 'Benchmark', y: benchmark },
    ];
  }, [metricas, selectedMetricConfig]);

  const formatValue = useCallback(
    (value: number) => selectedMetricConfig.formatter(value),
    [selectedMetricConfig]
  );

  const chartRenderer = useCallback(() => {
    if (!metricas) {
      return (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-muted-foreground">
          Nenhuma métrica disponível para calcular o gráfico.
        </div>
      );
    }

    const hasValues = chartData.some((point) => Number.isFinite(point.y) && point.y !== 0);

    if (!hasValues) {
      return (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-muted-foreground">
          Valores insuficientes para gerar a comparação.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Métrica comparada</p>
            <p className="text-xs text-muted-foreground">
              Veja como o desempenho atual se posiciona em relação a um benchmark de mercado.
            </p>
          </div>
          <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricKey)}>
            <SelectTrigger size="sm" className="min-w-[220px]">
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
              title={`${selectedMetricConfig.label}: Atual vs Benchmark`}
              subtitle={selectedMetricConfig.description}
              containerClassName="h-full"
              axisBottom={{
                tickRotation: 0,
                legend: 'Fonte',
                legendOffset: 36,
              }}
              axisLeft={{
                legend: selectedMetricConfig.axisLabel,
                legendOffset: -60,
                format: (value: string | number) => {
                  const numeric = typeof value === 'number' ? value : Number.parseFloat(value);
                  return formatValue(numeric);
                },
              }}
              colors={{ scheme: 'accent' }}
              padding={0.45}
              enableLabel
              labelFormat={(value: number) => formatValue(value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Benchmarks utilizados: CPM ≈ R$ {BENCHMARKS.cpm}, CPC ≈ R$ {BENCHMARKS.cpc}, CPA ≈ R$ {BENCHMARKS.cpa}, CTR ≈ {BENCHMARKS.ctr}%.
          </p>
        </div>
      </div>
    );
  }, [chartData, formatValue, metricas, selectedMetric, selectedMetricConfig]);

  const periodoTexto = periodo_dias ? `${periodo_dias} dias` : 'período não informado';
  const plataformaTexto = plataforma?.trim() ? plataforma : 'Todas as plataformas';
  const classificacao = metricas?.classificacao_eficiencia ?? 'Sem classificação';

  const summaryMessage = success
    ? `${message} • Plataforma: ${plataformaTexto} • Período: ${periodoTexto} • Classificação de eficiência: ${classificacao}`
    : message;

  return (
    <ArtifactDataTable<MetricRow>
      data={tableData}
      columns={columns}
      title="Métricas de Custo"
      icon={Gauge}
      iconColor="text-cyan-600"
      message={summaryMessage}
      success={success}
      count={tableData.length}
      exportFileName="paid-traffic-cost-metrics"
      pageSize={Math.min(10, Math.max(tableData.length, 6))}
      chartRenderer={chartRenderer}
    />
  );
}
