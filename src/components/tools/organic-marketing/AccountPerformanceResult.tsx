'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { Users } from 'lucide-react';

interface Props {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function AccountPerformanceResult(props: Props) {
  return (
    <GenericOrganicTable
      title="Desempenho por conta"
      icon={Users}
      iconColor="text-blue-600"
      {...props}
    />
  );
}

