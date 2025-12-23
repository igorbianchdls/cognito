"use client"

import * as React from 'react'
import ApKpiTile from '@/components/modulos/financeiro/ApKpiTile'

export type VendasKpiRowProps = {
  cancelados?: number
  previstos?: number
  aprovados?: number
  totalPeriodo?: number
  onClick?: (key: 'cancelados' | 'previstos' | 'aprovados' | 'totalPeriodo') => void
  className?: string
}

export default function VendasKpiRow({ cancelados = 0, previstos = 0, aprovados = 0, totalPeriodo = 0, onClick, className }: VendasKpiRowProps) {
  return (
    <div className={[ 'grid gap-2', 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4', className || '' ].join(' ')}>
      <ApKpiTile title="Cancelados (R$)" value={cancelados} color="danger" onClick={onClick ? () => onClick('cancelados') : undefined} />
      <ApKpiTile title="Previstos (R$)" value={previstos} color="warning" onClick={onClick ? () => onClick('previstos') : undefined} />
      <ApKpiTile title="Aprovados (R$)" value={aprovados} color="success" onClick={onClick ? () => onClick('aprovados') : undefined} />
      <ApKpiTile title="Total do período (R$)" value={totalPeriodo} color="info" onClick={onClick ? () => onClick('totalPeriodo') : undefined} />
    </div>
  )
}

