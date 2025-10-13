'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { AlertTriangle } from 'lucide-react';

interface Props {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function OrganicAnomaliesResult(props: Props) {
  return (
    <GenericOrganicTable
      title="Detecção de anomalias"
      icon={AlertTriangle}
      iconColor="text-rose-600"
      {...props}
    />
  );
}

