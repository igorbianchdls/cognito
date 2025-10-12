'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { DollarSign } from 'lucide-react';

interface ContentROIResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function ContentROIResult(props: ContentROIResultProps) {
  return (
    <GenericOrganicTable
      title="ROI de Conteúdo"
      icon={DollarSign}
      iconColor="text-emerald-600"
      {...props}
    />
  );
}
