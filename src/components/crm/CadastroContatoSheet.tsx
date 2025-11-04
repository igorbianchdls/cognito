"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroContatoSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [contas, setContas] = React.useState<Item[]>([])
  const [vendedores, setVendedores] = React.useState<Item[]>([])

  const [primeiroNome, setPrimeiroNome] = React.useState("")
  const [sobrenome, setSobrenome] = React.useState("")
  const [cargo, setCargo] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [contaId, setContaId] = React.useState("")
  const [usuarioId, setUsuarioId] = React.useState("")

  const canSave = !!primeiroNome.trim()
  const reset = () => { setPrimeiroNome(""); setSobrenome(""); setCargo(""); setEmail(""); setTelefone(""); setContaId(""); setUsuarioId("") }

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
      const [cs, vs] = await Promise.all([
        fetchList('/api/modulos/crm/contas/list'),
        fetchList('/api/modulos/vendas/vendedores/list'),
      ])
      setContas(cs)
      setVendedores(vs)
    })()
  }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!primeiroNome.trim()) return { success: false, error: 'Informe o primeiro nome.' }
    try {
      const fd = new FormData()
      fd.set('primeiro_nome', primeiroNome.trim())
      if (sobrenome) fd.set('sobrenome', sobrenome.trim())
      if (cargo) fd.set('cargo', cargo.trim())
      if (email) fd.set('email', email.trim())
      if (telefone) fd.set('telefone', telefone.trim())
      if (contaId) fd.set('conta_id', contaId)
      if (usuarioId) fd.set('usuario_id', usuarioId)
      const res = await fetch('/api/modulos/crm/contatos', { method: 'POST', body: fd })
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
      title="Cadastrar Contato"
      description="Defina os dados do contato"
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
        <Label>Cargo</Label>
        <Input value={cargo} onChange={(e) => setCargo(e.target.value)} />
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
        <Label>Conta</Label>
        <Select value={contaId} onValueChange={setContaId}>
          <SelectTrigger><SelectValue placeholder="Selecione a conta" /></SelectTrigger>
          <SelectContent>
            {contas.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
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
