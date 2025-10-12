'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { TrendingUp } from 'lucide-react';

interface ContentPerformanceResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function ContentPerformanceResult(props: ContentPerformanceResultProps) {
  return (
    <GenericOrganicTable
      title="Performance de Conteúdo"
      icon={TrendingUp}
      iconColor="text-purple-600"
      {...props}
    />
  );
}
