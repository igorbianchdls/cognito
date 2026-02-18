import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'
import { resolveTenantId } from '@/lib/tenant'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type ChartItem = { label: string; value: number }

function buildDocsWhere(
  tenantId: number,
  filters: { de?: string; ate?: string },
) {
  const params: unknown[] = [tenantId]
  const whereParts: string[] = ['d.tenant_id = $1']

  if (filters.de) {
    whereParts.push(`d.criado_em >= $${params.length + 1}`)
    params.push(filters.de)
  }
  if (filters.ate) {
    whereParts.push(`d.criado_em <= $${params.length + 1}`)
    params.push(filters.ate)
  }

  return {
    where: `WHERE ${whereParts.join(' AND ')}`,
    params,
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const tenantId = resolveTenantId(req.headers)
    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const limitParam = searchParams.get('limit') || undefined
    const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 8))

    const docsWhereCtx = buildDocsWhere(tenantId, { de, ate })

    const [{ templates_ativos }] = await runQuery<{ templates_ativos: number }>(
      `SELECT COUNT(*)::int AS templates_ativos
       FROM documentos.templates t
       WHERE t.tenant_id = $1 AND t.ativo = true`,
      [tenantId],
    )

    const [{ versoes_publicadas }] = await runQuery<{ versoes_publicadas: number }>(
      `SELECT COUNT(*)::int AS versoes_publicadas
       FROM documentos.template_versions v
       WHERE v.tenant_id = $1 AND v.publicado = true`,
      [tenantId],
    )

    const [{ documentos_gerados }] = await runQuery<{ documentos_gerados: number }>(
      `SELECT COUNT(*)::int AS documentos_gerados
       FROM documentos.documentos d
       ${docsWhereCtx.where}
       AND d.status IN ('gerado','enviado','assinado')`.replace(/\s+/g, ' '),
      docsWhereCtx.params,
    )

    const [{ documentos_enviados }] = await runQuery<{ documentos_enviados: number }>(
      `SELECT COUNT(*)::int AS documentos_enviados
       FROM documentos.documentos d
       ${docsWhereCtx.where}
       AND d.status = 'enviado'`.replace(/\s+/g, ' '),
      docsWhereCtx.params,
    )

    const [{ pendentes_geracao }] = await runQuery<{ pendentes_geracao: number }>(
      `SELECT COUNT(*)::int AS pendentes_geracao
       FROM documentos.documentos d
       ${docsWhereCtx.where}
       AND d.status IN ('rascunho','gerando')`.replace(/\s+/g, ' '),
      docsWhereCtx.params,
    )

    const [{ com_erro }] = await runQuery<{ com_erro: number }>(
      `SELECT COUNT(*)::int AS com_erro
       FROM documentos.documentos d
       ${docsWhereCtx.where}
       AND d.status = 'erro'`.replace(/\s+/g, ' '),
      docsWhereCtx.params,
    )

    const [{ assinados }] = await runQuery<{ assinados: number }>(
      `SELECT COUNT(*)::int AS assinados
       FROM documentos.documentos d
       ${docsWhereCtx.where}
       AND d.status = 'assinado'`.replace(/\s+/g, ' '),
      docsWhereCtx.params,
    )

    const [{ ultimos_30_dias }] = await runQuery<{ ultimos_30_dias: number }>(
      `SELECT COUNT(*)::int AS ultimos_30_dias
       FROM documentos.documentos d
       WHERE d.tenant_id = $1
         AND d.criado_em >= (NOW() - INTERVAL '30 days')`,
      [tenantId],
    )

    const docsLimitIndex = docsWhereCtx.params.length + 1

    const documentosStatus = await runQuery<ChartItem>(
      `SELECT d.status AS label, COUNT(*)::float AS value
       FROM documentos.documentos d
       ${docsWhereCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${docsLimitIndex}::int`.replace(/\s+/g, ' '),
      [...docsWhereCtx.params, limit],
    )

    const documentosOrigem = await runQuery<ChartItem>(
      `SELECT COALESCE(d.origem_tipo, '—') AS label, COUNT(*)::float AS value
       FROM documentos.documentos d
       ${docsWhereCtx.where}
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $${docsLimitIndex}::int`.replace(/\s+/g, ' '),
      [...docsWhereCtx.params, limit],
    )

    const documentosMensal = await runQuery<ChartItem>(
      `SELECT TO_CHAR(DATE_TRUNC('month', d.criado_em), 'YYYY-MM') AS label,
              COUNT(*)::float AS value
       FROM documentos.documentos d
       ${docsWhereCtx.where}
       GROUP BY 1
       ORDER BY 1 ASC
       LIMIT $${docsLimitIndex}::int`.replace(/\s+/g, ' '),
      [...docsWhereCtx.params, limit],
    )

    const templatesTipo = await runQuery<ChartItem>(
      `SELECT COALESCE(t.tipo, 'outro') AS label, COUNT(*)::float AS value
       FROM documentos.templates t
       WHERE t.tenant_id = $1
       GROUP BY 1
       ORDER BY 2 DESC
       LIMIT $2::int`,
      [tenantId, limit],
    )

    return Response.json(
      {
        success: true,
        kpis: {
          templates_ativos: Number(templates_ativos || 0),
          versoes_publicadas: Number(versoes_publicadas || 0),
          documentos_gerados: Number(documentos_gerados || 0),
          documentos_enviados: Number(documentos_enviados || 0),
          pendentes_geracao: Number(pendentes_geracao || 0),
          com_erro: Number(com_erro || 0),
          assinados: Number(assinados || 0),
          ultimos_30_dias: Number(ultimos_30_dias || 0),
        },
        charts: {
          documentos_status: documentosStatus,
          documentos_origem: documentosOrigem,
          documentos_mensal: documentosMensal,
          templates_tipo: templatesTipo,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('📄 API /api/modulos/documentos/dashboard error:', error)
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
