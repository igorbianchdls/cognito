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
    codigo_conta: 'pc.codigo',
    nome_conta: 'pc.nome',
    debito: 'lcl.debito',
    credito: 'lcl.credito',
    criado_em: 'lc.criado_em',
  },
  'plano-contas': {
    id: 'pc.id',
    codigo: 'pc.codigo',
    nome: 'pc.nome',
    tipo_conta: 'pc.tipo_conta',
    nivel: 'pc.nivel',
    aceita_lancamento: 'pc.aceita_lancamento',
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
    id: 'rc.id',
    tipo_operacao: 'rc.tipo_operacao',
    descricao: 'rc.descricao',
    categoria_financeira_id: 'rc.categoria_financeira_id',
    criado_em: 'rc.criado_em',
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
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 50) || 50))
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

    if (view === 'lancamentos') {
      baseSql = `FROM contabilidade.lancamentos_contabeis lc
                 LEFT JOIN contabilidade.lancamentos_contabeis_linhas lcl ON lcl.lancamento_id = lc.id
                 LEFT JOIN contabilidade.plano_contas pc ON pc.id = lcl.conta_id
                 LEFT JOIN contabilidade.centros_custo cc ON cc.id = lcl.centro_custo_id
                 LEFT JOIN contabilidade.centros_lucro cl ON cl.id = lcl.centro_lucro_id`
      selectSql = `SELECT
                    lc.id AS lancamento_id,
                    lc.data_lancamento,
                    lc.historico AS historico_geral,
                    lc.tipo_origem,
                    lc.documento_origem,
                    lc.origem_schema,
                    lc.origem_tabela,
                    lc.origem_id,
                    lc.cliente_id,
                    lc.fornecedor_id,
                    lcl.id AS linha_id,
                    pc.codigo AS codigo_conta,
                    pc.nome AS nome_conta,
                    pc.tipo_conta,
                    lcl.debito,
                    lcl.credito,
                    (COALESCE(lcl.debito,0) - COALESCE(lcl.credito,0)) AS saldo,
                    cc.nome AS centro_custo,
                    cl.nome AS centro_lucro,
                    lcl.historico AS historico_linha,
                    lc.criado_em`
      whereDateCol = 'lc.data_lancamento'
      if (cliente_id) push('lc.cliente_id =', cliente_id)
      if (fornecedor_id) push('lc.fornecedor_id =', fornecedor_id)
    } else if (view === 'plano-contas') {
      baseSql = `FROM contabilidade.plano_contas pc
                 LEFT JOIN contabilidade.plano_contas_categorias pcc ON pcc.id = pc.categoria_id
                 LEFT JOIN contabilidade.plano_contas_segmentos pcs ON pcs.id = pc.segmento_id
                 LEFT JOIN contabilidade.plano_contas pai ON pai.id = pc.conta_pai_id`
      selectSql = `SELECT
                    pc.id,
                    pc.codigo,
                    pc.nome,
                    pc.tipo_conta,
                    pcc.nome AS categoria,
                    pcs.nome AS segmento,
                    pc.conta_pai_id,
                    pai.nome AS conta_pai,
                    pc.nivel,
                    pc.aceita_lancamento,
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
      baseSql = `FROM contabilidade.regras_contabeis rc
                 LEFT JOIN contabilidade.plano_contas cd ON cd.id = rc.conta_debito_id
                 LEFT JOIN contabilidade.plano_contas cc ON cc.id = rc.conta_credito_id
                 LEFT JOIN contabilidade.centros_custo ccc ON ccc.id = rc.centro_custo_id`
      selectSql = `SELECT
                    rc.id,
                    rc.tenant_id,
                    rc.tipo_operacao,
                    rc.descricao,
                    rc.categoria_financeira_id,
                    cd.codigo AS codigo_conta_debito,
                    cd.nome AS conta_debito,
                    cc.codigo AS codigo_conta_credito,
                    cc.nome AS conta_credito,
                    ccc.nome AS centro_custo,
                    CASE WHEN rc.ativo THEN 'Ativa' ELSE 'Inativa' END AS status_regra,
                    rc.criado_em`
      whereDateCol = 'rc.criado_em'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    if (de) push(`${whereDateCol} >=`, de)
    if (ate) push(`${whereDateCol} <=`, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    let defaultOrder = ''
    if (view === 'lancamentos') defaultOrder = 'ORDER BY lc.data_lancamento DESC, lc.id DESC'
    else if (view === 'plano-contas') defaultOrder = 'ORDER BY pc.codigo ASC'
    else if (view === 'categorias') defaultOrder = 'ORDER BY pcc.tipo ASC, pcc.nivel ASC, pcc.ordem ASC'
    else if (view === 'segmentos') defaultOrder = 'ORDER BY pcs.ordem ASC'
    else if (view === 'centros-de-custo') defaultOrder = 'ORDER BY cc.codigo ASC'
    else if (view === 'centros-de-lucro') defaultOrder = 'ORDER BY cl.codigo ASC'
    else if (view === 'regras-contabeis') defaultOrder = 'ORDER BY rc.tipo_operacao ASC, rc.id ASC'

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
