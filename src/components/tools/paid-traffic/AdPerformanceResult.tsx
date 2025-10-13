"use client";

import { useCallback, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart } from '@/components/charts/BarChart';
import { BarChart3 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdPerformanceResultProps {
  success: boolean;
  message: string;
  rows?: Array<Record<string, unknown>>;
  count?: number;
}

type PerfRow = {
  campanha: string;
  plataforma: string;
  total_impressoes: string | number;
  total_cliques: string | number;
  total_conversoes: string | number;
  total_gasto: string | number;
  total_receita: string | number;
  ctr: string | number;
  taxa_conversao: string | number;
  cpc: string | number;
  cpa: string | number;
  roas: string | number;
  lucro: string | number;
  cpm: string | number;
  ticket_medio: string | number;
  frequencia_media: string | number;
  engajamento_total: string | number;
};

const METRIC_OPTIONS = [
  { value: 'roas', label: 'ROAS', axisLabel: 'ROAS (x)', description: 'Retorno sobre investimento.', format: (n: number) => `${n.toFixed(2)}x` },
  { value: 'total_gasto', label: 'Gasto', axisLabel: 'Gasto (R$)', description: 'Investimento em mídia.', format: (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { value: 'total_receita', label: 'Receita', axisLabel: 'Receita (R$)', description: 'Receita atribuída.', format: (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { value: 'total_conversoes', label: 'Conversões', axisLabel: 'Conversões', description: 'Quantidade de conversões.', format: (n: number) => n.toLocaleString('pt-BR') },
  { value: 'total_cliques', label: 'Cliques', axisLabel: 'Cliques', description: 'Total de cliques.', format: (n: number) => n.toLocaleString('pt-BR') },
  { value: 'total_impressoes', label: 'Impressões', axisLabel: 'Impressões', description: 'Total de impressões.', format: (n: number) => n.toLocaleString('pt-BR') },
  { value: 'ctr', label: 'CTR', axisLabel: 'CTR (%)', description: 'Taxa de cliques.', format: (n: number) => `${n.toFixed(2)}%` },
  { value: 'taxa_conversao', label: 'Taxa de Conversão', axisLabel: 'Taxa de Conversão (%)', description: 'Conversões/Clques.', format: (n: number) => `${n.toFixed(2)}%` },
  { value: 'cpc', label: 'CPC', axisLabel: 'CPC (R$)', description: 'Custo por clique.', format: (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { value: 'cpa', label: 'CPA', axisLabel: 'CPA (R$)', description: 'Custo por aquisição.', format: (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { value: 'cpm', label: 'CPM', axisLabel: 'CPM (R$)', description: 'Custo por mil impressões.', format: (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { value: 'ticket_medio', label: 'Ticket Médio', axisLabel: 'Ticket Médio (R$)', description: 'Receita média por conversão.', format: (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { value: 'lucro', label: 'Lucro', axisLabel: 'Lucro (R$)', description: 'Receita - gasto.', format: (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) },
  { value: 'frequencia_media', label: 'Frequência', axisLabel: 'Frequência', description: 'Exposições médias por usuário.', format: (n: number) => n.toFixed(2) },
  { value: 'engajamento_total', label: 'Engajamento', axisLabel: 'Engajamento', description: 'Soma de interações.', format: (n: number) => n.toLocaleString('pt-BR') },
] as const;

type MetricOption = (typeof METRIC_OPTIONS)[number];
type MetricKey = MetricOption['value'];

const parseNum = (v: unknown): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (typeof v === 'string') {
    const sanitized = v.replace(/\s/g, '').replace(/[^0-9,.-]/g, '').replace(',', '.');
    const n = Number.parseFloat(sanitized);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
};

export default function AdPerformanceResult({ success, message, rows = [], count }: AdPerformanceResultProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('roas');

  const tableData: PerfRow[] = useMemo(() => {
    return rows.map((r) => ({
      campanha: String(r.campanha ?? ''),
      plataforma: String(r.plataforma ?? ''),
      total_impressoes: parseNum(r.total_impressoes),
      total_cliques: parseNum(r.total_cliques),
      total_conversoes: parseNum(r.total_conversoes),
      total_gasto: parseNum(r.total_gasto),
      total_receita: parseNum(r.total_receita),
      ctr: parseNum(r.ctr),
      taxa_conversao: parseNum(r.taxa_conversao),
      cpc: parseNum(r.cpc),
      cpa: parseNum(r.cpa),
      roas: parseNum(r.roas),
      lucro: parseNum(r.lucro),
      cpm: parseNum(r.cpm),
      ticket_medio: parseNum(r.ticket_medio),
      frequencia_media: parseNum(r.frequencia_media),
      engajamento_total: parseNum(r.engajamento_total),
    }));
  }, [rows]);

  const columns: ColumnDef<PerfRow>[] = useMemo(() => [
    { accessorKey: 'campanha', header: 'Campanha', cell: ({ row }) => <span className="font-medium">{row.original.campanha}</span> },
    { accessorKey: 'plataforma', header: 'Plataforma' },
    { accessorKey: 'total_gasto', header: 'Gasto (R$)', cell: ({ row }) => <span className="block text-right text-rose-600 font-semibold">{parseNum(row.original.total_gasto).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
    { accessorKey: 'total_receita', header: 'Receita (R$)', cell: ({ row }) => <span className="block text-right text-emerald-600 font-semibold">{parseNum(row.original.total_receita).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
    { accessorKey: 'total_conversoes', header: 'Conversões', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.total_conversoes).toLocaleString('pt-BR')}</span> },
    { accessorKey: 'total_cliques', header: 'Cliques', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.total_cliques).toLocaleString('pt-BR')}</span> },
    { accessorKey: 'total_impressoes', header: 'Impressões', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.total_impressoes).toLocaleString('pt-BR')}</span> },
    { accessorKey: 'roas', header: 'ROAS', cell: ({ row }) => <span className="block text-right font-semibold text-purple-600">{parseNum(row.original.roas).toFixed(2)}x</span> },
    { accessorKey: 'ctr', header: 'CTR', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.ctr).toFixed(2)}%</span> },
    { accessorKey: 'taxa_conversao', header: 'Taxa Conv.', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.taxa_conversao).toFixed(2)}%</span> },
    { accessorKey: 'cpc', header: 'CPC (R$)', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.cpc).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
    { accessorKey: 'cpa', header: 'CPA (R$)', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.cpa).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
    { accessorKey: 'cpm', header: 'CPM (R$)', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.cpm).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
    { accessorKey: 'ticket_medio', header: 'Ticket Médio (R$)', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.ticket_medio).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
    { accessorKey: 'lucro', header: 'Lucro (R$)', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.lucro).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
    { accessorKey: 'frequencia_media', header: 'Frequência', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.frequencia_media).toFixed(2)}</span> },
    { accessorKey: 'engajamento_total', header: 'Engajamento', cell: ({ row }) => <span className="block text-right">{parseNum(row.original.engajamento_total).toLocaleString('pt-BR')}</span> },
  ], []);

  const metricValues = useMemo(() => {
    return tableData.map((row) => ({
      label: `${row.campanha} (${row.plataforma})`,
      metrics: Object.fromEntries(
        METRIC_OPTIONS.map((opt) => [opt.value, parseNum((row as Record<string, unknown>)[opt.value])])
      ) as Record<MetricKey, number>,
    }));
  }, [tableData]);

  const [selectedOption, setSelectedOption] = useState<MetricOption>(METRIC_OPTIONS[0]);

  const chartData = useMemo(
    () => metricValues.map(({ label, metrics }) => ({ x: label, y: metrics[selectedOption.value] ?? 0 })),
    [metricValues, selectedOption]
  );

  const formatForMetric = useCallback((value: number) => {
    const safe = Number.isFinite(value) ? value : 0;
    return selectedOption.format(safe);
  }, [selectedOption]);

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
            <p className="text-xs text-muted-foreground">Visualize a performance por campanha/plataforma.</p>
          </div>
          <Select value={selectedOption.value} onValueChange={(v) => setSelectedOption(METRIC_OPTIONS.find(o => o.value === v) ?? METRIC_OPTIONS[0])}>
            <SelectTrigger size="sm" className="min-w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {METRIC_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="h-[360px] w-full">
            <BarChart
              data={chartData}
              seriesLabel={selectedOption.label}
              title={`${selectedOption.label} por Campanha/Plataforma`}
              subtitle={selectedOption.description}
              containerClassName="h-full"
              axisBottom={{ tickRotation: -25, legend: 'Campanha/Plataforma', legendOffset: 36 }}
              axisLeft={{ legend: selectedOption.axisLabel, legendOffset: -60, format: (val: string | number) => formatForMetric(typeof val === 'number' ? val : Number.parseFloat(val)) }}
              colors={{ scheme: 'paired' }}
              padding={0.3}
              enableLabel
              labelFormat={(val: number) => formatForMetric(val)}
            />
          </div>
          <p className="text-xs text-muted-foreground">Valores calculados a partir do mesmo conjunto de dados apresentado na tabela.</p>
        </div>
      </div>
    );
  }, [chartData, formatForMetric, selectedOption]);

  return (
    <ArtifactDataTable<PerfRow>
      data={tableData}
      columns={columns}
      title="Desempenho por Anúncio (Campanha/Plataforma)"
      icon={BarChart3}
      iconColor="text-purple-600"
      message={message}
      success={success}
      count={tableData.length ?? count ?? 0}
      exportFileName="paid-traffic-ad-performance"
      pageSize={Math.min(10, Math.max(tableData.length, 5))}
      chartRenderer={chartRenderer}
    />
  );
}
