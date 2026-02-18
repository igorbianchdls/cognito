import { NextRequest } from 'next/server'
import { verifyAgentToken } from '@/app/api/chat/tokenStore'
import { runQuery } from '@/lib/postgres'

export const runtime = 'nodejs'

function toText(value: unknown): string {
  return String(value ?? '').trim()
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function parseLimit(value: unknown, fallback = 20): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  const k = Math.trunc(n)
  if (k <= 0) return fallback
  return Math.min(k, 500)
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => ({})) as Record<string, unknown>
    const auth = req.headers.get('authorization') || ''
    const chatId = req.headers.get('x-chat-id') || ''
    const token = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
    if (!verifyAgentToken(chatId, token)) {
      return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    }

    const hdrTenant = Number.parseInt((req.headers.get('x-tenant-id') || '').trim(), 10)
    const envTenant = Number.parseInt((process.env.DEFAULT_TENANT_ID || '').trim(), 10)
    const tenantId = Number.isFinite(hdrTenant) && hdrTenant > 0 ? hdrTenant : (Number.isFinite(envTenant) && envTenant > 0 ? envTenant : 1)

    const limit = parseLimit(payload.limit, 20)
    const status = toText(payload.status).toLowerCase()
    const clienteId = toNumber(payload.cliente_id)

    const params: unknown[] = [tenantId]
    const where: string[] = ['cr.tenant_id = $1']

    if (clienteId != null) {
      params.push(clienteId)
      where.push(`cr.cliente_id = $${params.length}`)
    }

    if (status) {
      if (status === 'vencido' || status === 'atrasado') {
        where.push(`LOWER(COALESCE(cr.status,'')) IN ('pendente','vencido')`)
        where.push(`cr.data_vencimento < CURRENT_DATE`)
      } else if (status === 'pago') {
        where.push(`LOWER(COALESCE(cr.status,'')) IN ('recebido','pago')`)
      } else {
        params.push(status)
        where.push(`LOWER(COALESCE(cr.status,'')) = $${params.length}`)
      }
    }

    const dataVencDe = toText(payload.data_vencimento_de)
    if (dataVencDe) {
      params.push(dataVencDe)
      where.push(`cr.data_vencimento >= $${params.length}::date`)
    }
    const dataVencAte = toText(payload.data_vencimento_ate)
    if (dataVencAte) {
      params.push(dataVencAte)
      where.push(`cr.data_vencimento <= $${params.length}::date`)
    }

    const dataEmissaoDe = toText(payload.data_emissao_de)
    if (dataEmissaoDe) {
      params.push(dataEmissaoDe)
      where.push(`cr.data_lancamento >= $${params.length}::date`)
    }
    const dataEmissaoAte = toText(payload.data_emissao_ate)
    if (dataEmissaoAte) {
      params.push(dataEmissaoAte)
      where.push(`cr.data_lancamento <= $${params.length}::date`)
    }

    const valorMin = toNumber(payload.valor_minimo)
    if (valorMin != null) {
      params.push(valorMin)
      where.push(`cr.valor_liquido >= $${params.length}::numeric`)
    }
    const valorMax = toNumber(payload.valor_maximo)
    if (valorMax != null) {
      params.push(valorMax)
      where.push(`cr.valor_liquido <= $${params.length}::numeric`)
    }

    const whereSql = `WHERE ${where.join(' AND ')}`
    const listSql = `
      SELECT
        cr.id,
        cr.numero_documento,
        cr.cliente_id,
        COALESCE(cr.nome_cliente_snapshot, c.nome_fantasia, 'Cliente') AS cliente,
        cr.valor_liquido AS valor_total,
        cr.data_lancamento AS data_emissao,
        cr.data_vencimento,
        cr.status,
        cr.observacao AS descricao,
        cr.criado_em
      FROM financeiro.contas_receber cr
      LEFT JOIN entidades.clientes c ON c.id = cr.cliente_id
      ${whereSql}
      ORDER BY cr.data_vencimento ASC, cr.id ASC
      LIMIT $${params.length + 1}::int
    `.trim()

    const rows = await runQuery<Record<string, unknown>>(listSql, [...params, limit])
    const countSql = `SELECT COUNT(*)::int AS total FROM financeiro.contas_receber cr ${whereSql}`
    const [countRow] = await runQuery<{ total: number }>(countSql, params)
    const count = Number(countRow?.total ?? rows.length)

    return Response.json({
      ok: true,
      result: {
        success: true,
        rows,
        count,
        message: `Encontradas ${count} contas a receber`,
        sql_query: listSql,
      },
    })
  } catch (e) {
    return Response.json({ ok: false, error: (e as Error).message }, { status: 500 })
  }
}
