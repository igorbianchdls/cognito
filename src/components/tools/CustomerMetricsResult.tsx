'use client';

import { GenericEcommerceTable, type EcommerceTableRow } from './GenericEcommerceTable';
import { Users } from 'lucide-react';

interface CustomerMetricsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: EcommerceTableRow[];
  sql_query?: string;
}

export default function CustomerMetricsResult(props: CustomerMetricsResultProps) {
  return (
    <GenericEcommerceTable
      title="Métricas de Clientes"
      icon={Users}
      iconColor="text-sky-600"
      {...props}
    />
  );
}
