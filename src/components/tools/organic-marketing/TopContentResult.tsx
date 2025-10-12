'use client';

import { GenericOrganicTable } from './GenericOrganicTable';
import type { OrganicTableRow } from './GenericOrganicTable';
import { Flame } from 'lucide-react';

interface TopContentResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: OrganicTableRow[];
  sql_query?: string;
}

export default function TopContentResult(props: TopContentResultProps) {
  return (
    <GenericOrganicTable
      title="Top Conteúdos"
      icon={Flame}
      iconColor="text-orange-600"
      {...props}
    />
  );
}
