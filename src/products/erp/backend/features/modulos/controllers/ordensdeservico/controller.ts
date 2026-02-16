import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Ordenação permitida por view e coluna exposta → coluna SQL
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  'ordens-servico': {
    id: 'os.id',
    numero_os: 'os.id',
    cliente: 'cli.nome_fantasia',
    tecnico_responsavel: 'func.nome',
    status: 'os.status',
    prioridade: 'os.prioridade',
    data_abertura: 'os.data_abertura',
    data_prevista: 'os.data_agendada',
    data_conclusao: 'os.data_conclusao',
  },
  'servicos-executados': {
    numero_os: 'os.numero_os',
    servico: 's.nome',
    cliente: 'c.nome_fantasia',
    tecnico: 't.nome',
    quantidade: 'ose.quantidade',
    valor_total: 'ose.valor_total',
    data_execucao: 'ose.criado_em',
  },
  'itens-materiais': {
    numero_os: 'os.numero_os',
    item: 'p.nome',
    categoria: 'cat.nome',
    quantidade: 'oim.quantidade',
    custo_unitario: 'oim.custo_unitario',
    custo_total: 'oim.custo_total',
  },
  tecnicos: {
    id: 'tec.id',
    tecnico: 'tec.nome',
    cargo: 'tec.cargo',
    especialidade: 'tec.especialidade',
    custo_hora: 'tec.custo_hora',
    status: 'tec.status',
    admissao: 'tec.data_admissao',
    ordens_servico: 'ordens_servico',
    horas_trabalhadas: 'horas_trabalhadas',
  },
  checklist: {
    item: 'oc.item',
    status: 'oc.concluido',
    responsavel: 't.nome',
    data: 'COALESCE(oc.atualizado_em, oc.criado_em)',
  },
}

const parseNumber = (v: string | null, fb?: number) => (v ? Number(v) : fb)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || 'ordens-servico').toLowerCase()

    // Filtros comuns
    const de = searchParams.get('de') || undefined
    const ate = searchParams.get('ate') || undefined
    const q = searchParams.get('q') || undefined

    // Filtros específicos de OS
    const tenant_id = searchParams.get('tenant_id') || undefined
    const status = searchParams.get('status') || undefined
    const prioridade = searchParams.get('prioridade') || undefined
    const cliente_id = searchParams.get('cliente_id') || undefined
    const tecnico_id = searchParams.get('tecnico_id') || undefined
    const valor_min = parseNumber(searchParams.get('valor_min'))
    const valor_max = parseNumber(searchParams.get('valor_max'))

    const page = Math.max(1, parseNumber(searchParams.get('page'), 1) || 1)
    const pageSize = Math.max(1, Math.min(1000, parseNumber(searchParams.get('pageSize'), 20) || 20))
    const offset = (page - 1) * pageSize

    const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
    const orderDirParam = (searchParams.get('order_dir') || 'desc').toLowerCase()
    const whitelist = ORDER_BY_WHITELIST[view] || {}
    const orderBy = whitelist[orderByParam] || undefined
    const orderDir = orderDirParam === 'asc' ? 'ASC' : 'DESC'

    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => {
      conditions.push(`${expr} $${i}`)
      params.push(val)
      i += 1
    }

    const selectSql = ''
    const baseSql = ''
    const groupBy = ''
    const whereDateCol = ''
    let rawSql: string | null = null

    if (view === 'ordens-servico') {
      // Usa EXATAMENTE a query fornecida, sem alterar, filtrar ou paginar
      rawSql = `SELECT
    os.id,
    os.tenant_id,

    -- Cliente
    os.cliente_id,
    cli.nome_fantasia AS cliente_nome,

    -- Técnico responsável
    os.tecnico_responsavel_id,
    func.nome AS tecnico_nome,

    os.pedido_id,
    os.data_abertura,
    os.data_agendada,
    os.data_conclusao,
    os.status,
    os.prioridade,
    os.descricao_problema,
    os.observacoes,
    os.criado_em,
    os.atualizado_em

FROM servicos.ordens_servico os

-- JOIN cliente
LEFT JOIN entidades.clientes cli
       ON cli.id = os.cliente_id

-- JOIN técnico
LEFT JOIN entidades.funcionarios func
       ON func.id = os.tecnico_responsavel_id

ORDER BY os.id DESC;`
    } else if (view === 'servicos-executados') {
      // Usa EXATAMENTE a query fornecida para Serviços Executados
      rawSql = `SELECT
    ose.id,
    ose.tenant_id,

    -- Ordem de Serviço
    ose.ordem_servico_id,

    -- Serviço
    ose.servico_id,
    serv.nome AS servico_nome,

    -- Categoria do serviço
    cat.nome AS categoria_servico,

    -- Quantidade e valores
    ose.quantidade,
    ose.valor_unitario,
    ose.valor_total,

    ose.criado_em,
    ose.atualizado_em

FROM servicos.os_servicos_executados ose
LEFT JOIN servicos.catalogo_servicos serv
       ON serv.id = ose.servico_id
LEFT JOIN servicos.categorias_servicos cat
       ON cat.id = serv.categoria_id

ORDER BY ose.id DESC;`
    } else if (view === 'itens-materiais') {
      // Usa EXATAMENTE a query fornecida para Itens Materiais
      rawSql = `SELECT
    osm.id,
    osm.tenant_id,

    -- Ordem de Serviço
    osm.ordem_servico_id,

    -- Produto
    osm.produto_id,
    prod.nome AS produto_nome,

    -- Quantidades e custos
    osm.quantidade,
    osm.custo_unitario,
    osm.custo_total,

    osm.criado_em,
    osm.atualizado_em

FROM servicos.os_itens_materiais osm
LEFT JOIN produtos.produto prod
       ON prod.id = osm.produto_id

ORDER BY osm.id DESC;`
    } else if (view === 'tecnicos') {
      // Usa EXATAMENTE a query fornecida para Técnicos da OS
      rawSql = `SELECT
    ost.id,
    ost.tenant_id,

    -- Ordem de Serviço
    ost.ordem_servico_id,

    -- Técnico
    ost.tecnico_id,
    func.nome AS tecnico_nome,

    -- Horários
    ost.hora_inicio,
    ost.hora_fim,
    ost.horas_trabalhadas,

    ost.criado_em,
    ost.atualizado_em

FROM servicos.os_tecnicos ost
LEFT JOIN entidades.funcionarios func
       ON func.id = ost.tecnico_id

ORDER BY ost.id DESC;`
    } else if (view === 'checklist') {
      // Usa EXATAMENTE a query fornecida para Checklist
      rawSql = `SELECT
    chk.id,
    chk.tenant_id,

    -- Ordem de Serviço
    chk.ordem_servico_id,

    -- Dados do checklist
    chk.item,
    chk.concluido,
    chk.observacao,

    chk.criado_em,
    chk.atualizado_em

FROM servicos.os_checklist chk
ORDER BY chk.id DESC;`
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    if (de && whereDateCol) push(`${whereDateCol} >=`, de)
    if (ate && whereDateCol) push(`${whereDateCol} <=`, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    let orderClause = ''
    if (!rawSql) {
      if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}`
      else {
        if (view === 'servicos-executados') orderClause = 'ORDER BY ose.criado_em DESC'
        else if (view === 'itens-materiais') orderClause = 'ORDER BY oim.criado_em DESC'
        else if (view === 'tecnicos') orderClause = 'ORDER BY tec.nome ASC'
        else if (view === 'checklist') orderClause = 'ORDER BY COALESCE(oc.atualizado_em, oc.criado_em) DESC'
      }
    }

    // Sem paginação quando usando RAW SQL; parâmetros ignorados
    const limitOffset = ''
    const paramsWithPage = params

    const listSql = rawSql ?? `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${groupBy}
                     ${orderClause}
                     ${limitOffset}`.replace(/\s+$/m, '').trim()

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)

    const total = rows.length

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
    console.error('🛠️ API /api/modulos/ordensdeservico error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}
