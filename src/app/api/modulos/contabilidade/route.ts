import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Whitelist para ordenação segura por view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'lancamentos': {
    lancamento_id: 'lc.id',
    data_lancamento: 'lc.data_lancamento',
    conta_id: 'lcl.conta_id',
    debito: 'lcl.debito',
    credito: 'lcl.credito',
    criado_em: 'lcl.criado_em',
  },
  'plano-contas': {
    id: 'pc.id',
    codigo: 'pc.codigo',
    nome: 'pc.nome',
    grupo_principal: "LEFT(pc.codigo, 1)",
    nivel: 'pc.nivel',
    aceita_lancamento: 'pc.aceita_lancamento',
    codigo_pai: 'pai.codigo',
    conta_pai: 'pai.nome',
    criado_em: 'pc.criado_em',
    atualizado_em: 'pc.atualizado_em',
  },
  'categorias': {
    id: 'pcc.id',
    codigo: 'pcc.codigo',
    nome: 'pcc.nome',
    tipo: 'pcc.tipo',
    nivel: 'pcc.nivel',
    ordem: 'pcc.ordem',
    ativo: 'pcc.ativo',
    criado_em: 'pcc.criado_em',
  },
  'segmentos': {
    id: 'pcs.id',
    codigo: 'pcs.codigo',
    nome: 'pcs.nome',
    ordem: 'pcs.ordem',
    separador: 'pcs.separador',
    ativo: 'pcs.ativo',
    criado_em: 'pcs.criado_em',
  },
  'centros-de-custo': {
    id: 'cc.id',
    codigo: 'cc.codigo',
    nome: 'cc.nome',
    criado_em: 'cc.criado_em',
    atualizado_em: 'cc.atualizado_em',
  },
  'centros-de-lucro': {
    id: 'cl.id',
    codigo: 'cl.codigo',
    nome: 'cl.nome',
    criado_em: 'cl.criado_em',
    atualizado_em: 'cl.atualizado_em',
  },
  'regras-contabeis': {
    id: 'r.id',
    origem: 'r.origem',
    subtipo: 'r.subtipo',
    categoria_financeira: 'cf.nome',
    codigo_conta_debito: 'd.codigo',
    conta_debito: 'd.nome',
    codigo_conta_credito: 'c.codigo',
    conta_credito: 'c.nome',
    descricao: 'r.descricao',
    automatico: 'r.automatico',
    ativo: 'r.ativo',
    criado_em: 'r.criado_em',
  },
}

const parseNumber = (v: string | null, fallback?: number) => (v ? Number(v) : fallback)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) {
      return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })
    }

    // Filtros comuns
    const de = searchParams.get('de') || undefined // YYYY-MM-DD
    const ate = searchParams.get('ate') || undefined // YYYY-MM-DD
    const cliente_id = searchParams.get('cliente_id') || undefined
    const fornecedor_id = searchParams.get('fornecedor_id') || undefined

    // Paginação
    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 1000) || 1000))
    const offset = (page - 1) * pageSize

    // Ordenação
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase()
    const orderWhitelist = ORDER_BY_WHITELIST[view] || {}
    const orderBy = orderWhitelist[orderByParam] || undefined
    const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC'

    // Montagem de SQL por view
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    const push = (expr: string, value: unknown) => {
      conditions.push(`${expr} $${idx}`)
      params.push(value)
      idx += 1
    }

    let baseSql = ''
    let whereDateCol = ''
    let selectSql = ''

    // Views com dados mockados: Balanço Patrimonial e DRE
    if (view === 'balanco-patrimonial') {
      const mock: Record<string, unknown>[] = [
        { grupo: 'Ativo Circulante', conta: 'Caixa e Equivalentes de Caixa', tipo: 'Ativo', nivel: 3, saldo_inicial: 120000, movimentos: 35000, saldo_final: 155000 },
        { grupo: 'Ativo Circulante', conta: 'Contas a Receber', tipo: 'Ativo', nivel: 3, saldo_inicial: 80000, movimentos: -10000, saldo_final: 70000 },
        { grupo: 'Ativo Não Circulante', conta: 'Imobilizado', tipo: 'Ativo', nivel: 2, saldo_inicial: 300000, movimentos: 20000, saldo_final: 320000 },
        { grupo: 'Passivo Circulante', conta: 'Fornecedores', tipo: 'Passivo', nivel: 3, saldo_inicial: 90000, movimentos: -15000, saldo_final: 75000 },
        { grupo: 'Passivo Não Circulante', conta: 'Empréstimos e Financiamentos', tipo: 'Passivo', nivel: 2, saldo_inicial: 200000, movimentos: -10000, saldo_final: 190000 },
        { grupo: 'Patrimônio Líquido', conta: 'Capital Social', tipo: 'PL', nivel: 1, saldo_inicial: 250000, movimentos: 0, saldo_final: 250000 },
        { grupo: 'Patrimônio Líquido', conta: 'Lucros/Prejuízos Acumulados', tipo: 'PL', nivel: 1, saldo_inicial: 50000, movimentos: 15000, saldo_final: 65000 },
      ]
      const total = mock.length
      const sliced = mock.slice(offset, offset + pageSize)
      return Response.json({
        success: true,
        view,
        page,
        pageSize,
        total,
        rows: sliced,
        sql: 'mock: balanco-patrimonial',
        params: JSON.stringify([]),
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (view === 'dre') {
      // DRE real a partir de lançamentos contábeis
      // Janela de período
      const today = new Date()
      const y = today.getFullYear()
      const m = String(today.getMonth() + 1).padStart(2, '0')
      const firstDay = `${y}-${m}-01`
      const from = de || firstDay
      const to = ate || new Date().toISOString().slice(0, 10)

      const dreSql = `
        WITH base AS (
          SELECT 
            lc.data_lancamento::date AS data_lancamento,
            DATE_TRUNC('month', lc.data_lancamento)::date AS periodo,
            pc.codigo,
            pc.tipo_conta,
            COALESCE(lcl.debito,0) AS debito,
            COALESCE(lcl.credito,0) AS credito
          FROM contabilidade.lancamentos_contabeis lc
          JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
          JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
          WHERE lc.data_lancamento::date BETWEEN $1::date AND $2::date
        )
        SELECT 
          TO_CHAR(periodo, 'YYYY-MM') AS periodo_key,
          CASE 
            WHEN codigo LIKE '4.1.%' THEN 'receita_operacional'
            WHEN codigo LIKE '4.2.%' THEN 'receita_outros'
            WHEN codigo LIKE '5.1.%' THEN 'cogs'
            WHEN codigo LIKE '5.2.%' THEN 'custos_operacionais'
            WHEN codigo LIKE '6.1.%' THEN 'despesas_adm'
            WHEN codigo LIKE '6.2.%' THEN 'despesas_comerciais'
            WHEN codigo LIKE '6.3.%' THEN 'despesas_financeiras'
            ELSE NULL
          END AS grupo,
          SUM(
            CASE WHEN tipo_conta IN ('Receita','Passivo','Patrimônio Líquido')
              THEN (credito - debito)
              ELSE (debito - credito)
            END
          ) AS valor
        FROM base
        GROUP BY 1,2
        ORDER BY 1,2
      `
      const dreRows = await runQuery<{ periodo_key: string; grupo: string | null; valor: number }>(dreSql, [from, to])
      // Construir períodos (ordenados)
      const periodKeys = Array.from(new Set(dreRows.map(r => r.periodo_key))).sort()
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
      const periods = periodKeys.map(k => {
        const [yy, mm] = k.split('-')
        const label = `${months[Number(mm)-1]}/${yy}`
        return { key: k, label }
      })

      const byGroup: Record<string, Record<string, number>> = {}
      for (const r of dreRows) {
        if (!r.grupo) continue
        if (!byGroup[r.grupo]) byGroup[r.grupo] = {}
        byGroup[r.grupo][r.periodo_key] = Number(r.valor || 0)
      }

      // Montar árvore DRE (mínima e coerente com seu plano)
      const node = (id: string, name: string, key: string) => ({ id, name, valuesByPeriod: byGroup[key] || {} })
      const data = [
        {
          id: 'receita',
          name: 'Receita',
          children: [
            node('receita-operacionais', 'Receitas Operacionais', 'receita_operacional'),
            node('receita-outras', 'Receitas Financeiras e Outras', 'receita_outros'),
          ],
        },
        {
          id: 'cogs',
          name: 'Custos dos Produtos/Operacionais (COGS)',
          children: [
            node('cogs-cmv', 'CMV (5.1)', 'cogs'),
            node('cogs-op', 'Custos Operacionais/Logística (5.2)', 'custos_operacionais'),
          ],
        },
        {
          id: 'opex',
          name: 'Despesas Operacionais',
          children: [
            node('desp-adm', 'Administrativas (6.1)', 'despesas_adm'),
            node('desp-com', 'Comerciais e Marketing (6.2)', 'despesas_comerciais'),
            node('desp-fin', 'Financeiras (6.3)', 'despesas_financeiras'),
          ],
        },
      ]

      return Response.json({
        success: true,
        view,
        periods,
        nodes: data,
        sql: dreRows.length ? 'ok' : 'sem movimentos',
        params: JSON.stringify([from, to]),
      }, { headers: { 'Cache-Control': 'no-store' } })
    }

    if (view === 'lancamentos') {
      baseSql = `FROM contabilidade.lancamentos_contabeis lc
                 LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl 
                        ON lcl.lancamento_id = lc.id`
      selectSql = `SELECT
                    lc.id AS lancamento_id,
                    lc.data_lancamento,
                    lc.historico,
                    lc.origem_tabela,
                    lc.origem_id,
                    lc.fornecedor_id,
                    lc.cliente_id,
                    lc.conta_financeira_id,
                    lc.total_debitos,
                    lc.total_creditos,
                    lcl.id AS linha_id,
                    lcl.conta_id,
                    lcl.debito,
                    lcl.credito,
                    lcl.historico AS historico_linha,
                    lcl.criado_em`
      whereDateCol = 'lc.data_lancamento'
      if (cliente_id) push('lc.cliente_id =', cliente_id)
      if (fornecedor_id) push('lc.fornecedor_id =', fornecedor_id)
  } else if (view === 'plano-contas') {
      baseSql = `FROM contabilidade.plano_contas pc
                 LEFT JOIN contabilidade.plano_contas pai ON pai.id = pc.conta_pai_id`
      selectSql = `SELECT
                    pc.id,
                    pc.codigo,
                    pc.nome,
                    CASE LEFT(pc.codigo, 1)
                      WHEN '1' THEN 'Ativo'
                      WHEN '2' THEN 'Passivo'
                      WHEN '3' THEN 'Patrimônio Líquido'
                      WHEN '4' THEN 'Receita'
                      WHEN '5' THEN 'Custo'
                      WHEN '6' THEN 'Despesa'
                      ELSE 'Outro'
                    END AS grupo_principal,
                    pc.nivel,
                    pc.aceita_lancamento,
                    pai.codigo AS codigo_pai,
                    pai.nome AS conta_pai,
                    pc.criado_em,
                    pc.atualizado_em`
      whereDateCol = 'pc.criado_em'
    } else if (view === 'categorias') {
      baseSql = `FROM contabilidade.plano_contas_categorias pcc`
      selectSql = `SELECT
                    pcc.id,
                    pcc.codigo,
                    pcc.nome,
                    pcc.tipo,
                    pcc.nivel,
                    pcc.categoria_pai_id,
                    pcc.ordem,
                    pcc.ativo,
                    pcc.criado_em`
      whereDateCol = 'pcc.criado_em'
    } else if (view === 'segmentos') {
      baseSql = `FROM contabilidade.plano_contas_segmentos pcs`
      selectSql = `SELECT
                    pcs.id,
                    pcs.codigo,
                    pcs.nome,
                    pcs.ordem,
                    pcs.separador,
                    pcs.ativo,
                    pcs.criado_em`
      whereDateCol = 'pcs.criado_em'
    } else if (view === 'centros-de-custo') {
      baseSql = `FROM contabilidade.centros_custo cc`
      selectSql = `SELECT
                    cc.id,
                    cc.codigo,
                    cc.nome,
                    CASE WHEN cc.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                    cc.criado_em,
                    cc.atualizado_em`
      whereDateCol = 'cc.criado_em'
    } else if (view === 'centros-de-lucro') {
      baseSql = `FROM contabilidade.centros_lucro cl`
      selectSql = `SELECT
                    cl.id,
                    cl.codigo,
                    cl.nome,
                    CASE WHEN cl.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                    cl.criado_em,
                    cl.atualizado_em`
      whereDateCol = 'cl.criado_em'
    } else if (view === 'regras-contabeis') {
      baseSql = `FROM contabilidade.regras_contabeis r
                 LEFT JOIN administrativo.categorias_financeiras cf ON r.categoria_financeira_id = cf.id
                 LEFT JOIN contabilidade.plano_contas d ON r.conta_debito_id = d.id
                 LEFT JOIN contabilidade.plano_contas c ON r.conta_credito_id = c.id`
      selectSql = `SELECT
                    r.id,
                    r.origem,
                    r.subtipo,
                    COALESCE(cf.nome, '— Todas —') AS categoria_financeira,
                    d.codigo AS codigo_conta_debito,
                    d.nome AS conta_debito,
                    c.codigo AS codigo_conta_credito,
                    c.nome AS conta_credito,
                    r.descricao,
                    r.automatico,
                    r.ativo,
                    r.criado_em`
      whereDateCol = 'r.criado_em'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    if (de) push(`${whereDateCol} >=`, de)
    if (ate) push(`${whereDateCol} <=`, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    let defaultOrder = ''
    if (view === 'lancamentos') defaultOrder = 'ORDER BY lc.data_lancamento DESC, lc.id DESC'
    else if (view === 'plano-contas') defaultOrder = 'ORDER BY pc.codigo::text COLLATE "C"'
    else if (view === 'categorias') defaultOrder = 'ORDER BY pcc.tipo ASC, pcc.nivel ASC, pcc.ordem ASC'
    else if (view === 'segmentos') defaultOrder = 'ORDER BY pcs.ordem ASC'
    else if (view === 'centros-de-custo') defaultOrder = 'ORDER BY cc.codigo ASC'
    else if (view === 'centros-de-lucro') defaultOrder = 'ORDER BY cl.codigo ASC'
    else if (view === 'regras-contabeis') defaultOrder = `ORDER BY CASE 
                                                                WHEN r.origem = 'contas_a_pagar' THEN 1
                                                                WHEN r.origem = 'pagamentos_efetuados' THEN 2
                                                                WHEN r.origem = 'contas_a_receber' THEN 3
                                                                WHEN r.origem = 'pagamentos_recebidos' THEN 4
                                                                ELSE 5
                                                              END, r.id ASC`

    const orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : defaultOrder
    const limitOffsetClause = `LIMIT $${idx}::int OFFSET $${idx + 1}::int`
    const paramsWithPage = [...params, pageSize, offset]

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${orderClause}
                     ${limitOffsetClause}`.replace(/\s+$/m, '').trim()

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)

    const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
    const totalRows = await runQuery<{ total: number }>(totalSql, params)
    const total = totalRows[0]?.total ?? 0

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
      sql: listSql,
      params: JSON.stringify(paramsWithPage),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📊 API /api/modulos/contabilidade error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
