"use client"

import * as React from 'react'
import ApKpiTile from '@/components/modulos/financeiro/ApKpiTile'

export type NfeKpiRowProps = {
  emAberto?: number
  emTransmissao?: number
  emitidas?: number
  comFalha?: number
  canceladas?: number
  totalPeriodo?: number
  onClick?: (key: 'emAberto' | 'emTransmissao' | 'emitidas' | 'comFalha' | 'canceladas' | 'totalPeriodo') => void
  className?: string
}

export default function NfeKpiRow({ emAberto = 0, emTransmissao = 0, emitidas = 0, comFalha = 0, canceladas = 0, totalPeriodo = 0, onClick, className }: NfeKpiRowProps) {
  return (
    <div className={[ 'grid gap-2', 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6', className || '' ].join(' ')}>
      <ApKpiTile title="Em aberto (R$)" value={emAberto} color="info" onClick={onClick ? () => onClick('emAberto') : undefined} />
      <ApKpiTile title="Em transmissão (R$)" value={emTransmissao} color="warning" onClick={onClick ? () => onClick('emTransmissao') : undefined} />
      <ApKpiTile title="Emitidas (R$)" value={emitidas} color="success" onClick={onClick ? () => onClick('emitidas') : undefined} />
      <ApKpiTile title="Com falha (R$)" value={comFalha} color="danger" onClick={onClick ? () => onClick('comFalha') : undefined} />
      <ApKpiTile title="Canceladas (R$)" value={canceladas} color="warning" onClick={onClick ? () => onClick('canceladas') : undefined} />
      <ApKpiTile title="Total do período (R$)" value={totalPeriodo} color="info" onClick={onClick ? () => onClick('totalPeriodo') : undefined} />
    </div>
  )
}

