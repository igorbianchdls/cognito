'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';
import { Sparkles } from 'lucide-react';
import { toBRL, toIntegerPT } from '@/lib/format';

export type PerformanceLancamentoRow = {
  tipo_colecao: string; // 'Nova Coleção (Lançamento)' | 'Coleção Antiga'
  receita_total_no_mes: number;
  total_itens_vendidos: number;
};

interface Props {
  success: boolean;
  message: string;
  rows?: PerformanceLancamentoRow[];
  data?: PerformanceLancamentoRow[];
  sql_query?: string;
}

const currency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function PerformanceLancamentoResult({ success, message, rows, data, sql_query }: Props) {
  const tableRows = rows ?? data ?? [];

  const columns: ColumnDef<PerformanceLancamentoRow>[] = useMemo(() => [
    { accessorKey: 'tipo_colecao', header: 'Tipo de Coleção' },
    { accessorKey: 'total_itens_vendidos', header: 'Itens Vendidos', cell: ({ row }) => toIntegerPT(row.original.total_itens_vendidos) },
    { accessorKey: 'receita_total_no_mes', header: 'Receita no Mês', cell: ({ row }) => (
      <span className="font-semibold text-emerald-600">{toBRL(row.original.receita_total_no_mes)}</span>
    ) },
  ], []);

  return (
    <ArtifactDataTable<PerformanceLancamentoRow>
      data={tableRows}
      columns={columns}
      title="Análise de Performance de Lançamento de Coleção"
      icon={Sparkles}
      iconColor="text-pink-600"
      message={message}
      success={success}
      count={tableRows.length}
      exportFileName="performance_lancamento_colecao"
      sqlQuery={sql_query}
      enableAutoChart={true}
      chartOptions={{
        xKey: 'tipo_colecao',
        valueKeys: ['receita_total_no_mes', 'total_itens_vendidos'],
        metricLabels: {
          receita_total_no_mes: 'Receita no Mês (R$)',
          total_itens_vendidos: 'Itens Vendidos',
        },
        initialChartType: 'bar',
        title: 'Performance de Lançamento',
        xLegend: 'Tipo de Coleção',
      }}
    />
  );
}
