"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroTecnicoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [nome, setNome] = React.useState("")
  const [cargo, setCargo] = React.useState("")
  const [especialidade, setEspecialidade] = React.useState("")
  const [custoHora, setCustoHora] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [admissao, setAdmissao] = React.useState("")
  const [imagemUrl, setImagemUrl] = React.useState("")

  const resetForm = () => {
    setNome(""); setCargo(""); setEspecialidade(""); setCustoHora(""); setTelefone("")
    setEmail(""); setStatus(""); setAdmissao(""); setImagemUrl("")
  }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) {
      return { success: false, error: 'Nome é obrigatório' }
    }

    try {
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
      title="Cadastrar Técnico"
      description="Defina os dados do técnico"
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
      <div><Label>Nome<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div><Label>Cargo</Label><Input value={cargo} onChange={(e) => setCargo(e.target.value)} /></div>
      <div><Label>Especialidade</Label><Input value={especialidade} onChange={(e) => setEspecialidade(e.target.value)} /></div>
      <div><Label>Custo/hora</Label><Input type="number" step="0.01" value={custoHora} onChange={(e) => setCustoHora(e.target.value)} /></div>
      <div><Label>Telefone</Label><Input value={telefone} onChange={(e) => setTelefone(e.target.value)} /></div>
      <div><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Status</Label><Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="ex: ativo, afastado" /></div>
      <div><Label>Admissão</Label><Input type="date" value={admissao} onChange={(e) => setAdmissao(e.target.value)} /></div>
      <div className="md:col-span-2"><Label>Imagem (URL)</Label><Input value={imagemUrl} onChange={(e) => setImagemUrl(e.target.value)} placeholder="https://..." /></div>
    </BaseCadastroSheet>
  )
}
