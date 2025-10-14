'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { ShoppingCart } from 'lucide-react';

export type CestaComprasRow = {
  produto_A: string;
  produto_B: string;
  vezes_comprados_juntos: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: CestaComprasRow[];
  data?: CestaComprasRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CestaComprasResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<CestaComprasRow>[] = useMemo(() => [
    { accessorKey: 'produto_A', header: 'Produto A' },
    { accessorKey: 'produto_B', header: 'Produto B' },
    { accessorKey: 'vezes_comprados_juntos', header: 'Comprados Juntos (Pedidos)', cell: ({ row }) => row.original.vezes_comprados_juntos.toLocaleString('pt-BR') },
  ], []);

  return (
    <ArtifactDataTable<CestaComprasRow>
      data={tableRows}
      columns={columns}
      title="Análise de Cesta de Compras (Produtos Comprados Juntos)"
      icon={ShoppingCart}
      iconColor="text-orange-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="cesta_compras"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'par',
        valueKeys: ['vezes_comprados_juntos'],
        metricLabels: {
          vezes_comprados_juntos: 'Pedidos com o Par',
        },
        initialChartType: 'bar',
        title: 'Produtos Comprados Juntos',
        xLegend: 'Par de Produtos',
        transform: (rows) => rows.map(r => ({
          ...r,
          par: `${r.produto_A} × ${r.produto_B}`,
        })) as unknown as CestaComprasRow[],
      }}
    />
  );
}
