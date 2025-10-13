'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { Clock } from 'lucide-react';

interface Props {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function EngagementByDayHourResult(props: Props) {
  return (
    <GenericOrganicTable
      title="Engajamento por dia/horário"
      icon={Clock}
      iconColor="text-amber-600"
      {...props}
    />
  );
}

