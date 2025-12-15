"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onSaved?: () => void }
type Item = { id: number; nome: string }

export default function CadastroContaAPagarSheet({ triggerLabel = "Cadastrar", onSaved }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)

  const [fornecedores, setFornecedores] = React.useState<Item[]>([])
  const [categorias, setCategorias] = React.useState<{ id: number; nome: string; tipo: string }[]>([])
  const [contas, setContas] = React.useState<Item[]>([])

  const [descricao, setDescricao] = React.useState("")
  const [valor, setValor] = React.useState("")
  const [dataLanc, setDataLanc] = React.useState("")
  const [dataVenc, setDataVenc] = React.useState("")
  const [fornecedorId, setFornecedorId] = React.useState("")
  const [categoriaId, setCategoriaId] = React.useState("")
  const [contaId, setContaId] = React.useState("")
  const [status, setStatus] = React.useState("pendente")
  const [tenantId, setTenantId] = React.useState("")

  const reset = () => { setDescricao(""); setValor(""); setDataLanc(""); setDataVenc(""); setFornecedorId(""); setCategoriaId(""); setContaId(""); setStatus("pendente"); setTenantId("") }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : [] } catch { return [] as T[] }
  }

  React.useEffect(() => { if (!isOpen) return; (async () => {
    const [fs, cs, cfs] = await Promise.all([
      fetchList<Item>('/api/modulos/financeiro/fornecedores/list'),
      fetchList<{ id: number; nome: string; tipo: string }>('/api/modulos/financeiro/categorias/list'),
      fetchList<Item>('/api/modulos/financeiro/contas-financeiras/list'),
    ])
    setFornecedores(fs); setCategorias(cs); setContas(cfs)
  })() }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(descricao.trim() && valor && dataLanc && dataVenc)) {
      return { success: false, error: 'Preencha descrição, valor, lançamento e vencimento.' }
    }
    try {
      const fd = new FormData()
      fd.set('descricao', descricao.trim())
      fd.set('valor', valor)
      fd.set('data_lancamento', dataLanc)
      fd.set('data_vencimento', dataVenc)
      if (fornecedorId) {
        fd.set('entidade_id', fornecedorId) // compat
        fd.set('fornecedor_id', fornecedorId) // novo schema
      }
      if (categoriaId) fd.set('categoria_id', categoriaId)
      if (contaId) fd.set('conta_financeira_id', contaId)
      if (status) fd.set('status', status.trim())
      if (tenantId) fd.set('tenant_id', tenantId)
      const res = await fetch('/api/modulos/financeiro/contas-a-pagar', { method: 'POST', body: fd })
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
      title="Nova Conta a Pagar"
      description="Preencha os dados da conta"
      widthClassName="max-w-3xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { reset(); onSaved?.() }}
    >
      <div><Label>Descrição<span className="text-red-500"> *</span></Label><Textarea rows={2} value={descricao} onChange={(e)=>setDescricao(e.target.value)} /></div>
      <div><Label>Valor<span className="text-red-500"> *</span></Label><Input type="number" step="0.01" value={valor} onChange={(e)=>setValor(e.target.value)} /></div>
      <div><Label>Lançamento<span className="text-red-500"> *</span></Label><Input type="date" value={dataLanc} onChange={(e)=>setDataLanc(e.target.value)} /></div>
      <div><Label>Vencimento<span className="text-red-500"> *</span></Label><Input type="date" value={dataVenc} onChange={(e)=>setDataVenc(e.target.value)} /></div>
      <div>
        <Label>Fornecedor</Label>
        <Select value={fornecedorId} onValueChange={setFornecedorId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{fornecedores.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}</SelectContent>
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
        <Label>Conta Financeira</Label>
        <Select value={contaId} onValueChange={setContaId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{contas.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="pendente | pago | vencido" /></div>
      <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e)=>setTenantId(e.target.value)} placeholder="opcional" /></div>
    </BaseCadastroSheet>
  )
}
