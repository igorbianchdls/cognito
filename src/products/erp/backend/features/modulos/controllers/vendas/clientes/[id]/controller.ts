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
    const sql = `SELECT id,
                        nome_fantasia AS nome,
                        imagem_url,
                        canal AS segmento
                   FROM entidades.clientes
                  WHERE tenant_id = $1 AND id = $2
                  LIMIT 1`
    const rows = await runQuery<Record<string, unknown>>(sql, [tenantId, id])
    const cliente = rows[0] || null
    if (!cliente) return Response.json({ success: false, message: 'Cliente não encontrado' }, { status: 404 })
    return Response.json({ success: true, data: cliente })
  } catch (error) {
    console.error('GET /api/modulos/vendas/clientes/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}

const WHITELIST = new Set(['imagem_url', 'segmento', 'nome'])

export async function PATCH(req: Request) {
  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/').filter(Boolean)
    const id = parts[parts.length - 1]
    if (!id) return Response.json({ success: false, message: 'ID é obrigatório' }, { status: 400 })

    const body = await req.json() as Record<string, unknown>
    const entries = Object.entries(body).filter(([k, v]) => WHITELIST.has(k) && v !== undefined)
    if (entries.length === 0) return Response.json({ success: false, message: 'Nenhum campo válido para atualizar' }, { status: 400 })

    const link = body['imagem_url'] as string | undefined
    if (link && !(link.startsWith('http://') || link.startsWith('https://'))) {
      return Response.json({ success: false, message: 'imagem_url deve ser um link http/https' }, { status: 400 })
    }

    let i = 1
    const sets: string[] = []
    const paramsArr: unknown[] = []
    for (const [key, value] of entries) {
      if (key === 'segmento') {
        sets.push(`canal = $${i}`)
        paramsArr.push(value)
      } else if (key === 'nome') {
        sets.push(`nome_fantasia = $${i}`)
        paramsArr.push(value)
      } else {
        sets.push(`${key} = $${i}`)
        paramsArr.push(value)
      }
      i += 1
    }
    const tenantId = resolveTenantId(req.headers)
    paramsArr.push(tenantId)
    paramsArr.push(id)
    const sql = `UPDATE entidades.clientes SET ${sets.join(', ')}, atualizado_em = NOW() WHERE tenant_id = $${i} AND id = $${i + 1} RETURNING id`
    await runQuery(sql, paramsArr)
    return Response.json({ success: true })
  } catch (error) {
    console.error('PATCH /api/modulos/vendas/clientes/[id] error:', error)
    return Response.json({ success: false, message: 'Erro interno' }, { status: 500 })
  }
}
