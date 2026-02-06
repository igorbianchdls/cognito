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

  const columns: ColumnDef<AnyRow>[] = useMemo(() => {
    const cols: ColumnDef<AnyRow>[] = []
    const sample = (Array.isArray(result.rows) && result.rows[0]) || null
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
  }, [result.rows])

  return (
    <ArtifactDataTable
      data={Array.isArray(result.rows) ? result.rows : []}
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
