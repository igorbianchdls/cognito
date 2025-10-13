'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { TrendingDown } from 'lucide-react';

interface Props {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function SuddenReachDropResult(props: Props) {
  return (
    <GenericOrganicTable
      title="Queda súbita de alcance"
      icon={TrendingDown}
      iconColor="text-red-600"
      {...props}
    />
  );
}

