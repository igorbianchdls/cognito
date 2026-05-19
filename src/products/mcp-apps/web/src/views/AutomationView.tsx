import { DataTable } from '@/products/mcp-apps/web/src/components/DataTable'
import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { ResultShell } from '@/products/mcp-apps/web/src/components/ResultShell'
import { StatusBadge } from '@/products/mcp-apps/web/src/components/StatusBadge'
import type { AutomationStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatDate, getToolVisual, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'
import type { DataRow } from '@/products/mcp-apps/web/src/utils/table'

function asRows(value: unknown): DataRow[] {
  return Array.isArray(value)
    ? value.filter((item): item is DataRow => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : []
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function getColumns(rows: DataRow[], columns?: string[]) {
  if (Array.isArray(columns) && columns.length) return columns
  return rows.length ? Object.keys(rows[0] || {}) : []
}

function stringifyShort(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function AutomationListCard({ row, kind }: { row: DataRow; kind?: string }) {
  const description = kind === 'schedules'
    ? stringifyShort(row.prompt)
    : stringifyShort(row.condition)
  const timing = [
    row.frequency ? humanizeKey(String(row.frequency)) : null,
    row.time ? String(row.time) : null,
    row.day_of_week ? humanizeKey(String(row.day_of_week)) : null,
  ].filter(Boolean).join(' · ')

  return (
    <article className="automation-list-card">
      <header>
        <div>
          <h2>{String(row.title || `${kind === 'schedules' ? 'Agendamento' : 'Alerta'} #${row.id || '-'}`)}</h2>
          <p>{timing || 'Sem recorrencia definida'}</p>
        </div>
        <StatusBadge value={row.status} />
      </header>
      <p className="automation-list-card__description">{description}</p>
      <dl>
        <div>
          <dt>Canais</dt>
          <dd>{stringifyShort(row.channels)}</dd>
        </div>
        <div>
          <dt>Ultima execucao</dt>
          <dd>{formatDate(row.last_run_at)}</dd>
        </div>
        <div>
          <dt>Proxima execucao</dt>
          <dd>{formatDate(row.next_run_at)}</dd>
        </div>
      </dl>
    </article>
  )
}

export function AutomationView({ data }: { data: AutomationStructuredContent }) {
  const visual = getToolVisual(data.tool)
  const rows = asRows(data.rows)
  const columns = getColumns(rows, data.columns)
  const preview = asRecord(data.preview)
  const result = asRecord(data.result)
  const summary = asRecord(data.summary)
  const title = data.title || humanizeKey(data.tool || 'Automacao')
  const isList = data.view === 'automation_list'

  if (isList) {
    return (
      <ResultShell icon={visual.icon} tone={visual.tone} title={title} description={data.subtitle || undefined}>
        <section className="automation-panel">
          <div className="automation-list-summary" aria-label="Resumo">
            <div>
              <span>Total</span>
              <strong>{String(summary.total ?? rows.length)}</strong>
            </div>
            <div>
              <span>Ativos</span>
              <strong>{String(summary.active ?? '-')}</strong>
            </div>
            <div>
              <span>Pausados</span>
              <strong>{String(summary.paused ?? '-')}</strong>
            </div>
            <div>
              <span>Proxima execucao</span>
              <strong>{formatDate(summary.next_run_at)}</strong>
            </div>
          </div>

          {rows.length ? (
            <div className="automation-list-grid">
              {rows.map((row) => (
                <AutomationListCard key={String(row.id || row.title)} row={row} kind={data.kind} />
              ))}
            </div>
          ) : (
            <EmptyState
              title={data.kind === 'schedules' ? 'Nenhum agendamento criado' : 'Nenhum alerta criado'}
              description="Quando houver registros, eles aparecem aqui com status, recorrencia e canais."
            />
          )}
        </section>
      </ResultShell>
    )
  }

  return (
    <ResultShell icon={visual.icon} tone={visual.tone} title={title} description={data.subtitle || undefined}>
      <section className="automation-panel">
        {Object.keys(preview).length || Object.keys(result).length ? (
          <div className="automation-summary">
            {Object.keys(preview).length ? (
              <section>
                <h2>Preview</h2>
                <dl>
                  {Object.entries(preview).slice(0, 8).map(([key, value]) => (
                    <div key={key}>
                      <dt>{humanizeKey(key)}</dt>
                      <dd>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
            {Object.keys(result).length ? (
              <section>
                <h2>Resultado</h2>
                <dl>
                  {Object.entries(result).slice(0, 8).map(([key, value]) => (
                    <div key={key}>
                      <dt>{humanizeKey(key)}</dt>
                      <dd>{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '-')}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}
          </div>
        ) : null}

        {rows.length && columns.length ? (
          <DataTable rows={rows} columns={columns} />
        ) : (
          <EmptyState title="Sem linhas" description="A tool nao retornou registros tabulares." />
        )}
      </section>
    </ResultShell>
  )
}
