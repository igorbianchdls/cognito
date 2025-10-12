'use client';

import { GenericEcommerceTable, type EcommerceTableRow } from './GenericEcommerceTable';
import { PackageSearch } from 'lucide-react';

interface ProductPerformanceResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: EcommerceTableRow[];
  sql_query?: string;
}

export default function ProductPerformanceResult(props: ProductPerformanceResultProps) {
  return (
    <GenericEcommerceTable
      title="Performance de Produtos"
      icon={PackageSearch}
      iconColor="text-amber-600"
      {...props}
    />
  );
}
