import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

const SERVICOS_SCHEMA = process.env.SERVICOS_SCHEMA || 'servicos'

const fmtParams = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]')

type BaseFilters = {
  limit?: number
  de?: string
  ate?: string
  q?: string
}

function buildWhere(
  push: (expr: string, val: unknown) => void,
  opts: { de?: string; ate?: string; dateCol?: string }
) {
  const { de, ate, dateCol } = opts
  if (de && dateCol) push(`${dateCol} >=`, de)
  if (ate && dateCol) push(`${dateCol} <=`, ate)
}

export const listarOrdensDeServico = tool({
  description: 'Lista Ordens de Serviço com filtros básicos',
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    prioridade: z.string().optional(),
    tecnico_id: z.string().optional(),
    cliente_id: z.string().optional(),
    valor_min: z.number().optional(),
    valor_max: z.number().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, prioridade, tecnico_id, cliente_id, valor_min, valor_max, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT os.id,
                              os.numero_os,
                              c.nome_fantasia AS cliente,
                              t.nome AS tecnico_responsavel,
                              os.status,
                              os.prioridade,
                              os.descricao_problema,
                              os.data_abertura,
                              os.data_prevista,
                              os.data_conclusao,
                              os.valor_estimado,
                              os.valor_final`
    const baseSql = `FROM ${SERVICOS_SCHEMA}.ordens_servico os
                     LEFT JOIN ${SERVICOS_SCHEMA}.clientes c ON os.cliente_id = c.id
                     LEFT JOIN ${SERVICOS_SCHEMA}.tecnicos t ON os.tecnico_responsavel_id = t.id`

    if (status) push('LOWER(os.status) =', status.toLowerCase())
    if (prioridade) push('LOWER(os.prioridade) =', prioridade.toLowerCase())
    if (tecnico_id) push('os.tecnico_responsavel_id =', tecnico_id)
    if (cliente_id) push('os.cliente_id =', cliente_id)
    if (valor_min !== undefined) push('COALESCE(os.valor_final, os.valor_estimado) >=', valor_min)
    if (valor_max !== undefined) push('COALESCE(os.valor_final, os.valor_estimado) <=', valor_max)
    if (q) {
      conditions.push(`(os.numero_os ILIKE '%' || $${i} || '%' OR COALESCE(os.descricao_problema,'') ILIKE '%' || $${i} || '%' OR COALESCE(c.nome_fantasia,'') ILIKE '%' || $${i} || '%')`)
      params.push(q)
      i += 1
    }
    buildWhere(push, { de, ate, dateCol: 'os.data_abertura' })

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]
    const orderClause = 'ORDER BY os.data_abertura DESC'

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      const baseTitle = 'Ordens de Serviço'
      let periodStr = ''
      if (de && ate) periodStr = `${de} a ${ate}`
      else if (de) periodStr = `desde ${de}`
      else if (ate) periodStr = `até ${ate}`
      let mainFilter = ''
      if (status) mainFilter = `Status ${status}`
      else if (tecnico_id) mainFilter = `Técnico ${tecnico_id}`
      else if (cliente_id) mainFilter = `Cliente ${cliente_id}`
      else if (prioridade) mainFilter = `Prioridade ${prioridade}`
      else if (q) mainFilter = `Busca "${q}"`
      const title = [baseTitle, periodStr, mainFilter].filter(Boolean).join(' · ')
      return { success: true, message: `✅ ${rows.length} OS encontradas`, count: rows.length, rows, title, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar Ordens de Serviço', error: error instanceof Error ? error.message : String(error), rows: [], sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarTecnicos = tool({
  description: 'Lista técnicos com agregados (OS e horas trabalhadas)',
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    especialidade: z.string().optional(),
    custo_min: z.number().optional(),
    custo_max: z.number().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, especialidade, custo_min, custo_max, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT tec.id,
                              tec.nome,
                              tec.cargo,
                              tec.especialidade,
                              tec.custo_hora,
                              tec.status,
                              tec.data_admissao AS admissao,
                              COUNT(DISTINCT os.id) AS ordens_servico,
                              COALESCE(SUM(ht.horas), 0) AS horas_trabalhadas`
    const baseSql = `FROM ${SERVICOS_SCHEMA}.tecnicos tec
                     LEFT JOIN ${SERVICOS_SCHEMA}.ordens_servico os ON os.tecnico_responsavel_id = tec.id
                     LEFT JOIN ${SERVICOS_SCHEMA}.horas_trabalhadas ht ON ht.tecnico_id = tec.id`

    if (status) push('LOWER(tec.status) =', status.toLowerCase())
    if (especialidade) push('LOWER(tec.especialidade) =', especialidade.toLowerCase())
    if (custo_min !== undefined) push('tec.custo_hora >=', custo_min)
    if (custo_max !== undefined) push('tec.custo_hora <=', custo_max)
    if (q) { conditions.push(`(tec.nome ILIKE '%' || $${i} || '%' OR tec.especialidade ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, { de, ate, dateCol: 'tec.data_admissao' })

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const groupBy = 'GROUP BY tec.id, tec.nome, tec.cargo, tec.especialidade, tec.custo_hora, tec.status, tec.data_admissao'
    const orderClause = 'ORDER BY tec.nome ASC'
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${groupBy}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      const baseTitle = 'Técnicos'
      let mainFilter = ''
      if (especialidade) mainFilter = `Esp. ${especialidade}`
      else if (status) mainFilter = `Status ${status}`
      else if (custo_min !== undefined) mainFilter = `≥ ${Number(custo_min).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      else if (custo_max !== undefined) mainFilter = `≤ ${Number(custo_max).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      const periodStr = de && ate ? `${de} a ${ate}` : de ? `desde ${de}` : ate ? `até ${ate}` : ''
      const title = [baseTitle, periodStr, mainFilter].filter(Boolean).join(' · ')
      return { success: true, message: `✅ ${rows.length} técnico(s) encontrados`, count: rows.length, rows, title, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar técnicos', error: error instanceof Error ? error.message : String(error), rows: [], sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarAgendamentos = tool({
  description: 'Lista agendamentos de serviço',
  inputSchema: z.object({
    limit: z.number().default(20),
    tecnico_id: z.string().optional(),
    status: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, tecnico_id, status, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT ag.id,
                              os.numero_os AS numero_os,
                              t.nome AS tecnico,
                              ag.data_agendada,
                              ag.data_inicio,
                              ag.data_fim,
                              ag.status,
                              ag.observacoes`
    const baseSql = `FROM ${SERVICOS_SCHEMA}.agendamentos_servico ag
                     LEFT JOIN ${SERVICOS_SCHEMA}.ordens_servico os ON ag.ordem_servico_id = os.id
                     LEFT JOIN ${SERVICOS_SCHEMA}.tecnicos t ON ag.tecnico_id = t.id`

    if (status) push('LOWER(ag.status) =', status.toLowerCase())
    if (tecnico_id) push('ag.tecnico_id =', tecnico_id)
    if (q) { conditions.push(`(os.numero_os ILIKE '%' || $${i} || '%' OR t.nome ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, { de, ate, dateCol: 'ag.data_agendada' })

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY ag.data_agendada DESC'
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      const baseTitle = 'Agendamentos'
      const periodStr = de && ate ? `${de} a ${ate}` : de ? `desde ${de}` : ate ? `até ${ate}` : ''
      const mainFilter = status ? `Status ${status}` : (tecnico_id ? `Técnico ${tecnico_id}` : (q ? `Busca "${q}"` : ''))
      const title = [baseTitle, periodStr, mainFilter].filter(Boolean).join(' · ')
      return { success: true, message: `✅ ${rows.length} agendamento(s)`, count: rows.length, rows, title, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar agendamentos', error: error instanceof Error ? error.message : String(error), rows: [], sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarCatalogoDeServicos = tool({
  description: 'Lista serviços do catálogo',
  inputSchema: z.object({
    limit: z.number().default(20),
    categoria: z.string().optional(),
    ativo: z.enum(['true', 'false']).optional(),
    preco_min: z.number().optional(),
    preco_max: z.number().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, categoria, ativo, preco_min, preco_max, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT s.id,
                              s.nome AS servico,
                              s.descricao,
                              s.categoria,
                              s.unidade_medida,
                              s.preco_base,
                              CASE WHEN s.ativo THEN 'Ativo' ELSE 'Inativo' END AS status,
                              s.criado_em,
                              s.atualizado_em`
    const baseSql = `FROM ${SERVICOS_SCHEMA}.servicos s`

    if (categoria) push('LOWER(s.categoria) =', categoria.toLowerCase())
    if (ativo) push('CAST(s.ativo AS TEXT) =', ativo)
    if (preco_min !== undefined) push('s.preco_base >=', preco_min)
    if (preco_max !== undefined) push('s.preco_base <=', preco_max)
    if (q) { conditions.push(`(s.nome ILIKE '%' || $${i} || '%' OR COALESCE(s.descricao,'') ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY s.categoria ASC, s.nome ASC'
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      const baseTitle = 'Catálogo de Serviços'
      let mainFilter = ''
      if (categoria) mainFilter = `Categoria ${categoria}`
      else if (ativo) mainFilter = ativo === 'true' ? 'Ativos' : 'Inativos'
      else if (preco_min !== undefined) mainFilter = `≥ ${Number(preco_min).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      else if (preco_max !== undefined) mainFilter = `≤ ${Number(preco_max).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
      const title = [baseTitle, mainFilter].filter(Boolean).join(' · ')
      return { success: true, message: `✅ ${rows.length} serviço(s)`, count: rows.length, rows, title, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar catálogo de serviços', error: error instanceof Error ? error.message : String(error), rows: [], sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const historicoDeServicosDoCliente = tool({
  description: 'Histórico de OS por cliente',
  inputSchema: z.object({
    cliente_id: z.string(),
    limit: z.number().default(50),
    de: z.string().optional(),
    ate: z.string().optional(),
  }),
  execute: async ({ cliente_id, limit, de, ate }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const selectSql = `SELECT os.id,
                              os.numero_os,
                              os.status,
                              os.prioridade,
                              os.data_abertura,
                              os.data_conclusao,
                              os.valor_final`
    const baseSql = `FROM ${SERVICOS_SCHEMA}.ordens_servico os`

    push('os.cliente_id =', cliente_id)
    buildWhere(push, { de, ate, dateCol: 'os.data_abertura' })

    const whereClause = `WHERE ${conditions.join(' AND ')}`
    const orderClause = 'ORDER BY os.data_abertura DESC'
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, limit]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      const baseTitle = 'Histórico do Cliente'
      const periodStr = de && ate ? `${de} a ${ate}` : de ? `desde ${de}` : ate ? `até ${ate}` : ''
      const title = [baseTitle, `Cliente ${cliente_id}`, periodStr].filter(Boolean).join(' · ')
      return { success: true, message: `✅ ${rows.length} registro(s) do cliente`, count: rows.length, rows, title, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao buscar histórico do cliente', error: error instanceof Error ? error.message : String(error), rows: [], sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const indicadoresDeServicos = tool({
  description: 'KPIs de serviços no período (abertas, em andamento, concluídas, backlog, TMA, receita total)',
  inputSchema: z.object({
    de: z.string().optional(),
    ate: z.string().optional(),
  }),
  execute: async ({ de, ate }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }
    buildWhere(push, { de, ate, dateCol: 'os.data_abertura' })
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const sql = `SELECT
      COUNT(*) FILTER (WHERE LOWER(os.status) = 'aberta') AS os_abertas,
      COUNT(*) FILTER (WHERE LOWER(os.status) = 'em_andamento') AS os_em_andamento,
      COUNT(*) FILTER (WHERE LOWER(os.status) = 'concluida') AS os_concluidas,
      COUNT(*) FILTER (WHERE LOWER(os.status) IN ('aberta','em_andamento','aguardando_pecas')) AS backlog,
      ROUND(AVG(EXTRACT(EPOCH FROM (os.data_conclusao - os.data_abertura))) / 86400::numeric, 2) FILTER (WHERE os.data_conclusao IS NOT NULL AND LOWER(os.status) = 'concluida') AS tma_dias,
      COALESCE(SUM(os.valor_final), 0) AS receita_total
    FROM ${SERVICOS_SCHEMA}.ordens_servico os
    ${whereClause}`.trim()

    try {
      const [row] = await runQuery<Record<string, unknown>>(sql, params)
      const baseTitle = 'Indicadores de Serviços'
      const periodStr = de && ate ? `${de} a ${ate}` : de ? `desde ${de}` : ate ? `até ${ate}` : ''
      const title = [baseTitle, periodStr].filter(Boolean).join(' · ')
      return { success: true, message: '✅ KPIs calculados', kpis: row ?? {}, title, sql_query: sql, sql_params: fmtParams(params) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao calcular KPIs', error: error instanceof Error ? error.message : String(error), kpis: {}, sql_query: sql, sql_params: fmtParams(params) }
    }
  }
})
