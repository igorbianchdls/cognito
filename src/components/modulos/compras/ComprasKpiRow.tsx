"use client"

import * as React from 'react'
import ApKpiTile from '@/components/modulos/financeiro/ApKpiTile'

export type ComprasKpiRowProps = {
  canceladas?: number
  emAprovacao?: number
  aprovadas?: number
  totalPeriodo?: number
  onClick?: (key: 'canceladas' | 'emAprovacao' | 'aprovadas' | 'totalPeriodo') => void
  className?: string
}

export default function ComprasKpiRow({ canceladas = 0, emAprovacao = 0, aprovadas = 0, totalPeriodo = 0, onClick, className }: ComprasKpiRowProps) {
  return (
    <div className={[ 'grid gap-2', 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4', className || '' ].join(' ')}>
      <ApKpiTile title="Canceladas (R$)" value={canceladas} color="danger" onClick={onClick ? () => onClick('canceladas') : undefined} />
      <ApKpiTile title="Em aprovação (R$)" value={emAprovacao} color="warning" onClick={onClick ? () => onClick('emAprovacao') : undefined} />
      <ApKpiTile title="Aprovadas (R$)" value={aprovadas} color="success" onClick={onClick ? () => onClick('aprovadas') : undefined} />
      <ApKpiTile title="Total do período (R$)" value={totalPeriodo} color="info" onClick={onClick ? () => onClick('totalPeriodo') : undefined} />
    </div>
  )
}

