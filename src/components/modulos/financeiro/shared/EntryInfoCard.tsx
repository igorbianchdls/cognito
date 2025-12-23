"use client"

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type EntryInfoValues = {
  dataCompetencia: string
  entidade: string
  descricao: string
  valor: string
  habilitarRateio: boolean
  categoria: string
  centro: string
  codigoReferencia: string
}

export type EntryInfoCardProps = {
  values: EntryInfoValues
  onChange: (patch: Partial<EntryInfoValues>) => void
  title?: string
  entityLabel: string
  categoryLabel?: string
  centerLabel?: string
}

export default function EntryInfoCard({ values, onChange, title = 'Informações do lançamento', entityLabel, categoryLabel = 'Categoria', centerLabel = 'Centro de custo' }: EntryInfoCardProps) {
  return (
    <Card className="p-4 mx-3">
      <div className="text-base font-semibold text-slate-800 mb-3">{title}</div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Data de competência *</Label>
          <Input type="date" value={values.dataCompetencia} onChange={(e) => onChange({ dataCompetencia: e.target.value })} />
        </div>
        <div className="md:col-span-4">
          <Label className="text-sm text-slate-600">{entityLabel}</Label>
          <Select value={values.entidade} onValueChange={(v) => onChange({ entidade: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Opção 1</SelectItem>
              <SelectItem value="2">Opção 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-4">
          <Label className="text-sm text-slate-600">Descrição *</Label>
          <Input placeholder="Descrição" value={values.descricao} onChange={(e) => onChange({ descricao: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Valor *</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">R$</span>
            <Input placeholder="0,00" value={values.valor} onChange={(e) => onChange({ valor: e.target.value })} />
          </div>
        </div>

        <div className="md:col-span-3">
          <Label className="text-sm text-slate-600">{categoryLabel}</Label>
          <Select value={values.categoria} onValueChange={(v) => onChange({ categoria: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cat1">Categoria 1</SelectItem>
              <SelectItem value="cat2">Categoria 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Label className="text-sm text-slate-600">{centerLabel}</Label>
          <Select value={values.centro} onValueChange={(v) => onChange({ centro: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cc1">Centro 1</SelectItem>
              <SelectItem value="cc2">Centro 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Código de referência</Label>
          <Input value={values.codigoReferencia} onChange={(e) => onChange({ codigoReferencia: e.target.value })} />
        </div>
      </div>
    </Card>
  )
}
