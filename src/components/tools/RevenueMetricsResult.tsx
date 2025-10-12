'use client';

import { GenericEcommerceTable, type EcommerceTableRow } from './GenericEcommerceTable';
import { DollarSign } from 'lucide-react';

interface RevenueMetricsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: EcommerceTableRow[];
  sql_query?: string;
}

export default function RevenueMetricsResult(props: RevenueMetricsResultProps) {
  return (
    <GenericEcommerceTable
      title="Métricas de Receita"
      icon={DollarSign}
      iconColor="text-emerald-600"
      {...props}
    />
  );
}
