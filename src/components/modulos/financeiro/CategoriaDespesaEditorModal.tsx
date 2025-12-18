"use client"

import * as React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type Categoria = {
  id: number
  codigo: string | null
  nome: string | null
  descricao: string | null
  tipo: string | null
  natureza: string | null
  categoria_pai_id: number | null
  plano_conta_id: number | null
}

type PlanoConta = {
  id: number
  codigo: string
  nome: string
  aceita_lancamento?: boolean
}

export default function CategoriaDespesaEditorModal({
  open,
  onOpenChange,
  categoriaId,
  onSaved,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  categoriaId: number | null
  onSaved?: () => void
}) {
  const [loading, setLoading] = React.useState(false)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [cat, setCat] = React.useState<Categoria | null>(null)
  const [selectedPlanoId, setSelectedPlanoId] = React.useState<number | null>(null)
  const [codigo, setCodigo] = React.useState('')
  const [nome, setNome] = React.useState('')
  const [descricao, setDescricao] = React.useState('')
  const [tipo, setTipo] = React.useState('')
  const [natureza, setNatureza] = React.useState('')
  const [q, setQ] = React.useState('')
  const [options, setOptions] = React.useState<PlanoConta[]>([])
  const [optLoading, setOptLoading] = React.useState(false)

  // Load categoria on open
  React.useEffect(() => {
    if (!open || !categoriaId) return
    let cancel = false
    ;(async () => {
      try {
        setLoading(true); setError(null)
        const res = await fetch(`/api/modulos/financeiro/categorias-despesa/${categoriaId}`, { cache: 'no-store' })
        const j = await res.json()
        if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
        const row = j.row as Categoria
        if (!cancel) {
          setCat(row)
          setSelectedPlanoId(row.plano_conta_id ?? null)
          setCodigo(String(row.codigo ?? ''))
          setNome(String(row.nome ?? ''))
          setDescricao(String(row.descricao ?? ''))
          setTipo(String(row.tipo ?? ''))
          setNatureza(String(row.natureza ?? ''))
        }
      } catch (e) {
        if (!cancel) setError(e instanceof Error ? e.message : 'Falha ao carregar categoria')
      } finally {
        if (!cancel) setLoading(false)
      }
    })()
    return () => { cancel = true }
  }, [open, categoriaId])

  // Load plan options (debounced)
  React.useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    const h = setTimeout(async () => {
      try {
        setOptLoading(true)
        const params = new URLSearchParams()
        params.set('view', 'plano-contas')
        params.set('aceita_lancamento', '1')
        params.set('tipo', 'Custo,Despesa')
        params.set('order_by', 'codigo')
        params.set('pageSize', '20')
        if (q) params.set('q', q)
        const res = await fetch(`/api/modulos/contabilidade?${params.toString()}`, { cache: 'no-store', signal: controller.signal })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? j.rows as Array<Record<string, unknown>> : []
        const opts: PlanoConta[] = rows.map(r => ({ id: Number(r['id']), codigo: String(r['codigo'] || ''), nome: String(r['nome'] || ''), aceita_lancamento: Boolean(r['aceita_lancamento']) }))
        setOptions(opts)
      } catch (e) {
        if (!(e instanceof DOMException && e.name === 'AbortError')) {
          // ignore transient
        }
      } finally { setOptLoading(false) }
    }, 300)
    return () => { clearTimeout(h); controller.abort() }
  }, [open, q])

  async function handleSave() {
    if (!categoriaId) return
    try {
      setSaving(true); setError(null)
      const body = {
        plano_conta_id: selectedPlanoId,
        codigo: codigo || null,
        nome: nome || null,
        descricao: descricao || null,
        tipo: tipo || null,
        natureza: natureza || null,
      }
      const res = await fetch(`/api/modulos/financeiro/categorias-despesa/${categoriaId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const j = await res.json()
      if (!res.ok || !j?.success) throw new Error(j?.message || `HTTP ${res.status}`)
      onSaved?.()
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao salvar')
    } finally { setSaving(false) }
  }

  const selectedLabel = React.useMemo(() => {
    if (!selectedPlanoId) return '—'
    const found = options.find(o => o.id === selectedPlanoId)
    return found ? `${found.codigo} — ${found.nome}` : `#${selectedPlanoId}`
  }, [selectedPlanoId, options])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Editar Categoria de Despesa</DialogTitle>
          <DialogDescription>Mapeie a categoria para um Plano de Contas (somente contas lançáveis de Custo/Despesa).</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="p-3 text-sm text-gray-500">Carregando…</div>
        ) : error ? (
          <div className="p-3 text-sm text-red-600">{error}</div>
        ) : cat ? (
          <div className="space-y-4">
            <div className="text-sm">
              <div><span className="text-gray-500">Categoria:</span> <strong>{cat.codigo ?? '—'} {cat.nome ?? ''}</strong></div>
              <div className="text-gray-600">{cat.descricao ?? ''}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Código</label>
                <Input value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ex.: 6.1.1" />
              </div>
              <div>
                <label className="text-sm font-medium">Nome</label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Despesa XYZ" />
              </div>
              <div className="col-span-2">
                <label className="text-sm font-medium">Descrição</label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da categoria" />
              </div>
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ex.: Despesa" />
              </div>
              <div>
                <label className="text-sm font-medium">Natureza</label>
                <Input value={natureza} onChange={(e) => setNatureza(e.target.value)} placeholder="Ex.: Operacional" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Plano de Contas</label>
              <div className="text-xs text-gray-600">Selecionado: {selectedLabel}</div>
              <div className="flex items-center gap-2">
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por código/nome…" className="flex-1" />
                <Button variant="outline" onClick={() => setQ('')}>Limpar</Button>
              </div>
              <div className="max-h-56 overflow-auto border rounded">
                {optLoading ? (
                  <div className="p-2 text-xs text-gray-500">Carregando opções…</div>
                ) : options.length === 0 ? (
                  <div className="p-2 text-xs text-gray-500">Sem resultados</div>
                ) : (
                  <ul>
                    {options.map(opt => (
                      <li key={opt.id}>
                        <button
                          type="button"
                          className={`w-full text-left px-2 py-1 text-sm hover:bg-gray-50 ${selectedPlanoId === opt.id ? 'bg-violet-50' : ''}`}
                          onClick={() => setSelectedPlanoId(opt.id)}
                          title={opt.nome}
                        >
                          <span className="font-mono text-[11px] text-gray-700">{opt.codigo}</span> — {opt.nome}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Button variant="secondary" onClick={() => setSelectedPlanoId(null)}>Remover vínculo</Button>
              </div>
            </div>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !cat}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
