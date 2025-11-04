"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroSolicitacaoCompraSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [data, setData] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [observacoes, setObservacoes] = React.useState("")

  const canSave = !!data
  const reset = () => { setData(""); setStatus(""); setObservacoes(""); setError(null) }

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('data_solicitacao', data)
      if (status) fd.set('status', status.trim())
      if (observacoes) fd.set('observacoes', observacoes.trim())
      const res = await fetch('/api/modulos/compras/solicitacoes-compra', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const id = Number(json?.id)
      setOpen(false); reset(); if (!Number.isNaN(id)) onCreated?.(id)
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar') } finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button></SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Solicitação</SheetTitle><SheetDescription>Defina os dados da solicitação</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid gap-4">
              <div><Label>Data Solicitação<span className="text-red-500"> *</span></Label><Input type="date" value={data} onChange={(e)=>setData(e.target.value)} /></div>
              <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: aberta, aprovada, cancelada" /></div>
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

