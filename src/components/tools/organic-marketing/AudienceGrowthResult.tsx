'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { Users } from 'lucide-react';

interface AudienceGrowthResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function AudienceGrowthResult(props: AudienceGrowthResultProps) {
  return (
    <GenericOrganicTable
      title="Crescimento de Audiência"
      icon={Users}
      iconColor="text-sky-600"
      {...props}
    />
  );
}
