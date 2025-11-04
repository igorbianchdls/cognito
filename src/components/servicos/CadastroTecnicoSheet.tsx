"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroTecnicoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [nome, setNome] = React.useState("")
  const [cargo, setCargo] = React.useState("")
  const [especialidade, setEspecialidade] = React.useState("")
  const [custoHora, setCustoHora] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [admissao, setAdmissao] = React.useState("")
  const [imagemUrl, setImagemUrl] = React.useState("")

  const canSave = !!nome.trim()
  const reset = () => { setNome(""); setCargo(""); setEspecialidade(""); setCustoHora(""); setTelefone(""); setEmail(""); setStatus(""); setAdmissao(""); setImagemUrl(""); setError(null) }

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('nome', nome.trim())
      if (cargo) fd.set('cargo', cargo.trim())
      if (especialidade) fd.set('especialidade', especialidade.trim())
      if (custoHora) fd.set('custo_hora', custoHora)
      if (telefone) fd.set('telefone', telefone.trim())
      if (email) fd.set('email', email.trim())
      if (status) fd.set('status', status.trim())
      if (admissao) fd.set('data_admissao', admissao)
      if (imagemUrl) fd.set('imagem_url', imagemUrl.trim())
      const res = await fetch('/api/modulos/servicos/tecnicos', { method: 'POST', body: fd })
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
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Técnico</SheetTitle><SheetDescription>Defina os dados do técnico</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
              <div><Label>Cargo</Label><Input value={cargo} onChange={(e)=>setCargo(e.target.value)} /></div>
              <div><Label>Especialidade</Label><Input value={especialidade} onChange={(e)=>setEspecialidade(e.target.value)} /></div>
              <div><Label>Custo/hora</Label><Input type="number" step="0.01" value={custoHora} onChange={(e)=>setCustoHora(e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={telefone} onChange={(e)=>setTelefone(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
              <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: ativo, afastado" /></div>
              <div><Label>Admissão</Label><Input type="date" value={admissao} onChange={(e)=>setAdmissao(e.target.value)} /></div>
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

