import { DataTable } from '@/products/mcp-apps/web/src/components/DataTable'
import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { ResultShell } from '@/products/mcp-apps/web/src/components/ResultShell'
import { StatusBadge } from '@/products/mcp-apps/web/src/components/StatusBadge'
import type { ConnectorsStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatDate, formatNumber, getToolVisual, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'
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

function stringifyShort(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getColumns(rows: DataRow[], columns?: string[]) {
  if (Array.isArray(columns) && columns.length) return columns
  return rows.length ? Object.keys(rows[0] || {}) : []
}

function ConnectorCard({ row }: { row: DataRow }) {
  return (
    <article className="connector-card">
      <header>
        <div>
          <h2>{String(row.name || row.connector_id || 'Conector')}</h2>
          <p>{humanizeKey(String(row.domain || '-'))} · {humanizeKey(String(row.plataforma || '-'))}</p>
        </div>
        <StatusBadge value={row.health || row.connection_status} />
      </header>
      <dl>
        <div>
          <dt>Ultimo sync</dt>
          <dd>{formatDate(row.last_sync_at)}</dd>
        </div>
        <div>
          <dt>Registros</dt>
          <dd>{formatNumber(Number(row.records_synced || 0))}</dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>{stringifyShort(row.connection_status)}</dd>
        </div>
        <div>
          <dt>Escopos</dt>
          <dd>{stringifyShort(row.scopes)}</dd>
        </div>
      </dl>
      {row.last_error ? <p className="connector-card__error">{String(row.last_error)}</p> : null}
    </article>
  )
}

export function ConnectorsView({ data }: { data: ConnectorsStructuredContent }) {
  const visual = getToolVisual('connectors')
  const rows = asRows(data.rows)
  const columns = getColumns(rows, data.columns)
  const summary = asRecord(data.summary)
  const result = asRecord(data.result)
  const title = data.title || 'Conectores'

  return (
    <ResultShell icon={visual.icon} tone={visual.tone} title={title} description={data.subtitle || undefined}>
      <section className="connectors-panel">
        <div className="connectors-summary" aria-label="Resumo dos conectores">
          <div>
            <span>Total</span>
            <strong>{String(summary.total ?? rows.length)}</strong>
          </div>
          <div>
            <span>Conectados</span>
            <strong>{String(summary.connected ?? '-')}</strong>
          </div>
          <div>
            <span>Atencao</span>
            <strong>{String(summary.warning ?? '-')}</strong>
          </div>
          <div>
            <span>Ultimo sync</span>
            <strong>{formatDate(summary.last_sync_at)}</strong>
          </div>
        </div>

        {Object.keys(result).length ? (
          <section className="connector-result">
            <h2>Resultado</h2>
            <dl>
              {Object.entries(result).slice(0, 8).map(([key, value]) => (
                <div key={key}>
                  <dt>{humanizeKey(key)}</dt>
                  <dd>{stringifyShort(value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        {rows.length ? (
          <>
            <div className="connectors-grid">
              {rows.map((row) => (
                <ConnectorCard key={String(row.connector_id || row.name)} row={row} />
              ))}
            </div>
            {columns.length ? <DataTable rows={rows} columns={columns} /> : null}
          </>
        ) : (
          <EmptyState title="Nenhum conector encontrado" description="Quando houver integracoes, elas aparecem aqui com status e ultimo sync." />
        )}
      </section>
    </ResultShell>
  )
}
