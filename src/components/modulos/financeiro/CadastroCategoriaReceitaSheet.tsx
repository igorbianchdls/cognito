"use client"

import * as React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import BaseCadastroSheet from '@/components/modulos/BaseCadastroSheet'

type Props = { triggerLabel?: string; onSaved?: () => void }
type Plano = { id: number; codigo: string; nome: string; aceita_lancamento?: boolean }

export default function CadastroCategoriaReceitaSheet({ triggerLabel = 'Cadastrar', onSaved }: Props) {
  const [tenantId, setTenantId] = React.useState('1')
  const [codigo, setCodigo] = React.useState('RC-001')
  const [nome, setNome] = React.useState('Receita de Serviços')
  const [descricao, setDescricao] = React.useState('Serviços prestados (padrão)')
  const [tipo, setTipo] = React.useState<'operacional'|'financeira'|'outras'>('operacional')
  const [planoId, setPlanoId] = React.useState<string>('')
  const [q, setQ] = React.useState('')
  const [planos, setPlanos] = React.useState<Plano[]>([])
  const [loading, setLoading] = React.useState(false)

  const reset = () => { setTenantId('1'); setCodigo('RC-001'); setNome('Receita de Serviços'); setDescricao('Serviços prestados (padrão)'); setTipo('operacional'); setPlanoId(''); setQ('') }

  React.useEffect(() => {
    let cancel = false
    const load = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        params.set('view', 'plano-contas')
        params.set('aceita_lancamento', '1')
        params.set('tipo', 'Receita')
        params.set('order_by', 'codigo')
        params.set('pageSize', '30')
        if (q) params.set('q', q)
        const res = await fetch(`/api/modulos/contabilidade?${params.toString()}`, { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? j.rows as Array<Record<string, unknown>> : []
        const list: Plano[] = rows.map(r => ({ id: Number(r['id']), codigo: String(r['codigo'] || ''), nome: String(r['nome'] || ''), aceita_lancamento: Boolean(r['aceita_lancamento']) }))
        if (!cancel) setPlanos(list)
      } finally { if (!cancel) setLoading(false) }
    }
    const t = setTimeout(load, 250)
    return () => { cancel = true; clearTimeout(t) }
  }, [q])

  const onSubmit = async (): Promise<{ success: boolean; error?: string }> => {
    if (!nome.trim()) return { success: false, error: 'Informe o nome da categoria.' }
    try {
      const payload = {
        tenant_id: Number(tenantId || '1'),
        codigo: codigo.trim() || null,
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        tipo,
        plano_conta_id: planoId ? Number(planoId) : null,
      }
      const res = await fetch('/api/modulos/financeiro/categorias-receita', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
      title="Cadastrar Categoria de Receita"
      description="Defina os dados da categoria e vincule ao Plano de Contas"
      widthClassName="max-w-3xl"
      onSubmit={onSubmit}
      onSuccess={() => { reset(); onSaved?.() }}
    >
      <div><Label>Tenant ID</Label><Input value={tenantId} onChange={(e) => setTenantId(e.target.value)} placeholder="1" /></div>
      <div><Label>Código</Label><Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: RC-001" /></div>
      <div><Label>Nome<span className="text-red-500"> *</span></Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Receita de Serviços" /></div>
      <div className="md:col-span-2"><Label>Descrição</Label><Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Texto opcional" /></div>
      <div>
        <Label>Tipo</Label>
        <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="operacional">Operacional</SelectItem>
            <SelectItem value="financeira">Financeira</SelectItem>
            <SelectItem value="outras">Outras</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="md:col-span-2">
        <Label>Plano de Contas (Receita)</Label>
        <div className="flex items-center gap-2 mb-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código/nome…" />
        </div>
        <div className="max-h-40 overflow-auto border rounded">
          {loading ? (
            <div className="p-2 text-xs text-gray-500">Carregando…</div>
          ) : (
            <ul>
              {planos.map(p => (
                <li key={p.id}>
                  <button type="button" className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-50 ${String(p.id) === planoId ? 'bg-emerald-50' : ''}`} onClick={() => setPlanoId(String(p.id))}>
                    <span className="font-mono text-[11px] text-gray-700">{p.codigo}</span> — {p.nome}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {planoId && (
          <div className="text-xs text-gray-600 mt-1">Selecionado: {planos.find(p => String(p.id) === planoId)?.codigo} — {planos.find(p => String(p.id) === planoId)?.nome}</div>
        )}
      </div>
    </BaseCadastroSheet>
  )
}

