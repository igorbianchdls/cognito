'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Target } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface ConversionFunnelRow extends Record<string, unknown> {
  step: number;
  event_name: string;
  sessoes: number;
  drop_off_percent: string;
  conversion_rate_percent: string;
}

interface ConversionFunnelResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  total_steps?: number;
  conversion_rate?: string;
  steps?: ConversionFunnelRow[];
  gargalos?: string[];
  rows?: ConversionFunnelRow[];
  sql_query?: string;
  sql_params?: string;
}

export default function EtapasDoFunilGeralResult({
  success,
  message,
  periodo_dias,
  total_steps,
  conversion_rate,
  steps,
  gargalos,
  rows,
  sql_query,
}: ConversionFunnelResultProps) {
  const data = rows ?? steps ?? [];

  const meta = [
    total_steps ? `${total_steps} etapas` : null,
    periodo_dias ? `${periodo_dias} dias` : null,
    conversion_rate ? `Conversão final: ${conversion_rate}` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const columns: ColumnDef<ConversionFunnelRow>[] = useMemo(
    () => [
      {
        accessorKey: 'step',
        header: '#',
        cell: ({ row }) => (
          <span className="font-semibold text-slate-500">
            #{row.original.step}
          </span>
        ),
      },
      {
        accessorKey: 'event_name',
        header: 'Evento',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.event_name}
          </span>
        ),
      },
      {
        accessorKey: 'sessoes',
        header: 'Sessões',
        cell: ({ row }) => (
          <span className="font-semibold text-indigo-600">
            {row.original.sessoes.toLocaleString('pt-BR')}
          </span>
        ),
      },
      {
        accessorKey: 'drop_off_percent',
        header: 'Drop-off',
        cell: ({ row }) => (
          <span className="text-rose-600 font-medium">
            {row.original.drop_off_percent}
          </span>
        ),
      },
      {
        accessorKey: 'conversion_rate_percent',
        header: 'Conversão acumulada',
        cell: ({ row }) => row.original.conversion_rate_percent,
      },
    ],
    [],
  );

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Funil de Conversão"
      icon={Target}
      message={
        meta
          ? `${message}${gargalos?.length ? ` • Gargalos: ${gargalos.join(', ')}` : ''} • ${meta}`
          : gargalos?.length
            ? `${message} • Gargalos: ${gargalos.join(', ')}`
            : message
      }
      success={success}
      count={data.length}
      iconColor="text-fuchsia-600"
      exportFileName="conversion_funnel"
      sqlQuery={sql_query}
    />
  );
}
