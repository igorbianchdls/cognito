"use client"

import * as React from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PlanoRow = { id: number; codigo: string; nome: string }
type Linha = { mes: number; conta_id: number | null; valor_debito?: number; valor_credito?: number; observacao?: string }

export default function CadastroOrcamentoSheet({ onSaved }: { onSaved?: () => void }) {
  const [open, setOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [nome, setNome] = React.useState('')
  const [ano, setAno] = React.useState<number>(new Date().getFullYear())
  const [versao, setVersao] = React.useState<string>('1')
  const [status, setStatus] = React.useState<string>('rascunho')
  const [descricao, setDescricao] = React.useState<string>('')

  const [mesBase, setMesBase] = React.useState<number>(new Date().getMonth() + 1)
  const [linhas, setLinhas] = React.useState<Linha[]>([{ mes: new Date().getMonth() + 1, conta_id: null, valor_debito: 0, valor_credito: 0 }])

  const [qPlano, setQPlano] = React.useState('')
  const [optsPlano, setOptsPlano] = React.useState<PlanoRow[]>([])
  const [loadingPlano, setLoadingPlano] = React.useState(false)

  async function fetchPlanoOpts(q: string): Promise<PlanoRow[]> {
    const params = new URLSearchParams()
    params.set('view', 'plano-contas')
    params.set('order_by', 'codigo')
    params.set('pageSize', '500')
    if (q) params.set('q', q)
    const res = await fetch(`/api/modulos/contabilidade?${params.toString()}`, { cache: 'no-store' })
    const j = await res.json()
    const rows = Array.isArray(j?.rows) ? j.rows as Array<Record<string, unknown>> : []
    return rows.map(r => ({ id: Number(r['id']), codigo: String(r['codigo'] || ''), nome: String(r['nome'] || '') }))
  }

  React.useEffect(() => { let c=false; (async()=>{ setLoadingPlano(true); try { setOptsPlano(await fetchPlanoOpts(qPlano)) } finally { if(!c) setLoadingPlano(false) }})(); return ()=>{c=true} }, [qPlano])

  const setLinha = (idx: number, patch: Partial<Linha>) => {
    setLinhas(prev => prev.map((l, i) => i === idx ? { ...l, ...patch } : l))
  }
  const addLinha = () => setLinhas(prev => [...prev, { mes: mesBase || 1, conta_id: null, valor_debito: 0, valor_credito: 0 }])
  const remLinha = (idx: number) => setLinhas(prev => prev.filter((_, i) => i !== idx))

  async function handleSave() {
    try {
      setSaving(true); setError(null)
      const body = {
        nome,
        ano,
        versao,
        status,
        descricao,
        linhas: linhas
          .filter(l => l.conta_id)
          .map(l => ({
            mes: Number(l.mes),
            conta_id: Number(l.conta_id),
            valor_debito: Number(l.valor_debito || 0),
            valor_credito: Number(l.valor_credito || 0),
            observacao: l.observacao || null,
          }))
      }
      const res = await fetch('/api/modulos/contabilidade/orcamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
      setOpen(false)
      setNome(''); setAno(new Date().getFullYear()); setVersao('1'); setStatus('rascunho'); setDescricao(''); setLinhas([{ mes: new Date().getMonth()+1, conta_id: null, valor_debito: 0, valor_credito: 0 }])
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar orçamento')
    } finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button className="ml-3 h-8 rounded bg-emerald-200 px-3 text-gray-900 hover:bg-emerald-300" variant="secondary">
          Novo Orçamento
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[880px] p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Novo Orçamento</SheetTitle>
            <SheetDescription>Preencha os dados do orçamento e as linhas com conta contábil (dropdown).</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-auto p-6">
            {error && <div className="mb-3 text-sm text-red-600">{error}</div>}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="col-span-2">
                <Label>Nome</Label>
                <Input value={nome} onChange={e=>setNome(e.target.value)} placeholder="Ex.: Orçamento 2025" />
              </div>
              <div>
                <Label>Ano</Label>
                <select value={ano} onChange={e=>setAno(Number(e.target.value))} className="h-9 w-full border rounded px-2">
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>
              <div>
                <Label>Mês</Label>
                <select value={mesBase} onChange={e=>setMesBase(Number(e.target.value))} className="h-9 w-full border rounded px-2">
                  <option value={1}>Janeiro</option>
                  <option value={2}>Fevereiro</option>
                  <option value={3}>Março</option>
                  <option value={4}>Abril</option>
                  <option value={5}>Maio</option>
                  <option value={6}>Junho</option>
                  <option value={7}>Julho</option>
                  <option value={8}>Agosto</option>
                  <option value={9}>Setembro</option>
                  <option value={10}>Outubro</option>
                  <option value={11}>Novembro</option>
                  <option value={12}>Dezembro</option>
                </select>
              </div>
              <div>
                <Label>Versão</Label>
                <Input value={versao} onChange={e=>setVersao(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Input value={status} onChange={e=>setStatus(e.target.value)} placeholder="ex.: rascunho, aprovado" />
              </div>
              <div className="col-span-2">
                <Label>Descrição</Label>
                <Input value={descricao} onChange={e=>setDescricao(e.target.value)} />
              </div>
            </div>
            <div className="mb-2 flex items-center gap-2">
              <Label className="font-semibold">Linhas</Label>
              <Button size="sm" variant="outline" onClick={addLinha}>Adicionar Linha</Button>
              <div className="ml-auto flex items-center gap-2">
                <Input value={qPlano} onChange={(e) => setQPlano(e.target.value)} placeholder="Buscar conta (código/nome)…" className="h-8 w-64" />
                {loadingPlano && <span className="text-xs text-gray-500">carregando…</span>}
              </div>
            </div>
            <div className="border rounded">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-2 py-2">Mês</th>
                    <th className="text-left px-2 py-2">Conta Contábil</th>
                    <th className="text-right px-2 py-2">Débito (Orçado)</th>
                    <th className="text-right px-2 py-2">Crédito (Orçado)</th>
                    <th className="text-left px-2 py-2">Observação</th>
                    <th className="text-right px-2 py-2">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="px-2 py-1">
                        <select value={l.mes} onChange={e=>setLinha(idx, { mes: Number(e.target.value) })} className="h-8 w-32 border rounded px-2">
                          <option value={1}>Jan</option>
                          <option value={2}>Fev</option>
                          <option value={3}>Mar</option>
                          <option value={4}>Abr</option>
                          <option value={5}>Mai</option>
                          <option value={6}>Jun</option>
                          <option value={7}>Jul</option>
                          <option value={8}>Ago</option>
                          <option value={9}>Set</option>
                          <option value={10}>Out</option>
                          <option value={11}>Nov</option>
                          <option value={12}>Dez</option>
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <select value={l.conta_id ?? ''} onChange={e=>setLinha(idx, { conta_id: e.target.value ? Number(e.target.value) : null })} className="h-9 w-full border rounded px-2">
                          <option value="">Selecione…</option>
                          {optsPlano.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.codigo} — {opt.nome}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-1 text-right"><Input type="number" value={l.valor_debito ?? 0} onChange={e=>setLinha(idx, { valor_debito: Number(e.target.value) })} className="h-8 w-28 text-right" /></td>
                      <td className="px-2 py-1 text-right"><Input type="number" value={l.valor_credito ?? 0} onChange={e=>setLinha(idx, { valor_credito: Number(e.target.value) })} className="h-8 w-28 text-right" /></td>
                      <td className="px-2 py-1"><Input value={l.observacao || ''} onChange={e=>setLinha(idx, { observacao: e.target.value })} className="h-8" /></td>
                      <td className="px-2 py-1 text-right"><Button size="sm" variant="outline" onClick={()=>remLinha(idx)}>Remover</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <SheetFooter className="p-4 border-t">
            <SheetClose asChild>
              <Button variant="outline">Cancelar</Button>
            </SheetClose>
            <Button onClick={handleSave} disabled={saving || !nome || !ano}>Salvar Orçamento</Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  )
}
