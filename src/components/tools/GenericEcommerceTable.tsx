'use client';

import type { LucideIcon } from 'lucide-react';
import {
  GenericOrganicTable,
  type OrganicTableRow,
} from './organic-marketing/GenericOrganicTable';

export type EcommerceTableRow = OrganicTableRow;

interface GenericEcommerceTableProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: EcommerceTableRow[];
  sql_query?: string;
}

export function GenericEcommerceTable(props: GenericEcommerceTableProps) {
  return <GenericOrganicTable {...props} />;
}
