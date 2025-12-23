"use client"

import * as React from 'react'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

function formatBRL(n?: number) { return (Number(n || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export type SettlementValues = {
  valorParcela: number
  dataRecebimento: string
  forma: string
  conta: string
  valorRecebido: number
  juros: number
  multa: number
  desconto: number
  tarifa: number
}

export type SettlementFormProps = {
  values: SettlementValues
  onChange: (patch: Partial<SettlementValues>) => void
  formas: Array<{ value: string; label: string }>
  contas: Array<{ value: string; label: string }>
  title?: string
  labelForma?: string
  labelConta?: string
  labelValor?: string
}

export default function SettlementForm({ values, onChange, formas, contas, title = 'Informações do recebimento', labelForma = 'Forma de recebimento *', labelConta = 'Conta *', labelValor = 'Valor recebido *' }: SettlementFormProps) {
  const liquido = Number((values.valorRecebido + values.juros + values.multa - values.desconto - values.tarifa).toFixed(2))
  return (
    <Card className="p-4 mx-4">
      <div className="text-base font-semibold text-slate-800 mb-2">{title}</div>
      <div className="text-[13px] text-slate-600 mb-3">Você pode fazer o recebimento total ou parcial do saldo da parcela. O valor restante ficará em aberto.</div>
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Valor da parcela</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">R$</span>
            <Input value={formatBRL(values.valorParcela)} readOnly />
          </div>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Data do recebimento *</Label>
          <Input type="date" value={values.dataRecebimento} onChange={(e) => onChange({ dataRecebimento: e.target.value })} />
        </div>
        <div className="md:col-span-3">
          <Label className="text-sm text-slate-600">{labelForma}</Label>
          <Select value={values.forma} onValueChange={(v) => onChange({ forma: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {formas.map(f => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-3">
          <Label className="text-sm text-slate-600">{labelConta}</Label>
          <Select value={values.conta} onValueChange={(v) => onChange({ conta: v })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {contas.map(c => (<SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-3">
          <Label className="text-sm text-slate-600">{labelValor}</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">R$</span>
            <Input value={formatBRL(values.valorRecebido)} onChange={(e) => {
              const v = Number(e.target.value.replace(/\./g, '').replace(/,/g, '.'))
              if (!isNaN(v)) onChange({ valorRecebido: v })
            }} />
          </div>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Juros *</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">R$</span>
            <Input value={formatBRL(values.juros)} onChange={(e) => {
              const v = Number(e.target.value.replace(/\./g, '').replace(/,/g, '.'))
              if (!isNaN(v)) onChange({ juros: v })
            }} />
          </div>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Multa *</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">R$</span>
            <Input value={formatBRL(values.multa)} onChange={(e) => {
              const v = Number(e.target.value.replace(/\./g, '').replace(/,/g, '.'))
              if (!isNaN(v)) onChange({ multa: v })
            }} />
          </div>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Desconto *</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">R$</span>
            <Input value={formatBRL(values.desconto)} onChange={(e) => {
              const v = Number(e.target.value.replace(/\./g, '').replace(/,/g, '.'))
              if (!isNaN(v)) onChange({ desconto: v })
            }} />
          </div>
        </div>
        <div className="md:col-span-2">
          <Label className="text-sm text-slate-600">Tarifa *</Label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">R$</span>
            <Input value={formatBRL(values.tarifa)} onChange={(e) => {
              const v = Number(e.target.value.replace(/\./g, '').replace(/,/g, '.'))
              if (!isNaN(v)) onChange({ tarifa: v })
            }} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end mt-4 text-sm text-slate-600">
        <div className="mr-3">Líquido a lançar:</div>
        <div className="text-slate-900 font-semibold">R$ {formatBRL(liquido)}</div>
      </div>
    </Card>
  )
}
