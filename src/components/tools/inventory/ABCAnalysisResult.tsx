'use client';

import { PieChart } from 'lucide-react';
import { GenericInventoryTable, type InventoryTableRow } from '../GenericInventoryTable';

interface ABCAnalysisResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: InventoryTableRow[];
  sql_query?: string;
}

export default function ABCAnalysisResult(props: ABCAnalysisResultProps) {
  return (
    <GenericInventoryTable
      title="Análise ABC"
      icon={PieChart}
      iconColor="text-purple-600"
      {...props}
    />
  );
}
