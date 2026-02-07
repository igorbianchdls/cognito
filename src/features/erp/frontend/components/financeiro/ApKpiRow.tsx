"use client"

import * as React from 'react'
import ApKpiTile from './ApKpiTile'

export type ApKpiRowProps = {
  vencidos?: number
  vencemHoje?: number
  aVencer?: number
  recebidos?: number
  totalPeriodo?: number
  onTileClick?: (key: 'vencidos' | 'vencemHoje' | 'aVencer' | 'recebidos' | 'totalPeriodo') => void
  className?: string
}

export default function ApKpiRow({
  vencidos = 0,
  vencemHoje = 0,
  aVencer = 0,
  recebidos = 0,
  totalPeriodo = 0,
  onTileClick,
  className,
}: ApKpiRowProps) {
  return (
    <div className={[
      'grid gap-2',
      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
      className || '',
    ].join(' ')}>
      <ApKpiTile
        title="Vencidos (R$)"
        value={vencidos}
        color="danger"
        onClick={onTileClick ? () => onTileClick('vencidos') : undefined}
      />
      <ApKpiTile
        title="Vencem hoje (R$)"
        value={vencemHoje}
        color="danger"
        onClick={onTileClick ? () => onTileClick('vencemHoje') : undefined}
      />
      <ApKpiTile
        title="A vencer (R$)"
        value={aVencer}
        color="info"
        onClick={onTileClick ? () => onTileClick('aVencer') : undefined}
      />
      <ApKpiTile
        title="Recebidos (R$)"
        value={recebidos}
        color="success"
        onClick={onTileClick ? () => onTileClick('recebidos') : undefined}
      />
      <ApKpiTile
        title="Total do período (R$)"
        value={totalPeriodo}
        color="info"
        onClick={onTileClick ? () => onTileClick('totalPeriodo') : undefined}
      />
    </div>
  )
}

