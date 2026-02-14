import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[parts.length - 1]
    if (!id) return Response.json({ success: false, message: 'ID é obrigatório' }, { status: 400 })
    const tenantId = resolveTenantId(req.headers)

    const sql = `SELECT id, nome, descricao, ativo, canal_distribuicao_id FROM vendas.canais_venda WHERE tenant_id = $1 AND id = $2 LIMIT 1`
    const rows = await runQuery<Record<string, unknown>>(sql, [tenantId, id])
    const canal = rows[0] || null
    if (!canal) return Response.json({ success: false, message: 'Canal não encontrado' }, { status: 404 })
    return Response.json({ success: true, data: canal })
  } catch (error) {
    console.error('GET /api/modulos/vendas/canais/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

const WHITELIST = new Set(['nome', 'descricao', 'ativo', 'canal_distribuicao_id'])

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[parts.length - 1]
    if (!id) return Response.json({ success: false, message: 'ID é obrigatório' }, { status: 400 })
    const tenantId = resolveTenantId(req.headers)

    const body = await req.json() as Record<string, unknown>
    const entries = Object.entries(body).filter(([k, v]) => WHITELIST.has(k) && v !== undefined)
    if (entries.length === 0) return Response.json({ success: false, message: 'Nenhum campo válido para atualizar' }, { status: 400 })

    let i = 1
    const sets: string[] = []
    const paramsArr: unknown[] = []
    for (const [key, value] of entries) {
      sets.push(`${key} = $${i}`)
      paramsArr.push(value)
      i += 1
    }
    paramsArr.push(tenantId)
    paramsArr.push(id)
    const sql = `UPDATE vendas.canais_venda SET ${sets.join(', ')}, atualizado_em = NOW() WHERE tenant_id = $${i} AND id = $${i + 1} RETURNING id`
    await runQuery(sql, paramsArr)
    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/modulos/vendas/canais/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}
