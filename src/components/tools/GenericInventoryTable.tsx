'use client';

import type { LucideIcon } from 'lucide-react';
import {
  GenericOrganicTable,
  type OrganicTableRow,
} from './organic-marketing/GenericOrganicTable';

export type InventoryTableRow = OrganicTableRow;

interface GenericInventoryTableProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: InventoryTableRow[];
  sql_query?: string;
}

export function GenericInventoryTable(props: GenericInventoryTableProps) {
  return <GenericOrganicTable {...props} />;
}
