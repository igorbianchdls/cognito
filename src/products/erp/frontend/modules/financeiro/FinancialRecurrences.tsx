'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useErpConfirmation } from '@/products/erp/frontend/components/ErpConfirmation'
import { ErpRequestError, parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'

type Recurrence = {
  id: string; tipo: string; descricao: string; frequencia: string; intervalo: number
  termino_tipo: 'data' | 'ocorrencias' | 'indeterminado'; termino_em: string | null
  quantidade_ocorrencias: number | null; proxima_competencia: string | null
  ativa: boolean; pausada_em: string | null; encerrada_em: string | null; atualizado_em: string
}
const day = (value: string | null) => value ? value.slice(0, 10) : ''
const dateLabel = (value: string | null) => value ? day(value).split('-').reverse().join('/') : '—'
const frequency: Record<string, string> = { dia: 'dia(s)', semana: 'semana(s)', mes: 'mês(es)', ano: 'ano(s)' }

export function FinancialRecurrences({ onChanged }: { onChanged: () => Promise<void> }) {
  const confirm = useErpConfirmation()
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [rows, setRows] = useState<Recurrence[]>([])
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Recurrence | null>(null)
  const [description, setDescription] = useState('')
  const [endType, setEndType] = useState<Recurrence['termino_tipo']>('ocorrencias')
  const [endDate, setEndDate] = useState('')
  const [count, setCount] = useState(12)
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const body = await parseErpResponse<{ financial: Recurrence[]; hasMore: boolean }>(await fetch(`/api/erp/recorrencias?scope=financial&page=${page}`, { cache: 'no-store' }))
      setRows(body.financial); setHasMore(body.hasMore)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as recorrências.') }
    finally { setLoading(false) }
  }, [page])
  useEffect(() => { if (open) void load() }, [open, load])

  async function change(row: Recurrence, action: string) {
    if (busy) return
    if (action === 'encerrar' && !(await confirm({ title: 'Encerrar recorrência', description: `Encerrar “${row.descricao}”? Não serão gerados novos lançamentos. Os títulos e o histórico existentes serão preservados.`, confirmLabel: 'Encerrar recorrência' }))) return
    setBusy(true); setError('')
    try {
      await parseErpResponse(await fetch('/api/erp/recorrencias', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, action, expectedUpdatedAt: row.atualizado_em,
          ...(action === 'editar' ? { values: { descricao: description, termino_tipo: endType,
            ...(endType === 'data' ? { termino_em: endDate } : endType === 'ocorrencias' ? { quantidade_ocorrencias: count } : {}) } } : {}) }),
      }))
      setEditing(null); await load(); await onChanged()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível alterar a recorrência.')
      if (cause instanceof ErpRequestError && cause.code === 'VERSION_CONFLICT') setEditing(null)
      await load()
    } finally { setBusy(false) }
  }
  return <>
    <Button variant="outline" onClick={() => { setError(''); setEditing(null); setPage(1); setOpen(true) }}>Recorrências</Button>
    <Dialog open={open} onOpenChange={(value) => { if (!busy) setOpen(value) }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>Recorrências financeiras</DialogTitle><DialogDescription>Gerencie os próximos lançamentos. Alterações preservam os títulos e o histórico existentes.</DialogDescription></DialogHeader>
        <p className="text-sm text-gray-600">As alterações valem para os próximos lançamentos. Os títulos já gerados são preservados. A frequência e o calendário original permanecem os mesmos.</p>
        {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
        {editing ? <form className="grid gap-4" onSubmit={(event) => { event.preventDefault(); void change(editing, 'editar') }}>
          <label className="grid gap-2 text-sm">Descrição<Input required maxLength={200} value={description} onChange={(event) => setDescription(event.target.value)} /></label>
          <label className="grid gap-2 text-sm">Término<select className="rounded border p-2" value={endType} onChange={(event) => setEndType(event.target.value as Recurrence['termino_tipo'])}><option value="ocorrencias">Quantidade total de ocorrências</option><option value="data">Data final</option><option value="indeterminado">Sem data final</option></select></label>
          {endType === 'data' && <label className="grid gap-2 text-sm">Data final<Input type="date" required min={day(editing.proxima_competencia)} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>}
          {endType === 'ocorrencias' && <label className="grid gap-2 text-sm">Quantidade total (inclui as já geradas)<Input type="number" required min={1} max={366} value={count} onChange={(event) => setCount(Number(event.target.value))} /></label>}
          <div className="flex justify-end gap-2"><Button type="button" variant="outline" disabled={busy} onClick={() => setEditing(null)}>Voltar</Button><Button disabled={busy}>Salvar alterações futuras</Button></div>
        </form> : <>
          {loading ? <p role="status">Carregando recorrências…</p> : rows.length ? rows.map((row) => <article key={row.id} className="grid gap-2 rounded border p-3">
            <div className="flex flex-wrap justify-between gap-2"><strong>{row.descricao || `Recorrência ${row.id}`}</strong><span>{row.encerrada_em ? 'Encerrada' : row.pausada_em ? 'Pausada' : row.ativa ? 'Ativa' : 'Inativa'}</span></div>
            <p className="text-sm text-gray-600">{row.tipo === 'pagar' ? 'Despesa' : 'Receita'} · A cada {row.intervalo} {frequency[row.frequencia]} · Próxima: {dateLabel(row.proxima_competencia)}</p>
            {!row.encerrada_em && <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={() => { setEditing(row); setDescription(row.descricao || ''); setEndType(row.termino_tipo); setEndDate(day(row.termino_em)); setCount(row.quantidade_ocorrencias || 12) }}>Editar</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void change(row, row.pausada_em ? 'retomar' : 'pausar')}>{row.pausada_em ? 'Retomar' : 'Pausar'}</Button>
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void change(row, 'encerrar')}>Encerrar</Button>
            </div>}
          </article>) : <p>Nenhuma recorrência cadastrada.</p>}
          <div className="flex items-center justify-end gap-2"><Button variant="outline" disabled={loading || busy || page === 1} onClick={() => setPage(page - 1)}>Anterior</Button><span>Página {page}</span><Button variant="outline" disabled={loading || busy || !hasMore} onClick={() => setPage(page + 1)}>Próxima</Button></div>
        </>}
      </DialogContent>
    </Dialog>
  </>
}
