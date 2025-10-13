'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { BarChart3 } from 'lucide-react';

interface Props {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function PlatformPerformanceResult(props: Props) {
  return (
    <GenericOrganicTable
      title="Desempenho por plataforma"
      icon={BarChart3}
      iconColor="text-indigo-600"
      {...props}
    />
  );
}

