"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export type SaleItem = {
  id: string
  produto: string
  detalhes: string
  quantidade: number
  valorUnitario: number
}

export type SaleItemsEditorProps = {
  items: SaleItem[]
  onChange: (items: SaleItem[]) => void
  produtoOptions?: Array<{ value: string; label: string }>
}

function fmtBRL(n: number) {
  return (Number(n || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function SaleItemsEditor({ items, onChange, produtoOptions = [] }: SaleItemsEditorProps) {
  const update = (idx: number, patch: Partial<SaleItem>) => {
    onChange(items.map((it, i) => i === idx ? { ...it, ...patch } : it))
  }
  const addRow = () => onChange([ ...items, { id: String(Date.now()), produto: '', detalhes: '', quantidade: 1, valorUnitario: 0 } ])
  const removeRow = (idx: number) => onChange(items.filter((_, i) => i !== idx))

  const totalGeral = items.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valorUnitario)), 0)

  return (
    <Card className="p-4 mx-4">
      <div className="text-base font-semibold text-slate-800 mb-3">Itens da venda</div>

      {/* Cabeçalho */}
      <div className="hidden md:grid md:grid-cols-12 gap-3 text-xs text-slate-600 mb-1 px-1">
        <div className="md:col-span-4">Produtos/Serviços *</div>
        <div className="md:col-span-4">Detalhes do item</div>
        <div className="md:col-span-1 text-right">Quantidade *</div>
        <div className="md:col-span-1 text-right">Valor Unitário *</div>
        <div className="md:col-span-2 text-right">Total (R$) *</div>
      </div>

      {/* Linhas */}
      <div className="space-y-2">
        {items.map((it, i) => {
          const totalLinha = Number(it.quantidade) * Number(it.valorUnitario)
          return (
            <div key={it.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-4">
                <Select value={it.produto} onValueChange={(v) => update(i, { produto: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtoOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-4">
                <Input placeholder="Detalhes do item" value={it.detalhes} onChange={(e) => update(i, { detalhes: e.target.value })} />
              </div>
              <div className="md:col-span-1">
                <Input inputMode="numeric" className="text-right" value={String(it.quantidade)} onChange={(e) => {
                  const v = Number(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
                  if (!isNaN(v)) update(i, { quantidade: v })
                }} />
              </div>
              <div className="md:col-span-1">
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
      </div>

      {/* Ações e totalizador */}
      <div className="mt-3 flex items-center justify-between">
        <Button type="button" variant="outline" onClick={addRow}>
          + Adicionar nova linha
        </Button>
        <div className="text-sm text-slate-700">Total geral: <span className="font-semibold">R$ {fmtBRL(totalGeral)}</span></div>
      </div>
    </Card>
  )
}

