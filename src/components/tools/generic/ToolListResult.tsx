'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import type { ColumnDef, CellContext } from '@tanstack/react-table'
import { Table as TableIcon } from 'lucide-react'
import { useMemo } from 'react'

type AnyRow = Record<string, unknown>

type ParsedResult = {
  success: boolean
  title: string
  message: string
  count: number
  rows: AnyRow[]
  sql_query?: string
  error?: string
}

const HIDDEN_EMAIL_FIELDS = new Set(['organizationid', 'podid'])

function toTitleCasePath(path?: string): string {
  if (!path) return 'Lista'
  try {
    const parts = path.split('/').filter(Boolean)
    const titled = parts.map(p => p
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
    )
    return titled.join(' / ')
  } catch {
    return 'Lista'
  }
}

function normalizeResourcePath(input?: any): string {
  if (!input || typeof input !== 'object') return ''
  const raw = (input as any).resource || (input as any).path || (input as any).endpoint
  return String(raw || '').replace(/^\/+|\/+$/g, '').toLowerCase()
}

function normalizeFieldKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, '')
}

function pickField(row: AnyRow, candidates: string[]): unknown {
  if (!row || typeof row !== 'object') return undefined
  const wanted = new Set(candidates.map((c) => normalizeFieldKey(c)))
  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(normalizeFieldKey(key))) return value
  }
  return undefined
}

function toFlatText(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map((item) => toFlatText(item)).filter(Boolean).join(', ')
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const name = typeof obj.name === 'string' ? obj.name : ''
    const email = typeof obj.email === 'string' ? obj.email : (typeof obj.address === 'string' ? obj.address : '')
    if (name && email) return `${name} <${email}>`
    if (email) return email
    if (name) return name
    try { return JSON.stringify(obj) } catch { return String(obj) }
  }
  return String(value)
}

function toLabelsText(value: unknown): string {
  if (Array.isArray(value)) return value.map((v) => toFlatText(v)).filter(Boolean).join(', ')
  return toFlatText(value)
}

function normalizeRows(data: unknown): AnyRow[] {
  const rows: AnyRow[] = Array.isArray(data) ? (data as AnyRow[]) : []
  return rows.map((row) => {
    const out: AnyRow = {}
    for (const [k, v] of Object.entries(row)) {
      if (v && typeof v === 'object') {
        try { out[k] = JSON.stringify(v) } catch { out[k] = String(v) }
      } else {
        out[k] = v as any
      }
    }
    return out
  })
}

function unwrapMcpLike(output: any): any {
  // Accept shapes:
  // - { result }
  // - { content: [{ json } | { text } | ...] }
  // - [ { type:"text", text:"..." }, ... ] (raw content array)
  // - already an object with rows/data/items
  let res: any = output
  try {
    // 1) { result }
    if (res && typeof res === 'object' && 'result' in res) {
      res = (res as any).result
      return res
    }
    // 2) { content: [...] }
    if (res && typeof res === 'object' && 'content' in (res as any) && Array.isArray((res as any).content)) {
      const arr = (res as any).content as Array<any>
      // Prefer explicit JSON payload
      const jsonPart = arr.find((c) => c && (c.json !== undefined))
      if (jsonPart && jsonPart.json !== undefined) return jsonPart.json
      // Fallback: parse first parseable text
      const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text))
      for (const t of textParts) { const s = t.trim(); if (!s) continue; try { return JSON.parse(s) } catch {} }
      return res
    }
    // 3) Raw content array
    if (Array.isArray(res)) {
      // If it looks like MCP content parts, try to parse JSON text entries
      const looksLikeContent = res.every((c) => c && typeof c === 'object' && 'type' in c)
      if (looksLikeContent) {
        const jsonPart = (res as Array<any>).find((c) => c && (c.json !== undefined))
        if (jsonPart && jsonPart.json !== undefined) return jsonPart.json
        const textParts = (res as Array<any>).filter((c) => typeof c?.text === 'string').map((c) => String(c.text))
        for (const t of textParts) { const s = t.trim(); if (!s) continue; try { return JSON.parse(s) } catch {} }
      }
    }
  } catch {}
  return res
}

function rowsFromObject(obj: any): AnyRow[] {
  if (!obj || typeof obj !== 'object') return []

  const preferredKeys = [
    'rows',
    'items',
    'data',
    'messages',
    'inboxes',
    'files',
    'folders',
    'recentFiles',
    'workspaces',
    'results',
  ]

  for (const key of preferredKeys) {
    const v = (obj as any)[key]
    if (Array.isArray(v)) return normalizeRows(v)
  }

  const dataObj = (obj as any).data
  if (dataObj && typeof dataObj === 'object' && !Array.isArray(dataObj)) {
    for (const key of preferredKeys) {
      const v = (dataObj as any)[key]
      if (Array.isArray(v)) return normalizeRows(v)
    }
  }

  // Fallback: discover first useful array in nested objects.
  const queue: any[] = [obj]
  const visited = new Set<any>()
  let depth = 0
  while (queue.length > 0 && depth < 4) {
    const levelSize = queue.length
    for (let i = 0; i < levelSize; i += 1) {
      const current = queue.shift()
      if (!current || typeof current !== 'object' || visited.has(current)) continue
      visited.add(current)
      for (const value of Object.values(current)) {
        if (Array.isArray(value) && value.length > 0) return normalizeRows(value as AnyRow[])
        if (value && typeof value === 'object' && !Array.isArray(value)) queue.push(value)
      }
    }
    depth += 1
  }

  return []
}

function parseResult(output: any, input?: any): ParsedResult {
  // Unwrap and try to standardize
  const unwrapped = unwrapMcpLike(output)
  let base: any = unwrapped

  // Some backends return in { success, rows, count, message, title, sql_query }
  // Others: { data: [], total }, or plain array
  let rows: AnyRow[] = []
  let success = true
  let message = ''
  let title = ''
  let count: number | undefined
  let sql_query: string | undefined
  let error: string | undefined

  try {
    if (Array.isArray(base)) {
      rows = normalizeRows(base)
      count = rows.length
    } else if (base && typeof base === 'object') {
      // common shapes (including nested data.* and workspace-style responses)
      rows = rowsFromObject(base)
      success = (base as any).success !== undefined ? Boolean((base as any).success) : true
      message = String((base as any).message ?? '')
      title = String((base as any).title ?? '')
      sql_query = typeof (base as any).sql_query === 'string' ? (base as any).sql_query : undefined
      error = ((base as any).error ?? (base as any)?.data?.error) as string | undefined
      if (typeof (base as any).count === 'number') count = (base as any).count
      else if (typeof (base as any).total === 'number') count = (base as any).total
      else if (typeof (base as any)?.data?.count === 'number') count = (base as any).data.count
      else if (typeof (base as any)?.data?.total === 'number') count = (base as any).data.total
    }
  } catch {}

  // Derive title from input.resource/path if needed
  if (!title) {
    try {
      const inp = input && typeof input === 'object' ? input : {}
      const resource = (inp as any).resource || (inp as any).path || (inp as any).endpoint
      title = toTitleCasePath(String(resource || 'Lista'))
    } catch { title = 'Lista' }
  }

  // Defaults
  if (!message) message = `${rows.length} registros`
  if (count === undefined) count = rows.length

  return { success, title, message, count, rows, sql_query, error }
}

export default function ToolListResult({ output, input }: { output: any; input?: any }) {
  const result = useMemo(() => parseResult(output, input), [output, input])
  const resourcePath = useMemo(() => normalizeResourcePath(input), [input])
  const isEmailResource = resourcePath.startsWith('email/')
  const isEmailMessagesList = resourcePath === 'email/messages'
  const inboxIdFromInput = useMemo(() => {
    if (!input || typeof input !== 'object') return ''
    const inp = input as any
    const direct = typeof inp.inboxId === 'string' ? inp.inboxId : ''
    const fromParams = inp.params && typeof inp.params === 'object' && typeof inp.params.inboxId === 'string'
      ? inp.params.inboxId
      : ''
    return String(direct || fromParams || '').trim()
  }, [input])
  const visibleRows = useMemo(() => {
    const src = Array.isArray(result.rows) ? result.rows : []
    if (isEmailMessagesList) {
      return src.map((row) => {
        const messageIdValue = pickField(row, ['messageId', 'message_id', 'id'])
        const fromValue = pickField(row, ['from', 'sender', 'fromEmail', 'from_address', 'fromAddress'])
        const toValue = pickField(row, ['to', 'recipients', 'toEmail', 'to_address', 'toAddress'])
        const subjectValue = pickField(row, ['subject', 'title'])
        const labelsValue = pickField(row, ['labels', 'tags', 'categories'])
        const inboxIdValue = pickField(row, ['inboxId', 'inbox_id'])
        return {
          messageId: toFlatText(messageIdValue),
          from: toFlatText(fromValue),
          to: toFlatText(toValue),
          subject: toFlatText(subjectValue),
          labels: toLabelsText(labelsValue),
          inboxId: toFlatText(inboxIdValue) || inboxIdFromInput,
        } as AnyRow
      })
    }
    if (!isEmailResource) return src
    return src.map((row) => {
      const out: AnyRow = {}
      for (const [key, value] of Object.entries(row)) {
        if (HIDDEN_EMAIL_FIELDS.has(normalizeFieldKey(key))) continue
        out[key] = value
      }
      return out
    })
  }, [inboxIdFromInput, isEmailMessagesList, isEmailResource, result.rows])

  const columns: ColumnDef<AnyRow>[] = useMemo(() => {
    if (isEmailMessagesList) {
      return [
        { accessorKey: 'messageId', header: 'messageId' },
        { accessorKey: 'from', header: 'from' },
        { accessorKey: 'to', header: 'to' },
        { accessorKey: 'subject', header: 'subject' },
        { accessorKey: 'labels', header: 'labels' },
        { accessorKey: 'inboxId', header: 'inboxId' },
      ] as ColumnDef<AnyRow>[]
    }
    const cols: ColumnDef<AnyRow>[] = []
    const sample = (Array.isArray(visibleRows) && visibleRows[0]) || null
    if (sample) {
      for (const key of Object.keys(sample)) {
        cols.push({
          accessorKey: key,
          header: key,
          cell: (ctx: CellContext<AnyRow, unknown>) => {
            const v = (ctx.row.original as AnyRow)[key]
            if (v === null || v === undefined) return ''
            if (typeof v === 'object') {
              try { return JSON.stringify(v) } catch { return String(v) }
            }
            return String(v)
          }
        } as ColumnDef<AnyRow>)
      }
    }
    return cols
  }, [isEmailMessagesList, visibleRows])

  return (
    <ArtifactDataTable
      data={visibleRows}
      columns={columns}
      title={result.title}
      icon={TableIcon}
      iconColor="text-slate-700"
      message={result.message}
      success={!!result.success}
      count={typeof result.count === 'number' ? result.count : (result.rows?.length ?? 0)}
      exportFileName="listar_result"
      sqlQuery={result.sql_query}
      error={result.error}
    />
  )
}
