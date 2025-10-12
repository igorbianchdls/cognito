'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { PieChart } from 'lucide-react';

interface ContentMixResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function ContentMixResult(props: ContentMixResultProps) {
  return (
    <GenericOrganicTable
      title="Mix de Conteúdo"
      icon={PieChart}
      iconColor="text-teal-600"
      {...props}
    />
  );
}
