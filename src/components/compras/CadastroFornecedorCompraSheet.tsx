"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroFornecedorCompraSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [nome, setNome] = React.useState("")
  const [razao, setRazao] = React.useState("")
  const [cnpj, setCnpj] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [cidade, setCidade] = React.useState("")
  const [estado, setEstado] = React.useState("")
  const [pais, setPais] = React.useState("")
  const [categoria, setCategoria] = React.useState("")
  const [imagemUrl, setImagemUrl] = React.useState("")
  const [ativo, setAtivo] = React.useState(true)

  const canSave = !!nome.trim()
  const reset = () => { setNome(""); setRazao(""); setCnpj(""); setTelefone(""); setEmail(""); setCidade(""); setEstado(""); setPais(""); setCategoria(""); setImagemUrl(""); setAtivo(true); setError(null) }

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('nome_fantasia', nome.trim())
      if (razao) fd.set('razao_social', razao.trim())
      if (cnpj) fd.set('cnpj', cnpj.trim())
      if (telefone) fd.set('telefone', telefone.trim())
      if (email) fd.set('email', email.trim())
      if (cidade) fd.set('cidade', cidade.trim())
      if (estado) fd.set('estado', estado.trim())
      if (pais) fd.set('pais', pais.trim())
      if (categoria) fd.set('categoria', categoria.trim())
      if (imagemUrl) fd.set('imagem_url', imagemUrl.trim())
      fd.set('ativo', String(ativo))
      const res = await fetch('/api/modulos/compras/fornecedores', { method: 'POST', body: fd })
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
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Fornecedor</SheetTitle><SheetDescription>Defina os dados do fornecedor</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>Nome Fantasia<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Razão Social</Label><Input value={razao} onChange={(e)=>setRazao(e.target.value)} /></div>
              <div><Label>CNPJ</Label><Input value={cnpj} onChange={(e)=>setCnpj(e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={telefone} onChange={(e)=>setTelefone(e.target.value)} /></div>
              <div><Label>Email</Label><Input value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={cidade} onChange={(e)=>setCidade(e.target.value)} /></div>
              <div><Label>Estado</Label><Input value={estado} onChange={(e)=>setEstado(e.target.value)} /></div>
              <div><Label>País</Label><Input value={pais} onChange={(e)=>setPais(e.target.value)} /></div>
              <div><Label>Categoria</Label><Input value={categoria} onChange={(e)=>setCategoria(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Imagem (URL)</Label><Input value={imagemUrl} onChange={(e)=>setImagemUrl(e.target.value)} placeholder="https://..." /></div>
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

