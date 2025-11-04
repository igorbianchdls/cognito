"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onCreated?: (id: number) => void }
type Item = { id: number; nome: string }

export default function CadastroOportunidadeSheet({ triggerLabel = "Cadastrar", onCreated }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)
  const createdIdRef = React.useRef<number | null>(null)

  const [contas, setContas] = React.useState<Item[]>([])
  const [vendedores, setVendedores] = React.useState<Item[]>([])

  const [nome, setNome] = React.useState("")
  const [contaId, setContaId] = React.useState("")
  const [usuarioId, setUsuarioId] = React.useState("")
  const [estagio, setEstagio] = React.useState("")
  const [valor, setValor] = React.useState("")
  const [prob, setProb] = React.useState("")
  const [dataFechamento, setDataFechamento] = React.useState("")
  const [status, setStatus] = React.useState("")

  const canSave = !!nome.trim()
  const reset = () => { setNome(""); setContaId(""); setUsuarioId(""); setEstagio(""); setValor(""); setProb(""); setDataFechamento(""); setStatus("") }

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
    if (!nome.trim()) return { success: false, error: 'Informe o nome da oportunidade.' }
    try {
      const fd = new FormData()
      fd.set('nome', nome.trim())
      if (contaId) fd.set('conta_id', contaId)
      if (usuarioId) fd.set('usuario_id', usuarioId)
      if (estagio) fd.set('estagio', estagio.trim())
      if (valor) fd.set('valor', valor)
      if (prob) fd.set('probabilidade', prob)
      if (dataFechamento) fd.set('data_fechamento', dataFechamento)
      if (status) fd.set('status', status.trim())
      const res = await fetch('/api/modulos/crm/oportunidades', { method: 'POST', body: fd })
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
      title="Cadastrar Oportunidade"
      description="Defina os dados da oportunidade"
      widthClassName="max-w-3xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { const id = createdIdRef.current; createdIdRef.current = null; reset(); if (typeof id === 'number') onCreated?.(id) }}
    >
      <div className="md:col-span-2">
        <Label>Nome da Oportunidade<span className="text-red-500"> *</span></Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} />
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
      <div>
        <Label>Estágio</Label>
        <Input value={estagio} onChange={(e) => setEstagio(e.target.value)} placeholder="ex: qualificação, proposta, fechado" />
      </div>
      <div>
        <Label>Valor (R$)</Label>
        <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
      </div>
      <div>
        <Label>Probabilidade (%)</Label>
        <Input type="number" step="1" value={prob} onChange={(e) => setProb(e.target.value)} />
      </div>
      <div>
        <Label>Data de Fechamento</Label>
        <Input type="date" value={dataFechamento} onChange={(e) => setDataFechamento(e.target.value)} />
      </div>
      <div>
        <Label>Status</Label>
        <Input value={status} onChange={(e) => setStatus(e.target.value)} />
      </div>
    </BaseCadastroSheet>
  )
}
