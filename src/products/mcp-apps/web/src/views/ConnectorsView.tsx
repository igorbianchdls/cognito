import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { ResultShell } from '@/products/mcp-apps/web/src/components/ResultShell'
import type { ConnectorsStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
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

function stringifyShort(value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (Array.isArray(value)) return value.length ? value.join(', ') : '-'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getConnectorName(row: DataRow) {
  return String(row.name || row.connector_name || row.connector_id || 'Conector')
}

function asNumber(value: unknown) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function getConnectorMeta(row: DataRow) {
  const accountCount = asNumber(row.accounts_count ?? row.account_count ?? row.contas ?? row.connected_accounts)

  if (accountCount !== null && accountCount > 0) {
    return `${accountCount} conta${accountCount === 1 ? '' : 's'}`
  }

  const parts = [
    row.domain ? humanizeKey(String(row.domain)) : null,
    row.plataforma ? humanizeKey(String(row.plataforma)) : null,
  ].filter(Boolean)

  return parts.length ? parts.join(' · ') : 'Conta conectada'
}

function getStatusValue(row: DataRow) {
  return String(row.health || row.connection_status || row.status || '').trim().toLowerCase()
}

function getStatusTone(row: DataRow) {
  if (row.last_error) return 'danger'
  const status = getStatusValue(row)
  if (['synced', 'sync', 'connected', 'active', 'ok', 'healthy', 'success'].includes(status)) return 'success'
  if (['pending', 'processing', 'syncing', 'warning', 'attention'].includes(status)) return 'warning'
  if (['error', 'failed', 'failure', 'disconnected', 'inactive', 'unhealthy'].includes(status)) return 'danger'
  return 'neutral'
}

function getStatusLabel(row: DataRow) {
  if (row.last_error) return 'Atencao'
  const tone = getStatusTone(row)
  if (tone === 'success') return 'Sincronizado'
  if (tone === 'warning') return 'Pendente'
  if (tone === 'danger') return 'Falha'
  return stringifyShort(row.connection_status || row.health || row.status || 'Indefinido')
}

function ConnectorRow({ row }: { row: DataRow }) {
  const tone = getStatusTone(row)
  const lastSync = row.last_sync_at ? `Ultimo sync ${formatDate(row.last_sync_at)}` : null

  return (
    <article className="connector-row">
      <div className="connector-row__identity">
        <span className="connector-row__mark" aria-hidden="true">
          {getConnectorName(row).slice(0, 1).toUpperCase()}
        </span>
        <div className="connector-row__copy">
          <h2>{getConnectorName(row)}</h2>
          <p>{lastSync || getConnectorMeta(row)}</p>
          {row.last_error ? <p className="connector-row__error">{String(row.last_error)}</p> : null}
        </div>
      </div>
      <div className={`connector-row__status connector-row__status--${tone}`}>
        <span>{getStatusLabel(row)}</span>
        <i aria-hidden="true" />
      </div>
    </article>
  )
}

export function ConnectorsView({ data }: { data: ConnectorsStructuredContent }) {
  const visual = getToolVisual('connectors')
  const rows = asRows(data.rows)
  const summary = asRecord(data.summary)
  const result = asRecord(data.result)
  const title = data.title || 'Conectores'
  const connected = summary.connected ?? rows.filter((row) => getStatusTone(row) === 'success').length
  const attention = summary.warning ?? rows.filter((row) => getStatusTone(row) !== 'success').length

  return (
    <ResultShell icon={visual.icon} tone={visual.tone} title={title} description={data.subtitle || undefined}>
      <section className="connectors-panel">
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

        <section className="connectors-directory" aria-label="Lista de conectores">
          <div className="connectors-directory__topline">
            <span>{String(summary.total ?? rows.length)} conectores</span>
            <span>{String(connected)} sincronizados</span>
            <span>{String(attention)} em atencao</span>
          </div>
          <div className="connectors-directory__header">
            <span>Conector</span>
            <span>Status</span>
          </div>
          {rows.length ? (
            <div className="connectors-directory__rows">
              {rows.map((row) => (
                <ConnectorRow key={String(row.connector_id || row.name)} row={row} />
              ))}
            </div>
          ) : (
            <EmptyState title="Nenhum conector encontrado" description="Quando houver integracoes, elas aparecem aqui com status e ultimo sync." />
          )}
          <div className="connectors-directory__footer">
            <p>Sincronizacoes grandes podem levar alguns minutos.</p>
            <button type="button">Adicionar conector</button>
          </div>
        </section>
      </section>
    </ResultShell>
  )
}
