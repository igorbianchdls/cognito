"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroCotacaoCompraSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [fornecedores, setFornecedores] = React.useState<Item[]>([])

  const [fornecedorId, setFornecedorId] = React.useState("")
  const [dataEnvio, setDataEnvio] = React.useState("")
  const [dataRetorno, setDataRetorno] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")

  const canSave = !!fornecedorId && !!dataEnvio
  const reset = () => { setFornecedorId(""); setDataEnvio(""); setDataRetorno(""); setStatus(""); setObservacoes("") }

  const fetchList = async (url: string): Promise<Item[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as Item[] : [] } catch { return [] }
  }

  React.useEffect(() => { if (!isOpen) return; (async () => { const fs = await fetchList('/api/modulos/compras/fornecedores/list'); setFornecedores(fs) })() }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(fornecedorId && dataEnvio)) return { success: false, error: 'Preencha fornecedor e data de envio.' }
    try {
      const fd = new FormData()
      fd.set('fornecedor_id', fornecedorId)
      fd.set('data_envio', dataEnvio)
      if (dataRetorno) fd.set('data_retorno', dataRetorno)
      if (status) fd.set('status', status.trim())
      if (observacoes) fd.set('observacoes', observacoes.trim())
      const res = await fetch('/api/modulos/compras/cotacoes-compra', { method: 'POST', body: fd })
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
      title="Cadastrar Cotação"
      description="Defina os dados da cotação"
      widthClassName="max-w-2xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; reset(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div>
        <Label>Fornecedor<span className="text-red-500"> *</span></Label>
        <Select value={fornecedorId} onValueChange={setFornecedorId}>
          <SelectTrigger><SelectValue placeholder="Selecione o fornecedor" /></SelectTrigger>
          <SelectContent>{fornecedores.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Data Envio<span className="text-red-500"> *</span></Label><Input type="date" value={dataEnvio} onChange={(e)=>setDataEnvio(e.target.value)} /></div>
      <div><Label>Data Retorno</Label><Input type="date" value={dataRetorno} onChange={(e)=>setDataRetorno(e.target.value)} /></div>
      <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: enviada, recebida" /></div>
      <div><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e)=>setObservacoes(e.target.value)} /></div>
    </BaseCadastroSheet>
  )
}
