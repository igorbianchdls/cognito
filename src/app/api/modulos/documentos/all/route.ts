import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 50) || 50))
    const offset = (page - 1) * pageSize

    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    const push = (expr: string, value: unknown) => {
      conditions.push(`${expr} $${idx}`)
      params.push(value)
      idx += 1
    }

    if (de) push('d.data_emissao >=', de)
    if (ate) push('d.data_emissao <=', ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY d.data_emissao DESC NULLS LAST, d.id DESC'
    const limitOffset = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const listSql = `SELECT 
      d.id AS documento_id,
      td.nome AS tipo_documento,
      td.categoria AS origem,
      d.numero,
      d.descricao,
      d.data_emissao,
      d.valor_total,
      d.status
    FROM documentos.documento d
    LEFT JOIN documentos.tipos_documentos td ON td.id = d.tipo_documento_id
    ${whereClause}
    ${orderClause}
    ${limitOffset}`.trim()

    const totalSql = `SELECT COUNT(*)::int AS total
    FROM documentos.documento d
    LEFT JOIN documentos.tipos_documentos td ON td.id = d.tipo_documento_id
    ${whereClause}`

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)
    const totalRows = await runQuery<{ total: number }>(totalSql, params)
    const total = totalRows[0]?.total ?? 0

    return Response.json({ success: true, page, pageSize, total, rows, sql: listSql })
  } catch (error) {
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

