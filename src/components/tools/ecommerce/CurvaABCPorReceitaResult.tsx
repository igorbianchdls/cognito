'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { BarChart3 } from 'lucide-react';

export type CurvaABCRow = {
  produto_id: number;
  sku: string | null;
  nome_produto: string;
  receita: number;
  classe_abc: 'A' | 'B' | 'C';
};

interface Props {
  success: boolean;
  message: string;
  rows?: CurvaABCRow[];
  data?: CurvaABCRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CurvaABCPorReceitaResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<CurvaABCRow>[] = useMemo(() => [
    { accessorKey: 'produto_id', header: 'Produto ID' },
    { accessorKey: 'sku', header: 'SKU' },
    { accessorKey: 'nome_produto', header: 'Produto' },
    { accessorKey: 'classe_abc', header: 'Classe ABC' },
    { accessorKey: 'receita', header: 'Receita', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{currency(row.original.receita)}</span>
    ) },
  ], []);

  return (
    <ArtifactDataTable<CurvaABCRow>
      data={tableRows}
      columns={columns}
      title="Curva ABC por Receita"
      icon={BarChart3}
      iconColor="text-amber-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="curva_abc_receita"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'nome_produto',
        valueKeys: ['receita'],
        metricLabels: { receita: 'Receita (R$)' },
        title: 'Receita por Produto (ABC)',
        xLegend: 'Produto',
      }}
    />
  );
}

