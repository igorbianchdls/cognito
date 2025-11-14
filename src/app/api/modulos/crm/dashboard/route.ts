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
    const limitParam = searchParams.get('limit') || undefined
    const monthsParam = searchParams.get('months') || undefined
    const limit = Math.max(1, Math.min(50, limitParam ? Number(limitParam) : 6))
    const months = Math.max(1, Math.min(24, monthsParam ? Number(monthsParam) : 6))

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

    // Atividades WHERE
    const aConds: string[] = []
    const aParams: unknown[] = []
    let ai = 1
    if (de) { aConds.push(`a.data_prevista >= $${ai++}`); aParams.push(de) }
    if (ate) { aConds.push(`a.data_prevista <= $${ai++}`); aParams.push(ate) }
    if (responsavelId) { aConds.push(`v.funcionario_id = $${ai++}`); aParams.push(responsavelId) }
    if (q) {
      aConds.push(`(a.descricao ILIKE '%' || $${ai} || '%' OR a.tipo ILIKE '%' || $${ai} || '%')`)
      aParams.push(q)
      ai += 1
    }
    const aWhere = aConds.length ? `WHERE ${aConds.join(' AND ')}` : ''

    // Fase fechada: coluna fase (fp.nome) com texto 'Fechado'
    const faseFechadaPredicate = `LOWER(fp.nome) = 'fechado'`

    // KPIs queries
    const faturamentoSql = `SELECT COALESCE(SUM(o.valor_estimado),0)::float AS faturamento
      FROM crm.oportunidades o
      LEFT JOIN crm.leads l ON l.id = o.lead_id
      LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
      LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
      LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
      LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
      ${oWhere ? oWhere + ' AND ' : 'WHERE '}${faseFechadaPredicate}`

    const vendasSql = `SELECT COUNT(DISTINCT o.id)::int AS vendas
      FROM crm.oportunidades o
      LEFT JOIN crm.leads l ON l.id = o.lead_id
      LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
      LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
      LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
      LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
      ${oWhere ? oWhere + ' AND ' : 'WHERE '}${faseFechadaPredicate}`

    const oportunidadesSql = `SELECT COUNT(DISTINCT o.id)::int AS oportunidades
      FROM crm.oportunidades o
      LEFT JOIN crm.leads l ON l.id = o.lead_id
      LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
      LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
      LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
      LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
      ${oWhere}`

    const leadsSql = `SELECT COUNT(DISTINCT l.id)::int AS leads
      FROM crm.leads l
      LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id
      LEFT JOIN comercial.vendedores v ON v.id = l.responsavel_id
      LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
      ${lWhere}`

    const [{ faturamento }] = await runQuery<{ faturamento: number }>(faturamentoSql, oParams)
    const [{ vendas }] = await runQuery<{ vendas: number }>(vendasSql, oParams)
    const [{ oportunidades }] = await runQuery<{ oportunidades: number }>(oportunidadesSql, oParams)
    const [{ leads }] = await runQuery<{ leads: number }>(leadsSql, lParams)

    const totalLeads = Number(leads ?? 0) || 0
    const vendasNum = Number(vendas ?? 0) || 0
    const faturamentoNum = Number(faturamento ?? 0) || 0
    const oportunidadesNum = Number(oportunidades ?? 0) || 0
    const taxaConversao = totalLeads > 0 ? (vendasNum / totalLeads) * 100 : 0

    // Charts
    type ChartItem = { label: string; value: number }
    // 1) Funil por fase (ordenado pela ordem da fase)
    const funilSql = `SELECT COALESCE(fp.nome, '—') AS label, COALESCE(SUM(o.valor_estimado),0)::float AS value, MIN(fp.ordem) AS ordem
                      FROM crm.oportunidades o
                      LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
                      LEFT JOIN crm.leads l ON l.id = o.lead_id
                      LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
                      LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                      LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
                      ${oWhere}
                      GROUP BY fp.nome
                      ORDER BY ordem ASC NULLS LAST, value DESC`;
    const funil = await runQuery<{ label: string; value: number; ordem: number | null }>(funilSql, oParams)

    // 2) Pipeline por vendedor (top N)
    const vendSql = `SELECT COALESCE(f.nome, '—') AS label, COALESCE(SUM(o.valor_estimado),0)::float AS value
                     FROM crm.oportunidades o
                     LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
                     LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                     LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
                     LEFT JOIN crm.leads l ON l.id = o.lead_id
                     LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
                     ${oWhere}
                     GROUP BY f.nome
                     ORDER BY value DESC
                     LIMIT $${oParams.length + 1}::int`;
    const pipelineVendedor = await runQuery<ChartItem>(vendSql, [...oParams, limit])

    // 3) Forecast mensal
    // Se não tiver de/ate informado, considera próximos N meses de current_date
    const forecastExtraConds: string[] = []
    const forecastParams: unknown[] = [...oParams]
    if (!de && !ate) {
      forecastExtraConds.push(`o.data_prevista >= CURRENT_DATE`)
      forecastExtraConds.push(`o.data_prevista < (CURRENT_DATE + ($${forecastParams.length + 1})::text::interval)`)
      forecastParams.push(`${months} months`)
    }
    const forecastWhere = (oWhere ? `${oWhere} ${forecastExtraConds.length ? 'AND ' + forecastExtraConds.join(' AND ') : ''}` : (forecastExtraConds.length ? 'WHERE ' + forecastExtraConds.join(' AND ') : ''))
    const forecastSql = `SELECT TO_CHAR(DATE_TRUNC('month', o.data_prevista), 'YYYY-MM') AS key, COALESCE(SUM(o.valor_estimado),0)::float AS value
                         FROM crm.oportunidades o
                         LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
                         LEFT JOIN crm.leads l ON l.id = o.lead_id
                         LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
                         LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                         LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
                         ${forecastWhere}
                         GROUP BY 1
                         ORDER BY 1 ASC`;
    const forecastMensal = await runQuery<{ key: string; value: number }>(forecastSql, forecastParams)

    // 4) Conversão por canal
    const leadsPorCanalSql = `SELECT COALESCE(ol.nome, '—') AS canal, COUNT(*)::int AS leads
                              FROM crm.leads l
                              LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id
                              LEFT JOIN comercial.vendedores v ON v.id = l.responsavel_id
                              LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                              ${lWhere}
                              GROUP BY 1`;
    const vendasPorCanalSql = `SELECT COALESCE(ol.nome, '—') AS canal, COUNT(DISTINCT o.id)::int AS vendas
                               FROM crm.oportunidades o
                               LEFT JOIN crm.leads l ON l.id = o.lead_id
                               LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id
                               LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
                               LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                               LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
                               ${oWhere ? oWhere + ' AND ' : 'WHERE '}${faseFechadaPredicate}
                               GROUP BY 1`;
    const leadsPorCanal = await runQuery<{ canal: string; leads: number }>(leadsPorCanalSql, lParams)
    const vendasPorCanal = await runQuery<{ canal: string; vendas: number }>(vendasPorCanalSql, oParams)
    const convCanalMap = new Map<string, { leads: number; vendas: number }>()
    for (const l of leadsPorCanal) convCanalMap.set(l.canal, { leads: l.leads, vendas: 0 })
    for (const v of vendasPorCanal) {
      const curr = convCanalMap.get(v.canal) || { leads: 0, vendas: 0 }
      curr.vendas = v.vendas
      convCanalMap.set(v.canal, curr)
    }
    const conversaoCanal = Array.from(convCanalMap, ([label, kv]) => ({ label, value: kv.leads > 0 ? (kv.vendas / kv.leads) * 100 : 0 }))
      .sort((a,b)=> b.value - a.value)
      .slice(0, limit)

    // 5) Conversão por vendedor
    const oppsPorVendedorSql = `SELECT COALESCE(f.nome, '—') AS vendedor, COUNT(DISTINCT o.id)::int AS total
                                FROM crm.oportunidades o
                                LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
                                LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                                LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
                                LEFT JOIN crm.leads l ON l.id = o.lead_id
                                ${oWhere}
                                GROUP BY 1`;
    const vendasPorVendedorSql = `SELECT COALESCE(f.nome, '—') AS vendedor, COUNT(DISTINCT o.id)::int AS vendas
                                  FROM crm.oportunidades o
                                  LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
                                  LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                                  LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
                                  LEFT JOIN crm.leads l ON l.id = o.lead_id
                                  ${oWhere ? oWhere + ' AND ' : 'WHERE '}${faseFechadaPredicate}
                                  GROUP BY 1`;
    const oppsPorVendedor = await runQuery<{ vendedor: string; total: number }>(oppsPorVendedorSql, oParams)
    const vendasPorVendedor = await runQuery<{ vendedor: string; vendas: number }>(vendasPorVendedorSql, oParams)
    const convVendMap = new Map<string, { total: number; vendas: number }>()
    for (const o of oppsPorVendedor) convVendMap.set(o.vendedor, { total: o.total, vendas: 0 })
    for (const v of vendasPorVendedor) {
      const curr = convVendMap.get(v.vendedor) || { total: 0, vendas: 0 }
      curr.vendas = v.vendas
      convVendMap.set(v.vendedor, curr)
    }
    const conversaoVendedor = Array.from(convVendMap, ([label, kv]) => ({ label, value: kv.total > 0 ? (kv.vendas / kv.total) * 100 : 0 }))
      .sort((a,b)=> b.value - a.value)
      .slice(0, limit)

    // 6) Motivos de perda (contagem)
    const motivosPerdaSql = `SELECT COALESCE(mp.nome, '—') AS label, COUNT(*)::int AS value
                             FROM crm.oportunidades o
                             LEFT JOIN crm.motivos_perda mp ON mp.id = o.motivo_perda_id
                             LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
                             LEFT JOIN crm.leads l ON l.id = o.lead_id
                             LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
                             LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                             LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
                             ${oWhere}
                             GROUP BY 1
                             ORDER BY value DESC
                             LIMIT $${oParams.length + 1}::int`;
    const motivosPerda = await runQuery<ChartItem>(motivosPerdaSql, [...oParams, limit])

    // 7) Atividades por vendedor
    const atividadesVendSql = `SELECT COALESCE(f.nome, '—') AS label, COUNT(*)::int AS value
                               FROM crm.atividades a
                               LEFT JOIN comercial.vendedores v ON v.id = a.responsavel_id
                               LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                               ${aWhere}
                               GROUP BY 1
                               ORDER BY value DESC
                               LIMIT $${aParams.length + 1}::int`;
    const atividadesVendedor = await runQuery<ChartItem>(atividadesVendSql, [...aParams, limit])

    // 8) Fontes de leads
    const fontesLeadsSql = `SELECT COALESCE(ol.nome, '—') AS label, COUNT(*)::int AS value
                            FROM crm.leads l
                            LEFT JOIN crm.origens_lead ol ON ol.id = l.origem_id
                            LEFT JOIN comercial.vendedores v ON v.id = l.responsavel_id
                            LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                            ${lWhere}
                            GROUP BY 1
                            ORDER BY value DESC
                            LIMIT $${lParams.length + 1}::int`;
    const fontesLeads = await runQuery<ChartItem>(fontesLeadsSql, [...lParams, limit])

    const charts = {
      funil_fase: funil.map(({ label, value }) => ({ label, value })),
      pipeline_vendedor: pipelineVendedor,
      forecast_mensal: forecastMensal, // [{ key, value }]
      conversao_canal: conversaoCanal, // percent values
      conversao_vendedor: conversaoVendedor, // percent values
      motivos_perda: motivosPerda,
      atividades_vendedor: atividadesVendedor,
      fontes_leads: fontesLeads,
    }

    // Conversão por Etapa do Funil (aproximação por snapshot atual)
    // Fases alvo e ordem fixa
    const targetStages = [
      'contato inicial',
      'diagnóstico',
      'proposta enviada',
      'negociação',
      'fechado',
    ]
    const stageCountsSql = `SELECT LOWER(fp.nome) AS nome, COUNT(DISTINCT o.id)::int AS total
                            FROM crm.oportunidades o
                            LEFT JOIN crm.fases_pipeline fp ON fp.id = o.fase_pipeline_id
                            LEFT JOIN crm.leads l ON l.id = o.lead_id
                            LEFT JOIN comercial.vendedores v ON v.id = o.vendedor_id
                            LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
                            LEFT JOIN entidades.clientes cli ON cli.id = o.cliente_id
                            ${oWhere}
                            GROUP BY 1`;
    const stageCounts = await runQuery<{ nome: string; total: number }>(stageCountsSql, oParams)
    const totalsByStage = new Map<string, number>()
    for (const s of targetStages) totalsByStage.set(s, 0)
    for (const row of stageCounts) {
      const n = (row.nome || '').toLowerCase()
      if (totalsByStage.has(n)) totalsByStage.set(n, Number(row.total || 0))
    }
    const ci = totalsByStage.get('contato inicial') || 0
    const dg = totalsByStage.get('diagnóstico') || 0
    const pe = totalsByStage.get('proposta enviada') || 0
    const ng = totalsByStage.get('negociação') || 0
    const fc = totalsByStage.get('fechado') || 0
    const atContato = ci + dg + pe + ng + fc
    const atDiag = dg + pe + ng + fc
    const atProp = pe + ng + fc
    const atNego = ng + fc
    const atFech = fc
    const convEtapa = [
      { label: 'Contato Inicial → Diagnóstico', value: atContato > 0 ? (atDiag / atContato) * 100 : 0 },
      { label: 'Diagnóstico → Proposta Enviada', value: atDiag > 0 ? (atProp / atDiag) * 100 : 0 },
      { label: 'Proposta Enviada → Negociação', value: atProp > 0 ? (atNego / atProp) * 100 : 0 },
      { label: 'Negociação → Fechado', value: atNego > 0 ? (atFech / atNego) * 100 : 0 },
    ]
    charts['conversao_etapa'] = convEtapa

    return Response.json(
      {
        success: true,
        kpis: {
          faturamento: faturamentoNum,
          vendas: vendasNum,
          oportunidades: oportunidadesNum,
          totalLeads,
          taxaConversao,
        },
        charts,
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
