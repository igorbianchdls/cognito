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
  const [categorias, setCategorias] = React.useState<{ id: number; nome: string }[]>([])
  const [contas, setContas] = React.useState<Item[]>([])
  const [centrosLucro, setCentrosLucro] = React.useState<Item[]>([])
  const [departamentos, setDepartamentos] = React.useState<Item[]>([])
  const [filiais, setFiliais] = React.useState<Item[]>([])

  const [descricao, setDescricao] = React.useState("Venda de serviços (Ref. 001)")
  const [numeroDocumento, setNumeroDocumento] = React.useState("NFS-0002")
  const [tipoDocumento, setTipoDocumento] = React.useState("nf")
  const [valor, setValor] = React.useState("1500.00")
  const [dataLanc, setDataLanc] = React.useState<string>(() => new Date().toISOString().slice(0,10))
  const [dataVenc, setDataVenc] = React.useState<string>(() => { const d = new Date(); d.setDate(d.getDate() + 10); return d.toISOString().slice(0,10) })
  const [clienteId, setClienteId] = React.useState("")
  const [categoriaId, setCategoriaId] = React.useState("")
  const [contaFinanceiraId, setContaFinanceiraId] = React.useState("")
  const [centroLucroId, setCentroLucroId] = React.useState("")
  const [departamentoId, setDepartamentoId] = React.useState("")
  const [filialId, setFilialId] = React.useState("")
  const [status, setStatus] = React.useState("pendente")
  const [tenantId, setTenantId] = React.useState("1")

  const reset = () => {
    setDescricao("Venda de serviços (Ref. 001)")
    setNumeroDocumento("NFS-0002")
    setTipoDocumento("nf")
    setValor("1500.00")
    const today = new Date(); const todayStr = today.toISOString().slice(0,10)
    const venc = new Date(today); venc.setDate(venc.getDate() + 10)
    setDataLanc(todayStr)
    setDataVenc(venc.toISOString().slice(0,10))
    setClienteId("")
    setCategoriaId("")
    setCentroLucroId("")
    setDepartamentoId("")
    setFilialId("")
    setStatus("pendente")
    setTenantId("1")
  }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : [] } catch { return [] as T[] }
  }

  React.useEffect(() => {
    if (!isOpen) return;
    (async () => {
      let [cl, cs, contasList, cluc, deps, fls] = await Promise.all([
        fetchList<Item>('/api/modulos/financeiro/clientes/list'),
        fetchList<{ id: number; nome: string }>(`/api/modulos/financeiro?view=categorias-receita&pageSize=1000`),
        fetchList<Item>('/api/modulos/financeiro/contas-financeiras/list'),
        fetchList<{ id: number; nome: string }>(`/api/modulos/financeiro?view=centros-de-lucro&pageSize=1000`),
        fetchList<{ id: number; nome: string }>(`/api/modulos/empresa?view=departamentos&pageSize=1000`),
        fetchList<{ id: number; nome: string }>(`/api/modulos/empresa?view=filiais&pageSize=1000`),
      ])

      // Auto-seed mínimo para facilitar teste
      if (!cl || cl.length === 0) {
        try {
          const res = await fetch('/api/modulos/financeiro/clientes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Cliente Teste (Auto)' }) })
          const j = await res.json();
          if (res.ok && j?.success && j?.data?.id) {
            cl = [{ id: Number(j.data.id), nome: j.data.nome }]
          }
        } catch {}
      }
      if (!cs || cs.length === 0) {
        try {
          const res = await fetch('/api/modulos/financeiro/categorias-receita', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nome: 'Receita de Serviços (Auto)', tipo: 'operacional', tenant_id: 1 }) })
          const j = await res.json();
          if (res.ok && j?.success && j?.row?.id) {
            cs = [{ id: Number(j.row.id), nome: j.row.nome }]
          }
        } catch {}
      }

      setClientes(cl || []);
      setCategorias(cs || []);
      setContas(contasList)
      setCentrosLucro((cluc || []).map(r => ({ id: r.id, nome: r.nome })) as Item[])
      setDepartamentos((deps || []).map(r => ({ id: r.id, nome: r.nome })) as Item[])
      setFiliais((fls || []).map(r => ({ id: r.id, nome: r.nome })) as Item[])
      if (!clienteId && cl && cl.length > 0) setClienteId(String(cl[0].id))
      if (!categoriaId && cs && cs.length > 0) setCategoriaId(String(cs[0].id))
      if (!contaFinanceiraId && contasList && contasList.length > 0) setContaFinanceiraId(String(contasList[0].id))
    })()
  }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(descricao.trim() && tipoDocumento.trim() && clienteId && categoriaId && valor && dataLanc && dataVenc)) {
      return { success: false, error: 'Preencha descrição, tipo do documento, cliente, categoria, valor, lançamento e vencimento.' }
    }
    try {
      // Garante número único por tentativa para evitar duplicidade em bases com unique
      const ts = Date.now().toString(36).toUpperCase()
      const numero = (numeroDocumento?.trim() || 'DOC') + '-' + ts
      const payload = {
        descricao: descricao.trim(),
        numero_documento: numero,
        tipo_documento: tipoDocumento.trim() || 'fatura',
        valor: Number(valor),
        data_lancamento: dataLanc,
        data_vencimento: dataVenc,
        cliente_id: Number(clienteId),
        categoria_id: Number(categoriaId),
        conta_financeira_id: contaFinanceiraId ? Number(contaFinanceiraId) : null,
        centro_lucro_id: centroLucroId ? Number(centroLucroId) : null,
        departamento_id: departamentoId ? Number(departamentoId) : null,
        filial_id: filialId ? Number(filialId) : null,
        status: status?.trim() || 'pendente',
        tenant_id: tenantId ? Number(tenantId) : 1,
        itens: [
          { descricao: descricao.trim(), quantidade: 1, valor_unitario: Number(valor), valor_total: Number(valor), categoria_id: Number(categoriaId) }
        ]
      }
      const res = await fetch('/api/modulos/financeiro/contas-a-receber', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json().catch(() => null)
      if (!res.ok || !j?.success) return { success: false, error: j?.message || j?.error || `HTTP ${res.status}` }
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
      <div><Label>Descrição<span className="text-red-500"> *</span></Label><Textarea rows={2} value={descricao} onChange={(e)=>setDescricao(e.target.value)} placeholder="Descreva a conta (ex.: Prestação de serviços)" /></div>
      <div><Label>Número do Documento<span className="text-red-500"> *</span></Label><Input value={numeroDocumento} onChange={(e)=>setNumeroDocumento(e.target.value)} placeholder="Ex.: NFS-0002 / DOC 4321" /></div>
      <div><Label>Tipo do Documento<span className="text-red-500"> *</span></Label><Input value={tipoDocumento} onChange={(e)=>setTipoDocumento(e.target.value)} placeholder="Ex.: nf, recibo, fatura" /></div>
      <div><Label>Valor<span className="text-red-500"> *</span></Label><Input type="number" step="0.01" value={valor} onChange={(e)=>setValor(e.target.value)} placeholder="Ex.: 1500,00" /></div>
      <div><Label>Lançamento<span className="text-red-500"> *</span></Label><Input type="date" value={dataLanc} onChange={(e)=>setDataLanc(e.target.value)} placeholder="YYYY-MM-DD" /></div>
      <div><Label>Vencimento<span className="text-red-500"> *</span></Label><Input type="date" value={dataVenc} onChange={(e)=>setDataVenc(e.target.value)} placeholder="YYYY-MM-DD" /></div>
      <div>
        <Label>Cliente</Label>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Categoria Receita</Label>
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Conta Financeira</Label>
        <Select value={contaFinanceiraId} onValueChange={setContaFinanceiraId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{contas.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
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
      <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e)=>setTenantId(e.target.value)} placeholder="1" /></div>
    </BaseCadastroSheet>
  )
}
