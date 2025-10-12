'use client';

import { useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Package } from 'lucide-react';
import ArtifactDataTable from '@/components/widgets/ArtifactDataTable';

interface ShippingCostRow extends Record<string, unknown> {
  faixa_peso: string;
  total_envios: number;
  custo_total: string;
  custo_medio_envio: string;
  peso_total: string;
  custo_medio_por_kg: string;
}

interface ShippingCostStructureResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  rows?: ShippingCostRow[];
  sql_query?: string;
  sql_params?: string;
}

export default function ShippingCostStructureResult({
  success,
  message,
  periodo_dias,
  rows,
  sql_query,
}: ShippingCostStructureResultProps) {
  const data = rows ?? [];

  const columns: ColumnDef<ShippingCostRow>[] = useMemo(
    () => [
      {
        accessorKey: 'faixa_peso',
        header: 'Faixa de peso',
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.faixa_peso}</span>
        ),
      },
      {
        accessorKey: 'total_envios',
        header: 'Envios',
        cell: ({ row }) => row.original.total_envios.toLocaleString('pt-BR'),
      },
      {
        accessorKey: 'custo_total',
        header: 'Custo total (R$)',
      },
      {
        accessorKey: 'custo_medio_envio',
        header: 'Ticket médio (R$)',
      },
      {
        accessorKey: 'peso_total',
        header: 'Peso total (kg)',
      },
      {
        accessorKey: 'custo_medio_por_kg',
        header: 'Custo por kg (R$)',
      },
    ],
    [],
  );

  const meta = periodo_dias ? `Período: ${periodo_dias} dias` : undefined;

  return (
    <ArtifactDataTable
      data={data}
      columns={columns}
      title="Estrutura de Custo por Faixa de Peso"
      icon={Package}
      message={meta ? `${message} • ${meta}` : message}
      success={success}
      count={data.length}
      iconColor="text-emerald-600"
      exportFileName="shipping_cost_structure"
      sqlQuery={sql_query}
    />
  );
}
