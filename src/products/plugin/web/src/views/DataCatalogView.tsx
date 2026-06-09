import { useMemo, useState } from 'react'
import { CheckCircle2, CircleAlert, Database, LayoutList } from 'lucide-react'
import { DataTable } from '@/products/plugin/web/src/components/DataTable'
import { ResultShell } from '@/products/plugin/web/src/components/ResultShell'
import type { DataCatalogStructuredContent } from '@/products/plugin/web/src/types/toolResult'
import type { DataRow } from '@/products/plugin/web/src/utils/table'
import { formatCurrency, formatNumber, getToolVisual, humanizeKey } from '@/products/plugin/web/src/utils/format'

type DataCatalogViewProps = {
  data: DataCatalogStructuredContent
}

type CatalogTab = 'fontes' | 'recursos' | 'qualidade' | 'campos' | 'relacionamentos' | 'cobertura'

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return value as Record<string, unknown>
}

function asRows(value: unknown): DataRow[] {
  return Array.isArray(value)
    ? value.filter((item): item is DataRow => Boolean(item && typeof item === 'object' && !Array.isArray(item)))
    : []
}

function getColumns(rows: DataRow[]) {
  if (!rows.length) return []
  return Object.keys(rows[0] || {})
}

function toNumber(value: unknown) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

function formatCompactValue(key: string, value: unknown) {
  if (typeof value === 'number') {
    return key.includes('value') || key.includes('valor') ? formatCurrency(value) : formatNumber(value)
  }
  if (value === null || value === undefined || value === '') return '-'
  return String(value)
}

function statusClass(status: unknown) {
  const value = String(status || '').toLowerCase()
  if (value === 'connected' || value === 'ok') return 'catalog-status catalog-status--success'
  if (value === 'empty') return 'catalog-status catalog-status--warning'
  return 'catalog-status catalog-status--neutral'
}

function getDefaultTab(data: DataCatalogStructuredContent): CatalogTab {
  if (data.action === 'fontes') return 'fontes'
  if (data.action === 'recursos') return 'recursos'
  if (data.action === 'campos') return 'campos'
  if (data.action === 'relacionamentos') return 'relacionamentos'
  if (data.action === 'cobertura') return 'cobertura'
  return 'qualidade'
}

function buildTabs(data: DataCatalogStructuredContent): CatalogTab[] {
  const tabs: CatalogTab[] = []
  if (asRows(data.sources).length) tabs.push('fontes')
  if (asRows(data.resources).length) tabs.push('recursos')
  if (asRecord(data.quality).score !== undefined || asRows(data.rows).length) tabs.push('qualidade')
  if (asRows(data.fields).length) tabs.push('campos')
  if (asRows(data.relationships).length) tabs.push('relacionamentos')
  if (asRows(data.coverage).length) tabs.push('cobertura')
  return tabs.length ? tabs : [getDefaultTab(data)]
}

function getTabRows(tab: CatalogTab, data: DataCatalogStructuredContent) {
  if (tab === 'fontes') return asRows(data.sources)
  if (tab === 'recursos') return asRows(data.resources)
  if (tab === 'campos') return asRows(data.fields)
  if (tab === 'relacionamentos') return asRows(data.relationships)
  if (tab === 'cobertura') return asRows(data.coverage)
  return asRows(data.rows)
}

export function DataCatalogView({ data }: DataCatalogViewProps) {
  const toolVisual = getToolVisual('data_catalog')
  const tabs = useMemo(() => buildTabs(data), [data])
  const defaultTab = getDefaultTab(data)
  const [activeTab, setActiveTab] = useState<CatalogTab>(tabs.includes(defaultTab) ? defaultTab : tabs[0])
  const sources = asRows(data.sources)
  const resources = asRows(data.resources)
  const quality = asRecord(data.quality)
  const activeRows = getTabRows(activeTab, data)
  const activeColumns = getColumns(activeRows)
  const totalRecords = resources.reduce((acc, resource) => acc + toNumber(resource.total_records), 0)
  const connectedSources = sources.filter((source) => source.status === 'connected').length
  const score = quality.score !== undefined ? toNumber(quality.score) : null

  return (
    <ResultShell
      icon={toolVisual.icon}
      tone={toolVisual.tone}
      title={data.title || 'Catalogo de Dados'}
      description={data.subtitle}
    >
      <section className="catalog-panel">
        <div className="catalog-kpis" aria-label="Resumo do catalogo">
          <div className="catalog-kpi">
            <span>Fontes</span>
            <strong>{sources.length ? `${connectedSources}/${sources.length}` : '-'}</strong>
          </div>
          <div className="catalog-kpi">
            <span>Recursos</span>
            <strong>{resources.length ? formatNumber(resources.length) : '-'}</strong>
          </div>
          <div className="catalog-kpi">
            <span>Registros</span>
            <strong>{totalRecords ? formatNumber(totalRecords) : '-'}</strong>
          </div>
          <div className="catalog-kpi">
            <span>Score</span>
            <strong>{score === null ? '-' : `${formatNumber(score)}/100`}</strong>
          </div>
        </div>

        {sources.length ? (
          <div className="catalog-source-strip" aria-label="Fontes conectadas">
            {sources.map((source) => (
              <div className="catalog-source" key={String(source.domain || source.label)}>
                <div>
                  <span className="catalog-source__label">{String(source.label || source.domain || '-')}</span>
                  <span className={statusClass(source.status)}>{String(source.status || '-')}</span>
                </div>
                <strong>{formatCompactValue('total_records', source.total_records)}</strong>
              </div>
            ))}
          </div>
        ) : null}

        <div className="catalog-tabs" role="tablist" aria-label="Secoes do catalogo">
          {tabs.map((tab) => (
            <button
              aria-selected={activeTab === tab}
              className="catalog-tab"
              key={tab}
              role="tab"
              type="button"
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'qualidade' ? <CheckCircle2 size={15} strokeWidth={2.3} /> : tab === 'fontes' ? <Database size={15} strokeWidth={2.3} /> : <LayoutList size={15} strokeWidth={2.3} />}
              <span>{humanizeKey(tab)}</span>
            </button>
          ))}
        </div>

        {activeRows.length && activeColumns.length ? (
          <DataTable rows={activeRows} columns={activeColumns} />
        ) : (
          <div className="catalog-empty">Sem dados para esta secao.</div>
        )}

        <div className="catalog-notes">
          {(data.issues || []).length ? (
            <section>
              <h2>
                <CircleAlert size={16} strokeWidth={2.3} />
                Pontos de atencao
              </h2>
              <ul>
                {(data.issues || []).map((issue, index) => (
                  <li key={`${issue}-${index}`}>{issue}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {(data.recommendations || []).length ? (
            <section>
              <h2>
                <CheckCircle2 size={16} strokeWidth={2.3} />
                Recomendacoes
              </h2>
              <ul>
                {(data.recommendations || []).map((recommendation, index) => (
                  <li key={`${recommendation}-${index}`}>{recommendation}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </section>
    </ResultShell>
  )
}
