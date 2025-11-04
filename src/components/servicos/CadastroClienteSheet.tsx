"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroClienteSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [nome, setNome] = React.useState("")
  const [segmento, setSegmento] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [cidade, setCidade] = React.useState("")
  const [estado, setEstado] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [imagemUrl, setImagemUrl] = React.useState("")

  const canSave = !!nome.trim()
  const reset = () => { setNome(""); setSegmento(""); setTelefone(""); setEmail(""); setCidade(""); setEstado(""); setStatus(""); setImagemUrl(""); setError(null) }

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('nome_fantasia', nome.trim())
      if (segmento) fd.set('segmento', segmento.trim())
      if (telefone) fd.set('telefone', telefone.trim())
      if (email) fd.set('email', email.trim())
      if (cidade) fd.set('cidade', cidade.trim())
      if (estado) fd.set('estado', estado.trim())
      if (status) fd.set('status', status.trim())
      if (imagemUrl) fd.set('imagem_url', imagemUrl.trim())
      const res = await fetch('/api/modulos/servicos/clientes', { method: 'POST', body: fd })
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
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Cliente</SheetTitle><SheetDescription>Defina os dados do cliente</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome Fantasia<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
              <div><Label>Segmento</Label><Input value={segmento} onChange={(e)=>setSegmento(e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={telefone} onChange={(e)=>setTelefone(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={cidade} onChange={(e)=>setCidade(e.target.value)} /></div>
              <div><Label>Estado</Label><Input value={estado} onChange={(e)=>setEstado(e.target.value)} /></div>
              <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: ativo, bloqueado" /></div>
              <div className="md:col-span-2"><Label>Imagem (URL)</Label><Input value={imagemUrl} onChange={(e)=>setImagemUrl(e.target.value)} placeholder="https://..." /></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

