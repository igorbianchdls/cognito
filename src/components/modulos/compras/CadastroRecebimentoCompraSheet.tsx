"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Pedido = { id: number; numero_pedido: string }

export default function CadastroRecebimentoCompraSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [pedidos, setPedidos] = React.useState<Pedido[]>([])

  const [pedidoId, setPedidoId] = React.useState("")
  const [data, setData] = React.useState("")
  const [nota, setNota] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")

  const canSave = !!pedidoId && !!data
  const reset = () => { setPedidoId(""); setData(""); setNota(""); setStatus(""); setObservacoes("") }

  const fetchList = async (url: string): Promise<Pedido[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as Pedido[] : [] } catch { return [] }
  }

  React.useEffect(() => { if (!isOpen) return; (async () => { const ps = await fetchList('/api/modulos/compras/pedidos/list'); setPedidos(ps) })() }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(pedidoId && data)) return { success: false, error: 'Preencha pedido e data de recebimento.' }
    try {
      const fd = new FormData()
      fd.set('pedido_id', pedidoId)
      fd.set('data_recebimento', data)
      if (nota) fd.set('numero_nota_fiscal', nota.trim())
      if (status) fd.set('status', status.trim())
      if (observacoes) fd.set('observacoes', observacoes.trim())
      const res = await fetch('/api/modulos/compras/recebimentos', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      const id = Number(json?.id)
      createdIdRef.current = Number.isNaN(id) ? null : id
      return { success: true }
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' } }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Recebimento"
      description="Defina os dados do recebimento"
      widthClassName="max-w-2xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; reset(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div>
        <Label>Pedido<span className="text-red-500"> *</span></Label>
        <Select value={pedidoId} onValueChange={setPedidoId}>
          <SelectTrigger><SelectValue placeholder="Selecione o pedido" /></SelectTrigger>
          <SelectContent>{pedidos.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.numero_pedido}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Data Recebimento<span className="text-red-500"> *</span></Label><Input type="date" value={data} onChange={(e)=>setData(e.target.value)} /></div>
      <div><Label>Nota Fiscal</Label><Input value={nota} onChange={(e)=>setNota(e.target.value)} /></div>
      <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: recebido, parcial" /></div>
      <div><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e)=>setObservacoes(e.target.value)} /></div>
    </BaseCadastroSheet>
  )
}
