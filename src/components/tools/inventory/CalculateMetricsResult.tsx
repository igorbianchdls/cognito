'use client';

import { Calculator } from 'lucide-react';
import { GenericInventoryTable, type InventoryTableRow } from '../GenericInventoryTable';

interface CalculateMetricsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: InventoryTableRow[];
  sql_query?: string;
}

export default function CalculateMetricsResult(props: CalculateMetricsResultProps) {
  return (
    <GenericInventoryTable
      title="Métricas de Inventário"
      icon={Calculator}
      iconColor="text-emerald-600"
      {...props}
    />
  );
}
