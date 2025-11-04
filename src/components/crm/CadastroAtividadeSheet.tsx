"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroAtividadeSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [contas, setContas] = React.useState<Item[]>([])
  const [contatos, setContatos] = React.useState<Item[]>([])
  const [leads, setLeads] = React.useState<Item[]>([])
  const [oportunidades, setOportunidades] = React.useState<Item[]>([])
  const [vendedores, setVendedores] = React.useState<Item[]>([])

  const [assunto, setAssunto] = React.useState("")
  const [tipo, setTipo] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [dataVencimento, setDataVencimento] = React.useState("")
  const [contaId, setContaId] = React.useState("")
  const [contatoId, setContatoId] = React.useState("")
  const [leadId, setLeadId] = React.useState("")
  const [oportunidadeId, setOportunidadeId] = React.useState("")
  const [usuarioId, setUsuarioId] = React.useState("")
  const [anotacoes, setAnotacoes] = React.useState("")

  const canSave = !!assunto.trim()
  const reset = () => { setAssunto(""); setTipo(""); setStatus(""); setDataVencimento(""); setContaId(""); setContatoId(""); setLeadId(""); setOportunidadeId(""); setUsuarioId(""); setAnotacoes("") }

  const fetchList = async (url: string): Promise<Item[]> => {
    try {
      const res = await fetch(url, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok || !json?.success || !Array.isArray(json?.rows)) return []
      return json.rows as Item[]
    } catch { return [] }
  }

  const loadContatos = async (conta?: string) => {
    const url = conta ? `/api/modulos/crm/contatos/list?conta_id=${encodeURIComponent(conta)}` : '/api/modulos/crm/contatos/list'
    const cs = await fetchList(url)
    setContatos(cs)
  }

  React.useEffect(() => {
    if (!isOpen) return
    ;(async () => {
      const [cts, lds, ops, vds, ctas] = await Promise.all([
        fetchList('/api/modulos/crm/contatos/list'),
        fetchList('/api/modulos/crm/leads/list'),
        fetchList('/api/modulos/crm/oportunidades/list'),
        fetchList('/api/modulos/vendas/vendedores/list'),
        fetchList('/api/modulos/crm/contas/list'),
      ])
      setContatos(cts)
      setLeads(lds)
      setOportunidades(ops)
      setVendedores(vds)
      setContas(ctas)
    })()
  }, [isOpen])

  React.useEffect(() => { if (contaId) loadContatos(contaId); }, [contaId])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!assunto.trim()) return { success: false, error: 'Informe o assunto.' }
    try {
      const fd = new FormData()
      fd.set('assunto', assunto.trim())
      if (tipo) fd.set('tipo', tipo.trim())
      if (status) fd.set('status', status.trim())
      if (dataVencimento) fd.set('data_vencimento', dataVencimento)
      if (contaId) fd.set('conta_id', contaId)
      if (contatoId) fd.set('contato_id', contatoId)
      if (leadId) fd.set('lead_id', leadId)
      if (oportunidadeId) fd.set('oportunidade_id', oportunidadeId)
      if (usuarioId) fd.set('usuario_id', usuarioId)
      if (anotacoes) fd.set('anotacoes', anotacoes.trim())
      const res = await fetch('/api/modulos/crm/atividades', { method: 'POST', body: fd })
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
      title="Cadastrar Atividade"
      description="Defina os dados da atividade"
      widthClassName="max-w-3xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; reset(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div className="md:col-span-2">
        <Label>Assunto<span className="text-red-500"> *</span></Label>
        <Input value={assunto} onChange={(e) => setAssunto(e.target.value)} />
      </div>
      <div>
        <Label>Tipo</Label>
        <Input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="ex: ligação, reunião" />
      </div>
      <div>
        <Label>Status</Label>
        <Input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="ex: aberto, concluído" />
      </div>
      <div>
        <Label>Data Vencimento</Label>
        <Input type="date" value={dataVencimento} onChange={(e) => setDataVencimento(e.target.value)} />
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
        <Label>Contato</Label>
        <Select value={contatoId} onValueChange={setContatoId}>
          <SelectTrigger><SelectValue placeholder="Selecione o contato" /></SelectTrigger>
          <SelectContent>
            {contatos.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Lead</Label>
        <Select value={leadId} onValueChange={setLeadId}>
          <SelectTrigger><SelectValue placeholder="Selecione o lead" /></SelectTrigger>
          <SelectContent>
            {leads.map(l => <SelectItem key={l.id} value={String(l.id)}>{l.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Oportunidade</Label>
        <Select value={oportunidadeId} onValueChange={setOportunidadeId}>
          <SelectTrigger><SelectValue placeholder="Selecione a oportunidade" /></SelectTrigger>
          <SelectContent>
            {oportunidades.map(o => <SelectItem key={o.id} value={String(o.id)}>{o.nome}</SelectItem>)}
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
      <div className="md:col-span-3">
        <Label>Anotações</Label>
        <Textarea rows={4} value={anotacoes} onChange={(e) => setAnotacoes(e.target.value)} />
      </div>
    </BaseCadastroSheet>
  )
}
