"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroServicoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [nome, setNome] = React.useState("")
  const [descricao, setDescricao] = React.useState("")
  const [categoria, setCategoria] = React.useState("")
  const [unidade, setUnidade] = React.useState("")
  const [precoBase, setPrecoBase] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const canSave = !!nome.trim()
  const reset = () => { setNome(""); setDescricao(""); setCategoria(""); setUnidade(""); setPrecoBase(""); setAtivo(true); setError(null) }

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('nome', nome.trim())
      if (descricao) fd.set('descricao', descricao.trim())
      if (categoria) fd.set('categoria', categoria.trim())
      if (unidade) fd.set('unidade_medida', unidade.trim())
      if (precoBase) fd.set('preco_base', precoBase)
      fd.set('ativo', String(ativo))
      const res = await fetch('/api/modulos/servicos/servicos', { method: 'POST', body: fd })
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
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Serviço</SheetTitle><SheetDescription>Defina os dados do serviço</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Nome<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Descrição</Label><Textarea rows={3} value={descricao} onChange={(e)=>setDescricao(e.target.value)} /></div>
              <div><Label>Categoria</Label><Input value={categoria} onChange={(e)=>setCategoria(e.target.value)} /></div>
              <div><Label>Unidade de Medida</Label><Input value={unidade} onChange={(e)=>setUnidade(e.target.value)} placeholder="ex: hora, serviço" /></div>
              <div><Label>Preço Base</Label><Input type="number" step="0.01" value={precoBase} onChange={(e)=>setPrecoBase(e.target.value)} /></div>
              <div className="flex items-center space-x-2"><Checkbox id="ativo" checked={ativo} onCheckedChange={(c)=>setAtivo(c === true)} /><Label htmlFor="ativo" className="cursor-pointer">Ativo</Label></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

