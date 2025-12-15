"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroSolicitacaoCompraSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const createdIdRef = React.useRef<number | null>(null)

  const [data, setData] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")

  const canSave = !!data
  const reset = () => { setData(""); setStatus(""); setObservacoes("") }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!data) return { success: false, error: 'Informe a data da solicitação.' }
    try {
      const fd = new FormData()
      fd.set('data_solicitacao', data)
      if (status) fd.set('status', status.trim())
      if (observacoes) fd.set('observacoes', observacoes.trim())
      const res = await fetch('/api/modulos/compras/solicitacoes-compra', { method: 'POST', body: fd })
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
      title="Cadastrar Solicitação"
      description="Defina os dados da solicitação"
      widthClassName="max-w-xl"
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; reset(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div><Label>Data Solicitação<span className="text-red-500"> *</span></Label><Input type="date" value={data} onChange={(e)=>setData(e.target.value)} /></div>
      <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: aberta, aprovada, cancelada" /></div>
      <div><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e)=>setObservacoes(e.target.value)} /></div>
    </BaseCadastroSheet>
  )
}
