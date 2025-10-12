'use client';

import { ShoppingCart } from 'lucide-react';
import { GenericEcommerceTable, type EcommerceTableRow } from './GenericEcommerceTable';

interface EcommerceSalesDataTableProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: EcommerceTableRow[];
  sql_query?: string;
}

export default function EcommerceSalesDataTable(props: EcommerceSalesDataTableProps) {
  return (
    <GenericEcommerceTable
      title="Dados de E-commerce"
      icon={ShoppingCart}
      iconColor="text-slate-600"
      {...props}
    />
  );
}
