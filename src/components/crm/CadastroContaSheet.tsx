"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroContaSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [vendedores, setVendedores] = React.useState<Item[]>([])

  const [nome, setNome] = React.useState("")
  const [setor, setSetor] = React.useState("")
  const [site, setSite] = React.useState("")
  const [telefone, setTelefone] = React.useState("")
  const [enderecoCobranca, setEnderecoCobranca] = React.useState("")
  const [usuarioId, setUsuarioId] = React.useState("")

  const canSave = !!nome.trim()
  const reset = () => { setNome(""); setSetor(""); setSite(""); setTelefone(""); setEnderecoCobranca(""); setUsuarioId("") }

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
    if (!nome.trim()) return { success: false, error: 'Informe o nome da conta.' }
    try {
      const fd = new FormData()
      fd.set('nome', nome.trim())
      if (setor) fd.set('setor', setor.trim())
      if (site) fd.set('site', site.trim())
      if (telefone) fd.set('telefone', telefone.trim())
      if (enderecoCobranca) fd.set('endereco_cobranca', enderecoCobranca.trim())
      if (usuarioId) fd.set('usuario_id', usuarioId)
      const res = await fetch('/api/modulos/crm/contas', { method: 'POST', body: fd })
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
      title="Cadastrar Conta"
      description="Defina os dados da conta"
      widthClassName="max-w-2xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; reset(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div>
        <Label>Nome<span className="text-red-500"> *</span></Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
      </div>
      <div>
        <Label>Setor</Label>
        <Input value={setor} onChange={(e) => setSetor(e.target.value)} />
      </div>
      <div>
        <Label>Site</Label>
        <Input value={site} onChange={(e) => setSite(e.target.value)} />
      </div>
      <div>
        <Label>Telefone</Label>
        <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <Label>Endereço de Cobrança</Label>
        <Input value={enderecoCobranca} onChange={(e) => setEnderecoCobranca(e.target.value)} />
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
