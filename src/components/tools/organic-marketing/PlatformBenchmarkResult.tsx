'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { Award } from 'lucide-react';

interface PlatformBenchmarkResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function PlatformBenchmarkResult(props: PlatformBenchmarkResultProps) {
  return (
    <GenericOrganicTable
      title="Benchmark de Plataformas"
      icon={Award}
      iconColor="text-indigo-600"
      {...props}
    />
  );
}
