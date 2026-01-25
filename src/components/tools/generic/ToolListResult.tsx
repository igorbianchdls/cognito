'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import type { ColumnDef } from '@tanstack/react-table'
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
  // Accept shapes: { result }, { content: [{json}|{text}] }, array, or object already in expected shape
  let res: any = output
  try {
    if (res && typeof res === 'object' && 'result' in res) {
      res = (res as any).result
    } else if (res && typeof res === 'object' && 'content' in (res as any) && Array.isArray((res as any).content)) {
      const arr = (res as any).content as Array<any>
      const jsonPart = arr.find((c) => c && (c.json !== undefined))
      if (jsonPart && jsonPart.json !== undefined) res = jsonPart.json
      else {
        const textParts = arr.filter((c) => typeof c?.text === 'string').map((c) => String(c.text))
        for (const t of textParts) { const s = t.trim(); if (!s) continue; try { res = JSON.parse(s); break } catch {} }
      }
    }
  } catch {}
  return res
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
      // common shapes
      if (Array.isArray((base as any).rows)) rows = normalizeRows((base as any).rows)
      else if (Array.isArray((base as any).data)) rows = normalizeRows((base as any).data)
      else if (Array.isArray((base as any).items)) rows = normalizeRows((base as any).items)
      success = (base as any).success !== undefined ? Boolean((base as any).success) : true
      message = String((base as any).message ?? '')
      title = String((base as any).title ?? '')
      sql_query = typeof (base as any).sql_query === 'string' ? (base as any).sql_query : undefined
      error = (base as any).error as string | undefined
      if (typeof (base as any).count === 'number') count = (base as any).count
      else if (typeof (base as any).total === 'number') count = (base as any).total
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
          cell: ({ row }) => {
            const v = (row.original as AnyRow)[key]
            if (v === null || v === undefined) return ''
            if (typeof v === 'object') return (v as any) // already stringified in normalizeRows
            return String(v)
          }
        } as any)
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

