'use client';

import { TrendingUp } from 'lucide-react';
import { GenericInventoryTable, type InventoryTableRow } from '../GenericInventoryTable';

interface TrendsAnalysisResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: InventoryTableRow[];
  sql_query?: string;
}

export default function TrendsAnalysisResult(props: TrendsAnalysisResultProps) {
  return (
    <GenericInventoryTable
      title="Tendências de Estoque"
      icon={TrendingUp}
      iconColor="text-blue-600"
      {...props}
    />
  );
}
