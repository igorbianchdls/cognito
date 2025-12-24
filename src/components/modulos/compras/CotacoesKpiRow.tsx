"use client"

import * as React from 'react'
import ApKpiTile from '@/components/modulos/financeiro/ApKpiTile'

export type CotacoesKpiRowProps = {
  abertas?: number
  respondidas?: number
  aprovadas?: number
  totalPeriodo?: number
  onClick?: (key: 'abertas' | 'respondidas' | 'aprovadas' | 'totalPeriodo') => void
  className?: string
}

export default function CotacoesKpiRow({ abertas = 0, respondidas = 0, aprovadas = 0, totalPeriodo = 0, onClick, className }: CotacoesKpiRowProps) {
  return (
    <div className={[ 'grid gap-2', 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4', className || '' ].join(' ')}>
      <ApKpiTile title="Abertas (R$)" value={abertas} color="info" onClick={onClick ? () => onClick('abertas') : undefined} />
      <ApKpiTile title="Respondidas (R$)" value={respondidas} color="warning" onClick={onClick ? () => onClick('respondidas') : undefined} />
      <ApKpiTile title="Aprovadas (R$)" value={aprovadas} color="success" onClick={onClick ? () => onClick('aprovadas') : undefined} />
      <ApKpiTile title="Total do período (R$)" value={totalPeriodo} color="info" onClick={onClick ? () => onClick('totalPeriodo') : undefined} />
    </div>
  )}

