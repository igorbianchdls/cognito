'use client';

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart } from '@/components/charts/BarChart';
import { Target } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CampaignROASResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  total_campanhas?: number;
  melhor_campanha?: string;
  campanhas?: Array<{
    campanha_id: string;
    gasto: string;
    receita: string;
    conversoes: number;
    roas: string;
    custo_por_conversao: string;
    ctr: string;
    classificacao: string;
  }>;
}

type CampaignRow = {
  rank: number;
  campanha: string;
  gasto: string;
  receita: string;
  conversoes: number;
  roas: string;
  custo_por_conversao: string;
  ctr: string;
  classificacao: string;
};

const METRIC_OPTIONS = [
  {
    value: 'roas',
    label: 'ROAS',
    axisLabel: 'ROAS (x)',
    description: 'Retorno sobre investimento por campanha.',
    formatter: (value: number) => `${value.toFixed(2)}x`,
  },
  {
    value: 'gasto',
    label: 'Gasto Total',
    axisLabel: 'Gasto (R$)',
    description: 'Investimento total em mídia por campanha.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'receita',
    label: 'Receita Total',
    axisLabel: 'Receita (R$)',
    description: 'Receita atribuída à campanha.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'conversoes',
    label: 'Conversões',
    axisLabel: 'Conversões',
    description: 'Quantidade de conversões geradas.',
    formatter: (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
  },
  {
    value: 'custo_por_conversao',
    label: 'Custo por Conversão',
    axisLabel: 'Custo por Conversão (R$)',
    description: 'Investimento necessário para gerar cada conversão.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'ctr',
    label: 'CTR',
    axisLabel: 'CTR (%)',
    description: 'Taxa de cliques das campanhas.',
    formatter: (value: number) => `${value.toFixed(2)}%`,
  },
] as const;

type MetricOption = (typeof METRIC_OPTIONS)[number];
type MetricKey = MetricOption['value'];

const getClassificationBadgeClasses = (classification: string) => {
  const value = classification.toLowerCase();

  if (value === 'excelente') return 'border-green-300 bg-green-50 text-green-700';
  if (value === 'bom') return 'border-blue-300 bg-blue-50 text-blue-700';
  if (value === 'regular') return 'border-yellow-300 bg-yellow-50 text-yellow-700';

  return 'border-slate-300 bg-slate-100 text-slate-700';
};

const parseNumericValue = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const compact = value.replace(/\s/g, '');
    let sanitized = compact.replace(/[^0-9,.-]/g, '');

    if (sanitized.includes('.') && sanitized.includes(',')) {
      const lastComma = sanitized.lastIndexOf(',');
      const lastDot = sanitized.lastIndexOf('.');
      if (lastComma > lastDot) {
        sanitized = sanitized.replace(/\./g, '').replace(',', '.');
      } else {
        sanitized = sanitized.replace(/,/g, '');
      }
    } else {
      sanitized = sanitized.replace(',', '.');
    }

    const parsed = Number.parseFloat(sanitized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

export default function CampaignROASResult({
  success,
  message,
  periodo_dias,
  plataforma,
  total_campanhas,
  melhor_campanha,
  campanhas,
}: CampaignROASResultProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('roas');

  const tableData: CampaignRow[] = useMemo(() => {
    if (!campanhas || campanhas.length === 0) return [];

    return campanhas.map((campanha, idx) => ({
      rank: idx + 1,
      campanha: campanha.campanha_id ?? `Campanha ${idx + 1}`,
      gasto: campanha.gasto,
      receita: campanha.receita,
      conversoes: campanha.conversoes,
      roas: campanha.roas,
      custo_por_conversao: campanha.custo_por_conversao,
      ctr: campanha.ctr,
      classificacao: campanha.classificacao || 'Não classificada',
    }));
  }, [campanhas]);

  const columns: ColumnDef<CampaignRow>[] = useMemo(() => [
    {
      accessorKey: 'rank',
      header: '#',
      cell: ({ row }) => (
        <span className="font-semibold text-muted-foreground">#{row.original.rank}</span>
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: 'campanha',
      header: 'Campanha',
      cell: ({ row }) => <span className="font-medium">{row.original.campanha}</span>,
    },
    {
      accessorKey: 'gasto',
      header: 'Gasto (R$)',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-rose-600">R$ {row.original.gasto}</span>
      ),
    },
    {
      accessorKey: 'receita',
      header: 'Receita (R$)',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-emerald-600">R$ {row.original.receita}</span>
      ),
    },
    {
      accessorKey: 'conversoes',
      header: 'Conversões',
      cell: ({ row }) => (
        <span className="block text-right">{row.original.conversoes.toLocaleString('pt-BR')}</span>
      ),
    },
    {
      accessorKey: 'roas',
      header: 'ROAS',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-purple-600">{row.original.roas}x</span>
      ),
    },
    {
      accessorKey: 'custo_por_conversao',
      header: 'Custo/Conversão',
      cell: ({ row }) => (
        <span className="block text-right">R$ {row.original.custo_por_conversao}</span>
      ),
    },
    {
      accessorKey: 'ctr',
      header: 'CTR',
      cell: ({ row }) => <span className="block text-right">{row.original.ctr}</span>,
    },
    {
      accessorKey: 'classificacao',
      header: 'Classificação',
      cell: ({ row }) => (
        <span
          className={`rounded-full border px-2 py-1 text-xs font-medium ${getClassificationBadgeClasses(
            row.original.classificacao
          )}`}
        >
          {row.original.classificacao}
        </span>
      ),
      enableSorting: false,
    },
  ], []);

  const metricValuesByCampaign = useMemo(() => {
    if (tableData.length === 0) return [];

    return tableData.map((row) => ({
      label: row.campanha,
      metrics: {
        roas: parseNumericValue(row.roas),
        gasto: parseNumericValue(row.gasto),
        receita: parseNumericValue(row.receita),
        conversoes: parseNumericValue(row.conversoes),
        custo_por_conversao: parseNumericValue(row.custo_por_conversao),
        ctr: parseNumericValue(row.ctr),
      } satisfies Record<MetricKey, number>,
    }));
  }, [tableData]);

  const selectedMetricConfig = useMemo<MetricOption>(() => {
    return METRIC_OPTIONS.find((option) => option.value === selectedMetric) ?? METRIC_OPTIONS[0];
  }, [selectedMetric]);

  const chartData = useMemo(
    () =>
      metricValuesByCampaign.map(({ label, metrics }) => ({
        x: label,
        y: metrics[selectedMetric] ?? 0,
      })),
    [metricValuesByCampaign, selectedMetric]
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
              Visualize as campanhas pela métrica desejada.
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
          <div className="h-[360px] w-full">
            <BarChart
              data={chartData}
              seriesLabel={selectedMetricConfig.label}
              title={`${selectedMetricConfig.label} por Campanha`}
              subtitle={selectedMetricConfig.description}
              containerClassName="h-full"
              axisBottom={{
                tickRotation: -25,
                legend: 'Campanha',
                legendOffset: 36,
              }}
              axisLeft={{
                legend: selectedMetricConfig.axisLabel,
                legendOffset: -60,
                format: (value: string | number) =>
                  formatForMetric(typeof value === 'number' ? value : Number.parseFloat(value)),
              }}
              colors={{ scheme: 'paired' }}
              padding={0.3}
              enableLabel
              labelFormat={(value: number) => formatForMetric(value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Valores calculados a partir do mesmo conjunto de dados apresentado na tabela.
          </p>
        </div>
      </div>
    );
  }, [chartData, formatForMetric, selectedMetric, selectedMetricConfig]);

  const periodoTexto = periodo_dias ? `${periodo_dias} dias` : 'período não informado';
  const plataformaTexto = plataforma?.trim() ? plataforma : 'Todas as plataformas';
  const melhorTexto = melhor_campanha?.trim() ? melhor_campanha : 'Sem destaque';
  const totalTexto = total_campanhas ?? tableData.length;

  const summaryMessage = success
    ? `${message} • Período: ${periodoTexto} • Plataforma: ${plataformaTexto} • Total de campanhas: ${totalTexto} • Melhor campanha: ${melhorTexto}`
    : message;

  return (
    <ArtifactDataTable<CampaignRow>
      data={tableData}
      columns={columns}
      title="Análise de ROAS por Campanha"
      icon={Target}
      iconColor="text-emerald-600"
      message={summaryMessage}
      success={success}
      count={tableData.length}
      exportFileName="paid-traffic-campaigns"
      pageSize={Math.min(10, Math.max(tableData.length, 5))}
      chartRenderer={chartRenderer}
    />
  );
}
