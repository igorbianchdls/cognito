"use client"

import * as React from 'react'
import ApKpiTile from './ApKpiTile'

export default function ExtratoKpiRow({
  receitasEmAberto = 0,
  receitasRealizadas = 0,
  despesasEmAberto = 0,
  despesasRealizadas = 0,
  totalPeriodo = 0,
}: {
  receitasEmAberto?: number
  receitasRealizadas?: number
  despesasEmAberto?: number
  despesasRealizadas?: number
  totalPeriodo?: number
}) {
  return (
    <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      <ApKpiTile title="Receitas em aberto (R$)" value={receitasEmAberto} color="success" />
      <ApKpiTile title="Receitas realizadas (R$)" value={receitasRealizadas} color="success" />
      <ApKpiTile title="Despesas em aberto (R$)" value={despesasEmAberto} color="danger" />
      <ApKpiTile title="Despesas realizadas (R$)" value={despesasRealizadas} color="danger" />
      <ApKpiTile title="Total do período (R$)" value={totalPeriodo} color="info" />
    </div>
  )
}
