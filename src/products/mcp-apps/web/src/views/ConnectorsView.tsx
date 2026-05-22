import AmazonIcon from '@/components/icons/AmazonIcon'
import BlingIcon from '@/components/icons/BlingIcon'
import ContaAzulIcon from '@/components/icons/ContaAzulIcon'
import GoogleAdsIcon from '@/components/icons/GoogleAdsIcon'
import HubspotIcon from '@/components/icons/HubspotIcon'
import MercadoLivreIcon from '@/components/icons/MercadoLivreIcon'
import MetaIcon from '@/components/icons/MetaIcon'
import OmieIcon from '@/components/icons/OmieIcon'
import ShopifyIcon from '@/components/icons/ShopifyIcon'
import ShopeeIcon from '@/components/icons/ShopeeIcon'
import TinyIcon from '@/components/icons/TinyIcon'
import TotvsIcon from '@/components/icons/TotvsIcon'
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

function normalizeConnectorKey(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
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

function ConnectorLogo({ row }: { row: DataRow }) {
  const platform = normalizeConnectorKey(row.plataforma || row.provider || row.platform)
  const domain = normalizeConnectorKey(row.domain)
  const name = normalizeConnectorKey(getConnectorName(row))
  const key = [platform, domain, name].join(' ')
  const className = 'connector-row__logo'

  if (key.includes('shopify')) return <ShopifyIcon className={className} />
  if (key.includes('shopee')) return <ShopeeIcon className={className} />
  if (key.includes('amazon')) return <AmazonIcon className={className} />
  if (key.includes('mercadolivre') || key.includes('mercado_livre')) return <MercadoLivreIcon className={className} />
  if (key.includes('google_ads') || key.includes('googleads')) return <GoogleAdsIcon className={className} />
  if (key.includes('meta_ads') || key.includes('metaads') || key.includes('facebook')) return <MetaIcon className={className} />
  if (key.includes('hubspot')) return <HubspotIcon className={className} />
  if (key.includes('totvs')) return <TotvsIcon className={className} />
  if (key.includes('omie')) return <OmieIcon className={className} />
  if (key.includes('tiny')) return <TinyIcon className={className} />
  if (key.includes('bling')) return <BlingIcon className={className} />
  if (key.includes('conta_azul') || key.includes('contaazul')) return <ContaAzulIcon className={className} />

  return <span className="connector-row__fallback">{getConnectorName(row).slice(0, 1).toUpperCase()}</span>
}

function ConnectorRow({ row }: { row: DataRow }) {
  const tone = getStatusTone(row)
  const lastSync = row.last_sync_at ? `Ultimo sync ${formatDate(row.last_sync_at)}` : null

  return (
    <article className="connector-row">
      <div className="connector-row__identity">
        <span className="connector-row__mark" aria-hidden="true">
          <ConnectorLogo row={row} />
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
  const result = asRecord(data.result)
  const title = data.title || 'Conectores'

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
            <button type="button">Adicionar conector</button>
          </div>
        </section>
      </section>
    </ResultShell>
  )
}
