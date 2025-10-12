'use client';

import { Gift } from 'lucide-react';
import { GenericEcommerceTable, type EcommerceTableRow } from './GenericEcommerceTable';

interface CouponEffectivenessResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: EcommerceTableRow[];
  sql_query?: string;
}

export default function CouponEffectivenessResult(props: CouponEffectivenessResultProps) {
  return (
    <GenericEcommerceTable
      title="Efetividade de Cupons"
      icon={Gift}
      iconColor="text-rose-600"
      {...props}
    />
  );
}
