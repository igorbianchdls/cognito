'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { RefreshCcw } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface ReverseLogisticsRow extends Record<string, unknown> {
  categoria: string;
  chave: string;
  total: number;
  concluidas?: number | null;
  pendentes?: number | null;
  taxa_conclusao?: string | null;
}

interface ReverseLogisticsTrendsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  rows?: ReverseLogisticsRow[];
  sql_query?: string;
  sql_params?: string;
}

export default function ReverseLogisticsTrendsResult({
  success,
  message,
  periodo_dias,
  rows,
  sql_query,
}: ReverseLogisticsTrendsResultProps) {
  const data = rows ?? [];

  const columns: ColumnDef<ReverseLogisticsRow>[] = useMemo(
    () => [
      {
        accessorKey: 'categoria',
        header: 'Categoria',
        cell: ({ row }) => (
          <span className="uppercase text-xs font-semibold text-slate-500">
            {row.original.categoria}
          </span>
        ),
      },
      {
        accessorKey: 'chave',
        header: 'Chave',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.chave}</span>
        ),
      },
      {
        accessorKey: 'total',
        header: 'Total',
        cell: ({ row }) => row.original.total.toLocaleString('pt-BR'),
      },
      {
        accessorKey: 'concluidas',
        header: 'Concluídas',
        cell: ({ row }) => row.original.concluidas != null
          ? row.original.concluidas.toLocaleString('pt-BR')
          : '—',
      },
      {
        accessorKey: 'pendentes',
        header: 'Pendentes',
        cell: ({ row }) => row.original.pendentes != null
          ? row.original.pendentes.toLocaleString('pt-BR')
          : '—',
      },
      {
        accessorKey: 'taxa_conclusao',
        header: 'Taxa conclusão',
        cell: ({ row }) => row.original.taxa_conclusao ?? '—',
      },
    ],
    [],
  );

  const timelineCount = data.filter(item => item.categoria === 'Timeline').length;
  const meta = [
    periodo_dias ? `Período: ${periodo_dias} dias` : null,
    timelineCount ? `Dias analisados: ${timelineCount}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Logística Reversa"
      icon={RefreshCcw}
      message={meta ? `${message} • ${meta}` : message}
      success={success}
      count={data.length}
      iconColor="text-orange-600"
      exportFileName="reverse_logistics_trends"
      sqlQuery={sql_query}
    />
  );
}
