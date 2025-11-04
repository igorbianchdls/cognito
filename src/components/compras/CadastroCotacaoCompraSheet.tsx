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

export default function CadastroCotacaoCompraSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [fornecedores, setFornecedores] = React.useState<Item[]>([])

  const [fornecedorId, setFornecedorId] = React.useState("")
  const [dataEnvio, setDataEnvio] = React.useState("")
  const [dataRetorno, setDataRetorno] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")

  const canSave = !!fornecedorId && !!dataEnvio
  const reset = () => { setFornecedorId(""); setDataEnvio(""); setDataRetorno(""); setStatus(""); setObservacoes(""); setError(null) }

  const fetchList = async (url: string): Promise<Item[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as Item[] : [] } catch { return [] }
  }

  React.useEffect(() => { if (!open) return; (async () => { const fs = await fetchList('/api/modulos/compras/fornecedores/list'); setFornecedores(fs) })() }, [open])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('fornecedor_id', fornecedorId)
      fd.set('data_envio', dataEnvio)
      if (dataRetorno) fd.set('data_retorno', dataRetorno)
      if (status) fd.set('status', status.trim())
      if (observacoes) fd.set('observacoes', observacoes.trim())
      const res = await fetch('/api/modulos/compras/cotacoes-compra', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const id = Number(json?.id)
      setOpen(false); reset(); if (!Number.isNaN(id)) onCreated?.(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar') } finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button></SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-2xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Cotação</SheetTitle><SheetDescription>Defina os dados da cotação</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <div className="md:col-span-2"><Label>Observações</Label><Textarea rows={3} value={observacoes} onChange={(e)=>setObservacoes(e.target.value)} /></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

