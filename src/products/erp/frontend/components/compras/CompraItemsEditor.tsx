"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export type CompraItem = {
  id: string
  produto: string
  quantidade: number
  unidade: string
  valorUnitario: number
}

export type CompraItemsEditorProps = {
  items: CompraItem[]
  onChange: (items: CompraItem[]) => void
  produtoOptions?: Array<{ value: string; label: string }>
  unidadeOptions?: Array<{ value: string; label: string }>
}

function fmtBRL(n: number) { return (Number(n || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function CompraItemsEditor({ items, onChange, produtoOptions = [], unidadeOptions = [{ value: 'un', label: 'un' }, { value: 'cx', label: 'cx' }] }: CompraItemsEditorProps) {
  const addRow = () => onChange([...items, { id: String(Date.now()), produto: '', quantidade: 1, unidade: 'un', valorUnitario: 0 }])
  const removeRow = (idx: number) => onChange(items.filter((_, i) => i !== idx))
  const update = (idx: number, patch: Partial<CompraItem>) => onChange(items.map((it, i) => i === idx ? { ...it, ...patch } : it))

  const totalGeral = items.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valorUnitario)), 0)

  return (
    <div className="space-y-2">
      <div className="hidden md:grid md:grid-cols-12 gap-3 text-xs text-slate-600 mb-1 px-1">
        <div className="md:col-span-4">Produto</div>
        <div className="md:col-span-2">Quantidade</div>
        <div className="md:col-span-2">Unidade</div>
        <div className="md:col-span-2">Valor Unitário</div>
        <div className="md:col-span-2 text-right">Total (R$)</div>
      </div>

      {items.map((it, i) => {
        const totalLinha = Number(it.quantidade) * Number(it.valorUnitario)
        return (
          <div key={it.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            <div className="md:col-span-4">
              <Label className="md:hidden">Produto</Label>
              <Select value={it.produto} onValueChange={(v) => update(i, { produto: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {produtoOptions.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="md:hidden">Quantidade</Label>
              <Input inputMode="numeric" value={String(it.quantidade)} onChange={(e) => {
                const v = Number(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
                if (!isNaN(v)) update(i, { quantidade: v })
              }} />
            </div>
            <div className="md:col-span-2">
              <Label className="md:hidden">Unidade</Label>
              <Select value={it.unidade} onValueChange={(v) => update(i, { unidade: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {unidadeOptions.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="md:hidden">Valor Unitário</Label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500">R$</span>
                <Input className="text-right" value={fmtBRL(it.valorUnitario)} onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, '').replace(/,/g, '.')
                  const v = Number(raw)
                  if (!isNaN(v)) update(i, { valorUnitario: v })
                }} />
              </div>
            </div>
            <div className="md:col-span-2 text-right text-sm font-medium">R$ {fmtBRL(totalLinha)}</div>
            <div className="md:col-span-12 text-right">
              <button type="button" onClick={() => removeRow(i)} className="text-xs text-red-600 hover:underline">Remover</button>
            </div>
          </div>
        )
      })}

      <div className="flex items-center justify-between mt-2">
        <Button variant="outline" onClick={addRow}>+ Adicionar item</Button>
        <div className="text-sm text-slate-700">Total geral: <span className="font-semibold">R$ {fmtBRL(totalGeral)}</span></div>
      </div>
    </div>
  )
}

