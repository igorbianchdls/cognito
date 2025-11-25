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
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

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

    let selectSql = ''
    let baseSql = ''
    let groupBy = ''
    let whereDateCol = ''

    if (view === 'ordens-servico') {
      // Query alinhada ao modelo fornecido pelo usuário
      selectSql = `SELECT
        os.id AS id,
        os.tenant_id,
        os.cliente_id AS cliente_id,
        cli.nome_fantasia AS cliente,
        os.tecnico_responsavel_id AS tecnico_id,
        func.nome AS tecnico_responsavel,
        os.pedido_id,
        os.data_abertura,
        os.data_agendada AS data_prevista,
        os.data_conclusao,
        os.status,
        os.prioridade,
        os.descricao_problema,
        os.observacoes,
        os.criado_em,
        os.atualizado_em,
        os.id::text AS numero_os`;
      baseSql = `FROM servicos.ordens_servico os
                 LEFT JOIN entidades.clientes cli ON cli.id = os.cliente_id
                 LEFT JOIN entidades.funcionarios func ON func.id = os.tecnico_responsavel_id`;
      whereDateCol = 'os.data_abertura'
      if (tenant_id) push('os.tenant_id =', tenant_id)
      if (status) push('LOWER(os.status) =', status.toLowerCase())
      if (prioridade) push('LOWER(os.prioridade) =', prioridade.toLowerCase())
      if (cliente_id) push('os.cliente_id =', cliente_id)
      if (tecnico_id) push('os.tecnico_responsavel_id =', tecnico_id)
      if (q) {
        conditions.push(`(CAST(os.id AS TEXT) ILIKE '%' || $${i} || '%' OR COALESCE(os.descricao_problema,'') ILIKE '%' || $${i} || '%' OR COALESCE(cli.nome_fantasia,'') ILIKE '%' || $${i} || '%' OR COALESCE(func.nome,'') ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }
    } else if (view === 'servicos-executados') {
      selectSql = `SELECT os.numero_os,
                          s.nome AS servico,
                          c.nome_fantasia AS cliente,
                          t.nome AS tecnico,
                          ose.quantidade,
                          ose.valor_total,
                          ose.criado_em AS data_execucao`;
      baseSql = `FROM servicos.os_servicos_executados ose
                 LEFT JOIN servicos.ordens_servico os ON os.id = ose.ordem_servico_id
                 LEFT JOIN servicos.servicos s ON s.id = ose.servico_id
                 LEFT JOIN servicos.clientes c ON c.id = os.cliente_id
                 LEFT JOIN servicos.tecnicos t ON t.id = os.tecnico_responsavel_id`;
      whereDateCol = 'ose.criado_em'
      if (tenant_id) push('os.tenant_id =', tenant_id)
      if (cliente_id) push('os.cliente_id =', cliente_id)
      if (tecnico_id) push('os.tecnico_responsavel_id =', tecnico_id)
      if (q) {
        conditions.push(`(os.numero_os ILIKE '%' || $${i} || '%' OR COALESCE(s.nome,'') ILIKE '%' || $${i} || '%' OR COALESCE(c.nome_fantasia,'') ILIKE '%' || $${i} || '%' OR COALESCE(t.nome,'') ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }
    } else if (view === 'itens-materiais') {
      selectSql = `SELECT os.numero_os,
                          p.nome AS item,
                          cat.nome AS categoria,
                          oim.quantidade,
                          oim.custo_unitario,
                          oim.custo_total`;
      baseSql = `FROM servicos.os_itens_materiais oim
                 LEFT JOIN servicos.ordens_servico os ON os.id = oim.ordem_servico_id
                 LEFT JOIN produtos.produto p ON p.id = oim.produto_id
                 LEFT JOIN produtos.categorias cat ON cat.id = p.categoria_id`;
      whereDateCol = 'oim.criado_em'
      if (tenant_id) push('os.tenant_id =', tenant_id)
      if (cliente_id) push('os.cliente_id =', cliente_id)
      if (q) {
        conditions.push(`(os.numero_os ILIKE '%' || $${i} || '%' OR COALESCE(p.nome,'') ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }
    } else if (view === 'tecnicos') {
      // Técnicos com contagem de OS e somatório de horas a partir de os_tecnicos
      selectSql = `SELECT tec.id AS id,
                          tec.nome AS tecnico,
                          tec.imagem_url AS tecnico_imagem_url,
                          tec.cargo,
                          tec.especialidade,
                          tec.custo_hora,
                          tec.telefone,
                          tec.email,
                          tec.status,
                          COUNT(DISTINCT os.id) AS ordens_servico,
                          COALESCE(SUM(ot.horas_trabalhadas), 0) AS horas_trabalhadas,
                          tec.data_admissao AS admissao`;
      baseSql = `FROM servicos.tecnicos tec
                 LEFT JOIN servicos.os_tecnicos ot ON ot.tecnico_id = tec.id
                 LEFT JOIN servicos.ordens_servico os ON os.id = ot.ordem_servico_id`;
      whereDateCol = 'tec.data_admissao'
      // Se houver tenant_id, filtramos por relação em os_tecnicos
      if (tenant_id) push('ot.tenant_id =', tenant_id)
      groupBy = 'GROUP BY tec.id, tec.nome, tec.imagem_url, tec.cargo, tec.especialidade, tec.custo_hora, tec.telefone, tec.email, tec.status, tec.data_admissao'
      if (status) push('LOWER(tec.status) =', status.toLowerCase())
      if (q) {
        conditions.push(`(tec.nome ILIKE '%' || $${i} || '%' OR tec.especialidade ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }
    } else if (view === 'checklist') {
      selectSql = `SELECT oc.item,
                          CASE WHEN oc.concluido THEN 'Concluído' ELSE 'Pendente' END AS status,
                          COALESCE(t.nome, '—') AS responsavel,
                          COALESCE(oc.atualizado_em, oc.criado_em) AS data,
                          oc.observacao AS observacoes`;
      baseSql = `FROM servicos.os_checklist oc
                 LEFT JOIN servicos.ordens_servico os ON os.id = oc.ordem_servico_id
                 LEFT JOIN servicos.tecnicos t ON t.id = os.tecnico_responsavel_id`;
      whereDateCol = 'oc.atualizado_em'
      if (tenant_id) push('os.tenant_id =', tenant_id)
      if (q) {
        conditions.push(`(oc.item ILIKE '%' || $${i} || '%' OR COALESCE(oc.observacao,'') ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    if (de && whereDateCol) push(`${whereDateCol} >=`, de)
    if (ate && whereDateCol) push(`${whereDateCol} <=`, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    let orderClause = ''
    if (orderBy) orderClause = `ORDER BY ${orderBy} ${orderDir}`
    else {
      if (view === 'ordens-servico') orderClause = 'ORDER BY os.id DESC'
      else if (view === 'servicos-executados') orderClause = 'ORDER BY ose.criado_em DESC'
      else if (view === 'itens-materiais') orderClause = 'ORDER BY oim.criado_em DESC'
      else if (view === 'tecnicos') orderClause = 'ORDER BY tec.nome ASC'
      else if (view === 'checklist') orderClause = 'ORDER BY COALESCE(oc.atualizado_em, oc.criado_em) DESC'
    }

    // Paginação: somente para lista principal de OS
    const paginate = view === 'ordens-servico'
    const limitOffset = paginate ? `LIMIT $${i}::int OFFSET $${i + 1}::int` : ''
    const paramsWithPage = paginate ? [...params, pageSize, offset] : params

    const listSql = `${selectSql}
                     ${baseSql}
                     ${whereClause}
                     ${groupBy}
                     ${orderClause}
                     ${limitOffset}`.replace(/\s+$/m, '').trim()

    const rows = await runQuery<Record<string, unknown>>(listSql, paramsWithPage)

    let total = rows.length
    if (!groupBy && paginate) {
      const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
      const totalRows = await runQuery<{ total: number }>(totalSql, params)
      total = totalRows[0]?.total ?? 0
    }

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
