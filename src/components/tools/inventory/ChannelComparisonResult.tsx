'use client';

import { Network } from 'lucide-react';
import { GenericInventoryTable, type InventoryTableRow } from '../GenericInventoryTable';

interface ChannelComparisonResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: InventoryTableRow[];
  sql_query?: string;
}

export default function ChannelComparisonResult(props: ChannelComparisonResultProps) {
  return (
    <GenericInventoryTable
      title="Comparativo de Canais"
      icon={Network}
      iconColor="text-cyan-600"
      {...props}
    />
  );
}
