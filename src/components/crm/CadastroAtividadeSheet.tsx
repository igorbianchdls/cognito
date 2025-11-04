"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroAtividadeSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

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
  const reset = () => { setAssunto(""); setTipo(""); setStatus(""); setDataVencimento(""); setContaId(""); setContatoId(""); setLeadId(""); setOportunidadeId(""); setUsuarioId(""); setAnotacoes(""); setError(null) }

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
    if (!open) return
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
  }, [open])

  React.useEffect(() => { if (contaId) loadContatos(contaId); }, [contaId])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true)
      setError(null)
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
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      const id = Number(json?.id)
      setOpen(false)
      reset()
      if (!Number.isNaN(id)) onCreated?.(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao salvar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-3xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Cadastrar Atividade</SheetTitle>
            <SheetDescription>Defina os dados da atividade</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t">
            <SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose>
            <Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

