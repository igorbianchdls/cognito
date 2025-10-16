'use client';

import { useEffect, useMemo, useState } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { ShoppingCart } from 'lucide-react';
import { toBRL, toIntegerPT } from '@/lib/format';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

export type TopProdutosRow = {
  produto_id: number;
  sku: string | null;
  nome_produto: string;
  qtd: number;
  receita_liquida: number;
};

interface TopProdutosReceitaLiquidaTableProps {
  success: boolean;
  message: string;
  rows?: TopProdutosRow[];
  data?: TopProdutosRow[];
  sql_query?: string;
}

export default function TopProdutosReceitaLiquidaTable({
  success,
  message,
  rows,
  data,
  sql_query,
}: TopProdutosReceitaLiquidaTableProps) {
  const initialRows = rows ?? data ?? [];
  const [tableRows, setTableRows] = useState<TopProdutosRow[]>(initialRows);

  useEffect(() => {
    setTableRows(initialRows);
  }, [rows, data]);

  const columns: ColumnDef<TopProdutosRow>[] = useMemo(
    () => [
      { accessorKey: 'produto_id', header: 'Produto ID' },
      { accessorKey: 'sku', header: 'SKU' },
      { accessorKey: 'nome_produto', header: 'Produto' },
      { accessorKey: 'qtd', header: 'Unidades', cell: ({ row }) => toIntegerPT(row.original.qtd) },
      {
        accessorKey: 'receita_liquida',
        header: 'Receita Líquida',
        cell: ({ row }) => (
          <span className="font-semibold text-emerald-600">
            {toBRL(row.original.receita_liquida)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <ArtifactDataTable<TopProdutosRow>
      data={tableRows}
      columns={columns}
      title="Top Produtos por Receita Líquida"
      icon={ShoppingCart}
      iconColor="text-emerald-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="top_produtos_receita_liquida"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        // Usar um rótulo estável para o eixo X
        // Preferir nome_produto; fallback para SKU; último recurso: produto_id
        xKey: 'label',
        valueKeys: ['receita_liquida', 'qtd'],
        metricLabels: {
          receita_liquida: 'Receita Líquida (R$)',
          qtd: 'Unidades',
        },
        initialChartType: 'bar',
        title: 'Receita por Produto',
        xLegend: 'Produto',
        // yLegend dinâmico via metricLabels (não definir yLegend aqui)
        transform: (rows) =>
          rows.map((r) => ({
            ...r,
            label: (r.nome_produto && String(r.nome_produto).trim())
              ? String(r.nome_produto)
              : (r.sku && String(r.sku).trim())
                ? String(r.sku)
                : String(r.produto_id),
          })),
        showDateFilter: true,
        onDateRangeChange: async ({ from, to }) => {
          try {
            const params = new URLSearchParams();
            if (from) params.set('data_de', from);
            if (to) params.set('data_ate', to);
            params.set('limit', '20');
            const res = await fetch(`/api/tools/ecommerce/top-produtos?${params.toString()}`, { cache: 'no-store' });
            if (!res.ok) return;
            const json = await res.json();
            if (json?.success && Array.isArray(json.rows)) {
              setTableRows(json.rows as TopProdutosRow[]);
            }
          } catch (e) {
            console.error('Erro ao buscar Top Produtos por período:', e);
          }
        }
      }}
    />
  );
}
