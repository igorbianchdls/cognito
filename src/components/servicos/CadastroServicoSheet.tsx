"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroServicoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [nome, setNome] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [categoria, setCategoria] = React.useState("")
  const [unidade, setUnidade] = React.useState("")
  const [precoBase, setPrecoBase] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const resetForm = () => {
    setNome(""); setDescricao(""); setCategoria(""); setUnidade(""); setPrecoBase(""); setAtivo(true)
  }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) {
      return { success: false, error: 'Nome é obrigatório' }
    }

    try {
      const fd = new FormData()
      fd.set('nome', nome.trim())
      if (descricao) fd.set('descricao', descricao.trim())
      if (categoria) fd.set('categoria', categoria.trim())
      if (unidade) fd.set('unidade_medida', unidade.trim())
      if (precoBase) fd.set('preco_base', precoBase)
      fd.set('ativo', String(ativo))

      const res = await fetch('/api/modulos/servicos/servicos', { method: 'POST', body: fd })
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
      title="Cadastrar Serviço"
      description="Defina os dados do serviço"
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
      <div className="md:col-span-2"><Label>Nome<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
      <div className="md:col-span-2"><Label>Descrição</Label><Textarea rows={3} value={descricao} onChange={(e) => setDescricao(e.target.value)} /></div>
      <div><Label>Categoria</Label><Input value={categoria} onChange={(e) => setCategoria(e.target.value)} /></div>
      <div><Label>Unidade de Medida</Label><Input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="ex: hora, serviço" /></div>
      <div><Label>Preço Base</Label><Input type="number" step="0.01" value={precoBase} onChange={(e) => setPrecoBase(e.target.value)} /></div>
      <div className="flex items-center space-x-2"><Checkbox id="ativo" checked={ativo} onCheckedChange={(c) => setAtivo(c === true)} /><Label htmlFor="ativo" className="cursor-pointer">Ativo</Label></div>
    </BaseCadastroSheet>
  )
}
