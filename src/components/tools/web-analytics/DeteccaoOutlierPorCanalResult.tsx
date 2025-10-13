'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface TrafficAnomalyRow extends Record<string, unknown> {
  data: string;
  sessoes: number;
  media: number;
  z_score: string;
  tipo: string;
  severidade: string;
}

interface TrafficAnomaliesResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  sensitivity?: number;
  estatisticas?: {
    media_sessoes_dia: number;
    desvio_padrao: number;
  };
  total_anomalias?: number;
  bot_rate?: string;
  anomalias?: TrafficAnomalyRow[];
  red_flags?: string[];
  rows?: TrafficAnomalyRow[];
  sql_query?: string;
  sql_params?: string;
}

export default function DeteccaoOutlierPorCanalResult({
  success,
  message,
  periodo_dias,
  sensitivity,
  estatisticas,
  total_anomalias,
  bot_rate,
  red_flags,
  rows,
  sql_query,
}: TrafficAnomaliesResultProps) {
  const data = rows ?? [];

  const details = [
    periodo_dias ? `${periodo_dias} dias analisados` : null,
    sensitivity ? `Sensibilidade Z = ${sensitivity}` : null,
    estatisticas ? `Média: ${estatisticas.media_sessoes_dia} • Desvio: ${estatisticas.desvio_padrao}` : null,
    bot_rate ? `Tráfego bot: ${bot_rate}` : null,
    total_anomalias !== undefined ? `${total_anomalias} anomalias` : null,
  ]
    .filter(Boolean)
    .join(' • ');

  const columns: ColumnDef<TrafficAnomalyRow>[] = useMemo(
    () => [
      {
        accessorKey: 'data',
        header: 'Data',
        cell: ({ row }) => new Date(row.original.data).toLocaleDateString('pt-BR'),
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
        accessorKey: 'media',
        header: 'Média',
        cell: ({ row }) => row.original.media.toLocaleString('pt-BR'),
      },
      {
        accessorKey: 'z_score',
        header: 'Z-score',
        cell: ({ row }) => (
          <span className="font-semibold text-rose-600">
            {row.original.z_score}
          </span>
        ),
      },
      {
        accessorKey: 'tipo',
        header: 'Tipo',
        cell: ({ row }) => (
          <span className="uppercase tracking-wide text-slate-600">
            {row.original.tipo}
          </span>
        ),
      },
      {
        accessorKey: 'severidade',
        header: 'Severidade',
        cell: ({ row }) => (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${
              row.original.severidade === 'CRÍTICA'
                ? 'bg-red-100 text-red-700 border border-red-300'
                : 'bg-amber-100 text-amber-700 border border-amber-300'
            }`}
          >
            {row.original.severidade}
          </span>
        ),
      },
    ],
    [],
  );

  const warningList = red_flags?.length ? (
    <ul className="mt-2 space-y-1 text-sm text-rose-600">
      {red_flags.map(flag => (
        <li key={flag} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
          {flag}
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Detecção de outlier por canal"
      icon={AlertTriangle}
      message={details ? `${message} • ${details}` : message}
      success={success}
      count={data.length}
      iconColor="text-rose-600"
      exportFileName="outliers_por_canal"
      sqlQuery={sql_query}
      chartRenderer={() => warningList}
    />
  );
}
