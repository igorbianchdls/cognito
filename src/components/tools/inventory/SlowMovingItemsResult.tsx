'use client';

import { Timer } from 'lucide-react';
import { GenericInventoryTable, type InventoryTableRow } from '../GenericInventoryTable';

interface SlowMovingItemsResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: InventoryTableRow[];
  sql_query?: string;
}

export default function SlowMovingItemsResult(props: SlowMovingItemsResultProps) {
  return (
    <GenericInventoryTable
      title="Itens de Baixo Giro"
      icon={Timer}
      iconColor="text-amber-600"
      {...props}
    />
  );
}
