"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

type Props = { triggerLabel?: string; onSaved?: () => void }
type Item = { id: number; nome: string }

export default function CadastroContaAReceberSheet({ triggerLabel = 'Cadastrar', onSaved }: Props) {
  const [isOpen, setIsOpen] = React.useState(false)

  const [clientes, setClientes] = React.useState<Item[]>([])
  const [categorias, setCategorias] = React.useState<Item[]>([])

  const [descricao, setDescricao] = React.useState('Venda/serviço')
  const [numero, setNumero] = React.useState('')
  const [tipoDoc, setTipoDoc] = React.useState('fatura')
  const [valor, setValor] = React.useState('')
  const [dataLanc, setDataLanc] = React.useState<string>('')
  const [dataVenc, setDataVenc] = React.useState<string>('')
  const [clienteId, setClienteId] = React.useState('')
  const [categoriaId, setCategoriaId] = React.useState('')
  
  const [tenantId, setTenantId] = React.useState('1')

  const reset = () => { setDescricao('Venda/serviço'); setNumero(''); setTipoDoc('fatura'); setValor(''); setDataLanc(''); setDataVenc(''); setClienteId(''); setCategoriaId(''); setTenantId('1') }

  const fetchList = async <T,>(url: string): Promise<T[]> => {
    try { const res = await fetch(url, { cache: 'no-store' }); const json = await res.json(); return res.ok && json?.success && Array.isArray(json?.rows) ? json.rows as T[] : [] } catch { return [] as T[] }
  }

  React.useEffect(() => {
    if (!isOpen) return;
    (async () => {
      const [cl, cs] = await Promise.all([
        fetchList<Item>('/api/modulos/financeiro/clientes/list'),
        fetchList<Item>(`/api/modulos/financeiro?view=categorias-receita&pageSize=1000`),
      ])
      setClientes(cl);
      setCategorias(cs);
      if (!dataLanc) setDataLanc(new Date().toISOString().slice(0,10))
      if (!numero) {
        const today = new Date().toISOString().slice(0,10).replace(/-/g,'')
        setNumero(`CR-${today}-${Math.random().toString(36).slice(2,8).toUpperCase()}`)
      }
    })()
  }, [isOpen])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!(descricao.trim() && valor && dataLanc && dataVenc && clienteId)) {
      return { success: false, error: 'Preencha descrição, valor, lançamento, vencimento e cliente.' }
    }
    try {
      const payload = {
        tenant_id: Number(tenantId || '1'),
        cliente_id: Number(clienteId),
        numero_documento: (numero || '').trim(),
        tipo_documento: (tipoDoc || 'fatura').trim(),
        status: 'pendente',
        descricao: descricao.trim(),
        valor: Number(valor),
        data_lancamento: dataLanc,
        data_vencimento: dataVenc,
        categoria_id: categoriaId ? Number(categoriaId) : null,
      }
      const res = await fetch('/api/modulos/financeiro/contas-a-receber', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const j = await res.json()
      if (!res.ok || !j?.success) return { success: false, error: j?.message || 'Falha ao cadastrar' }
      return { success: true }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Erro ao salvar' }
    }
  }

  return (
    <BaseCadastroSheet
      triggerLabel={triggerLabel}
      title="Nova Conta a Receber"
      description="Preencha os dados mínimos para o título"
      widthClassName="max-w-3xl"
      onOpenChange={setIsOpen}
      onSubmit={onSubmit}
      onSuccess={() => { reset(); onSaved?.() }}
    >
      <div className="md:col-span-2"><Label>Descrição<span className="text-red-500"> *</span></Label><Textarea rows={2} value={descricao} onChange={(e)=>setDescricao(e.target.value)} placeholder="Ex.: Prestação de serviços" /></div>
      <div><Label>Valor<span className="text-red-500"> *</span></Label><Input type="number" step="0.01" value={valor} onChange={(e)=>setValor(e.target.value)} placeholder="Ex.: 1500,00" /></div>
      <div><Label>Número do Documento</Label><Input value={numero} onChange={(e)=>setNumero(e.target.value)} placeholder="Ex.: NFS-0001" /></div>
      <div><Label>Tipo do Documento</Label><Input value={tipoDoc} onChange={(e)=>setTipoDoc(e.target.value)} placeholder="Ex.: fatura, nf, recibo" /></div>
      <div><Label>Lançamento<span className="text-red-500"> *</span></Label><Input type="date" value={dataLanc} onChange={(e)=>setDataLanc(e.target.value)} /></div>
      <div><Label>Vencimento<span className="text-red-500"> *</span></Label><Input type="date" value={dataVenc} onChange={(e)=>setDataVenc(e.target.value)} /></div>
      <div>
        <Label>Cliente<span className="text-red-500"> *</span></Label>
        <Select value={clienteId} onValueChange={setClienteId}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{clientes.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label>Categoria Receita</Label>
        <Select value={categoriaId} onValueChange={setCategoriaId}>
          <SelectTrigger><SelectValue placeholder="(Opcional)" /></SelectTrigger>
          <SelectContent>{categorias.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      
      <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e)=>setTenantId(e.target.value)} placeholder="1" /></div>
    </BaseCadastroSheet>
  )
}
