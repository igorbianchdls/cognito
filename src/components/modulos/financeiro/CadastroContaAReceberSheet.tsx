"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import BaseCadastroSheet from "@/components/modulos/BaseCadastroSheet"

type Props = { triggerLabel?: string; onSaved?: () => void }
type Item = { id: number; nome: string }

export default function CadastroContaAReceberSheet({ triggerLabel = "Cadastrar", onSaved }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)

  const [clientes, setClientes] = React.useState<Item[]>([])
  const [categorias, setCategorias] = React.useState<{ id: number; nome: string; tipo: string }[]>([])
  const [centrosLucro, setCentrosLucro] = React.useState<Item[]>([])
  const [departamentos, setDepartamentos] = React.useState<Item[]>([])
  const [filiais, setFiliais] = React.useState<Item[]>([])

  const [descricao, setDescricao] = React.useState("")
  const [valor, setValor] = React.useState("")
  const [dataLanc, setDataLanc] = React.useState("")
  const [dataVenc, setDataVenc] = React.useState("")
  const [clienteId, setClienteId] = React.useState("")
  const [categoriaId, setCategoriaId] = React.useState("")
  const [centroLucroId, setCentroLucroId] = React.useState("")
  const [departamentoId, setDepartamentoId] = React.useState("")
  const [filialId, setFilialId] = React.useState("")
  const [status, setStatus] = React.useState("pendente")
  const [tenantId, setTenantId] = React.useState("")

  const reset = () => { setDescricao(""); setValor(""); setDataLanc(""); setDataVenc(""); setClienteId(""); setCategoriaId(""); setCentroLucroId(""); setDepartamentoId(""); setFilialId(""); setStatus("pendente"); setTenantId("") }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : [] } catch { return [] as T[] }
  }

  React.useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const [cl, cs, cluc, deps, fls] = await Promise.all([
        fetchList<Item>('/api/modulos/financeiro/clientes/list'),
        fetchList<{ id: number; nome: string; tipo: string }>('/api/modulos/financeiro/categorias/list'),
        fetchList<{ id: number; nome: string }>(`/api/modulos/financeiro?view=centros-de-lucro&pageSize=1000`),
        fetchList<{ id: number; nome: string }>(`/api/modulos/empresa?view=departamentos&pageSize=1000`),
        fetchList<{ id: number; nome: string }>(`/api/modulos/empresa?view=filiais&pageSize=1000`),
      ])
      setClientes(cl);
      setCategorias(cs);
      setCentrosLucro(cluc.map(r => ({ id: r.id, nome: r.nome })) as Item[])
      setDepartamentos(deps.map(r => ({ id: r.id, nome: r.nome })) as Item[])
      setFiliais(fls.map(r => ({ id: r.id, nome: r.nome })) as Item[])
    })()
  }, [isOpen])

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
      if (clienteId) {
        fd.set('entidade_id', clienteId) // compat
        fd.set('cliente_id', clienteId) // novo schema
      }
      if (categoriaId) fd.set('categoria_id', categoriaId)
      if (centroLucroId) fd.set('centro_lucro_id', centroLucroId)
      if (departamentoId) fd.set('departamento_id', departamentoId)
      if (filialId) fd.set('filial_id', filialId)
      if (status) fd.set('status', status.trim())
      if (tenantId) fd.set('tenant_id', tenantId)
      const res = await fetch('/api/modulos/financeiro/contas-a-receber', { method: 'POST', body: fd })
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
      title="Nova Conta a Receber"
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
        <Label>Cliente</Label>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
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
        <Label>Centro de Lucro</Label>
        <Select value={centroLucroId} onValueChange={setCentroLucroId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{centrosLucro.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Departamento</Label>
        <Select value={departamentoId} onValueChange={setDepartamentoId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{departamentos.map(d => <SelectItem key={d.id} value={String(d.id)}>{d.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Filial</Label>
        <Select value={filialId} onValueChange={setFilialId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{filiais.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="pendente | recebido | vencido" /></div>
      <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e)=>setTenantId(e.target.value)} placeholder="opcional" /></div>
    </BaseCadastroSheet>
  )
}
