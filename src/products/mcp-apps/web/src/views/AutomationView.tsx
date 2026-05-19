import { DataTable } from '@/products/mcp-apps/web/src/components/DataTable'
import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { ResultShell } from '@/products/mcp-apps/web/src/components/ResultShell'
import type { AutomationStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { getToolVisual, humanizeKey } from '@/products/mcp-apps/web/src/utils/format'
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

export function AutomationView({ data }: { data: AutomationStructuredContent }) {
  const visual = getToolVisual(data.tool)
  const rows = asRows(data.rows)
  const columns = getColumns(rows, data.columns)
  const preview = asRecord(data.preview)
  const result = asRecord(data.result)
  const title = data.title || humanizeKey(data.tool || 'Automacao')

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
