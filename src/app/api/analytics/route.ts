import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Source = 'ap' | 'ar' | 'pe' | 'pr' | 'vd' | 'vendas'

type WhereRule = {
  col: string
  op: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'in' | 'between' | 'like' | string
  val?: string
  vals?: string[]
  start?: string | number
  end?: string | number
}

type AnalyticsBody = {
  source: Source
  measure?: string
  dimension?: string
  dateColumn?: string
  from?: string
  to?: string
  where?: WhereRule[]
  tenant_id?: number
  limit?: number
  order?: 'value DESC' | 'value ASC' | 'label ASC' | 'label DESC'
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AnalyticsBody>
    let source = (body.source || '').toLowerCase() as Source
    if (source === 'vendas') source = 'vd' as Source
    if (!source || !['ap','ar','pe','pr','vd'].includes(source)) {
      return Response.json({ success: false, message: "Parâmetro 'source' inválido. Use 'ap' | 'ar' | 'pe' | 'pr' | 'vd' (vendas)" }, { status: 400 })
    }

    const limit = Math.max(1, Math.min(50, Number(body.limit || 5)))
    const order = (body.order || 'value DESC') as 'value DESC' | 'value ASC' | 'label ASC' | 'label DESC'
    const from = body.from || undefined
    const to = body.to || undefined
    const whereRules = Array.isArray(body.where) ? body.where : []
    const tenantId = body.tenant_id !== undefined && body.tenant_id !== null ? Number(body.tenant_id) : undefined

    // Base SELECT blocks per source
    const ctx = (() => {
      if (source === 'ap') {
        return {
          baseFrom: `FROM financeiro.contas_pagar cp
                     LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                     LEFT JOIN financeiro.categorias_despesa cat ON cat.id = cp.categoria_despesa_id
                     LEFT JOIN empresa.centros_custo cc ON cc.id = cp.centro_custo_id
                     LEFT JOIN empresa.departamentos dep ON dep.id = cp.departamento_id
                     LEFT JOIN empresa.unidades_negocio un ON un.id = cp.unidade_negocio_id
                     LEFT JOIN empresa.filiais fil ON fil.id = cp.filial_id
                     LEFT JOIN financeiro.projetos prj ON prj.id = cp.projeto_id`,
          defaultMeasure: 'SUM(cp.valor_liquido)',
          defaultDate: 'cp.data_vencimento',
          labelMap: new Map<string, string>([
            ['fornecedor', "COALESCE(f.nome_fantasia,'Sem fornecedor')"],
            ['categoria', "COALESCE(cat.nome,'Sem categoria')"],
            ['centro_custo', "COALESCE(cc.nome,'Sem centro de custo')"],
            ['departamento', "COALESCE(dep.nome,'Sem departamento')"],
            ['unidade_negocio', "COALESCE(un.nome,'Sem unidade')"],
            ['filial', "COALESCE(fil.nome,'Sem filial')"],
            ['projeto', "COALESCE(prj.nome,'Sem projeto')"],
            ['titulo', "COALESCE(NULLIF(TRIM(cp.numero_documento), ''), CONCAT('Conta #', cp.id::text))"],
          ]),
        }
      }
      if (source === 'vd') {
        return {
          baseFrom: `FROM comercial.vendas_vw vw`,
          defaultMeasure: 'SUM(vw.item_subtotal)',
          defaultDate: 'vw.data_pedido',
          labelMap: new Map<string, string>([
            ['vendedor', "COALESCE(vw.vendedor_nome,'—')"],
            ['canal_venda', "COALESCE(vw.canal_venda_nome,'—')"],
            ['canal_distribuicao', "COALESCE(vw.canal_distribuicao_nome,'—')"],
            ['territorio', "COALESCE(vw.territorio_nome,'—')"],
            ['categoria', "COALESCE(vw.categoria_servico_nome,'—')"],
            ['categoria_servico', "COALESCE(vw.categoria_servico_nome,'—')"],
            ['servico', "COALESCE(vw.servico_nome,'—')"],
            ['produto', "COALESCE(vw.produto_nome,'—')"],
            ['cliente', "COALESCE(vw.cliente_nome,'—')"],
            ['cidade', "COALESCE(vw.cidade,'—')"],
            ['filial', "COALESCE(vw.filial_nome,'—')"],
            ['unidade_negocio', "COALESCE(vw.unidade_negocio_nome,'—')"],
            ['sales_office', "COALESCE(vw.sales_office_nome,'—')"],
            ['marca', "COALESCE(vw.marca_nome,'—')"],
            ['campanha', "COALESCE(vw.campanha_venda_nome,'—')"],
          ]),
        }
      }
      if (source === 'ar') {
        return {
          baseFrom: `FROM financeiro.contas_receber cr
                     LEFT JOIN entidades.clientes cli ON cli.id = cr.cliente_id
                     LEFT JOIN financeiro.categorias_receita cat ON cat.id = cr.categoria_receita_id
                     LEFT JOIN empresa.centros_lucro cl ON cl.id = cr.centro_lucro_id
                     LEFT JOIN empresa.departamentos dep ON dep.id = cr.departamento_id
                     LEFT JOIN empresa.unidades_negocio un ON un.id = cr.unidade_negocio_id
                     LEFT JOIN empresa.filiais fil ON fil.id = cr.filial_id
                     LEFT JOIN financeiro.projetos prj ON prj.id = cr.projeto_id`,
          defaultMeasure: 'SUM(cr.valor_liquido)',
          defaultDate: 'cr.data_vencimento',
          labelMap: new Map<string, string>([
            ['cliente', "COALESCE(cli.nome_fantasia,'Sem cliente')"],
            ['categoria', "COALESCE(cat.nome,'Sem categoria')"],
            ['centro_lucro', "COALESCE(cl.nome,'Sem centro de lucro')"],
            ['departamento', "COALESCE(dep.nome,'Sem departamento')"],
            ['unidade_negocio', "COALESCE(un.nome,'Sem unidade')"],
            ['filial', "COALESCE(fil.nome,'Sem filial')"],
            ['projeto', "COALESCE(prj.nome,'Sem projeto')"],
            ['titulo', "COALESCE(NULLIF(TRIM(cr.numero_documento), ''), CONCAT('Conta #', cr.id::text))"],
          ]),
        }
      }
      if (source === 'pe') {
        return {
          baseFrom: `FROM financeiro.pagamentos_efetuados pe
                     LEFT JOIN financeiro.pagamentos_efetuados_linhas pel ON pel.pagamento_id = pe.id
                     LEFT JOIN financeiro.contas_pagar cp ON cp.id = pel.conta_pagar_id
                     LEFT JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
                     LEFT JOIN financeiro.categorias_despesa cat ON cat.id = cp.categoria_despesa_id
                     LEFT JOIN empresa.centros_custo cc ON cc.id = cp.centro_custo_id
                     LEFT JOIN empresa.departamentos dep ON dep.id = cp.departamento_id
                     LEFT JOIN empresa.unidades_negocio un ON un.id = cp.unidade_negocio_id
                     LEFT JOIN empresa.filiais fil ON fil.id = cp.filial_id
                     LEFT JOIN financeiro.contas_financeiras cf ON cf.id = pe.conta_financeira_id
                     LEFT JOIN financeiro.metodos_pagamento mp ON mp.id = pe.metodo_pagamento_id
                     LEFT JOIN financeiro.projetos prj ON prj.id = cp.projeto_id`,
          defaultMeasure: 'SUM(pe.valor_total_pagamento)',
          defaultDate: 'pe.data_pagamento',
          labelMap: new Map<string, string>([
            ['conta_financeira', "COALESCE(cf.nome_conta,'Sem conta')"],
            ['metodo_pagamento', "COALESCE(mp.nome,'Sem método')"],
            ['fornecedor', "COALESCE(f.nome_fantasia,'Sem fornecedor')"],
            ['categoria', "COALESCE(cat.nome,'Sem categoria')"],
            ['centro_custo', "COALESCE(cc.nome,'Sem centro de custo')"],
            ['departamento', "COALESCE(dep.nome,'Sem departamento')"],
            ['unidade_negocio', "COALESCE(un.nome,'Sem unidade')"],
            ['filial', "COALESCE(fil.nome,'Sem filial')"],
            ['projeto', "COALESCE(prj.nome,'Sem projeto')"],
          ]),
        }
      }
      // pr
      return {
        baseFrom: `FROM financeiro.pagamentos_recebidos pr
                   LEFT JOIN financeiro.pagamentos_recebidos_linhas prl ON prl.pagamento_id = pr.id
                   LEFT JOIN financeiro.contas_receber cr ON cr.id = prl.conta_receber_id
                   LEFT JOIN entidades.clientes cli ON cli.id = cr.cliente_id
                   LEFT JOIN financeiro.categorias_receita cat ON cat.id = cr.categoria_receita_id
                   LEFT JOIN empresa.centros_lucro cl ON cl.id = cr.centro_lucro_id
                   LEFT JOIN empresa.departamentos dep ON dep.id = cr.departamento_id
                   LEFT JOIN empresa.unidades_negocio un ON un.id = cr.unidade_negocio_id
                   LEFT JOIN empresa.filiais fil ON fil.id = cr.filial_id
                   LEFT JOIN financeiro.contas_financeiras cf ON cf.id = pr.conta_financeira_id
                   LEFT JOIN financeiro.metodos_pagamento mp ON mp.id = pr.metodo_pagamento_id
                   LEFT JOIN financeiro.projetos prj ON prj.id = cr.projeto_id`,
        defaultMeasure: 'SUM(pr.valor_total_recebido)',
        defaultDate: 'pr.data_recebimento',
        labelMap: new Map<string, string>([
          ['conta_financeira', "COALESCE(cf.nome_conta,'Sem conta')"],
          ['metodo_pagamento', "COALESCE(mp.nome,'Sem método')"],
          ['cliente', "COALESCE(cli.nome_fantasia,'Sem cliente')"],
          ['categoria', "COALESCE(cat.nome,'Sem categoria')"],
          ['centro_lucro', "COALESCE(cl.nome,'Sem centro de lucro')"],
          ['departamento', "COALESCE(dep.nome,'Sem departamento')"],
          ['unidade_negocio', "COALESCE(un.nome,'Sem unidade')"],
          ['filial', "COALESCE(fil.nome,'Sem filial')"],
          ['projeto', "COALESCE(prj.nome,'Sem projeto')"],
        ]),
      }
    })()

    const dimRaw = (body.dimension || '').toLowerCase().trim()
    const dimension = dimRaw
      .replace('centros_custo','centro_custo')
      .replace('centros_lucro','centro_lucro')
      .replace('unidade-negocio','unidade_negocio')

    const labelExpr = dimension ? ctx.labelMap.get(dimension) : undefined
    let measure = (body.measure && String(body.measure).trim()) || ctx.defaultMeasure
    let dateCol = (body.dateColumn && String(body.dateColumn).trim()) || ctx.defaultDate

    // Normalize fields for vendas view
    if (source === 'vd') {
      // Normalize common fields for sales view
      measure = measure
        .replace(/\bsubtotal\b/gi, 'vw.item_subtotal')
        .replace(/\bitem_subtotal\b/gi, 'vw.item_subtotal')
        .replace(/COUNT_DISTINCT\s*\(\s*([^)]+?)\s*\)/gi, 'COUNT(DISTINCT $1)')
        .replace(/\bpedido_id\b/gi, 'vw.pedido_id');
      dateCol = dateCol.replace(/\bdata_pedido\b/gi, 'vw.data_pedido')
    }

    // Build WHERE with safe whitelists
    const params: unknown[] = []
    let idx = 1
    const filters: string[] = []

    // Tenant filter
    if (tenantId && source !== 'vd') {
      // decide alias by source
      const alias = source === 'ap' ? 'cp' : source === 'ar' ? 'cr' : source === 'pe' ? 'pe' : 'pr'
      filters.push(`${alias}.tenant_id = $${idx++}`)
      params.push(tenantId)
    }

    // Date range
    if (from) { filters.push(`${dateCol} >= $${idx++}`); params.push(from) }
    if (to) { filters.push(`${dateCol} <= $${idx++}`); params.push(to) }

    // Status defaults for AP/AR (em aberto)
    const hasStatusRule = whereRules.some(r => String(r.col || '').toLowerCase() === 'status')
    if (!hasStatusRule && (source === 'ap' || source === 'ar')) {
      const alias = source === 'ap' ? 'cp' : 'cr'
      filters.push(`LOWER(${alias}.status) IN ('aberto','pendente','em_aberto','em aberto')`)
    }

    // Custom where (very limited whitelist)
    const applyRule = (r: WhereRule) => {
      const c = String(r.col || '').toLowerCase()
      const op = String(r.op || '=').toLowerCase()
      if (source === 'vd') {
        const mapCol = (name: string): string | null => {
          switch (name) {
            case 'status': return 'vw.status'
            case 'vendedor': return 'vw.vendedor_nome'
            case 'canal_venda': return 'vw.canal_venda_nome'
            case 'canal_distribuicao': return 'vw.canal_distribuicao_nome'
            case 'territorio': return 'vw.territorio_nome'
            case 'categoria': return 'vw.categoria_servico_nome'
            case 'categoria_servico': return 'vw.categoria_servico_nome'
            case 'servico': return 'vw.servico_nome'
            case 'produto': return 'vw.produto_nome'
            case 'cliente': return 'vw.cliente_nome'
            case 'cidade': return 'vw.cidade'
            case 'filial': return 'vw.filial_nome'
            case 'unidade_negocio': return 'vw.unidade_negocio_nome'
            case 'sales_office': return 'vw.sales_office_nome'
            case 'marca': return 'vw.marca_nome'
            case 'campanha': return 'vw.campanha_venda_nome'
            default: return null
          }
        }
        const colExpr = mapCol(c)
        if (!colExpr) return
        if (op === '=' && r.val !== undefined) { filters.push(`${colExpr} = $${idx++}`); params.push(r.val) }
        else if (op === 'in' && Array.isArray(r.vals) && r.vals.length) {
          const placeholders = r.vals.map(() => `$${idx++}`).join(',')
          filters.push(`${colExpr} IN (${placeholders})`); params.push(...r.vals)
        } else if (op === 'between' && r.start !== undefined && r.end !== undefined) {
          filters.push(`${colExpr} BETWEEN $${idx++} AND $${idx++}`); params.push(r.start, r.end)
        } else if (op === 'like' && r.val !== undefined) {
          filters.push(`${colExpr} ILIKE $${idx++}`); params.push(r.val)
        }
        return
      }
      // Financeiro
      const allowedCols = new Set<string>([
        'status','fornecedor_id','cliente_id','categoria_despesa_id','categoria_receita_id','centro_custo_id','centro_lucro_id','departamento_id','unidade_negocio_id','filial_id','projeto_id'
      ])
      if (!allowedCols.has(c)) return
      const alias = (source === 'ap' || source === 'pe') ? (c.includes('cliente') || c.includes('receita') || c.includes('centro_lucro') ? 'cr' : 'cp')
                  : (source === 'ar' || source === 'pr') ? 'cr' : 'cp'
      const colExpr = `${alias}.${c}`
      if (op === '=' && r.val !== undefined) { filters.push(`${colExpr} = $${idx++}`); params.push(r.val) }
      else if (op === 'in' && Array.isArray(r.vals) && r.vals.length) {
        const placeholders = r.vals.map(() => `$${idx++}`).join(',')
        filters.push(`${colExpr} IN (${placeholders})`); params.push(...r.vals)
      } else if (op === 'between' && r.start !== undefined && r.end !== undefined) {
        filters.push(`${colExpr} BETWEEN $${idx++} AND $${idx++}`); params.push(r.start, r.end)
      } else if (op === 'like' && r.val !== undefined) {
        filters.push(`${colExpr} ILIKE $${idx++}`); params.push(r.val)
      }
    }
    whereRules.forEach(applyRule)

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
    const orderClause = order.startsWith('value')
      ? `ORDER BY total ${order.endsWith('ASC') ? 'ASC' : 'DESC'} NULLS LAST`
      : `ORDER BY label ${order.endsWith('DESC') ? 'DESC' : 'ASC'}`

    let sql: string
    if (!labelExpr) {
      // Aggregate only (no dimension)
      sql = `SELECT COALESCE(${measure}, 0) AS total ${ctx.baseFrom} ${whereClause}`.replace(/\s+/g, ' ').trim()
    } else {
      sql = `SELECT ${labelExpr} AS label, COALESCE(${measure}, 0) AS total ${ctx.baseFrom} ${whereClause} GROUP BY 1 ${orderClause} LIMIT ${limit}`
        .replace(/\s+/g, ' ').trim()
    }

    const rows = await runQuery<Record<string, unknown>>(sql, params)
    const outRows = rows.map((r, i) => {
      if (!labelExpr) return { label: 'Total', total: Number((r as any).total || 0) }
      const lbl = String((r as any).label ?? `Item ${i+1}`)
      const total = Number((r as any).total || 0)
      return { label: lbl, total }
    })

    return Response.json({ success: true, source, rows: outRows, meta: { sql, params, measure, dimension: dimension || null, dateColumn: dateCol, from: from || null, to: to || null, limit, order } }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message: msg }, { status: 400 })
  }
}

export async function GET(req: NextRequest) {
  // Optional: lightweight GET for quick checks
  return Response.json({ success: true, message: 'Use POST with JSON body to query analytics.' })
}
