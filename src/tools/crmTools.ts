import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

const fmt = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]')

// ==========================
// OPORTUNIDADES (leitura)
// ==========================
export type CrmOportunidadeRow = {
  id: string
  oportunidade: string
  conta: string | null
  responsavel: string | null
  estagio: string | null
  valor: number | null
  probabilidade: number | null
  data_fechamento: string | null
  prioridade: string | null
}

export type GetCrmOportunidadesOutput = {
  success: boolean
  rows: CrmOportunidadeRow[]
  count: number
  page: number
  pageSize: number
  message: string
  sql_query?: string
  sql_params?: string
}

export const getCrmOportunidades = tool({
  description: 'Lista oportunidades do CRM com filtros (leitura)',
  inputSchema: z.object({
    de: z.string().optional(),
    ate: z.string().optional(),
    estagio: z.string().optional(),
    status: z.string().optional(),
    prob_min: z.number().optional(),
    prob_max: z.number().optional(),
    valor_min: z.number().optional(),
    valor_max: z.number().optional(),
    responsavel_id: z.string().optional(),
    q: z.string().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(20),
  }),
  execute: async ({ de, ate, estagio, status, prob_min, prob_max, valor_min, valor_max, responsavel_id, q, page = 1, pageSize = 20 }) => {
    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let i = 1
      const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

      const selectSql = `SELECT o.oportunidadeid AS id,
                                o.nome AS oportunidade,
                                c.nome AS conta,
                                u.nome AS responsavel,
                                o.estagio,
                                o.valor,
                                o.probabilidade,
                                o.datadefechamento AS data_fechamento,
                                CASE WHEN o.probabilidade >= 80 THEN 'Alta'
                                     WHEN o.probabilidade >= 50 THEN 'Média'
                                     ELSE 'Baixa' END AS prioridade`;
      const baseSql = `FROM crm.oportunidades o
                       LEFT JOIN crm.contas c ON o.contaid = c.contaid
                       LEFT JOIN gestaovendas.vendedores u ON o.usuarioid = u.id`;

      // Filtros
      if (status) push('LOWER(o.status) =', status.toLowerCase())
      if (estagio) push('LOWER(o.estagio) =', estagio.toLowerCase())
      if (prob_min !== undefined) push('o.probabilidade >=', prob_min)
      if (prob_max !== undefined) push('o.probabilidade <=', prob_max)
      if (valor_min !== undefined) push('o.valor >=', valor_min)
      if (valor_max !== undefined) push('o.valor <=', valor_max)
      if (responsavel_id) push('o.usuarioid =', responsavel_id)
      if (de) push('o.datadefechamento >=', de)
      if (ate) push('o.datadefechamento <=', ate)
      if (q) {
        conditions.push(`(o.nome ILIKE '%' || $${i} || '%' OR c.nome ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const orderClause = 'ORDER BY o.datadefechamento DESC NULLS LAST'
      const offset = (page - 1) * pageSize
      const listSql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\nLIMIT $${i}::int OFFSET $${i + 1}::int`.trim()
      const rows = await runQuery<CrmOportunidadeRow>(listSql, [...params, pageSize, offset])

      // Total
      const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
      const totalRows = await runQuery<{ total: number }>(totalSql, params)
      const count = totalRows[0]?.total ?? rows.length

      return {
        success: true,
        rows,
        count,
        page,
        pageSize,
        message: `Oportunidades: ${rows.length} (total ${count})`,
        sql_query: listSql,
        sql_params: fmt([...params, pageSize, offset])
      }
    } catch (error) {
      return { success: false, rows: [], count: 0, page, pageSize, message: `Erro ao listar oportunidades: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})

// ==========================
// ATIVIDADES (leitura)
// ==========================
export type CrmAtividadeRow = {
  id: string
  assunto: string
  tipo: string | null
  status: string | null
  data_vencimento: string | null
  conta: string | null
  contato: string | null
  lead: string | null
  oportunidade: string | null
  responsavel: string | null
  anotacoes: string | null
}

export type GetCrmAtividadesOutput = {
  success: boolean
  rows: CrmAtividadeRow[]
  count: number
  page: number
  pageSize: number
  message: string
  sql_query?: string
  sql_params?: string
}

export const getCrmAtividades = tool({
  description: 'Lista atividades do CRM com filtros (leitura)',
  inputSchema: z.object({
    de: z.string().optional(),
    ate: z.string().optional(),
    status: z.string().optional(),
    tipo: z.string().optional(),
    responsavel_id: z.string().optional(),
    oportunidade_id: z.string().optional(),
    conta_id: z.string().optional(),
    lead_id: z.string().optional(),
    contato_id: z.string().optional(),
    q: z.string().optional(),
    page: z.number().default(1),
    pageSize: z.number().default(20),
  }),
  execute: async ({ de, ate, status, tipo, responsavel_id, oportunidade_id, conta_id, lead_id, contato_id, q, page = 1, pageSize = 20 }) => {
    try {
      const conditions: string[] = []
      const params: unknown[] = []
      let i = 1
      const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

      const selectSql = `SELECT a.atividadeid AS id,
                                a.assunto,
                                a.tipo,
                                a.status,
                                a.datadevencimento AS data_vencimento,
                                COALESCE(c.nome, '—') AS conta,
                                COALESCE(ct.primeironome || ' ' || ct.sobrenome, '—') AS contato,
                                COALESCE(l.primeironome || ' ' || l.sobrenome, '—') AS lead,
                                COALESCE(o.nome, '—') AS oportunidade,
                                u.nome AS responsavel,
                                a.anotacoes`;
      const baseSql = `FROM crm.atividades a
                       LEFT JOIN crm.contas c ON a.contaid = c.contaid
                       LEFT JOIN crm.contatos ct ON a.contatoid = ct.contatoid
                       LEFT JOIN crm.leads l ON a.leadid = l.leadid
                       LEFT JOIN crm.oportunidades o ON a.oportunidadeid = o.oportunidadeid
                       LEFT JOIN gestaovendas.vendedores u ON a.usuarioid = u.id`;

      // Filtros
      if (status) push('LOWER(a.status) =', status.toLowerCase())
      if (tipo) push('LOWER(a.tipo) =', tipo.toLowerCase())
      if (responsavel_id) push('a.usuarioid =', responsavel_id)
      if (oportunidade_id) push('a.oportunidadeid =', oportunidade_id)
      if (conta_id) push('a.contaid =', conta_id)
      if (lead_id) push('a.leadid =', lead_id)
      if (contato_id) push('a.contatoid =', contato_id)
      if (de) push('a.datadevencimento >=', de)
      if (ate) push('a.datadevencimento <=', ate)
      if (q) {
        conditions.push(`(a.assunto ILIKE '%' || $${i} || '%' OR a.anotacoes ILIKE '%' || $${i} || '%')`)
        params.push(q)
        i += 1
      }

      const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
      const orderClause = 'ORDER BY a.datadevencimento DESC NULLS LAST'
      const offset = (page - 1) * pageSize
      const listSql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\nLIMIT $${i}::int OFFSET $${i + 1}::int`.trim()
      const rows = await runQuery<CrmAtividadeRow>(listSql, [...params, pageSize, offset])

      // Total
      const totalSql = `SELECT COUNT(*)::int AS total ${baseSql} ${whereClause}`
      const totalRows = await runQuery<{ total: number }>(totalSql, params)
      const count = totalRows[0]?.total ?? rows.length

      return {
        success: true,
        rows,
        count,
        page,
        pageSize,
        message: `Atividades: ${rows.length} (total ${count})`,
        sql_query: listSql,
        sql_params: fmt([...params, pageSize, offset])
      }
    } catch (error) {
      return { success: false, rows: [], count: 0, page, pageSize, message: `Erro ao listar atividades: ${error instanceof Error ? error.message : String(error)}` }
    }
  }
})

