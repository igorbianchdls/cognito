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
  return (
    <div className="space-y-4">
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">{titleLaunch}</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-[13px]">
          <div className="md:col-span-2 text-slate-500">{entityLabel}</div>
          <div className="md:col-span-2 text-slate-900 font-medium">{entityName}</div>
          <div className="md:col-span-2 text-slate-500">Código de referência</div>
          <div className="md:col-span-2 text-slate-900 font-medium">{launch.codigoRef || '—'}</div>
          <div className="md:col-span-2 text-slate-500">Data de competência</div>
          <div className="md:col-span-2 text-slate-900 font-medium">{launch.dataCompetencia || '—'}</div>

          <div className="md:col-span-2 text-slate-500">Categoria</div>
          <div className="md:col-span-2 text-slate-900 font-medium">{launch.categoria || '—'}</div>
          <div className="md:col-span-2 text-slate-500">Centro de custo</div>
          <div className="md:col-span-2 text-slate-900 font-medium">{launch.centroCusto || '—'}</div>
          <div className="md:col-span-2 text-slate-500">Recorrente</div>
          <div className="md:col-span-2 text-slate-900 font-medium">{launch.recorrente ? 'Sim' : 'Não'}</div>
        </div>
      </Card>

      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">{titleParcel} {parcel?.numero ? parcel.numero : ''}</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-[13px]">
          <div className="md:col-span-2 text-slate-500">Vencimento</div>
          <div className="md:col-span-2 text-slate-900 font-medium">{parcel.vencimento || '—'}</div>
          <div className="md:col-span-2 text-slate-500">Parcela</div>
          <div className="md:col-span-2 text-slate-900 font-medium">{parcel.numero || '—'}</div>
          <div className="md:col-span-2 text-slate-500">Descrição</div>
          <div className="md:col-span-2 text-slate-900 font-medium">{parcel.descricao || '—'}</div>
        </div>
        <div className="flex items-center justify-end mt-3">
          <div className="text-slate-500 text-sm mr-3">Valor total</div>
          <div className="text-slate-900 text-xl font-semibold">{formatBRL(parcel.valorTotal)}</div>
        </div>
      </Card>
    </div>
  )
}
