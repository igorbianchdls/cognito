'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ChartSwitcher } from '@/components/charts/ChartSwitcher';
import { Layers } from 'lucide-react';

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

type PlatformRow = {
  plataforma: string;
  total_impressoes: number;
  total_cliques: number;
  total_conversoes: number;
  total_gasto: number;
  total_receita: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
  lucro: number;
};

// Função auxiliar para formatar valores monetários
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Função auxiliar para formatar percentuais
const formatPercentage = (value: number): string => {
  return `${value.toFixed(2)}%`;
};

// Função auxiliar para formatar números
const formatNumber = (value: number): string => {
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
};

// Função auxiliar para formatar ROAS
const formatRoas = (value: number): string => {
  return `${value.toFixed(2)}x`;
};

export default function AdsPlatformsResult({
  success,
  message,
  periodo_dias,
  total_plataformas,
  melhor_plataforma,
  pior_plataforma,
  sql_query,
  plataformas = []
}: AdsPlatformsResultProps) {
  
  const data: PlatformRow[] = useMemo(() => {
    return plataformas.map(platform => ({
      plataforma: platform.plataforma || 'N/A',
      total_impressoes: Number(platform.total_impressoes) || 0,
      total_cliques: Number(platform.total_cliques) || 0,
      total_conversoes: Number(platform.total_conversoes) || 0,
      total_gasto: Number(platform.total_gasto) || 0,
      total_receita: Number(platform.total_receita) || 0,
      ctr: Number(platform.ctr) || 0,
      cpc: Number(platform.cpc) || 0,
      cpa: Number(platform.cpa) || 0,
      roas: Number(platform.roas) || 0,
      lucro: Number(platform.lucro) || 0,
    }));
  }, [plataformas]);

  // Colunas para a tabela
  const columns: ColumnDef<PlatformRow>[] = useMemo(() => [
    {
      accessorKey: 'plataforma',
      header: 'Plataforma',
      cell: ({ row }) => (
        <span className="font-medium text-gray-900">
          {row.getValue('plataforma')}
        </span>
      ),
    },
    {
      accessorKey: 'total_impressoes',
      header: 'Impressões',
      cell: ({ row }) => (
        <span className="text-gray-700">
          {formatNumber(row.getValue('total_impressoes'))}
        </span>
      ),
    },
    {
      accessorKey: 'total_cliques',
      header: 'Cliques',
      cell: ({ row }) => (
        <span className="text-blue-600 font-medium">
          {formatNumber(row.getValue('total_cliques'))}
        </span>
      ),
    },
    {
      accessorKey: 'ctr',
      header: 'CTR',
      cell: ({ row }) => (
        <span className="text-gray-600">
          {formatPercentage(row.getValue('ctr'))}
        </span>
      ),
    },
    {
      accessorKey: 'total_conversoes',
      header: 'Conversões',
      cell: ({ row }) => (
        <span className="text-green-600 font-semibold">
          {formatNumber(row.getValue('total_conversoes'))}
        </span>
      ),
    },
    {
      accessorKey: 'total_gasto',
      header: 'Gasto Total',
      cell: ({ row }) => (
        <span className="text-red-600 font-medium">
          {formatCurrency(row.getValue('total_gasto'))}
        </span>
      ),
    },
    {
      accessorKey: 'total_receita',
      header: 'Receita Total',
      cell: ({ row }) => (
        <span className="text-green-600 font-semibold">
          {formatCurrency(row.getValue('total_receita'))}
        </span>
      ),
    },
    {
      accessorKey: 'roas',
      header: 'ROAS',
      cell: ({ row }) => {
        const roas = row.getValue('roas') as number;
        const colorClass = roas >= 3 ? 'text-green-600' : roas >= 1.5 ? 'text-yellow-600' : 'text-red-600';
        return (
          <span className={`font-semibold ${colorClass}`}>
            {formatRoas(roas)}
          </span>
        );
      },
    },
    {
      accessorKey: 'cpc',
      header: 'CPC',
      cell: ({ row }) => (
        <span className="text-gray-600">
          {formatCurrency(row.getValue('cpc'))}
        </span>
      ),
    },
    {
      accessorKey: 'cpa',
      header: 'CPA',
      cell: ({ row }) => (
        <span className="text-gray-600">
          {formatCurrency(row.getValue('cpa'))}
        </span>
      ),
    },
    {
      accessorKey: 'lucro',
      header: 'Lucro',
      cell: ({ row }) => {
        const lucro = row.getValue('lucro') as number;
        const colorClass = lucro > 0 ? 'text-green-600' : 'text-red-600';
        return (
          <span className={`font-medium ${colorClass}`}>
            {formatCurrency(lucro)}
          </span>
        );
      },
    },
  ], []);

  // Renderer de gráficos
  const chartRenderer = () => (
    <ChartSwitcher
      rows={data}
      options={{
        xKey: 'plataforma',
        valueKeys: [
          'total_gasto', 'total_receita', 'roas', 'total_conversoes', 
          'total_impressoes', 'total_cliques', 'ctr', 'cpc', 'cpa', 'lucro'
        ],
        metricLabels: {
          total_gasto: 'Gasto Total',
          total_receita: 'Receita Total',
          roas: 'ROAS',
          total_conversoes: 'Conversões',
          total_impressoes: 'Impressões',
          total_cliques: 'Cliques',
          ctr: 'CTR (%)',
          cpc: 'CPC',
          cpa: 'CPA',
          lucro: 'Lucro'
        },
        title: 'Comparação entre Plataformas de Anúncios',
        xLegend: 'Plataforma',
        yLegend: 'Valor',
        initialChartType: 'bar',
      }}
    />
  );

  // Construir mensagem customizada com insights
  const enhancedMessage = useMemo(() => {
    let baseMessage = message;
    
    if (melhor_plataforma && pior_plataforma) {
      baseMessage += ` Melhor plataforma: ${melhor_plataforma}. Pior plataforma: ${pior_plataforma}.`;
    }
    
    if (total_plataformas) {
      baseMessage += ` Total de ${total_plataformas} plataformas analisadas.`;
    }
    
    if (periodo_dias) {
      baseMessage += ` Período: últimos ${periodo_dias} dias.`;
    }
    
    return baseMessage;
  }, [message, melhor_plataforma, pior_plataforma, total_plataformas, periodo_dias]);

  return (
    <ArtifactDataTable<PlatformRow>
      data={data}
      columns={columns}
      title="Comparação de Plataformas de Anúncios"
      icon={Layers}
      iconColor="text-blue-600"
      message={enhancedMessage}
      success={success}
      count={data.length}
      exportFileName="plataformas-ads"
      pageSize={Math.min(10, Math.max(data.length, 5))}
      sqlQuery={sql_query}
      chartRenderer={chartRenderer}
    />
  );
}