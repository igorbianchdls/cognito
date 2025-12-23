"use client"

import * as React from 'react'
import ApKpiTile from './ApKpiTile'

export default function ExtratoKpiRow({
  saldoInicial = 0,
  creditos = 0,
  debitos = 0,
  saldoFinal = 0,
  diferenca = 0,
}: {
  saldoInicial?: number
  creditos?: number
  debitos?: number
  saldoFinal?: number
  diferenca?: number
}) {
  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <ApKpiTile title="Saldo inicial (R$)" value={saldoInicial} color="info" />
      <ApKpiTile title="Créditos (R$)" value={creditos} color="success" />
      <ApKpiTile title="Débitos (R$)" value={debitos} color="danger" />
      <ApKpiTile title="Saldo final (R$)" value={saldoFinal} color="info" />
      <ApKpiTile title="Diferença (R$)" value={diferenca} color={diferenca >= 0 ? 'success' : 'danger'} />
    </div>
  )
}

