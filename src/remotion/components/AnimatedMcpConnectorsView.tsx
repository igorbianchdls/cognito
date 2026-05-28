import { interpolate, useCurrentFrame } from 'remotion'

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
import type { ConnectorsStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { formatDate, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'
import type { DataRow } from '@/products/mcp-apps/web/src/utils/table'

function progress(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
}

function fadeSlide(frame: number, start: number, fromY = 14) {
  const opacity = progress(frame, start, start + 18)
  const y = interpolate(frame, [start, start + 22], [fromY, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return {
    opacity,
    transform: `translateY(${y}px)`,
  }
}

function asRows(value: unknown): DataRow[] {
  return Array.isArray(value)
    ? value.filter((item): item is DataRow => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : []
}

function normalizeConnectorKey(value: unknown) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
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
  return String(row.connection_status || row.health || row.status || 'Indefinido')
}

function ConnectorLogo({ row }: { row: DataRow }) {
  const platform = normalizeConnectorKey(row.plataforma || row.provider || row.platform)
  const domain = normalizeConnectorKey(row.domain)
  const name = normalizeConnectorKey(getConnectorName(row))
  const key = [platform, domain, name].join(' ')
  const props = { className: 'connector-row__logo' }

  if (key.includes('shopify')) return <ShopifyIcon {...props} />
  if (key.includes('shopee')) return <ShopeeIcon {...props} />
  if (key.includes('amazon')) return <AmazonIcon {...props} />
  if (key.includes('mercadolivre') || key.includes('mercado_livre')) return <MercadoLivreIcon {...props} />
  if (key.includes('google_ads') || key.includes('googleads')) return <GoogleAdsIcon {...props} />
  if (key.includes('meta_ads') || key.includes('metaads') || key.includes('facebook')) return <MetaIcon {...props} />
  if (key.includes('hubspot')) return <HubspotIcon {...props} />
  if (key.includes('totvs')) return <TotvsIcon {...props} />
  if (key.includes('omie')) return <OmieIcon {...props} />
  if (key.includes('tiny')) return <TinyIcon {...props} />
  if (key.includes('bling')) return <BlingIcon {...props} />
  if (key.includes('conta_azul') || key.includes('contaazul')) return <ContaAzulIcon {...props} />

  return (
    <span style={{ color: '#225f42', fontSize: 24, fontWeight: 820, letterSpacing: 0 }}>
      {getConnectorName(row).slice(0, 1).toUpperCase()}
    </span>
  )
}

function StatusDot({ tone }: { tone: string }) {
  const color = tone === 'success' ? '#20b15a' : tone === 'warning' ? '#d99a22' : tone === 'danger' ? '#d94a3a' : '#9aa39d'

  return <i aria-hidden="true" style={{ background: color, borderRadius: 999, flex: '0 0 12px', height: 12, width: 12 }} />
}

function ConnectorRow({ row, index, localFrame }: { row: DataRow; index: number; localFrame: number }) {
  const tone = getStatusTone(row)
  const lastSync = row.last_sync_at ? `Ultimo sync ${formatDate(row.last_sync_at)}` : null
  const rowStyle = fadeSlide(localFrame, 34 + index * 9, 16)

  return (
    <article
      style={{
        ...rowStyle,
        alignItems: 'center',
        borderTop: index > 0 ? '1px solid #edf0ed' : undefined,
        display: 'grid',
        gap: 20,
        gridTemplateColumns: 'minmax(0, 1fr) 178px',
        padding: '18px 0',
      }}
    >
      <div style={{ alignItems: 'center', display: 'flex', gap: 16, minWidth: 0 }}>
        <span
          aria-hidden="true"
          style={{
            alignItems: 'center',
            background: '#f7faf8',
            borderRadius: 10,
            color: '#225f42',
            display: 'inline-flex',
            flex: '0 0 42px',
            height: 42,
            justifyContent: 'center',
            overflow: 'hidden',
            width: 42,
          }}
        >
          <ConnectorLogo row={row} />
        </span>
        <div style={{ display: 'grid', gap: 4, minWidth: 0 }}>
          <h2
            style={{
              color: '#2a312d',
              fontSize: 25,
              fontWeight: 760,
              letterSpacing: -0.5,
              lineHeight: 1.25,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {getConnectorName(row)}
          </h2>
          <p
            style={{
              color: row.last_error ? '#9b2b23' : '#4f5a53',
              fontSize: 18,
              fontWeight: 400,
              letterSpacing: -0.35,
              lineHeight: 1.35,
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.last_error ? String(row.last_error) : lastSync || getConnectorMeta(row)}
          </p>
        </div>
      </div>
      <div
        style={{
          alignItems: 'center',
          color: '#38413c',
          display: 'inline-flex',
          fontSize: 20,
          fontWeight: 640,
          gap: 10,
          justifyContent: 'flex-end',
          minWidth: 0,
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getStatusLabel(row)}</span>
        <StatusDot tone={tone} />
      </div>
    </article>
  )
}

export function AnimatedMcpConnectorsView({ data, startFrame = 0 }: { data: ConnectorsStructuredContent; startFrame?: number }) {
  const frame = useCurrentFrame()
  const localFrame = Math.max(0, frame - startFrame)
  const rows = asRows(data.rows).slice(0, 5)
  const titleStyle = fadeSlide(localFrame, 0)
  const subtitleStyle = fadeSlide(localFrame, 10)
  const title = data.title || 'Conectores'
  const subtitle = data.subtitle || `${rows.length} conectores sincronizados`

  return (
    <section style={{ background: '#ffffff', display: 'grid', gap: 0, overflow: 'hidden' }}>
      <header className="chart-card__header" style={{ marginBottom: 0, paddingBottom: 4 }}>
        <div className="chart-card__copy" style={{ gap: 1 }}>
          <h1 style={{ ...titleStyle, fontSize: 32, letterSpacing: 0, lineHeight: 1.12 }}>{title}</h1>
          {subtitle ? (
            <p style={{ ...subtitleStyle, fontSize: 18, letterSpacing: 0, lineHeight: 1.25 }}>{subtitle}</p>
          ) : null}
        </div>
      </header>

      <section
        aria-label="Lista de conectores"
        style={{
          background: '#ffffff',
          borderRadius: 8,
          display: 'grid',
          marginTop: 8,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'grid' }}>
          {rows.map((row, index) => (
            <ConnectorRow index={index} key={String(row.connector_id || row.name || index)} localFrame={localFrame} row={row} />
          ))}
        </div>
      </section>
    </section>
  )
}
