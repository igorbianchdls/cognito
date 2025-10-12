'use client';

import { AlertTriangle } from 'lucide-react';
import { GenericInventoryTable, type InventoryTableRow } from '../GenericInventoryTable';

interface AnomaliesResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: InventoryTableRow[];
  sql_query?: string;
}

export default function AnomaliesResult(props: AnomaliesResultProps) {
  return (
    <GenericInventoryTable
      title="Detecção de Anomalias"
      icon={AlertTriangle}
      iconColor="text-red-600"
      {...props}
    />
  );
}
