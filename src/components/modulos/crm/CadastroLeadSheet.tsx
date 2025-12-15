"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroLeadSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [vendedores, setVendedores] = React.useState<Item[]>([])

  const [primeiroNome, setPrimeiroNome] = React.useState("")
  const [sobrenome, setSobrenome] = React.useState("")
  const [empresa, setEmpresa] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [origem, setOrigem] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [usuarioId, setUsuarioId] = React.useState("")

  const canSave = !!primeiroNome.trim()
  const reset = () => { setPrimeiroNome(""); setSobrenome(""); setEmpresa(""); setEmail(""); setTelefone(""); setOrigem(""); setStatus(""); setUsuarioId("") }

  const fetchList = async (url: string): Promise<Item[]> => {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json?.success || !Array.isArray(json?.rows)) return []
      return json.rows as Item[]
    } catch { return [] }
  }

  React.useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      const vs = await fetchList('/api/modulos/vendas/vendedores/list')
      setVendedores(vs)
    })()
  }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!primeiroNome.trim()) return { success: false, error: 'Informe o primeiro nome.' }
    try {
      const fd = new FormData()
      fd.set('primeiro_nome', primeiroNome.trim())
      if (sobrenome) fd.set('sobrenome', sobrenome.trim())
      if (empresa) fd.set('empresa', empresa.trim())
      if (email) fd.set('email', email.trim())
      if (telefone) fd.set('telefone', telefone.trim())
      if (origem) fd.set('origem', origem.trim())
      if (status) fd.set('status', status.trim())
      if (usuarioId) fd.set('usuario_id', usuarioId)
      const res = await fetch('/api/modulos/crm/leads', { method: 'POST', body: fd })
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
      title="Cadastrar Lead"
      description="Defina os dados do lead"
      widthClassName="max-w-2xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; reset(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div>
        <Label>Primeiro Nome<span className="text-red-500"> *</span></Label>
        <Input value={primeiroNome} onChange={(e) => setPrimeiroNome(e.target.value)} />
      </div>
      <div>
        <Label>Sobrenome</Label>
        <Input value={sobrenome} onChange={(e) => setSobrenome(e.target.value)} />
      </div>
      <div>
        <Label>Empresa</Label>
        <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label>Telefone</Label>
        <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
      </div>
      <div>
        <Label>Origem</Label>
        <Input value={origem} onChange={(e) => setOrigem(e.target.value)} placeholder="ex: orgânico, anúncio" />
      </div>
      <div>
        <Label>Status</Label>
        <Input value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>
      <div>
        <Label>Responsável</Label>
        <Select value={usuarioId} onValueChange={setUsuarioId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {vendedores.map(v => <SelectItem key={v.id} value={String(v.id)}>{v.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </BaseCadastroSheet>
  )
}
