'use client';

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart } from '@/components/charts/BarChart';
import { BarChart3 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AdsPlatformsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_plataformas?: number;
  melhor_plataforma?: string;
  pior_plataforma?: string;
  sql_query?: string;
  plataformas?: Array<{
    plataforma: string;
    gasto: string;
    receita: string;
    conversoes: number;
    roas: string;
    ctr: string;
    conversion_rate: string;
    classificacao: string;
  }>;
}

type PlatformRow = Record<string, unknown> & {
  rank: number;
  plataforma: string;
  gasto: string;
  receita: string;
  conversoes: number;
  roas: string;
  ctr: string;
  conversion_rate: string;
  classificacao: string;
};

const getClassificationBadgeClasses = (classification: string) => {
  const value = classification.toLowerCase();

  if (value === 'excelente') {
    return 'text-green-600 bg-green-100 border-green-300';
  }

  if (value === 'boa') {
    return 'text-blue-600 bg-blue-100 border-blue-300';
  }

  if (value === 'regular') {
    return 'text-yellow-600 bg-yellow-100 border-yellow-300';
  }

  return 'text-red-600 bg-red-100 border-red-300';
};

const METRIC_OPTIONS = [
  {
    value: 'roas',
    label: 'ROAS',
    axisLabel: 'ROAS (x)',
    description: 'Mostra o retorno sobre o investimento de mídia em cada plataforma.',
    formatter: (value: number) => `${value.toFixed(2)}x`,
  },
  {
    value: 'gasto',
    label: 'Gasto Total',
    axisLabel: 'Gasto (R$)',
    description: 'Quanto foi investido em mídia paga por plataforma.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'receita',
    label: 'Receita Total',
    axisLabel: 'Receita (R$)',
    description: 'Receita atribuída às campanhas em cada plataforma.',
    formatter: (value: number) =>
      value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
  },
  {
    value: 'conversoes',
    label: 'Conversões',
    axisLabel: 'Conversões',
    description: 'Número de conversões atribuídas à plataforma.',
    formatter: (value: number) => value.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
  },
  {
    value: 'ctr',
    label: 'CTR',
    axisLabel: 'CTR (%)',
    description: 'Taxa de cliques sobre impressões em cada plataforma.',
    formatter: (value: number) => `${value.toFixed(2)}%`,
  },
  {
    value: 'conversion_rate',
    label: 'Taxa de Conversão',
    axisLabel: 'Taxa de Conversão (%)',
    description: 'Percentual de cliques que geraram conversão.',
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

export default function AdsPlatformsResult({
  success,
  message,
  periodo_dias,
  total_plataformas,
  melhor_plataforma,
  pior_plataforma,
  plataformas,
  sql_query
}: AdsPlatformsResultProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('roas');

  const tableData: PlatformRow[] = useMemo(() => {
    if (!plataformas || plataformas.length === 0) return [];

    return plataformas.map((plat, idx) => ({
      rank: idx + 1,
      plataforma: plat.plataforma?.trim() ? plat.plataforma : 'Não informada',
      gasto: plat.gasto,
      receita: plat.receita,
      conversoes: plat.conversoes,
      roas: plat.roas,
      ctr: plat.ctr,
      conversion_rate: plat.conversion_rate,
      classificacao: plat.classificacao || 'Não classificada',
    }));
  }, [plataformas]);

  const columns: ColumnDef<PlatformRow>[] = useMemo(() => [
    {
      accessorKey: 'rank',
      header: '#',
      cell: ({ row }) => (
        <span className="font-semibold text-sm text-muted-foreground">
          #{row.original.rank}
        </span>
      ),
      enableSorting: false,
      size: 40,
    },
    {
      accessorKey: 'plataforma',
      header: 'Plataforma',
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.plataforma}
        </span>
      ),
    },
    {
      accessorKey: 'gasto',
      header: 'Gasto (R$)',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-rose-600">
          R$ {row.original.gasto}
        </span>
      ),
    },
    {
      accessorKey: 'receita',
      header: 'Receita (R$)',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-green-600">
          R$ {row.original.receita}
        </span>
      ),
    },
    {
      accessorKey: 'conversoes',
      header: 'Conversões',
      cell: ({ row }) => (
        <span className="block text-right font-medium">
          {row.original.conversoes.toLocaleString('pt-BR')}
        </span>
      ),
    },
    {
      accessorKey: 'roas',
      header: 'ROAS',
      cell: ({ row }) => (
        <span className="block text-right font-semibold text-purple-600">
          {row.original.roas}x
        </span>
      ),
    },
    {
      accessorKey: 'ctr',
      header: 'CTR',
      cell: ({ row }) => (
        <span className="block text-right">
          {row.original.ctr}
        </span>
      ),
    },
    {
      accessorKey: 'conversion_rate',
      header: 'Taxa de Conversão',
      cell: ({ row }) => (
        <span className="block text-right">
          {row.original.conversion_rate}
        </span>
      ),
    },
    {
      accessorKey: 'classificacao',
      header: 'Classificação',
      cell: ({ row }) => (
        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getClassificationBadgeClasses(row.original.classificacao)}`}>
          {row.original.classificacao}
        </span>
      ),
      enableSorting: false,
    },
  ], []);

  const tableMessage = useMemo(() => {
    const periodoTexto = periodo_dias ? `${periodo_dias} dias` : 'período não informado';
    const totalTexto = total_plataformas ?? tableData.length;
    const melhorTexto = melhor_plataforma?.trim() ? melhor_plataforma : 'Sem destaque';
    const piorTexto = pior_plataforma?.trim() ? pior_plataforma : 'Sem destaque';

    return `Período analisado: ${periodoTexto} • Total de plataformas: ${totalTexto} • Melhor: ${melhorTexto} • Pior: ${piorTexto}`;
  }, [periodo_dias, total_plataformas, melhor_plataforma, pior_plataforma, tableData.length]);

  const platformMetricData = useMemo(() => {
    if (!plataformas || plataformas.length === 0) return [];

    return plataformas.map((plat) => {
      const label = plat.plataforma?.trim() ? plat.plataforma : 'Não informada';

      return {
        label,
        metrics: {
          roas: parseNumericValue(plat.roas),
          gasto: parseNumericValue(plat.gasto),
          receita: parseNumericValue(plat.receita),
          conversoes: parseNumericValue(plat.conversoes),
          ctr: parseNumericValue(plat.ctr),
          conversion_rate: parseNumericValue(plat.conversion_rate),
        } satisfies Record<MetricKey, number>,
      };
    });
  }, [plataformas]);

  const selectedMetricConfig = useMemo<MetricOption>(() => {
    return METRIC_OPTIONS.find((option) => option.value === selectedMetric) ?? METRIC_OPTIONS[0];
  }, [selectedMetric]);

  const chartData = useMemo(
    () =>
      platformMetricData.map(({ label, metrics }) => ({
        x: label,
        y: metrics[selectedMetric] ?? 0,
      })),
    [platformMetricData, selectedMetric]
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
          Não há dados suficientes para gerar o gráfico no momento.
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-700">Métrica do gráfico</p>
            <p className="text-xs text-muted-foreground">
              Compare as plataformas pela métrica desejada.
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
              title={`${selectedMetricConfig.label} por Plataforma`}
              subtitle={selectedMetricConfig.description}
              containerClassName="h-full"
              axisBottom={{
                tickRotation: -25,
                legend: 'Plataforma',
                legendOffset: 36,
              }}
              axisLeft={{
                legend: selectedMetricConfig.axisLabel,
                legendOffset: -60,
                format: (value: string | number) =>
                  formatForMetric(typeof value === 'number' ? value : Number.parseFloat(value)),
              }}
              colors={{ scheme: 'nivo' }}
              padding={0.3}
              enableLabel
              labelFormat={(value: number) => formatForMetric(value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Valores exibidos com base na mesma consulta SQL utilizada para a tabela.
          </p>
        </div>
      </div>
    );
  }, [chartData, formatForMetric, selectedMetric, selectedMetricConfig]);

  return (
    <div className="space-y-4">
      <ArtifactDataTable
        data={tableData}
        columns={columns}
        title="Benchmark de Plataformas"
        icon={BarChart3}
      iconColor="text-purple-600"
      message={success ? tableMessage : message}
      success={success}
      count={tableData.length}
      exportFileName="paid-traffic-platforms"
      pageSize={Math.min(10, Math.max(tableData.length, 5))}
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
    </div>
  );
}
