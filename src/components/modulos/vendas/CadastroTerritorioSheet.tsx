"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = {
  triggerLabel?: string
  onCreated?: (id: number) => void
}

export default function CadastroTerritorioSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const createdIdRef = React.useRef<number | null>(null)

  const [nome, setNome] = React.useState("")

  const resetForm = () => { setNome("") }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) {
      return { success: false, error: 'Informe o nome do território.' }
    }
    try {
      const fd = new FormData()
      fd.set('nome', nome.trim())
      const res = await fetch('/api/modulos/vendas/territorios', { method: 'POST', body: fd })
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
      title="Cadastrar Território"
      description="Defina o nome do território"
      widthClassName="max-w-xl"
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; resetForm(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div>
        <Label>Nome<span className="text-red-500"> *</span></Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
    </BaseCadastroSheet>
  )
}
