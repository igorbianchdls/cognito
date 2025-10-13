'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart3 } from 'lucide-react';
// Removed local metric/chart selectors to keep UI simple; using ArtifactDataTable auto-chart

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

// (as métricas são inferidas automaticamente pelo auto-chart)

// (sem função auxiliar local; o ChartSwitcher converte valores numéricos quando necessário)

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
  // No chart-specific local state; chart type dropdown is provided by ArtifactDataTable auto-chart

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

  // (sem mapeamento de métricas local)

  // Chart rendering is delegated to ArtifactDataTable auto-chart

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
      enableAutoChart
      chartOptions={{
        xKey: 'plataforma',
        valueKeys: [
          'total_impressoes',
          'total_cliques',
          'total_conversoes',
          'total_gasto',
          'total_receita',
          'ctr',
          'cpc',
          'cpa',
          'roas',
          'lucro',
        ],
        metricLabels: {
          total_impressoes: 'Impressões',
          total_cliques: 'Cliques',
          total_conversoes: 'Conversões',
          total_gasto: 'Gasto',
          total_receita: 'Receita',
          ctr: 'CTR',
          cpc: 'CPC',
          cpa: 'CPA',
          roas: 'ROAS',
          lucro: 'Lucro',
        },
        title: 'Métricas por Plataforma',
        xLegend: 'Plataforma',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
    </div>
  );
}
