'use client';

import { Network } from 'lucide-react';
import { GenericEcommerceTable, type EcommerceTableRow } from './GenericEcommerceTable';

interface ChannelAnalysisResultProps {
  success: boolean;
  message: string;
  periodo_dias?: number;
  data?: EcommerceTableRow[];
  sql_query?: string;
}

export default function ChannelAnalysisResult(props: ChannelAnalysisResultProps) {
  return (
    <GenericEcommerceTable
      title="Análise de Canais"
      icon={Network}
      iconColor="text-cyan-600"
      {...props}
    />
  );
}
