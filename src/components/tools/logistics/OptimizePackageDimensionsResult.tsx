'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { PackageCheck } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface PackageEfficiencyRow extends Record<string, unknown> {
  transportadora: string;
  total_pacotes: number;
  peso_medio: string;
  peso_volumetrico_medio: string;
  eficiencia_media: string;
  eficiencia_p10: string;
  eficiencia_p90: string;
  classificacao: string;
}

interface OptimizePackageDimensionsResultProps {
  success: boolean;
  message: string;
  rows?: PackageEfficiencyRow[];
  low_efficiency_examples?: Array<Record<string, unknown>>;
  sql_query?: string;
  sql_params?: string;
}

export default function OptimizePackageDimensionsResult({
  success,
  message,
  rows,
  low_efficiency_examples,
  sql_query,
}: OptimizePackageDimensionsResultProps) {
  const data = rows ?? [];

  const columns: ColumnDef<PackageEfficiencyRow>[] = useMemo(
    () => [
      {
        accessorKey: 'transportadora',
        header: 'Transportadora',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.transportadora}</span>
        ),
      },
      {
        accessorKey: 'total_pacotes',
        header: 'Pacotes',
        cell: ({ row }) => row.original.total_pacotes.toLocaleString('pt-BR'),
      },
      {
        accessorKey: 'peso_medio',
        header: 'Peso médio (kg)',
      },
      {
        accessorKey: 'peso_volumetrico_medio',
        header: 'Peso volumétrico médio (kg)',
      },
      {
        accessorKey: 'eficiencia_media',
        header: 'Eficiência média',
      },
      {
        accessorKey: 'eficiencia_p10',
        header: 'P10',
      },
      {
        accessorKey: 'eficiencia_p90',
        header: 'P90',
      },
      {
        accessorKey: 'classificacao',
        header: 'Classificação',
        cell: ({ row }) => (
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-slate-600">
            {row.original.classificacao}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <ArtifactDataTable
        data={data}
        columns={columns}
        title="Eficiência de Cubagem"
        icon={PackageCheck}
        message={message}
        success={success}
        count={data.length}
        iconColor="text-purple-600"
        exportFileName="package_efficiency"
        sqlQuery={sql_query}
      />

      {low_efficiency_examples && low_efficiency_examples.length > 0 && (
        <ArtifactDataTable
          data={low_efficiency_examples}
          columns={[
            {
              accessorKey: 'transportadora_id',
              header: 'Transportadora',
            },
            {
              accessorKey: 'peso_kg',
              header: 'Peso (kg)',
            },
            {
              accessorKey: 'dimensoes_cm',
              header: 'Dimensões (cm)',
            },
            {
              accessorKey: 'eficiencia',
              header: 'Eficiência',
            },
          ]}
          title="Pacotes com Baixa Eficiência"
          icon={PackageCheck}
          message="Exemplos de pacotes que mais desperdiçam espaço (rank baseado na eficiência)."
          success={success}
          count={low_efficiency_examples.length}
          iconColor="text-amber-600"
          exportFileName="package_low_efficiency"
        />
      )}
    </div>
  );
}
