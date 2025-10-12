'use client';

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart } from '@/components/charts/BarChart';
import { Trophy } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TopAdsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  total_analisados?: number;
  top_anuncios?: Array<{
    anuncio_id: string;
    plataforma: string;
    gasto: string;
    receita: string;
    conversoes: number;
    roas: string;
    ctr: string;
    custo_por_conversao: string;
  }>;
}

type AdRow = {
  rank: number;
  anuncio: string;
  plataforma: string;
  gasto: string;
  receita: string;
  conversoes: number;
  roas: string;
  ctr: string;
  custo_por_conversao: string;
};

const METRIC_OPTIONS = [
  {
    value: 'roas',
    label: 'ROAS',
    axisLabel: 'ROAS (x)',
    description: 'Retorno sobre investimento por anúncio.',
    formatter: (value: number) => `${value.toFixed(2)}x`,
  },
  {
    value: 'gasto',
    label: 'Gasto',
    axisLabel: 'Gasto (R$)',
    description: 'Investimento destinado ao anúncio.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'receita',
    label: 'Receita',
    axisLabel: 'Receita (R$)',
    description: 'Receita atribuída ao anúncio.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'conversoes',
    label: 'Conversões',
    axisLabel: 'Conversões',
    description: 'Conversões geradas por anúncio.',
    formatter: (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
  },
  {
    value: 'custo_por_conversao',
    label: 'Custo por Conversão',
    axisLabel: 'Custo por Conversão (R$)',
    description: 'Custo médio de cada conversão.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'ctr',
    label: 'CTR',
    axisLabel: 'CTR (%)',
    description: 'Taxa de cliques por impressão.',
    formatter: (value: number) => `${value.toFixed(2)}%`,
  },
] as const;

type MetricOption = (typeof METRIC_OPTIONS)[number];
type MetricKey = MetricOption['value'];

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

export default function TopAdsResult({
  success,
  message,
  periodo_dias,
  plataforma,
  total_analisados,
  top_anuncios,
}: TopAdsResultProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('roas');

  const tableData: AdRow[] = useMemo(() => {
    if (!top_anuncios || top_anuncios.length === 0) return [];

    return top_anuncios.map((anuncio, idx) => ({
      rank: idx + 1,
      anuncio: anuncio.anuncio_id ?? `Anúncio ${idx + 1}`,
      plataforma: anuncio.plataforma || 'Desconhecida',
      gasto: anuncio.gasto,
      receita: anuncio.receita,
      conversoes: anuncio.conversoes,
      roas: anuncio.roas,
      ctr: anuncio.ctr,
      custo_por_conversao: anuncio.custo_por_conversao,
    }));
  }, [top_anuncios]);

  const columns: ColumnDef<AdRow>[] = useMemo(() => [
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
      accessorKey: 'anuncio',
      header: 'Anúncio',
      cell: ({ row }) => <span className="font-medium">{row.original.anuncio}</span>,
    },
    {
      accessorKey: 'plataforma',
      header: 'Plataforma',
      cell: ({ row }) => (
        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
          {row.original.plataforma}
        </span>
      ),
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
      accessorKey: 'ctr',
      header: 'CTR',
      cell: ({ row }) => <span className="block text-right">{row.original.ctr}</span>,
    },
    {
      accessorKey: 'custo_por_conversao',
      header: 'Custo/Conv.',
      cell: ({ row }) => (
        <span className="block text-right">R$ {row.original.custo_por_conversao}</span>
      ),
    },
  ], []);

  const metricValuesByAd = useMemo(() => {
    if (tableData.length === 0) return [];

    return tableData.map((row) => ({
      label: row.anuncio,
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
      metricValuesByAd.map(({ label, metrics }) => ({
        x: label,
        y: metrics[selectedMetric] ?? 0,
      })),
    [metricValuesByAd, selectedMetric]
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
              Compare os principais anúncios pela métrica desejada.
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
              title={`${selectedMetricConfig.label} por Anúncio`}
              subtitle={selectedMetricConfig.description}
              containerClassName="h-full"
              axisBottom={{
                tickRotation: -25,
                legend: 'Anúncio',
                legendOffset: 36,
              }}
              axisLeft={{
                legend: selectedMetricConfig.axisLabel,
                legendOffset: -60,
                format: (value: string | number) =>
                  formatForMetric(typeof value === 'number' ? value : Number.parseFloat(value)),
              }}
              colors={{ scheme: 'set2' }}
              padding={0.3}
              enableLabel
              labelFormat={(value: number) => formatForMetric(value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Dados consolidados a partir do resultado do agente de tráfego pago.
          </p>
        </div>
      </div>
    );
  }, [chartData, formatForMetric, selectedMetric, selectedMetricConfig]);

  const periodoTexto = periodo_dias ? `${periodo_dias} dias` : 'período não informado';
  const plataformaTexto = plataforma?.trim() ? plataforma : 'Todas as plataformas';
  const totalTop = tableData.length;
  const analisadosTexto = total_analisados ?? totalTop;

  const summaryMessage = success
    ? `${message} • Top ${totalTop} anúncios de ${analisadosTexto} avaliados • Plataforma: ${plataformaTexto} • Período: ${periodoTexto}`
    : message;

  return (
    <ArtifactDataTable<AdRow>
      data={tableData}
      columns={columns}
      title="Ranking de Anúncios"
      icon={Trophy}
      iconColor="text-amber-600"
      message={summaryMessage}
      success={success}
      count={tableData.length}
      exportFileName="paid-traffic-top-ads"
      pageSize={Math.min(10, Math.max(tableData.length, 5))}
      chartRenderer={chartRenderer}
    />
  );
}
