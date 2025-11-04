"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroPedidoCompraSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [fornecedores, setFornecedores] = React.useState<Item[]>([])
  const [condicoes, setCondicoes] = React.useState<Item[]>([])

  const [numeroPedido, setNumeroPedido] = React.useState("")
  const [fornecedorId, setFornecedorId] = React.useState("")
  const [condicaoId, setCondicaoId] = React.useState("")
  const [dataPedido, setDataPedido] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [valorTotal, setValorTotal] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")

  const canSave = !!numeroPedido.trim() && !!fornecedorId && !!dataPedido
  const reset = () => { setNumeroPedido(""); setFornecedorId(""); setCondicaoId(""); setDataPedido(""); setStatus(""); setValorTotal(""); setObservacoes(""); setError(null) }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : [] } catch { return [] as T[] }
  }

  React.useEffect(() => { if (!open) return; (async () => {
    const [fs, cps] = await Promise.all([
      fetchList<Item>('/api/modulos/compras/fornecedores/list'),
      fetchList<Item>('/api/modulos/compras/condicoes-pagamento/list'),
    ])
    setFornecedores(fs); setCondicoes(cps)
  })() }, [open])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('numero_pedido', numeroPedido.trim())
      fd.set('fornecedor_id', fornecedorId)
      if (condicaoId) fd.set('condicao_pagamento_id', condicaoId)
      fd.set('data_pedido', dataPedido)
      if (status) fd.set('status', status.trim())
      if (valorTotal) fd.set('valor_total', valorTotal)
      if (observacoes) fd.set('observacoes', observacoes.trim())
      const res = await fetch('/api/modulos/compras/pedidos', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const id = Number(json?.id)
      setOpen(false); reset(); if (!Number.isNaN(id)) onCreated?.(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar') } finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button></SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-3xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Pedido</SheetTitle><SheetDescription>Defina os dados do pedido</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 gap-4">
              <div><Label>Número do Pedido<span className="text-red-500"> *</span></Label><Input value={numeroPedido} onChange={(e)=>setNumeroPedido(e.target.value)} /></div>
              <div>
                <Label>Fornecedor<span className="text-red-500"> *</span></Label>
                <Select value={fornecedorId} onValueChange={setFornecedorId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
                  <SelectContent>{fornecedores.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Condição de Pagamento</Label>
                <Select value={condicaoId} onValueChange={setCondicaoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{condicoes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Data do Pedido<span className="text-red-500"> *</span></Label><Input type="date" value={dataPedido} onChange={(e)=>setDataPedido(e.target.value)} /></div>
              <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: aberto, faturado, cancelado" /></div>
              <div><Label>Valor Total</Label><Input type="number" step="0.01" value={valorTotal} onChange={(e)=>setValorTotal(e.target.value)} /></div>
              <div><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e)=>setObservacoes(e.target.value)} /></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
