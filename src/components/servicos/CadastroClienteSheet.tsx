"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroClienteSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [nome, setNome] = React.useState("")
  const [segmento, setSegmento] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [cidade, setCidade] = React.useState("")
  const [estado, setEstado] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [imagemUrl, setImagemUrl] = React.useState("")

  const resetForm = () => {
    setNome(""); setSegmento(""); setTelefone(""); setEmail("")
    setCidade(""); setEstado(""); setStatus(""); setImagemUrl("")
  }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) {
      return { success: false, error: 'Nome é obrigatório' }
    }

    try {
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

      if (!res.ok || !json?.success) {
        return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      }

      createdIdRef.current = Number.isNaN(Number(json?.id)) ? null : Number(json?.id)
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Cliente"
      description="Defina os dados do cliente"
      widthClassName="max-w-2xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => {
        const id = createdIdRef.current
        createdIdRef.current = null
        resetForm()
        if (typeof id === 'number') onCreated?.(id)
      }}
    >
      <div><Label>Nome Fantasia<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div><Label>Segmento</Label><Input value={segmento} onChange={(e) => setSegmento(e.target.value)} /></div>
      <div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
      <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Cidade</Label><Input value={cidade} onChange={(e) => setCidade(e.target.value)} /></div>
      <div><Label>Estado</Label><Input value={estado} onChange={(e) => setEstado(e.target.value)} /></div>
      <div><Label>Status</Label><Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="ex: ativo, bloqueado" /></div>
      <div className="md:col-span-2"><Label>Imagem (URL)</Label><Input value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://..." /></div>
    </BaseCadastroSheet>
  )
}
