'use client';

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart } from '@/components/charts/BarChart';
import { LineChart } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdPerformanceForecastResultProps {
  success: boolean;
  message: string;
  lookback_days?: number;
  forecast_days?: number;
  plataforma?: string;
  historico?: {
    gasto_medio_dia: string;
    conversoes_medio_dia: string;
    roas_medio: string;
  };
  previsao?: {
    gasto_previsto: string;
    conversoes_previstas: number;
    receita_prevista: string;
    roas_esperado: string;
  };
}

type ForecastRow = {
  categoria: string;
  indicador: string;
  valor: string;
};

const METRIC_OPTIONS = [
  {
    value: 'gasto',
    label: 'Gasto',
    axisLabel: 'Gasto (R$)',
    description: 'Compara gasto histórico médio com o valor previsto.',
    historicoExtractor: (historico: AdPerformanceForecastResultProps['historico']) =>
      historico ? parseCurrency(historico.gasto_medio_dia) : 0,
    previsaoExtractor: (previsao: AdPerformanceForecastResultProps['previsao']) =>
      previsao ? parseCurrency(previsao.gasto_previsto) : 0,
    historicoFormatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    previsaoFormatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'receita',
    label: 'Receita',
    axisLabel: 'Receita (R$)',
    description: 'Receita prevista versus média histórica (gasto * ROAS).',
    historicoExtractor: (historico) => {
      if (!historico) return 0;
      const gasto = parseCurrency(historico.gasto_medio_dia);
      const roas = parseNumeric(historico.roas_medio);
      return gasto * roas;
    },
    previsaoExtractor: (previsao) =>
      previsao ? parseCurrency(previsao.receita_prevista) : 0,
    historicoFormatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    previsaoFormatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'conversoes',
    label: 'Conversões',
    axisLabel: 'Conversões',
    description: 'Comparação entre conversões diárias médias e previstas.',
    historicoExtractor: (historico) =>
      historico ? parseNumeric(historico.conversoes_medio_dia) : 0,
    previsaoExtractor: (previsao) =>
      previsao ? Number(previsao.conversoes_previstas ?? 0) : 0,
    historicoFormatter: (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 1 }),
    previsaoFormatter: (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
  },
  {
    value: 'roas',
    label: 'ROAS',
    axisLabel: 'ROAS (x)',
    description: 'ROAS médio histórico comparado com o esperado.',
    historicoExtractor: (historico) =>
      historico ? parseNumeric(historico.roas_medio) : 0,
    previsaoExtractor: (previsao) =>
      previsao ? parseNumeric(previsao.roas_esperado) : 0,
    historicoFormatter: (value: number) => `${value.toFixed(2)}x`,
    previsaoFormatter: (value: number) => `${value.toFixed(2)}x`,
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

function parseNumeric(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  const normalized = value.replace(/\s/g, '').replace(',', '.').replace('x', '');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function AdPerformanceForecastResult({
  success,
  message,
  lookback_days,
  forecast_days,
  plataforma,
  historico,
  previsao,
}: AdPerformanceForecastResultProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('gasto');

  const tableData: ForecastRow[] = useMemo(() => {
    const rows: ForecastRow[] = [];

    if (historico) {
      rows.push(
        {
          categoria: 'Histórico (média diária)',
          indicador: 'Gasto médio por dia',
          valor: `R$ ${historico.gasto_medio_dia}`,
        },
        {
          categoria: 'Histórico (média diária)',
          indicador: 'Conversões médias por dia',
          valor: historico.conversoes_medio_dia,
        },
        {
          categoria: 'Histórico (média diária)',
          indicador: 'ROAS médio',
          valor: `${historico.roas_medio}x`,
        }
      );
    }

    if (previsao) {
      rows.push(
        {
          categoria: `Previsão (${forecast_days ?? 0} dias)`,
          indicador: 'Gasto previsto',
          valor: `R$ ${previsao.gasto_previsto}`,
        },
        {
          categoria: `Previsão (${forecast_days ?? 0} dias)`,
          indicador: 'Receita prevista',
          valor: `R$ ${previsao.receita_prevista}`,
        },
        {
          categoria: `Previsão (${forecast_days ?? 0} dias)`,
          indicador: 'Conversões previstas',
          valor: previsao.conversoes_previstas.toLocaleString('pt-BR'),
        },
        {
          categoria: `Previsão (${forecast_days ?? 0} dias)`,
          indicador: 'ROAS esperado',
          valor: `${previsao.roas_esperado}x`,
        },
        {
          categoria: `Previsão (${forecast_days ?? 0} dias)`,
          indicador: 'Retorno líquido estimado',
          valor: `R$ ${(parseCurrency(previsao.receita_prevista) - parseCurrency(previsao.gasto_previsto)).toFixed(2)}`,
        }
      );
    }

    return rows;
  }, [forecast_days, historico, previsao]);

  const columns: ColumnDef<ForecastRow>[] = useMemo(() => [
    {
      accessorKey: 'categoria',
      header: 'Categoria',
      cell: ({ row }) => <span className="text-xs font-medium uppercase text-muted-foreground">{row.original.categoria}</span>,
    },
    {
      accessorKey: 'indicador',
      header: 'Indicador',
      cell: ({ row }) => <span className="font-medium text-slate-800">{row.original.indicador}</span>,
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
    const historicoValue = selectedMetricConfig.historicoExtractor(historico);
    const previsaoValue = selectedMetricConfig.previsaoExtractor(previsao);

    return [
      { x: 'Histórico', y: historicoValue },
      { x: 'Previsão', y: previsaoValue },
    ];
  }, [historico, previsao, selectedMetricConfig]);

  const chartRenderer = useCallback(() => {
    const hasValues = chartData.some((point) => Number.isFinite(point.y) && point.y !== 0);

    if (!hasValues) {
      return (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-muted-foreground">
          Não há dados suficientes para gerar a projeção gráfica.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Métrica projetada</p>
            <p className="text-xs text-muted-foreground">
              Compare valores médios históricos com as estimativas futuras.
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
              title={`${selectedMetricConfig.label}: Histórico vs. Previsão`}
              subtitle={selectedMetricConfig.description}
              containerClassName="h-full"
              axisBottom={{
                tickRotation: 0,
                legend: 'Período',
                legendOffset: 36,
              }}
              axisLeft={{
                legend: selectedMetricConfig.axisLabel,
                legendOffset: -60,
                format: (value: string | number) => {
                  const numericValue = typeof value === 'number' ? value : Number.parseFloat(value);
                  return selectedMetricConfig.previsaoFormatter(numericValue);
                },
              }}
              colors={{ scheme: 'category10' }}
              padding={0.5}
              enableLabel
              labelFormat={(value: number) => selectedMetricConfig.previsaoFormatter(value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            As projeções consideram o comportamento médio dos últimos {lookback_days ?? 0} dias.
          </p>
        </div>
      </div>
    );
  }, [chartData, lookback_days, selectedMetric, selectedMetricConfig]);

  const plataformaTexto = plataforma?.trim() ? plataforma : 'Todas as plataformas';
  const periodoHistorico = lookback_days ? `${lookback_days} dias` : 'período histórico não informado';
  const periodoPrevisao = forecast_days ? `${forecast_days} dias` : 'previsão não informada';

  const summaryMessage = success
    ? `${message} • Plataforma: ${plataformaTexto} • Histórico considerado: ${periodoHistorico} • Janela de previsão: ${periodoPrevisao}`
    : message;

  return (
    <ArtifactDataTable<ForecastRow>
      data={tableData}
      columns={columns}
      title="Previsão de Performance"
      icon={LineChart}
      iconColor="text-violet-600"
      message={summaryMessage}
      success={success}
      count={tableData.length}
      exportFileName="paid-traffic-forecast"
      pageSize={Math.min(10, Math.max(tableData.length, 6))}
      chartRenderer={chartRenderer}
    />
  );
}
