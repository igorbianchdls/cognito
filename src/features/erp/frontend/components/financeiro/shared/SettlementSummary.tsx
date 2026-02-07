"use client"

import * as React from 'react'
import { Card } from '@/components/ui/card'

export type LaunchInfo = {
  cliente?: string
  fornecedor?: string
  codigoRef?: string
  dataCompetencia?: string
  categoria?: string
  centroCusto?: string
  recorrente?: boolean
}

export type ParcelInfo = {
  vencimento?: string
  numero?: string // e.g., "1/6"
  descricao?: string
  valorTotal?: number
}

function formatBRL(n?: number) {
  return (Number(n || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function SettlementSummary({ launch, parcel, titleLaunch = 'Informações do lançamento', titleParcel = 'Informações da parcela', entityLabel = 'Cliente' }: { launch: LaunchInfo; parcel: ParcelInfo; titleLaunch?: string; titleParcel?: string; entityLabel?: string }) {
  const entityName = launch.cliente || launch.fornecedor || '—'
  const topItems = [
    { label: entityLabel, value: entityName },
    { label: 'Código de referência', value: launch.codigoRef || '—' },
    { label: 'Data de competência', value: launch.dataCompetencia || '—' },
    { label: 'Categoria', value: launch.categoria || '—' },
    { label: 'Centro de custo', value: launch.centroCusto || '—' },
    { label: 'Recorrente', value: launch.recorrente ? 'Sim' : 'Não' },
  ]
  const parcelItems = [
    { label: 'Vencimento', value: parcel.vencimento || '—' },
    { label: 'Parcela', value: parcel.numero || '—' },
    { label: 'Descrição', value: parcel.descricao || '—' },
    { label: 'Valor total', value: formatBRL(parcel.valorTotal) },
  ]
  return (
    <div className="space-y-4">
      <Card className="p-4 mx-4">
        <div className="text-lg font-semibold text-slate-800 mb-3">{titleLaunch}</div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {topItems.map((it, idx) => (
            <div key={idx} className="flex flex-col">
              <div className="text-base text-slate-500">{it.label}</div>
              <div className="text-[16px] text-slate-900 font-semibold">{it.value}</div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 mx-4">
        <div className="text-lg font-semibold text-slate-800 mb-3">{titleParcel} {parcel?.numero ? parcel.numero : ''}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {parcelItems.map((it, idx) => {
            const isTotal = String(it.label).toLowerCase().includes('valor total')
            return (
              <div key={idx} className="flex flex-col">
                <div className="text-base text-slate-500">{it.label}</div>
                <div className={isTotal ? 'text-[18px] md:text-[20px] text-slate-900 font-bold' : 'text-[16px] text-slate-900 font-semibold'}>
                  {it.value}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
