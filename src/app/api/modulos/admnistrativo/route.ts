import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Whitelist para ordenação segura por view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'despesas': {
    id: 'd.id',
    descricao_despesa: 'd.descricao',
    valor_total: 'd.valor_total',
    data_competencia: 'd.data_competencia',
    data_vencimento: 'd.data_vencimento',
    status: 'd.status',
    categoria: 'cf.nome',
    fornecedor: 'f.nome',
    centro_custo: 'cc.nome',
    projeto: 'p.nome',
    criado_em: 'd.criado_em',
  },
  'contratos': {
    id: 'c.id',
    descricao: 'c.descricao',
    data_inicio: 'c.data_inicio',
    data_fim: 'c.data_fim',
    status: 'c.status',
    fornecedor: 'f.nome',
    categoria: 'cf.nome',
    centro_custo: 'cc.nome',
    departamento: 'dp.nome',
    projeto: 'pj.nome',
    filial: 'fl.nome',
    criado_em: 'c.criado_em',
  },
  'reembolsos': {
    id: 'r.id',
    tenant_id: 'r.tenant_id',
    funcionario: 'f.nome_razao_social',
    tipo: 'r.tipo',
    valor_total: 'r.valor_total',
    status: 'r.status',
    incluir_na_folha: 'r.incluir_na_folha',
    criado_em: 'r.criado_em',
    centro_custo: 'cc.nome',
    departamento: 'dp.nome',
    projeto: 'pj.nome',
    linha_id: 'rl.id',
    descricao_linha: 'rl.descricao',
    categoria: 'cf.nome',
    valor_linha: 'rl.valor',
    data_despesa: 'rl.data_despesa',
  },
  'obrigacoes-legais': {
    id: 'o.id',
    tipo_obrigacao: 't.nome',
    descricao_obrigacao: 'o.descricao',
    data_vencimento: 'o.data_vencimento',
    valor: 'o.valor',
    status: 'o.status',
    responsavel: 'f.nome_razao_social',
    categoria: 'cf.nome',
    criado_em: 'o.criado_em',
  },
  'documentos': {
    id: 'doc.id',
    origem_schema: 'doc.origem_schema',
    origem_tabela: 'doc.origem_tabela',
    origem_id: 'doc.origem_id',
    tipo_documento: 'doc.tipo_documento',
    numero_documento: 'doc.numero_documento',
    descricao: 'doc.descricao',
    data_emissao: 'doc.data_emissao',
    valor_total: 'doc.valor_total',
    arquivo_url: 'doc.arquivo_url',
    status: 'doc.status',
    criado_em: 'doc.criado_em',
  },
  'categorias': {
    id: 'cf.id',
    categoria: 'cf.nome',
    tipo: 'cf.tipo',
    descricao: 'cf.descricao',
    ativo: 'cf.ativo',
    conta_contabil_id: 'cf.conta_contabil_id',
    codigo_conta: 'pc.codigo',
    nome_conta_contabil: 'pc.nome',
    criado_em: 'cf.criado_em',
    atualizado_em: 'cf.atualizado_em',
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

    // Setup de SQL por view
    const conditions: string[] = []
    const params: unknown[] = []
    let idx = 1

    const push = (expr: string, value: unknown) => {
      conditions.push(`${expr} $${idx}`)
      params.push(value)
      idx += 1
    }

    let baseSql = ''
    let selectSql = ''
    let whereDateCol = ''

    if (view === 'despesas') {
      baseSql = `FROM administrativo.despesas d
                 LEFT JOIN administrativo.categorias_financeiras cf ON d.categoria_id = cf.id
                 LEFT JOIN entidades.fornecedores f ON d.fornecedor_id = f.id
                 LEFT JOIN empresa.centros_custo cc ON d.centro_custo_id = cc.id
                 LEFT JOIN administrativo.projetos p ON d.projeto_id = p.id`
      selectSql = `SELECT 
                    d.id,
                    d.descricao AS descricao_despesa,
                    d.valor_total,
                    d.data_competencia,
                    d.data_vencimento,
                    d.status,
                    cf.nome AS categoria,
                    f.nome AS fornecedor,
                    cc.nome AS centro_custo,
                    p.nome AS projeto,
                    d.criado_em`
      whereDateCol = 'd.data_vencimento'
    } else if (view === 'contratos') {
      baseSql = `FROM administrativo.contratos c
                 LEFT JOIN entidades.fornecedores f ON c.fornecedor_id = f.id
                 LEFT JOIN administrativo.categorias_financeiras cf ON c.categoria_id = cf.id
                 LEFT JOIN empresa.centros_custo cc ON c.centro_custo_id = cc.id
                 LEFT JOIN empresa.departamentos dp ON c.departamento_id = dp.id
                 LEFT JOIN administrativo.projetos pj ON c.projeto_id = pj.id
                 LEFT JOIN empresa.filiais fl ON c.filial_id = fl.id`
      selectSql = `SELECT
                    c.id,
                    c.descricao,
                    c.data_inicio,
                    c.data_fim,
                    c.status,
                    f.nome AS fornecedor,
                    cf.nome AS categoria,
                    cc.nome AS centro_custo,
                    dp.nome AS departamento,
                    pj.nome AS projeto,
                    fl.nome AS filial,
                    c.criado_em`
      whereDateCol = 'c.data_inicio'
    } else if (view === 'reembolsos') {
      baseSql = `FROM administrativo.reembolsos r
                 LEFT JOIN administrativo.reembolsos_linhas rl ON rl.obrigacao_id = r.id
                 LEFT JOIN administrativo.categorias_financeiras cf ON rl.categoria_id = cf.id
                 LEFT JOIN entidades.funcionarios f ON r.funcionario_id = f.id
                 LEFT JOIN empresa.centros_custo cc ON r.centro_custo_id = cc.id
                 LEFT JOIN empresa.departamentos dp ON r.departamento_id = dp.id
                 LEFT JOIN administrativo.projetos pj ON r.projeto_id = pj.id`
      selectSql = `SELECT
                    r.id,
                    r.tenant_id,
                    f.nome_razao_social AS funcionario,
                    f.imagem_url AS funcionario_imagem_url,
                    r.tipo,
                    r.valor_total,
                    r.status,
                    r.incluir_na_folha,
                    r.criado_em,
                    cc.nome AS centro_custo,
                    dp.nome AS departamento,
                    pj.nome AS projeto,
                    rl.id AS linha_id,
                    rl.descricao AS descricao_linha,
                    cf.nome AS categoria,
                    rl.valor AS valor_linha,
                    rl.data_despesa`
      whereDateCol = 'r.criado_em'
    } else if (view === 'obrigacoes-legais') {
      baseSql = `FROM administrativo.obrigacoes_legais o
                 LEFT JOIN administrativo.obrigacoes_legais_tipos t ON o.tipo_id = t.id
                 LEFT JOIN entidades.funcionarios f ON o.responsavel_id = f.id
                 LEFT JOIN administrativo.categorias_financeiras cf ON o.categoria_id = cf.id`
      selectSql = `SELECT 
                    o.id,
                    t.nome AS tipo_obrigacao,
                    o.descricao AS descricao_obrigacao,
                    o.data_vencimento,
                    o.valor,
                    o.status,
                    f.nome_razao_social AS responsavel,
                    cf.nome AS categoria,
                    o.criado_em`
      whereDateCol = 'o.data_vencimento'
    } else if (view === 'documentos') {
      baseSql = `FROM administrativo.documentos doc`
      selectSql = `SELECT 
                    doc.id,
                    doc.origem_schema,
                    doc.origem_tabela,
                    doc.origem_id,
                    doc.tipo_documento,
                    doc.numero_documento,
                    doc.descricao,
                    doc.data_emissao,
                    doc.valor_total,
                    doc.arquivo_url,
                    doc.status,
                    doc.criado_em`
      whereDateCol = 'doc.criado_em'
    } else if (view === 'categorias') {
      baseSql = `FROM administrativo.categorias_financeiras cf
                 LEFT JOIN contabilidade.plano_contas pc ON cf.conta_contabil_id = pc.id`
      selectSql = `SELECT 
                    cf.id,
                    cf.nome AS categoria,
                    cf.tipo,
                    cf.descricao,
                    cf.ativo,
                    cf.conta_contabil_id,
                    pc.codigo AS codigo_conta,
                    pc.nome AS nome_conta_contabil,
                    cf.criado_em,
                    cf.atualizado_em`
      whereDateCol = 'cf.criado_em'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    if (de) push(`${whereDateCol} >=`, de)
    if (ate) push(`${whereDateCol} <=`, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    let defaultOrder = ''
    if (view === 'despesas') defaultOrder = 'ORDER BY d.data_vencimento ASC'
    else if (view === 'contratos') defaultOrder = 'ORDER BY c.data_inicio DESC'
    else if (view === 'reembolsos') defaultOrder = 'ORDER BY r.criado_em DESC'
    else if (view === 'obrigacoes-legais') defaultOrder = 'ORDER BY o.data_vencimento ASC'
    else if (view === 'documentos') defaultOrder = 'ORDER BY doc.criado_em DESC'
    else if (view === 'categorias') defaultOrder = 'ORDER BY cf.tipo ASC, cf.nome ASC'
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
    console.error('📊 API /api/modulos/admnistrativo error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}
