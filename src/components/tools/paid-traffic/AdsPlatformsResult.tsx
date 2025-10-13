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
// Removed date controls to keep UI simple

interface AdsPlatformsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_plataformas?: number;
  melhor_plataforma?: string;
  pior_plataforma?: string;
  sql_query?: string;
  plataformas?: Array<{
    plataforma: string | null;
    total_impressoes: number | string | null;
    total_cliques: number | string | null;
    total_conversoes: number | string | null;
    total_gasto: number | string | null;
    total_receita: number | string | null;
    ctr: number | string | null;
    cpc: number | string | null;
    cpa: number | string | null;
    roas: number | string | null;
    lucro: number | string | null;
  }>;
}

type PlatformRow = Record<string, unknown> & {
  plataforma: string | null;
  total_impressoes: number | string | null;
  total_cliques: number | string | null;
  total_conversoes: number | string | null;
  total_gasto: number | string | null;
  total_receita: number | string | null;
  ctr: number | string | null;
  cpc: number | string | null;
  cpa: number | string | null;
  roas: number | string | null;
  lucro: number | string | null;
};

// (Sem classificação na resposta da query)

const METRIC_OPTIONS = [
  { value: 'roas', label: 'roas', axisLabel: 'roas', description: 'Retorno sobre gasto', formatter: (v: number) => v.toFixed(2) },
  { value: 'total_gasto', label: 'total_gasto', axisLabel: 'total_gasto', description: 'Soma do gasto', formatter: (v: number) => v.toFixed(2) },
  { value: 'total_receita', label: 'total_receita', axisLabel: 'total_receita', description: 'Soma da receita', formatter: (v: number) => v.toFixed(2) },
  { value: 'total_conversoes', label: 'total_conversoes', axisLabel: 'total_conversoes', description: 'Soma das conversões', formatter: (v: number) => v.toFixed(0) },
  { value: 'total_impressoes', label: 'total_impressoes', axisLabel: 'total_impressoes', description: 'Soma das impressões', formatter: (v: number) => v.toFixed(0) },
  { value: 'total_cliques', label: 'total_cliques', axisLabel: 'total_cliques', description: 'Soma dos cliques', formatter: (v: number) => v.toFixed(0) },
  { value: 'ctr', label: 'ctr', axisLabel: 'ctr', description: 'Taxa de cliques', formatter: (v: number) => v.toFixed(2) },
  { value: 'cpc', label: 'cpc', axisLabel: 'cpc', description: 'Custo por clique', formatter: (v: number) => v.toFixed(2) },
  { value: 'cpa', label: 'cpa', axisLabel: 'cpa', description: 'Custo por aquisição', formatter: (v: number) => v.toFixed(2) },
  { value: 'lucro', label: 'lucro', axisLabel: 'lucro', description: 'Lucro bruto', formatter: (v: number) => v.toFixed(2) },
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
  // No date controls here to avoid complexity in /nexus

  const tableData: PlatformRow[] = useMemo(() => {
    if (!plataformas || plataformas.length === 0) return [] as PlatformRow[];
    return plataformas as unknown as PlatformRow[];
  }, [plataformas]);

  const columns: ColumnDef<PlatformRow>[] = useMemo(() => [
    { accessorKey: 'plataforma', header: 'plataforma', cell: ({ row }) => <span>{String(row.getValue('plataforma') ?? '')}</span> },
    { accessorKey: 'total_impressoes', header: 'total_impressoes', cell: ({ row }) => <span className="block text-right">{String(row.getValue('total_impressoes') ?? '')}</span> },
    { accessorKey: 'total_cliques', header: 'total_cliques', cell: ({ row }) => <span className="block text-right">{String(row.getValue('total_cliques') ?? '')}</span> },
    { accessorKey: 'total_conversoes', header: 'total_conversoes', cell: ({ row }) => <span className="block text-right">{String(row.getValue('total_conversoes') ?? '')}</span> },
    { accessorKey: 'total_gasto', header: 'total_gasto', cell: ({ row }) => <span className="block text-right">{String(row.getValue('total_gasto') ?? '')}</span> },
    { accessorKey: 'total_receita', header: 'total_receita', cell: ({ row }) => <span className="block text-right">{String(row.getValue('total_receita') ?? '')}</span> },
    { accessorKey: 'ctr', header: 'ctr', cell: ({ row }) => <span className="block text-right">{String(row.getValue('ctr') ?? '')}</span> },
    { accessorKey: 'cpc', header: 'cpc', cell: ({ row }) => <span className="block text-right">{String(row.getValue('cpc') ?? '')}</span> },
    { accessorKey: 'cpa', header: 'cpa', cell: ({ row }) => <span className="block text-right">{String(row.getValue('cpa') ?? '')}</span> },
    { accessorKey: 'roas', header: 'roas', cell: ({ row }) => <span className="block text-right">{String(row.getValue('roas') ?? '')}</span> },
    { accessorKey: 'lucro', header: 'lucro', cell: ({ row }) => <span className="block text-right">{String(row.getValue('lucro') ?? '')}</span> },
  ], []);

  const tableMessage = useMemo(() => {
    const totalTexto = total_plataformas ?? tableData.length;
    const melhorTexto = melhor_plataforma?.trim() ? melhor_plataforma : 'Sem destaque';
    const piorTexto = pior_plataforma?.trim() ? pior_plataforma : 'Sem destaque';

    return `Total de plataformas: ${totalTexto} • Melhor: ${melhorTexto} • Pior: ${piorTexto}`;
  }, [total_plataformas, melhor_plataforma, pior_plataforma, tableData.length]);

  const platformMetricData = useMemo(() => {
    if (!plataformas || plataformas.length === 0) return [] as Array<{ label: string; metrics: Record<MetricKey, number> }>;
    return plataformas.map((plat) => {
      const label = (typeof plat.plataforma === 'string' && plat.plataforma.trim()) ? plat.plataforma : 'Não informada';
      return {
        label,
        metrics: {
          roas: parseNumericValue(plat.roas),
          total_gasto: parseNumericValue(plat.total_gasto),
          total_receita: parseNumericValue(plat.total_receita),
          total_conversoes: parseNumericValue(plat.total_conversoes),
          total_impressoes: parseNumericValue(plat.total_impressoes),
          total_cliques: parseNumericValue(plat.total_cliques),
          ctr: parseNumericValue(plat.ctr),
          cpc: parseNumericValue(plat.cpc),
          cpa: parseNumericValue(plat.cpa),
          lucro: parseNumericValue(plat.lucro),
        } as Record<MetricKey, number>,
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm font-medium text-slate-700">Métrica do gráfico</p>
              <p className="text-xs text-muted-foreground">Compare as plataformas pela métrica desejada.</p>
            </div>
            <Select value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricKey)}>
              <SelectTrigger size="sm" className="min-w-[180px]">
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
