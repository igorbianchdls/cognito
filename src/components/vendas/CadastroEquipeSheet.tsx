"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (id: number) => void
}

export default function CadastroEquipeSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const createdIdRef = React.useRef<number | null>(null)

  const [nome, setNome] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const resetForm = () => { setNome(""); setDescricao(""); setAtivo(true) }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) {
      return { success: false, error: 'Informe o nome da equipe.' }
    }
    try {
      const fd = new FormData()
      fd.set('nome', nome.trim())
      if (descricao) fd.set('descricao', descricao.trim())
      fd.set('ativo', String(ativo))
      const res = await fetch('/api/modulos/vendas/equipes', { method: 'POST', body: fd })
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
      title="Cadastrar Equipe"
      description="Defina as informações da equipe"
      widthClassName="max-w-xl"
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; resetForm(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div>
        <Label>Nome<span className="text-red-500"> *</span></Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="ativo" checked={ativo} onCheckedChange={(c) => setAtivo(c === true)} />
        <Label htmlFor="ativo" className="cursor-pointer">Ativa</Label>
      </div>
    </BaseCadastroSheet>
  )
}
