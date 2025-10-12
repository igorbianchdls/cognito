'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { LineChart } from 'lucide-react';

interface ForecastEngagementResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function ForecastEngagementResult(props: ForecastEngagementResultProps) {
  return (
    <GenericOrganicTable
      title="Previsão de Engajamento"
      icon={LineChart}
      iconColor="text-indigo-600"
      {...props}
    />
  );
}
