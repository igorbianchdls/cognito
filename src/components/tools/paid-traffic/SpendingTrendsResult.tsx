'use client';

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart } from '@/components/charts/BarChart';
import { Activity } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SpendingTrendsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  plataforma?: string;
  estatisticas?: {
    gasto_medio_dia: string;
    gasto_maximo: string;
    gasto_minimo: string;
    tendencia: string;
  };
  gastos_diarios?: Array<{
    data: string;
    gasto: string;
    receita: string;
  }>;
}

type TrendRow = {
  data: string;
  gasto: string;
  receita: string;
  roas: string;
};

const METRIC_OPTIONS = [
  {
    value: 'gasto',
    label: 'Gasto Diário',
    axisLabel: 'Gasto (R$)',
    description: 'Investimento diário em mídia paga.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'receita',
    label: 'Receita Diária',
    axisLabel: 'Receita (R$)',
    description: 'Receita atribuída por dia.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'roas',
    label: 'ROAS Diário',
    axisLabel: 'ROAS (x)',
    description: 'Retorno sobre investimento calculado diariamente.',
    formatter: (value: number) => `${value.toFixed(2)}x`,
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

const formatDateLabel = (isoDate: string) => {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return isoDate;
  return date.toLocaleDateString('pt-BR');
};

export default function SpendingTrendsResult({
  success,
  message,
  periodo_dias,
  plataforma,
  estatisticas,
  gastos_diarios,
}: SpendingTrendsResultProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('gasto');

  const tableData: TrendRow[] = useMemo(() => {
    if (!gastos_diarios || gastos_diarios.length === 0) return [];

    return gastos_diarios.map((registro) => {
      const gastoValue = parseNumericValue(registro.gasto);
      const receitaValue = parseNumericValue(registro.receita);
      const roas = gastoValue > 0 ? receitaValue / gastoValue : 0;

      return {
        data: formatDateLabel(registro.data),
        gasto: registro.gasto,
        receita: registro.receita,
        roas: `${roas.toFixed(2)}`,
      };
    });
  }, [gastos_diarios]);

  const columns: ColumnDef<TrendRow>[] = useMemo(() => [
    {
      accessorKey: 'data',
      header: 'Data',
      cell: ({ row }) => <span className="font-medium">{row.original.data}</span>,
    },
    {
      accessorKey: 'gasto',
      header: 'Gasto (R$)',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-slate-700">R$ {row.original.gasto}</span>
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
      accessorKey: 'roas',
      header: 'ROAS',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-purple-600">{row.original.roas}x</span>
      ),
    },
  ], []);

  const metricValuesByDay = useMemo(() => {
    if (tableData.length === 0) return [];

    return tableData.map((row) => ({
      label: row.data,
      metrics: {
        gasto: parseNumericValue(row.gasto),
        receita: parseNumericValue(row.receita),
        roas: parseNumericValue(row.roas),
      } satisfies Record<MetricKey, number>,
    }));
  }, [tableData]);

  const selectedMetricConfig = useMemo<MetricOption>(() => {
    return METRIC_OPTIONS.find((option) => option.value === selectedMetric) ?? METRIC_OPTIONS[0];
  }, [selectedMetric]);

  const chartData = useMemo(
    () =>
      metricValuesByDay.map(({ label, metrics }) => ({
        x: label,
        y: metrics[selectedMetric] ?? 0,
      })),
    [metricValuesByDay, selectedMetric]
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
          Não há registros suficientes para gerar o gráfico.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Métrica do gráfico</p>
            <p className="text-xs text-muted-foreground">
              Visualize a tendência diária de gasto, receita ou ROAS.
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
              title={`${selectedMetricConfig.label} por Dia`}
              subtitle={selectedMetricConfig.description}
              containerClassName="h-full"
              axisBottom={{
                tickRotation: -45,
                legend: 'Data',
                legendOffset: 48,
              }}
              axisLeft={{
                legend: selectedMetricConfig.axisLabel,
                legendOffset: -60,
                format: (value: string | number) =>
                  formatForMetric(typeof value === 'number' ? value : Number.parseFloat(value)),
              }}
              colors={{ scheme: 'nivo' }}
              padding={0.2}
              enableLabel={false}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Os valores exibidos correspondem aos registros retornados pela consulta SQL.
          </p>
        </div>
      </div>
    );
  }, [chartData, formatForMetric, selectedMetric, selectedMetricConfig]);

  const periodoTexto = periodo_dias ? `${periodo_dias} dias` : 'período não informado';
  const plataformaTexto = plataforma?.trim() ? plataforma : 'Todas as plataformas';
  const tendencia = estatisticas?.tendencia ?? 'Sem tendência calculada';
  const gastoMedio = estatisticas?.gasto_medio_dia
    ? `Gasto médio/dia: R$ ${estatisticas.gasto_medio_dia}`
    : 'Gasto médio não informado';
  const totalRegistros = tableData.length;

  const summaryMessage = success
    ? `${message} • Plataforma: ${plataformaTexto} • Período analisado: ${periodoTexto} • Tendência: ${tendencia} • ${gastoMedio} • Registros: ${totalRegistros}`
    : message;

  return (
    <ArtifactDataTable<TrendRow>
      data={tableData}
      columns={columns}
      title="Tendências de Gasto"
      icon={Activity}
      iconColor="text-indigo-600"
      message={summaryMessage}
      success={success}
      count={tableData.length}
      exportFileName="paid-traffic-spending-trends"
      pageSize={Math.min(15, Math.max(tableData.length, 8))}
      chartRenderer={chartRenderer}
    />
  );
}
