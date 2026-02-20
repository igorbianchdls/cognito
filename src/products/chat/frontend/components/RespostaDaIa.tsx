"use client"

import type { ToolUIPart, UIMessage } from 'ai'
import { Message } from '@/components/ai-elements/message'
import { Reasoning, ReasoningContent, ReasoningTrigger } from '@/components/ai-elements/reasoning'
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import EntityDisplay from '@/products/erp/frontend/components/EntityDisplay'

type Props = { message: UIMessage; isPending?: boolean }
type CrudRow = Record<string, unknown>
type EntityKind = 'cliente' | 'fornecedor'

function pretty(value: unknown): string {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function parseMaybeJson(value: unknown): unknown {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  if (!trimmed) return value
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value
  try {
    return JSON.parse(trimmed)
  } catch {
    return value
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function isCrudToolPart(part: any): boolean {
  const type = String(part?.type || '').toLowerCase()
  const toolName = String(part?.tool_name || '').toLowerCase()
  return type.includes('crud') || toolName.includes('crud')
}

function asCrudRows(value: unknown): CrudRow[] | null {
  if (!Array.isArray(value)) return null
  if (value.length === 0) return []
  return value.every((item) => isRecord(item)) ? (value as CrudRow[]) : null
}

function extractCrudRows(outputRaw: unknown): CrudRow[] | null {
  const output = parseMaybeJson(outputRaw)
  const direct = asCrudRows(output)
  if (direct) return direct
  if (!isRecord(output)) return null

  const candidates: unknown[] = [
    output.rows,
    output.items,
    output.data,
    output.result,
  ]

  if (isRecord(output.data)) {
    candidates.push(output.data.rows, output.data.items)
  }
  if (isRecord(output.result)) {
    candidates.push(output.result.rows, output.result.items, output.result.data)
  }

  for (const candidate of candidates) {
    const rows = asCrudRows(candidate)
    if (rows) return rows
  }

  return null
}

function extractCrudMeta(outputRaw: unknown): { title?: string; message?: string; count?: number } {
  const output = parseMaybeJson(outputRaw)
  const containers: Array<Record<string, unknown>> = []
  if (isRecord(output)) containers.push(output)
  if (isRecord(output) && isRecord(output.result)) containers.push(output.result)
  if (isRecord(output) && isRecord(output.data)) containers.push(output.data)

  for (const c of containers) {
    const title = typeof c.title === 'string' && c.title.trim() ? c.title.trim() : undefined
    const message = typeof c.message === 'string' && c.message.trim() ? c.message.trim() : undefined
    const countNum = Number(c.count)
    const count = Number.isFinite(countNum) ? countNum : undefined
    if (title || message || count !== undefined) return { title, message, count }
  }
  return {}
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[-\s]+/g, '_')
}

function isImageColumnKey(normalizedKey: string): boolean {
  return (
    normalizedKey.includes('imagem') ||
    normalizedKey.includes('image') ||
    normalizedKey.includes('avatar') ||
    normalizedKey.includes('foto') ||
    normalizedKey.includes('icone') ||
    normalizedKey.includes('icon')
  )
}

function getEntityKindFromColumn(column: string): EntityKind | null {
  const normalized = normalizeKey(column)
  if (normalized.includes('cliente')) return 'cliente'
  if (normalized.includes('fornecedor')) return 'fornecedor'
  return null
}

function pickEntityColumn(columns: string[]): string | null {
  let best: { key: string; score: number } | null = null

  for (const column of columns) {
    const normalized = normalizeKey(column)
    const kind = getEntityKindFromColumn(column)
    if (!kind) continue
    if (isImageColumnKey(normalized)) continue

    let score = 10
    if (normalized === kind) score = 0
    else if (normalized === `${kind}_nome` || normalized === `nome_${kind}`) score = 1
    else if (normalized.endsWith('_id')) score = 30
    else if (normalized.startsWith(`${kind}_`) || normalized.endsWith(`_${kind}`)) score = 4

    if (!best || score < best.score) best = { key: column, score }
  }

  return best?.key ?? null
}

function humanizeKey(key: string): string {
  const raw = key.replace(/[_-]+/g, ' ').trim()
  if (!raw) return key
  return raw.replace(/\b\w/g, (c) => c.toUpperCase())
}

function compactValue(value: unknown): string {
  if (value == null || value === '') return '—'
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'bigint') return String(value)
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não'
  if (Array.isArray(value)) return value.length ? `${value.length} itens` : '0 itens'
  if (isRecord(value)) {
    const firstLabel =
      (typeof value.nome === 'string' && value.nome) ||
      (typeof value.name === 'string' && value.name) ||
      (typeof value.titulo === 'string' && value.titulo) ||
      (typeof value.title === 'string' && value.title)
    if (firstLabel) return firstLabel
    return '[objeto]'
  }
  return String(value)
}

function pickEntityCellData(row: CrudRow, entityColumn: string): { name: string; imageUrl?: string } {
  const entityKind = getEntityKindFromColumn(entityColumn)
  const entityValue = row[entityColumn]

  const values: unknown[] = []
  values.push(entityValue)

  if (entityKind) {
    values.push(row[entityKind])
    values.push(row[`${entityKind}_nome`])
    values.push(row[`nome_${entityKind}`])
    values.push(row[`${entityKind}_fantasia`])
    values.push(row[`${entityKind}_razao_social`])
  }

  let name = ''
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      name = value.trim()
      break
    }
    if (typeof value === 'number' || typeof value === 'bigint') {
      name = String(value)
      break
    }
    if (isRecord(value)) {
      const nestedName =
        (typeof value.nome === 'string' && value.nome.trim() && value.nome.trim()) ||
        (typeof value.name === 'string' && value.name.trim() && value.name.trim()) ||
        (typeof value.titulo === 'string' && value.titulo.trim() && value.titulo.trim()) ||
        (typeof value.title === 'string' && value.title.trim() && value.title.trim())
      if (nestedName) {
        name = nestedName
        break
      }
    }
  }
  if (!name) name = 'Sem nome'

  const imageCandidates: unknown[] = []
  if (isRecord(entityValue)) {
    imageCandidates.push(
      entityValue.imagem_url,
      entityValue.image_url,
      entityValue.avatar_url,
      entityValue.foto_url,
      entityValue.icon_url,
      entityValue.icone_url,
    )
  }
  imageCandidates.push(
    row[`${entityColumn}_imagem_url`],
    row[`${entityColumn}_image_url`],
    row[`${entityColumn}_avatar_url`],
    row[`${entityColumn}_foto_url`],
  )
  if (entityKind) {
    imageCandidates.push(
      row[`${entityKind}_imagem_url`],
      row[`${entityKind}_image_url`],
      row[`${entityKind}_avatar_url`],
      row[`imagem_${entityKind}_url`],
      row[`image_${entityKind}_url`],
    )
  }
  imageCandidates.push(row.imagem_url, row.image_url, row.avatar_url, row.foto_url, row.icon_url, row.icone_url)

  let imageUrl: string | undefined
  for (const value of imageCandidates) {
    if (typeof value === 'string' && value.trim()) {
      imageUrl = value.trim()
      break
    }
  }

  return { name, imageUrl }
}

function CrudEntityCell({ name, imageUrl }: { name: string; imageUrl?: string }) {
  return (
    <div className="max-w-[280px] overflow-hidden whitespace-nowrap">
      <EntityDisplay name={name} imageUrl={imageUrl} size={24} />
    </div>
  )
}

function CrudOutputTable({ rows, title, message, count }: { rows: CrudRow[]; title?: string; message?: string; count?: number }) {
  const allColumns = rows.reduce<string[]>((acc, row) => {
    for (const key of Object.keys(row)) {
      if (!acc.includes(key)) acc.push(key)
    }
    return acc
  }, [])

  const entityColumn = pickEntityColumn(allColumns)
  const entityKind = entityColumn ? getEntityKindFromColumn(entityColumn) : null
  const filteredColumns = allColumns.filter((column) => {
    if (!entityKind) return true
    const normalized = normalizeKey(column)
    if (column === entityColumn) return true
    if (!isImageColumnKey(normalized)) return true
    return !normalized.includes(entityKind)
  })
  const columns = entityColumn
    ? [entityColumn, ...filteredColumns.filter((column) => column !== entityColumn)]
    : filteredColumns

  return (
    <div className="space-y-2">
      {(title || message || count !== undefined) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-600">
          {title ? <span className="font-semibold text-gray-800">{title}</span> : null}
          {count !== undefined ? <span>{count} registros</span> : null}
          {message ? <span>{message}</span> : null}
        </div>
      )}
      <div className="rounded-md border border-gray-200 overflow-hidden bg-white">
        <Table>
          {columns.length > 0 ? (
            <TableHeader>
              <TableRow className="hover:bg-[rgb(252,252,252)]" style={{ backgroundColor: 'rgb(252, 252, 252)' }}>
                {columns.map((column) => (
                  <TableHead
                    key={column}
                    className="h-9 text-[11px] font-semibold text-gray-600 whitespace-nowrap overflow-hidden text-ellipsis"
                    style={{ padding: '6px 10px' }}
                  >
                    {humanizeKey(column)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
          ) : null}
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={Math.max(columns.length, 1)} className="py-6 text-center text-xs text-gray-500">
                  Nenhum registro retornado.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, rowIndex) => (
                <TableRow key={`crud-row-${rowIndex}`}>
                  {columns.map((column) => {
                    if (entityColumn && column === entityColumn) {
                      const entity = pickEntityCellData(row, entityColumn)
                      return (
                        <TableCell
                          key={`${rowIndex}-${column}`}
                          className="align-middle whitespace-nowrap overflow-hidden text-ellipsis"
                          style={{ padding: '8px 10px' }}
                        >
                          <CrudEntityCell name={entity.name} imageUrl={entity.imageUrl} />
                        </TableCell>
                      )
                    }
                    return (
                      <TableCell
                        key={`${rowIndex}-${column}`}
                        className="text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis"
                        style={{ padding: '8px 10px' }}
                      >
                        <span className="block max-w-[220px] truncate text-[13px]">{compactValue(row[column])}</span>
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export default function RespostaDaIa({ message, isPending = false }: Props) {
  const parts = Array.isArray(message.parts) ? message.parts : []
  const hasParts = parts.length > 0

  if (!hasParts && !isPending) return null

  return (
    <Message from="assistant" className="py-3">
      <div className="w-full min-w-0 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gradient-to-tr from-fuchsia-500 via-purple-500 to-blue-500 text-white text-[10px] leading-none shadow-sm ml-0.5">OT</span>
          <span className="font-semibold text-gray-900 text-[16px]">Otto</span>
        </div>

        {!hasParts && isPending && (
          <div className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-50 px-3 py-2">
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse [animation-delay:300ms]" />
          </div>
        )}

        {parts.map((part: any, index: number) => {
          if (part?.type === 'text') {
            return (
              <div key={`txt-${index}`} className="whitespace-pre-wrap text-sm leading-6 text-gray-900">
                {String(part?.text || '')}
              </div>
            )
          }

          if (part?.type === 'reasoning') {
            const txt = String(part?.content ?? part?.text ?? '').trim()
            if (!txt) return null
            return (
              <Reasoning key={`rs-${index}`} isStreaming={String(part?.state || '') === 'streaming'}>
                <ReasoningTrigger />
                <ReasoningContent>{txt}</ReasoningContent>
              </Reasoning>
            )
          }

          if (typeof part?.type === 'string' && part.type.startsWith('tool-')) {
            const crudPart = isCrudToolPart(part)
            const crudRows = crudPart ? extractCrudRows(part?.output) : null
            const crudMeta = crudPart ? extractCrudMeta(part?.output) : {}
            const rawState = String(part?.state || 'output-available')
            const toolState: ToolUIPart['state'] = (
              rawState === 'input-streaming' ||
              rawState === 'input-available' ||
              rawState === 'output-available' ||
              rawState === 'output-error'
            ) ? rawState : 'output-available'
            const showCrudTable = crudPart && crudRows !== null
            const shouldOpen = toolState === 'output-available' || toolState === 'output-error'
            const type = String(part.type) as ToolUIPart['type']

            return (
              <div key={`tool-${index}`} className="space-y-2">
                <Tool defaultOpen={shouldOpen}>
                  <ToolHeader type={type} state={toolState} />
                  <ToolContent>
                    {part?.input !== undefined ? (
                      <ToolInput input={part.input as ToolUIPart['input']} />
                    ) : null}
                    {part?.errorText ? (
                      <ToolOutput output={null} errorText={String(part.errorText)} />
                    ) : (
                      part?.output !== undefined && !showCrudTable ? (
                        <ToolOutput
                          output={<pre className="text-xs whitespace-pre-wrap">{pretty(part.output)}</pre>}
                          errorText={undefined}
                        />
                      ) : null
                    )}
                  </ToolContent>
                </Tool>

                {showCrudTable ? (
                  <CrudOutputTable
                    rows={crudRows}
                    title={crudMeta.title}
                    message={crudMeta.message}
                    count={crudMeta.count}
                  />
                ) : null}
              </div>
            )
          }

          return null
        })}
      </div>
    </Message>
  )
}
