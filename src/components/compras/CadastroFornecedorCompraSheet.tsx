"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }

export default function CadastroFornecedorCompraSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const createdIdRef = React.useRef<number | null>(null)

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
  const reset = () => { setNome(""); setRazao(""); setCnpj(""); setTelefone(""); setEmail(""); setCidade(""); setEstado(""); setPais(""); setCategoria(""); setImagemUrl(""); setAtivo(true) }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) return { success: false, error: 'Informe o nome do fornecedor.' }
    try {
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
      if (!res.ok || !json?.success) return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      const id = Number(json?.id)
      createdIdRef.current = Number.isNaN(id) ? null : id
      return { success: true }
    } catch (e) { return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' } }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Fornecedor"
      description="Defina os dados do fornecedor"
      widthClassName="max-w-2xl"
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; reset(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div><Label>Nome Fantasia<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
      <div><Label>Razão Social</Label><Input value={razao} onChange={(e)=>setRazao(e.target.value)} /></div>
      <div><Label>CNPJ</Label><Input value={cnpj} onChange={(e)=>setCnpj(e.target.value)} /></div>
      <div><Label>Telefone</Label><Input value={telefone} onChange={(e)=>setTelefone(e.target.value)} /></div>
      <div><Label>Email</Label><Input value={email} onChange={(e)=>setEmail(e.target.value)} /></div>
      <div><Label>Cidade</Label><Input value={cidade} onChange={(e)=>setCidade(e.target.value)} /></div>
      <div><Label>Estado</Label><Input value={estado} onChange={(e)=>setEstado(e.target.value)} /></div>
      <div><Label>País</Label><Input value={pais} onChange={(e)=>setPais(e.target.value)} /></div>
      <div><Label>Categoria</Label><Input value={categoria} onChange={(e)=>setCategoria(e.target.value)} /></div>
      <div><Label>Imagem (URL)</Label><Input value={imagemUrl} onChange={(e)=>setImagemUrl(e.target.value)} placeholder="https://..." /></div>
      <div className="flex items-center space-x-2"><Checkbox id="ativo" checked={ativo} onCheckedChange={(c)=>setAtivo(c === true)} /><Label htmlFor="ativo" className="cursor-pointer">Ativo</Label></div>
    </BaseCadastroSheet>
  )
}
