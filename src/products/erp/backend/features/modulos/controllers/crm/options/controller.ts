import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Option = { value: number | string; label: string }

export async function GET(req: NextRequest) {
  try {
    const tenantId = resolveTenantId(req.headers)
    const { searchParams } = new URL(req.url)
    const field = (searchParams.get('field') || '').trim().toLowerCase()
    const q = searchParams.get('q') || undefined
    const limit = Math.max(1, Math.min(200, Number(searchParams.get('limit') || 50)))

    const ctx: { sql: string; params: unknown[] } = { sql: '', params: [] }

    if (field === 'vendedor_id' || field === 'responsavel_id') {
      ctx.params.push(tenantId)
      let where = `WHERE v.tenant_id = $1`
      if (q) {
        ctx.params.push(`%${q}%`)
        where += ` AND COALESCE(f.nome,'—') ILIKE $2`
      }
      ctx.sql = `SELECT v.id AS value, COALESCE(f.nome,'—') AS label
                 FROM comercial.vendedores v
                 LEFT JOIN entidades.funcionarios f ON f.id = v.funcionario_id AND f.tenant_id = v.tenant_id
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'origem_id') {
      if (q) ctx.params.push(`%${q}%`)
      ctx.sql = `SELECT ol.id AS value, COALESCE(ol.nome,'—') AS label
                 FROM crm.origens_lead ol
                 ${q ? `WHERE COALESCE(ol.nome,'—') ILIKE $1` : ''}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'fase_pipeline_id') {
      if (q) ctx.params.push(`%${q}%`)
      ctx.sql = `SELECT fp.id AS value,
                        TRIM(COALESCE(p.nome || ' - ', '') || COALESCE(fp.nome,'—')) AS label
                 FROM crm.fases_pipeline fp
                 LEFT JOIN crm.pipelines p ON p.id = fp.pipeline_id
                 ${q ? `WHERE TRIM(COALESCE(p.nome || ' - ', '') || COALESCE(fp.nome,'—')) ILIKE $1` : ''}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'conta_id') {
      ctx.params.push(tenantId)
      let where = `WHERE ct.tenant_id = $1`
      if (q) {
        ctx.params.push(`%${q}%`)
        where += ` AND COALESCE(ct.nome,'—') ILIKE $2`
      }
      ctx.sql = `SELECT ct.id AS value, COALESCE(ct.nome,'—') AS label
                 FROM crm.contas ct
                 ${where}
                 ORDER BY label ASC
                 LIMIT $${ctx.params.length + 1}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else if (field === 'status') {
      ctx.params.push(tenantId, tenantId)
      const qIndex = ctx.params.length + 1
      const limitIndex = q ? qIndex + 1 : qIndex
      if (q) ctx.params.push(`%${q.toLowerCase()}%`)
      ctx.sql = `WITH statuses AS (
                   SELECT LOWER(o.status) AS s FROM crm.oportunidades o WHERE o.tenant_id = $1
                   UNION
                   SELECT LOWER(l.status) AS s FROM crm.leads l WHERE l.tenant_id = $2
                 )
                 SELECT DISTINCT s AS value, s AS label
                 FROM statuses
                 ${q ? `WHERE s LIKE $${qIndex}` : ''}
                 ORDER BY label ASC
                 LIMIT $${limitIndex}::int`.replace(/\s+/g, ' ').trim()
      ctx.params.push(limit)
    } else {
      return Response.json({ success: false, message: `Campo não suportado: ${field}` }, { status: 400 })
    }

    const rows = await runQuery<Option>(ctx.sql, ctx.params)
    return Response.json({ success: true, options: rows })
  } catch (error) {
    console.error('📈 API /api/modulos/crm/options error:', error)
    return Response.json(
      {
        success: false,
        message: 'Erro interno',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    )
  }
}

