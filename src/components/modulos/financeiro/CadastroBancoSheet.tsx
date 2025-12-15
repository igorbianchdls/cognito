"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onSaved?: () => void }

export default function CadastroBancoSheet({ triggerLabel = "Cadastrar", onSaved }: Props) {
  const [nome, setNome] = React.useState("")
  const [numero, setNumero] = React.useState("")
  const [agencia, setAgencia] = React.useState("")
  const [endereco, setEndereco] = React.useState("")
  const [imagemUrl, setImagemUrl] = React.useState("")

  const reset = () => { setNome(""); setNumero(""); setAgencia(""); setEndereco(""); setImagemUrl("") }

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) return { success: false, error: 'Informe o nome do banco.' }
    try {
      const fd = new FormData()
      fd.set('nome_banco', nome.trim())
      if (numero) fd.set('numero_banco', numero.trim())
      if (agencia) fd.set('agencia', agencia.trim())
      if (endereco) fd.set('endereco', endereco.trim())
      if (imagemUrl) fd.set('imagem_url', imagemUrl.trim())
      const res = await fetch('/api/modulos/financeiro/bancos', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) return { success: false, error: json?.message || json?.error || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Cadastrar Banco"
      description="Defina os dados do banco"
      widthClassName="max-w-2xl"
      onSubmit={onSubmit}
      onSuccess={() => { reset(); onSaved?.() }}
    >
      <div><Label>Nome do Banco<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
      <div><Label>Número do Banco</Label><Input value={numero} onChange={(e)=>setNumero(e.target.value)} /></div>
      <div><Label>Agência</Label><Input value={agencia} onChange={(e)=>setAgencia(e.target.value)} /></div>
      <div className="md:col-span-2"><Label>Endereço</Label><Input value={endereco} onChange={(e)=>setEndereco(e.target.value)} /></div>
      <div className="md:col-span-2"><Label>Imagem (URL)</Label><Input value={imagemUrl} onChange={(e)=>setImagemUrl(e.target.value)} placeholder="https://..." /></div>
    </BaseCadastroSheet>
  )
}
