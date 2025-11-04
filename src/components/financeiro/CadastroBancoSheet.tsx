"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Props = { triggerLabel?: string; onSaved?: () => void }

export default function CadastroBancoSheet({ triggerLabel = "Cadastrar", onSaved }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [nome, setNome] = React.useState("")
  const [numero, setNumero] = React.useState("")
  const [agencia, setAgencia] = React.useState("")
  const [endereco, setEndereco] = React.useState("")
  const [imagemUrl, setImagemUrl] = React.useState("")

  const canSave = !!nome.trim()
  const reset = () => { setNome(""); setNumero(""); setAgencia(""); setEndereco(""); setImagemUrl(""); setError(null) }

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('nome_banco', nome.trim())
      if (numero) fd.set('numero_banco', numero.trim())
      if (agencia) fd.set('agencia', agencia.trim())
      if (endereco) fd.set('endereco', endereco.trim())
      if (imagemUrl) fd.set('imagem_url', imagemUrl.trim())
      const res = await fetch('/api/modulos/financeiro/bancos', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      setOpen(false); reset(); onSaved?.()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar') } finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button></SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-2xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b"><SheetTitle>Cadastrar Banco</SheetTitle><SheetDescription>Defina os dados do banco</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Nome do Banco<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e)=>setNome(e.target.value)} /></div>
              <div><Label>Número do Banco</Label><Input value={numero} onChange={(e)=>setNumero(e.target.value)} /></div>
              <div><Label>Agência</Label><Input value={agencia} onChange={(e)=>setAgencia(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Endereço</Label><Input value={endereco} onChange={(e)=>setEndereco(e.target.value)} /></div>
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

