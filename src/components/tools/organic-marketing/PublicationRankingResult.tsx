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

export default function PublicationRankingResult(props: Props) {
  return (
    <GenericOrganicTable
      title="Ranking por publicação"
      icon={BarChart3}
      iconColor="text-emerald-600"
      {...props}
    />
  );
}

