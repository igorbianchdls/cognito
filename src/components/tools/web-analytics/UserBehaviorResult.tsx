'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Users } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface BehaviorRow extends Record<string, unknown> {
  metrica: string;
  valor: number | string;
  percentual: string;
}

interface UserBehaviorResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  comportamento?: {
    total_visitantes: number;
    novos_visitantes: number;
    visitantes_recorrentes: number;
    percentual_novos: string;
    percentual_recorrentes: string;
    frequencia_media_visitas: string;
    engagement_rate: string;
    classificacao: string;
  };
  rows?: BehaviorRow[];
  sql_query?: string;
  sql_params?: string;
}

const formatNumber = (value: number | string) => {
  if (typeof value === 'number') {
    return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  }
  return value;
};

export default function UserBehaviorResult({
  success,
  message,
  periodo_dias,
  comportamento,
  rows,
  sql_query,
}: UserBehaviorResultProps) {
  const data = rows ?? [];

  const summary = comportamento
    ? [
        `Visitantes: ${comportamento.total_visitantes.toLocaleString('pt-BR')}`,
        `Classificação: ${comportamento.classificacao}`,
        comportamento.engagement_rate ? `Engajamento: ${comportamento.engagement_rate}` : null,
        periodo_dias ? `${periodo_dias} dias` : null,
      ]
        .filter(Boolean)
        .join(' • ')
    : undefined;

  const columns: ColumnDef<BehaviorRow>[] = useMemo(
    () => [
      {
        accessorKey: 'metrica',
        header: 'Métrica',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.metrica}</span>
        ),
      },
      {
        accessorKey: 'valor',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="font-semibold text-indigo-600">
            {formatNumber(row.original.valor)}
          </span>
        ),
      },
      {
        accessorKey: 'percentual',
        header: 'Percentual',
        cell: ({ row }) => (
          <span className="text-slate-600">{row.original.percentual}</span>
        ),
      },
    ],
    [],
  );

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Comportamento de Visitantes"
      icon={Users}
      message={summary ? `${message} • ${summary}` : message}
      success={success}
      count={data.length}
      iconColor="text-sky-600"
      exportFileName="user_behavior"
      sqlQuery={sql_query}
    />
  );
}
