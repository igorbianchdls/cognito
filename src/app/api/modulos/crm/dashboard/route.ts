import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const status = searchParams.get('status') || undefined
    const responsavelId = searchParams.get('responsavel_id') || undefined
    const origem = searchParams.get('origem') || undefined
    const q = searchParams.get('q') || undefined

    // Oportunidades WHERE
    const oConds: string[] = []
    const oParams: unknown[] = []
    let oi = 1
    if (de) { oConds.push(`o.data_prevista >= $${oi++}`); oParams.push(de) }
    if (ate) { oConds.push(`o.data_prevista <= $${oi++}`); oParams.push(ate) }
    if (status) { oConds.push(`LOWER(o.status) = LOWER($${oi++})`); oParams.push(status) }
    if (responsavelId) { oConds.push(`v.funcionario_id = $${oi++}`); oParams.push(responsavelId) }
    if (q) {
      oConds.push(`(l.nome ILIKE '%' || $${oi} || '%' OR l.empresa ILIKE '%' || $${oi} || '%' OR cli.nome_fantasia ILIKE '%' || $${oi} || '%' OR f.nome ILIKE '%' || $${oi} || '%')`)
      oParams.push(q)
      oi += 1
    }
    const oWhere = oConds.length ? `WHERE ${oConds.join(' AND ')}` : ''

    // Leads WHERE
    const lConds: string[] = []
    const lParams: unknown[] = []
    let li = 1
    if (de) { lConds.push(`l.criado_em >= $${li++}`); lParams.push(de) }
    if (ate) { lConds.push(`l.criado_em <= $${li++}`); lParams.push(ate) }
    if (origem) { lConds.push(`LOWER(ol.nome) = LOWER($${li++})`); lParams.push(origem) }
    if (responsavelId) { lConds.push(`v.funcionario_id = $${li++}`); lParams.push(responsavelId) }
    if (q) {
      lConds.push(`(l.nome ILIKE '%' || $${li} || '%' OR l.empresa ILIKE '%' || $${li} || '%' OR l.email ILIKE '%' || $${li} || '%' OR f.nome ILIKE '%' || $${li} || '%')`)
      lParams.push(q)
      li += 1
    }
    const lWhere = lConds.length ? `WHERE ${lConds.join(' AND ')}` : ''

    // Closed Won predicate (status or fase do pipeline)
    const closedWonPredicate = `(
      LOWER(o.status) LIKE '%ganh%' OR LOWER(o.status) LIKE '%won%'
      OR LOWER(fp.nome) LIKE '%ganh%' OR LOWER(fp.nome) LIKE '%won%'
    )`

    // KPIs queries
    const faturamentoSql = `SELECT COALESCE(SUM(o.valor_estimado),0)::float AS faturamento
      FROM crm.oportunidades o
      LEFT JOIN crm.leads l ON l.id = o.lead_id
      LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
      LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
      LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
      LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
      ${oWhere ? oWhere + ' AND ' : 'WHERE '}${closedWonPredicate}`

    const vendasSql = `SELECT COUNT(DISTINCT o.id)::int AS vendas
      FROM crm.oportunidades o
      LEFT JOIN crm.leads l ON l.id = o.lead_id
      LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
      LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
      LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
      LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
      ${oWhere ? oWhere + ' AND ' : 'WHERE '}${closedWonPredicate}`

    const leadsSql = `SELECT COUNT(DISTINCT l.id)::int AS leads
      FROM crm.leads l
      LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id
      LEFT JOIN comercial.vendedores v ON v.id = l.responsavel_id
      LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
      ${lWhere}`

    const [{ faturamento }] = await runQuery<{ faturamento: number }>(faturamentoSql, oParams)
    const [{ vendas }] = await runQuery<{ vendas: number }>(vendasSql, oParams)
    const [{ leads }] = await runQuery<{ leads: number }>(leadsSql, lParams)

    const totalLeads = Number(leads ?? 0) || 0
    const vendasNum = Number(vendas ?? 0) || 0
    const faturamentoNum = Number(faturamento ?? 0) || 0
    const taxaConversao = totalLeads > 0 ? (vendasNum / totalLeads) * 100 : 0

    return Response.json(
      {
        success: true,
        kpis: {
          faturamento: faturamentoNum,
          vendas: vendasNum,
          totalLeads,
          taxaConversao,
        },
      },
      { headers: { 'Cache-Control': 'no-store' } }
    )
  } catch (error) {
    console.error('📇 API /api/modulos/crm/dashboard error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

