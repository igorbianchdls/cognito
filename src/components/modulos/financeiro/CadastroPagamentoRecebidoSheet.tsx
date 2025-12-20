"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onSaved?: () => void }
type Item = { id: number; nome: string }

export default function CadastroPagamentoRecebidoSheet({ triggerLabel = "Cadastrar", onSaved }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)

  const [clientes, setClientes] = React.useState<Item[]>([])
  const [categorias, setCategorias] = React.useState<{ id: number; nome: string; tipo: string }[]>([])
  const [contas, setContas] = React.useState<Item[]>([])
  const [metodos, setMetodos] = React.useState<Item[]>([])

  const [descricao, setDescricao] = React.useState("")
  const [valor, setValor] = React.useState("")
  const [dataLanc, setDataLanc] = React.useState("")
  const [clienteId, setClienteId] = React.useState("")
  const [categoriaId, setCategoriaId] = React.useState("")
  const [contaId, setContaId] = React.useState("")
  const [metodoId, setMetodoId] = React.useState("")
  const [status, setStatus] = React.useState("")
  const [tenantId, setTenantId] = React.useState("")
  const [numeroPagamento, setNumeroPagamento] = React.useState("")

  const reset = () => { setDescricao(""); setValor(""); setDataLanc(""); setClienteId(""); setCategoriaId(""); setContaId(""); setStatus(""); setTenantId("") }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : [] } catch { return [] as T[] }
  }

  React.useEffect(() => { if (!isOpen) return; (async () => {
    const [cl, cs, cfs, mps] = await Promise.all([
      fetchList<Item>('/api/modulos/financeiro/clientes/list'),
      fetchList<{ id: number; nome: string; tipo: string }>('/api/modulos/financeiro/categorias/list'),
      fetchList<Item>('/api/modulos/financeiro/contas-financeiras/list'),
      fetchList<Item>('/api/modulos/financeiro/metodos-pagamento/list'),
    ])
    setClientes(cl); setCategorias(cs); setContas(cfs); setMetodos(mps)
    if (!numeroPagamento) {
      const today = new Date().toISOString().slice(0,10).replace(/-/g,'')
      setNumeroPagamento(`PR-${today}-${Math.random().toString(36).slice(2,8).toUpperCase()}`)
    }
  })() }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(descricao.trim() && valor && dataLanc && contaId && metodoId)) {
      return { success: false, error: 'Preencha descrição, valor, data, conta e método.' }
    }
    try {
      const fd = new FormData()
      fd.set('descricao', descricao.trim())
      fd.set('valor', valor)
      fd.set('data_lancamento', dataLanc)
      fd.set('numero_pagamento', (numeroPagamento || '').trim() || (() => { const today = new Date().toISOString().slice(0,10).replace(/-/g,''); return `PR-${today}-${Math.random().toString(36).slice(2,8).toUpperCase()}` })())
      if (clienteId) {
        fd.set('entidade_id', clienteId)
        fd.set('cliente_id', clienteId)
      }
      if (categoriaId) fd.set('categoria_id', categoriaId)
      if (contaId) fd.set('conta_financeira_id', contaId)
      if (metodoId) fd.set('metodo_pagamento_id', metodoId)
      if (status) fd.set('status', status.trim())
      if (tenantId) fd.set('tenant_id', tenantId)
      const res = await fetch('/api/modulos/financeiro/pagamentos-recebidos', { method: 'POST', body: fd })
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
      title="Novo Pagamento Recebido"
      description="Preencha os dados do recebimento"
      widthClassName="max-w-3xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { reset(); onSaved?.() }}
    >
      <div className="md:col-span-2"><Label>Descrição<span className="text-red-500"> *</span></Label><Textarea rows={2} value={descricao} onChange={(e)=>setDescricao(e.target.value)} /></div>
      <div><Label>Valor<span className="text-red-500"> *</span></Label><Input type="number" step="0.01" value={valor} onChange={(e)=>setValor(e.target.value)} /></div>
      <div><Label>Número do Pagamento</Label><Input value={numeroPagamento} onChange={(e)=>setNumeroPagamento(e.target.value)} placeholder="PR-YYYYMMDD-XXXXXX" /></div>
      <div><Label>Data Recebimento<span className="text-red-500"> *</span></Label><Input type="date" value={dataLanc} onChange={(e)=>setDataLanc(e.target.value)} /></div>
      <div>
        <Label>Cliente</Label>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Método de Pagamento<span className="text-red-500"> *</span></Label>
        <Select value={metodoId} onValueChange={setMetodoId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{metodos.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Categoria</Label>
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Conta Financeira<span className="text-red-500"> *</span></Label>
        <Select value={contaId} onValueChange={setContaId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{contas.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="ex: liquidado" /></div>
      <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e)=>setTenantId(e.target.value)} placeholder="opcional" /></div>
    </BaseCadastroSheet>
  )
}
