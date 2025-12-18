"use client"

import * as React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function CadastroRegraContabilSheet({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [origem, setOrigem] = React.useState('contas_a_pagar')
  const [subtipo, setSubtipo] = React.useState('principal')
  const [planoContaId, setPlanoContaId] = React.useState<number | null>(null)
  const [contaDebitoId, setContaDebitoId] = React.useState<number | null>(null)
  const [contaCreditoId, setContaCreditoId] = React.useState<number | null>(null)
  const [descricao, setDescricao] = React.useState('')

  // Lookups (plano/contas) com busca
  type PlanoRow = { id: number; codigo: string; nome: string; aceita_lancamento?: boolean }
  const [qPlano, setQPlano] = React.useState('')
  const [qCredito, setQCredito] = React.useState('')
  const [optsPlano, setOptsPlano] = React.useState<PlanoRow[]>([])
  const [optsCredito, setOptsCredito] = React.useState<PlanoRow[]>([])
  const [loadingPlano, setLoadingPlano] = React.useState(false)
  const [loadingCredito, setLoadingCredito] = React.useState(false)

  async function fetchPlanoOpts(q: string): Promise<PlanoRow[]> {
    const params = new URLSearchParams()
    params.set('view', 'plano-contas')
    params.set('aceita_lancamento', '1')
    params.set('tipo', 'Custo,Despesa')
    params.set('order_by', 'codigo')
    params.set('pageSize', '20')
    if (q) params.set('q', q)
    const res = await fetch(`/api/modulos/contabilidade?${params.toString()}`, { cache: 'no-store' })
    const j = await res.json()
    const rows = Array.isArray(j?.rows) ? j.rows as Array<Record<string, unknown>> : []
    return rows.map(r => ({ id: Number(r['id']), codigo: String(r['codigo'] || ''), nome: String(r['nome'] || ''), aceita_lancamento: Boolean(r['aceita_lancamento']) }))
  }

  // Debounced loaders
  React.useEffect(() => { let c = false; (async () => { setLoadingPlano(true); try { setOptsPlano(await fetchPlanoOpts(qPlano)) } finally { if (!c) setLoadingPlano(false) } })(); return () => { c = true } }, [qPlano])
  React.useEffect(() => { let c = false; (async () => { setLoadingCredito(true); try { setOptsCredito(await fetchPlanoOpts(qCredito)) } finally { if (!c) setLoadingCredito(false) } })(); return () => { c = true } }, [qCredito])

  async function handleSave() {
    try {
      setSaving(true); setError(null)
      const body = {
        origem,
        subtipo: subtipo || null,
        plano_conta_id: Number(planoContaId),
        conta_debito_id: Number(contaDebitoId),
        conta_credito_id: Number(contaCreditoId),
        descricao: descricao || null,
      }
      const res = await fetch('/api/modulos/contabilidade/regras-contabeis', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
      setOpen(false)
      setOrigem('contas_a_pagar'); setSubtipo('principal'); setPlanoContaId(null); setContaCreditoId(null); setDescricao('')
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar')
    } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="ml-3 h-8 rounded bg-amber-200 px-3 text-gray-900 hover:bg-amber-300" variant="secondary">
          Nova Regra
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[720px] p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Nova Regra Contábil</SheetTitle>
            <SheetDescription>Origem + mapeamento de contas; crie a regra para o plano informado.</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Origem</Label>
                <Select value={origem} onValueChange={setOrigem}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contas_a_pagar">Contas a Pagar</SelectItem>
                    <SelectItem value="pagamentos_efetuados">Pagamentos Efetuados</SelectItem>
                    <SelectItem value="contas_a_receber">Contas a Receber</SelectItem>
                    <SelectItem value="pagamentos_recebidos">Pagamentos Recebidos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Subtipo (opcional)</Label>
                <Input value={subtipo} onChange={(e) => setSubtipo(e.target.value)} placeholder="ex.: principal" />
              </div>
              <div className="col-span-2">
                <Label>Plano de Contas (Débito)</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Input value={qPlano} onChange={(e) => setQPlano(e.target.value)} placeholder="Buscar plano por código/nome…" />
                </div>
                <div className="max-h-40 overflow-auto border rounded">
                  {loadingPlano ? <div className="p-2 text-xs text-gray-500">Carregando…</div> : (
                    <ul>
                      {optsPlano.map(opt => (
                        <li key={opt.id}>
                          <button type="button" className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-50 ${planoContaId === opt.id ? 'bg-amber-50' : ''}`} onClick={() => setPlanoContaId(opt.id)}>
                            <span className="font-mono text-[11px] text-gray-700">{opt.codigo}</span> — {opt.nome}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {planoContaId && (
                  <div className="text-xs text-gray-600 mt-1">Selecionado: {optsPlano.find(o => o.id === planoContaId)?.codigo} — {optsPlano.find(o => o.id === planoContaId)?.nome}</div>
                )}
              </div>
              <div>
                <Label>Conta Crédito</Label>
                <Input value={qCredito} onChange={(e) => setQCredito(e.target.value)} placeholder="Buscar conta crédito…" className="mb-2" />
                <div className="max-h-40 overflow-auto border rounded">
                  {loadingCredito ? <div className="p-2 text-xs text-gray-500">Carregando…</div> : (
                    <ul>
                      {optsCredito.map(opt => (
                        <li key={opt.id}>
                          <button type="button" className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-50 ${contaCreditoId === opt.id ? 'bg-amber-50' : ''}`} onClick={() => setContaCreditoId(opt.id)}>
                            <span className="font-mono text-[11px] text-gray-700">{opt.codigo}</span> — {opt.nome}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {contaCreditoId && (
                  <div className="text-xs text-gray-600 mt-1">Selecionada: {optsCredito.find(o => o.id === contaCreditoId)?.codigo} — {optsCredito.find(o => o.id === contaCreditoId)?.nome}</div>
                )}
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Texto livre do histórico" />
              </div>
            </div>
          </div>
          <SheetFooter className="p-4 border-t">
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={saving || !planoContaId || !contaCreditoId}>Salvar</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
