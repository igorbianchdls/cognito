'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart3 } from 'lucide-react';

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
    />
    </div>
  );
}
