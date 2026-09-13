'use client'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { HistoryRows, historyValue } from './ErpHistoryPanel'
import { parseErpResponse } from '@/products/erp/frontend/services/erpProfessionalClient'
import { useErpAccess } from '@/products/erp/frontend/hooks/useErpAccess'

type Row = Record<string, unknown>
const routines = [
  ['contratos', 'Gerar vendas dos contratos'],
  ['recorrencias_financeiras', 'Gerar recorrências financeiras e compras'],
  ['titulos_vencidos', 'Atualizar parcelas vencidas'],
  ['indicadores', 'Conferir indicadores'],
  ['estoque_minimo', 'Conferir reposição de estoque'],
]
type Recurrences = {
  financial: Row[]
  purchases: Row[]
  occurrences: Row[]
  purchaseOccurrences: Row[]
  contracts: Row[]
  hasMore: boolean
}
export function AutomationWorkspacePage() {
  const access = useErpAccess(),
    [records, setRecords] = useState<Row[]>([]),
    [recurrences, setRecurrences] = useState<Recurrences | null>(null),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [page, setPage] = useState(1),
    [hasMore, setHasMore] = useState(false),
    [date, setDate] = useState(() =>
      new Date().toLocaleDateString('en-CA', { timeZone: 'America/Fortaleza' }),
    ),
    [message, setMessage] = useState('')
  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [runs, cycles] = await Promise.all([
        fetch(`/api/erp/automacoes?page=${page}`, { cache: 'no-store' }).then((r) =>
          parseErpResponse<{ records: Row[]; hasMore: boolean }>(r),
        ),
        fetch(`/api/erp/recorrencias?page=${page}`, { cache: 'no-store' }).then((r) =>
          parseErpResponse<Recurrences>(r),
        ),
      ])
      setRecords(runs.records)
      setRecurrences(cycles)
      setHasMore(runs.hasMore || cycles.hasMore)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível consultar as rotinas.')
    } finally {
      setLoading(false)
    }
  }, [page])
  useEffect(() => {
    void load()
  }, [load])
  async function run(tipo: string) {
    if (busy) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const response = await parseErpResponse<{ result: Row }>(
        await fetch('/api/erp/automacoes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tipo, competencia: date }),
        }),
      )
      setMessage(`Execução: ${historyValue(response.result.status)}. Consulte o resultado abaixo.`)
      await load()
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'Falha na execução. Consulte o histórico antes de tentar novamente.',
      )
    } finally {
      setBusy(false)
    }
  }
  async function change(row: Row, action: string) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await parseErpResponse(
        await fetch('/api/erp/recorrencias', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: String(row.id),
            action,
            expectedUpdatedAt: row.atualizado_em,
          }),
        }),
      )
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível alterar a recorrência.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="grid gap-5">
      <header>
        <h1 className="text-2xl font-semibold">Rotinas e recorrências</h1>
        <p className="mt-2 text-sm text-gray-600">
          Consulte próximas ocorrências, tentativas e resultados. Repetir uma execução concluída
          retorna o resultado registrado para a mesma data.
        </p>
      </header>
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-sm">
          Data limite da execução
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={busy}
          />
        </label>
        <Button variant="outline" disabled={busy || loading} onClick={() => void load()}>
          Atualizar
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {routines.map(([id, label]) => (
          <Button
            key={id}
            variant="outline"
            disabled={busy || !date || !access.can('erp.configuracoes.gerenciar')}
            onClick={() => void run(id)}
          >
            {label}
          </Button>
        ))}
      </div>
      {message ? <p role="status">{message}</p> : null}
      {error ? (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      ) : null}
      {loading ? (
        <p role="status">Carregando rotinas…</p>
      ) : error ? null : (
        <>
          <HistoryRows title="Execuções e resultados" rows={records} />
          {recurrences ? (
            <>
              <section className="grid gap-3">
                <h2 className="font-semibold">Recorrências financeiras</h2>
                {recurrences.financial.length ? (
                  recurrences.financial.map((row) => (
                    <div key={String(row.id)} className="grid gap-2">
                      <HistoryRows title={`Recorrência ${row.id}`} rows={[row]} />
                      {!row.encerrada_em && access.can('erp.financeiro.gerenciar') ? (
                        <div className="flex gap-2">
                          {row.ativa ? (
                            <Button
                              variant="outline"
                              disabled={busy}
                              onClick={() => void change(row, 'pausar')}
                            >
                              Pausar
                            </Button>
                          ) : row.pausada_em ? (
                            <Button
                              variant="outline"
                              disabled={busy || !row.proxima_competencia}
                              onClick={() => void change(row, 'retomar')}
                            >
                              Retomar
                            </Button>
                          ) : null}
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => void change(row, 'encerrar')}
                          >
                            Encerrar próximas gerações
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p>Nenhuma recorrência registrada.</p>
                )}
              </section>
              <HistoryRows title="Títulos gerados por ocorrência" rows={recurrences.occurrences} />
              <HistoryRows title="Recorrências de compras" rows={recurrences.purchases} />
              <HistoryRows title="Compras geradas" rows={recurrences.purchaseOccurrences} />
              <HistoryRows title="Gerações dos contratos" rows={recurrences.contracts} />
            </>
          ) : null}
          <div className="flex items-center gap-3">
            <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Anterior
            </Button>
            <span>Página {page}</span>
            <Button variant="outline" disabled={!hasMore} onClick={() => setPage((p) => p + 1)}>
              Próxima
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
