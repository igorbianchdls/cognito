import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const runtime = 'nodejs'
export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type JsonMap = Record<string, unknown>

type SqlExecutionAction = 'execute'

type ToolPayload = {
  sql?: unknown
  title?: unknown
}

function toObj(input: unknown): JsonMap {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {}
  return input as JsonMap
}

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function normalizeAndAssertSafeSelectQuery(sql: string): string {
  const cleaned = sql.trim().replace(/;+\s*$/g, '')
  if (!cleaned) throw new Error('sql vazio')
  if (cleaned.includes(';')) throw new Error('apenas uma query é permitida')
  if (/\$\d+/.test(cleaned)) {
    throw new Error('placeholders posicionais ($1, $2, ...) não são permitidos; use SQL literal ou {{tenant_id}}')
  }
  if (!/^\s*(select|with)\b/i.test(cleaned)) throw new Error('somente SELECT/CTE (WITH) é permitido')
  const blocked =
    /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|vacuum|call|do|copy|merge|execute|prepare|deallocate)\b/i
  if (blocked.test(cleaned)) throw new Error('sql contém comando não permitido')
  return cleaned
}

function bindTenantParam(sql: string, tenantId: number) {
  const params: unknown[] = []
  let tenantParamIndex = 0
  const compiled = sql.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, rawName: string) => {
    const name = String(rawName || '').trim().toLowerCase()
    if (name !== 'tenant_id') {
      throw new Error(`placeholder não suportado: {{${rawName}}}. Use apenas {{tenant_id}} nesta tool`)
    }
    if (tenantParamIndex > 0) return `$${tenantParamIndex}`
    params.push(tenantId)
    tenantParamIndex = params.length
    return `$${tenantParamIndex}`
  })
  return { sql: compiled, params }
}

function inferColumns(rows: Array<Record<string, unknown>>): string[] {
  if (!rows.length) return []
  const first = rows[0] || {}
  return Object.keys(first)
}

function unauthorized(req: NextRequest): boolean {
  const auth = req.headers.get('authorization') || ''
  const chatId = req.headers.get('x-chat-id') || ''
  const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return !verifyAgentToken(chatId, token)
}

function toolErrorJson(status: number, code: string, error: string, action: SqlExecutionAction = 'execute') {
  return Response.json(
    {
      ok: false,
      success: false,
      data: null,
      error,
      code,
      meta: { tool: 'sql_execution', action, status },
      result: { success: false, error, code },
    },
    { status },
  )
}

function toolSuccessJson(action: SqlExecutionAction, result: Record<string, unknown>) {
  return Response.json({
    ok: true,
    success: true,
    data: result,
    meta: { tool: 'sql_execution', action, status: 200 },
    result,
  })
}

export async function POST(req: NextRequest) {
  try {
    if (unauthorized(req)) {
      return toolErrorJson(401, 'unauthorized', 'Token inválido para sql_execution')
    }

    const payload = toObj(await req.json().catch(() => ({}))) as ToolPayload
    const sqlRaw = toText(payload.sql)
    const titleRaw = toText(payload.title)

    if (!sqlRaw) {
      return toolErrorJson(400, 'invalid_input', 'sql é obrigatório')
    }

    const safeSql = normalizeAndAssertSafeSelectQuery(sqlRaw)
    const tenantId = resolveTenantId(req.headers)
    const { sql: boundSql, params } = bindTenantParam(safeSql, tenantId)

    const maxRows = 1000
    const finalSql = `SELECT * FROM (${boundSql}) AS q LIMIT $${params.length + 1}::int`
    const finalParams = [...params, maxRows]

    const rows = await runQuery<Record<string, unknown>>(finalSql, finalParams)
    const columns = inferColumns(rows)

    return toolSuccessJson('execute', {
      success: true,
      title: titleRaw || 'Resultado da Consulta',
      rows,
      columns,
      count: rows.length,
      sql_query: finalSql,
      sql_params: finalParams,
      max_rows: maxRows,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro interno ao executar SQL'
    return toolErrorJson(400, 'sql_execution_error', message)
  }
}
