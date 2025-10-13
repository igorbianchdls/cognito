'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { Layout } from 'lucide-react';

interface Props {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function PostFormatPerformanceResult(props: Props) {
  return (
    <GenericOrganicTable
      title="Desempenho por formato de post"
      icon={Layout}
      iconColor="text-violet-600"
      {...props}
    />
  );
}

