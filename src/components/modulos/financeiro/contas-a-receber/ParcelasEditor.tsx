"use client"

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RotateCcw, X } from 'lucide-react'

export type Parcela = {
  index: number
  vencimento: string
  valor: number
  percentual: number
  forma?: string | null
  conta?: string | null
  descricao?: string
}

export type ParcelasEditorProps = {
  total: number
  parcelas: Parcela[]
  onChangeParcel: (idx: number, patch: Partial<Parcela>) => void
  formasPagamento: Array<{ value: string; label: string }>
  contas: Array<{ value: string; label: string }>
  formaPadrao: string
  contaPadrao: string
}

function fmtCurrency(n: number) { return (Number(n || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function ParcelasEditor({ total, parcelas, onChangeParcel, formasPagamento, contas, formaPadrao, contaPadrao }: ParcelasEditorProps) {
  const somaValores = parcelas.reduce((a, p) => a + (Number.isFinite(p.valor) ? p.valor : 0), 0)
  const somaPercent = parcelas.reduce((a, p) => a + (Number.isFinite(p.percentual) ? p.percentual : 0), 0)
  const diff = Number((total - somaValores).toFixed(2))

  return (
    <div className="space-y-3">
      <div className="text-sm font-semibold text-slate-800">Parcelas</div>
      {parcelas.map((p, i) => (
        <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="text-xs text-slate-500 md:col-span-1">{i + 1}</div>
          <div className="md:col-span-2">
            <Label className="text-xs text-slate-600">Vencimento</Label>
            <Input type="date" value={p.vencimento} onChange={(e) => onChangeParcel(i, { vencimento: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-slate-600">Valor (R$)</Label>
            <Input value={fmtCurrency(p.valor)} onChange={(e) => {
              const raw = e.target.value.replace(/\./g, '').replace(/,/g, '.')
              const v = Number(raw)
              if (!isNaN(v)) onChangeParcel(i, { valor: v, percentual: total ? Number(((v / total) * 100).toFixed(2)) : 0 })
            }} />
          </div>
          <div className="md:col-span-1">
            <Label className="text-xs text-slate-600">Percentual</Label>
            <Input value={String(p.percentual)} onChange={(e) => {
              const v = Number(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
              if (!isNaN(v)) onChangeParcel(i, { percentual: v, valor: Number(((total * v) / 100).toFixed(2)) })
            }} />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-slate-600">Forma de pagamento</Label>
            <div className="flex items-center gap-2">
              <Select value={p.forma ?? ''} onValueChange={(v) => onChangeParcel(i, { forma: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={formaPadrao ? `Herdado (${formasPagamento.find(f=>f.value===formaPadrao)?.label || 'Padrão'})` : 'Selecione'} />
                </SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((f) => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button type="button" aria-label="Resetar forma (padrão)" className="p-1 rounded border hover:bg-gray-50" onClick={() => onChangeParcel(i, { forma: formaPadrao || '' })}>
                <RotateCcw className="h-4 w-4 text-slate-600" />
              </button>
              <button type="button" aria-label="Limpar override" className="p-1 rounded border hover:bg-gray-50" onClick={() => onChangeParcel(i, { forma: '' })}>
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-slate-600">Conta para Recebimento</Label>
            <div className="flex items-center gap-2">
              <Select value={p.conta ?? ''} onValueChange={(v) => onChangeParcel(i, { conta: v })}>
                <SelectTrigger>
                  <SelectValue placeholder={contaPadrao ? `Herdado (${contas.find(c=>c.value===contaPadrao)?.label || 'Padrão'})` : 'Selecione'} />
                </SelectTrigger>
                <SelectContent>
                  {contas.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button type="button" aria-label="Resetar conta (padrão)" className="p-1 rounded border hover:bg-gray-50" onClick={() => onChangeParcel(i, { conta: contaPadrao || '' })}>
                <RotateCcw className="h-4 w-4 text-slate-600" />
              </button>
              <button type="button" aria-label="Limpar override" className="p-1 rounded border hover:bg-gray-50" onClick={() => onChangeParcel(i, { conta: '' })}>
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs text-slate-600">Descrição</Label>
            <Input value={p.descricao ?? ''} onChange={(e) => onChangeParcel(i, { descricao: e.target.value })} />
          </div>
        </div>
      ))}

      <div className="text-xs text-slate-600 mt-1">
        Soma das parcelas: R$ {fmtCurrency(somaValores)} {diff !== 0 ? (
          <span className="text-amber-700">(diferença de R$ {fmtCurrency(Math.abs(diff))} para o total R$ {fmtCurrency(total)})</span>
        ) : null} — Percentuais: {somaPercent.toFixed(2)}%
      </div>
    </div>
  )
}

