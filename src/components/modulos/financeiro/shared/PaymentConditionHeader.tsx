"use client"

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type PaymentConditionConfig = {
  parcelas: number
  primeiroVenc: string
  intervaloDias: number
  formaPadrao: string
  contaPadrao: string
}

export type PaymentConditionHeaderProps = {
  config: PaymentConditionConfig
  onChange: (patch: Partial<PaymentConditionConfig>) => void
  formasPagamento: Array<{ value: string; label: string }>
  contas: Array<{ value: string; label: string }>
}

export default function PaymentConditionHeader({ config, onChange, formasPagamento, contas }: PaymentConditionHeaderProps) {
  const parcOpts = Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}x` }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
      <div className="md:col-span-2">
        <Label className="text-xs text-slate-600">Parcelamento *</Label>
        <Select value={String(config.parcelas)} onValueChange={(v) => onChange({ parcelas: Number(v) || 1 })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {parcOpts.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-3">
        <Label className="text-xs text-slate-600">1º Vencimento *</Label>
        <Input type="date" value={config.primeiroVenc} onChange={(e) => onChange({ primeiroVenc: e.target.value })} />
      </div>

      <div className="md:col-span-2">
        <Label className="text-xs text-slate-600">Intervalo entre parcelas (dias) *</Label>
        <Input inputMode="numeric" value={String(config.intervaloDias)} onChange={(e) => onChange({ intervaloDias: Number(e.target.value.replace(/\D/g, '')) || 0 })} />
      </div>

      <div className="md:col-span-3">
        <Label className="text-xs text-slate-600">Forma de pagamento</Label>
        <Select value={config.formaPadrao} onValueChange={(v) => onChange({ formaPadrao: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {formasPagamento.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="md:col-span-2">
        <Label className="text-xs text-slate-600">Conta de recebimento</Label>
        <Select value={config.contaPadrao} onValueChange={(v) => onChange({ contaPadrao: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {contas.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

