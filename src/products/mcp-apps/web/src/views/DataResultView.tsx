import { DataTable } from '@/products/mcp-apps/web/src/components/DataTable'
import { EmptyState } from '@/products/mcp-apps/web/src/components/EmptyState'
import { MetricSummary } from '@/products/mcp-apps/web/src/components/MetricSummary'
import { ResultShell } from '@/products/mcp-apps/web/src/components/ResultShell'
import type { DataResultStructuredContent } from '@/products/mcp-apps/web/src/types/toolResult'
import { getToolLabel } from '@/products/mcp-apps/web/src/utils/format'
import { getColumns, getRows } from '@/products/mcp-apps/web/src/utils/table'

type DataResultViewProps = {
  data: DataResultStructuredContent
}

export function DataResultView({ data }: DataResultViewProps) {
  const rows = getRows(data)
  const columns = getColumns(data, rows)
  const description = [
    data.action ? `Acao: ${data.action}` : null,
    data.resource ? `Recurso: ${data.resource}` : null,
    typeof data.count === 'number' ? `${data.count} registros` : null,
  ].filter(Boolean).join(' · ')

  if (!rows.length) {
    return (
      <ResultShell
        eyebrow={getToolLabel(data.tool)}
        title={data.title || 'Resultado'}
        description={description || 'A tool retornou uma resposta estruturada.'}
      >
        <EmptyState title="Sem linhas" description="A tool retornou uma tabela vazia." />
      </ResultShell>
    )
  }

  return (
    <ResultShell
      eyebrow={getToolLabel(data.tool)}
      title={data.title || 'Resultado'}
      description={description || 'Resultado estruturado da tool.'}
    >
      <MetricSummary rows={rows} columns={columns} count={data.count} />
      <DataTable rows={rows} columns={columns} />
    </ResultShell>
  )
}
