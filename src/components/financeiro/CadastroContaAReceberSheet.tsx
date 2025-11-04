"use client"

import * as React from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type Props = { triggerLabel?: string; onSaved?: () => void }
type Item = { id: number; nome: string }

export default function CadastroContaAReceberSheet({ triggerLabel = "Cadastrar", onSaved }: Props) {
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [clientes, setClientes] = React.useState<Item[]>([])
  const [categorias, setCategorias] = React.useState<{ id: number; nome: string; tipo: string }[]>([])
  const [contas, setContas] = React.useState<Item[]>([])

  const [descricao, setDescricao] = React.useState("")
  const [valor, setValor] = React.useState("")
  const [dataLanc, setDataLanc] = React.useState("")
  const [dataVenc, setDataVenc] = React.useState("")
  const [clienteId, setClienteId] = React.useState("")
  const [categoriaId, setCategoriaId] = React.useState("")
  const [contaId, setContaId] = React.useState("")
  const [status, setStatus] = React.useState("pendente")
  const [tenantId, setTenantId] = React.useState("")

  const canSave = !!descricao.trim() && !!valor && !!dataLanc && !!dataVenc
  const reset = () => { setDescricao(""); setValor(""); setDataLanc(""); setDataVenc(""); setClienteId(""); setCategoriaId(""); setContaId(""); setStatus("pendente"); setTenantId(""); setError(null) }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : [] } catch { return [] as T[] }
  }

  React.useEffect(() => { if (!open) return; (async () => {
    const [cl, cs, cfs] = await Promise.all([
      fetchList<Item>('/api/modulos/financeiro/clientes/list'),
      fetchList<{ id: number; nome: string; tipo: string }>('/api/modulos/financeiro/categorias/list'),
      fetchList<Item>('/api/modulos/financeiro/contas-financeiras/list'),
    ])
    setClientes(cl); setCategorias(cs); setContas(cfs)
  })() }, [open])

  const onSave = async () => {
    if (!canSave || loading) return
    try {
      setLoading(true); setError(null)
      const fd = new FormData()
      fd.set('descricao', descricao.trim())
      fd.set('valor', valor)
      fd.set('data_lancamento', dataLanc)
      fd.set('data_vencimento', dataVenc)
      if (clienteId) fd.set('entidade_id', clienteId)
      if (categoriaId) fd.set('categoria_id', categoriaId)
      if (contaId) fd.set('conta_financeira_id', contaId)
      if (status) fd.set('status', status.trim())
      if (tenantId) fd.set('tenant_id', tenantId)
      const res = await fetch('/api/modulos/financeiro/contas-a-receber', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.success) throw new Error(json?.message || json?.error || 'Falha ao cadastrar')
      setOpen(false); reset(); onSaved?.()
    } catch (e) { setError(e instanceof Error ? e.message : 'Erro ao salvar') } finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild><Button className="ml-3 h-8 rounded bg-yellow-200 px-3 text-gray-900 hover:bg-yellow-300" variant="secondary">{triggerLabel}</Button></SheetTrigger>
      <SheetContent side="right" className="w-screen max-w-3xl p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b"><SheetTitle>Nova Conta a Receber</SheetTitle><SheetDescription>Preencha os dados da conta</SheetDescription></SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2"><Label>Descrição<span className="text-red-500"> *</span></Label><Textarea rows={2} value={descricao} onChange={(e)=>setDescricao(e.target.value)} /></div>
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
                <Label>Conta Financeira</Label>
                <Select value={contaId} onValueChange={setContaId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>{contas.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Status</Label><Input value={status} onChange={(e)=>setStatus(e.target.value)} placeholder="pendente | recebido | vencido" /></div>
              <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e)=>setTenantId(e.target.value)} placeholder="opcional" /></div>
            </div>
            {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
          </div>
          <SheetFooter className="p-4 border-t"><SheetClose asChild><Button variant="outline">Cancelar</Button></SheetClose><Button onClick={onSave} disabled={!canSave || loading}>{loading ? 'Salvando…' : 'Salvar'}</Button></SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}

