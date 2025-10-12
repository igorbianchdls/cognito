'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Activity } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface DeliveryAnomalyRow extends Record<string, unknown> {
  data: string;
  entregues: number;
  atrasados: number;
  atraso_percentual: string;
  z_score: number;
  severidade: string;
}

interface DetectDeliveryAnomaliesResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  sensitivity?: number;
  rows?: DeliveryAnomalyRow[];
  sql_query?: string;
  sql_params?: string;
}

export default function DetectDeliveryAnomaliesResult({
  success,
  message,
  periodo_dias,
  sensitivity,
  rows,
  sql_query,
}: DetectDeliveryAnomaliesResultProps) {
  const data = rows ?? [];

  const columns: ColumnDef<DeliveryAnomalyRow>[] = useMemo(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        cell: ({ row }) => new Date(row.original.data).toLocaleDateString('pt-BR'),
      },
      {
        accessorKey: 'entregues',
        header: 'Entregues',
        cell: ({ row }) => row.original.entregues.toLocaleString('pt-BR'),
      },
      {
        accessorKey: 'atrasados',
        header: 'Atrasadas',
        cell: ({ row }) => row.original.atrasados.toLocaleString('pt-BR'),
      },
      {
        accessorKey: 'atraso_percentual',
        header: '% atraso',
      },
      {
        accessorKey: 'z_score',
        header: 'Z-score',
        cell: ({ row }) => row.original.z_score.toFixed(2),
      },
      {
        accessorKey: 'severidade',
        header: 'Severidade',
        cell: ({ row }) => (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">
            {row.original.severidade}
          </span>
        ),
      },
    ],
    [],
  );

  const meta = [
    periodo_dias ? `Período: ${periodo_dias} dias` : null,
    sensitivity ? `Sensibilidade Z: ${sensitivity}` : null,
    data.length ? `Registros: ${data.length}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Anomalias de Entrega"
      icon={Activity}
      message={meta ? `${message} • ${meta}` : message}
      success={success}
      count={data.length}
      iconColor="text-orange-600"
      exportFileName="delivery_anomalies"
      sqlQuery={sql_query}
    />
  );
}
