"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroPedidoCompraSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

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
  const reset = () => { setNumeroPedido(""); setFornecedorId(""); setCondicaoId(""); setDataPedido(""); setStatus(""); setValorTotal(""); setObservacoes("") }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : [] } catch { return [] as T[] }
  }

  React.useEffect(() => { if (!isOpen) return; (async () => {
    const [fs, cps] = await Promise.all([
      fetchList<Item>('/api/modulos/compras/fornecedores/list'),
      fetchList<Item>('/api/modulos/compras/condicoes-pagamento/list'),
    ])
    setFornecedores(fs); setCondicoes(cps)
  })() }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(numeroPedido.trim() && fornecedorId && dataPedido)) {
      return { success: false, error: 'Preencha número, fornecedor e data.' }
    }
    try {
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
      if (!res.ok || !json?.success) return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      const id = Number(json?.id)
      createdIdRef.current = Number.isNaN(id) ? null : id
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Pedido"
      description="Defina os dados do pedido"
      widthClassName="max-w-3xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; reset(); if (typeof id === 'number') onCreated?.(id) }}
    >
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
    </BaseCadastroSheet>
  )
}
