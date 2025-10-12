'use client';

import { Truck } from 'lucide-react';
import { GenericInventoryTable, type InventoryTableRow } from '../GenericInventoryTable';

interface RestockForecastResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: InventoryTableRow[];
  sql_query?: string;
}

export default function RestockForecastResult(props: RestockForecastResultProps) {
  return (
    <GenericInventoryTable
      title="Previsão de Reposição"
      icon={Truck}
      iconColor="text-orange-600"
      {...props}
    />
  );
}
