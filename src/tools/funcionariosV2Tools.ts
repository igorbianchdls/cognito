import { z } from 'zod'
import { tool } from 'ai'
import { runQuery } from '@/lib/postgres'

const RH_SCHEMA = process.env.RH_SCHEMA || 'recursoshumanos'
const fmtParams = (params: unknown[]) => (params.length ? JSON.stringify(params) : '[]')

const normalizeLimit = (limit?: number, def = 20, min = 1, max = 1000) => {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return def
  return Math.min(Math.max(Math.trunc(limit), min), max)
}

function buildWhere(push: (expr: string, val: unknown) => void, col?: string, de?: string, ate?: string) {
  if (!col) return
  if (de) push(`${col} >=`, de)
  if (ate) push(`${col} <=`, ate)
}

export const listarFuncionariosRH = tool({
  description: 'Lista funcionários com cargo, departamento e gestor (schema recursoshumanos)'.trim(),
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    cargo_id: z.string().optional(),
    departamento_id: z.string().optional(),
    gestor_id: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, cargo_id, departamento_id, gestor_id, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const f = `${RH_SCHEMA}.funcionarios`
    const c = `${RH_SCHEMA}.cargos`
    const d = `${RH_SCHEMA}.departamentos`

    const selectSql = `SELECT f.funcionarioid AS id,
                              f.nomecompleto AS funcionario,
                              c.nome AS cargo,
                              d.nome AS departamento,
                              g.nomecompleto AS gestor_direto,
                              f.emailcorporativo AS email_corporativo,
                              f.telefonecorporativo AS telefone,
                              f.status,
                              f.datanascimento AS data_nascimento,
                              f.datadecriacao AS data_criacao`
    const baseSql = `FROM ${f} f
                     LEFT JOIN ${c} c ON f.cargoid = c.cargoid
                     LEFT JOIN ${d} d ON f.departamentoid = d.departamentoid
                     LEFT JOIN ${RH_SCHEMA}.funcionarios g ON f.gestordiretoid = g.funcionarioid`

    if (status) push('LOWER(f.status) =', status.toLowerCase())
    if (cargo_id) push('f.cargoid =', cargo_id)
    if (departamento_id) push('f.departamentoid =', departamento_id)
    if (gestor_id) push('f.gestordiretoid =', gestor_id)
    if (q) { conditions.push(`(f.nomecompleto ILIKE '%' || $${i} || '%' OR f.emailcorporativo ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'f.datadecriacao', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY f.nomecompleto ASC'
    const lim = normalizeLimit(limit)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} funcionário(s)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar funcionários', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarDepartamentosRH = tool({
  description: 'Lista departamentos com departamento pai, gestor e quantidade de funcionários',
  inputSchema: z.object({
    limit: z.number().default(100),
    q: z.string().optional(),
  }),
  execute: async ({ limit, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const d = `${RH_SCHEMA}.departamentos`
    const f = `${RH_SCHEMA}.funcionarios`

    const selectSql = `SELECT d.departamentoid AS id,
                              d.nome AS departamento,
                              dp.nome AS departamento_pai,
                              g.nomecompleto AS gestor,
                              COUNT(f.funcionarioid) AS qtd_funcionarios`
    const baseSql = `FROM ${d} d
                     LEFT JOIN ${d} dp ON d.departamentopaiid = dp.departamentoid
                     LEFT JOIN ${RH_SCHEMA}.funcionarios g ON d.gestorid = g.funcionarioid
                     LEFT JOIN ${f} f ON f.departamentoid = d.departamentoid`
    if (q) { conditions.push(`(d.nome ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const groupBy = 'GROUP BY d.departamentoid, d.nome, dp.nome, g.nomecompleto'
    const orderClause = 'ORDER BY d.nome ASC'
    const lim = normalizeLimit(limit)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${groupBy}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} departamento(s)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar departamentos', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarCargosRH = tool({
  description: 'Lista cargos com quantidade de funcionários',
  inputSchema: z.object({
    limit: z.number().default(100),
    q: z.string().optional(),
  }),
  execute: async ({ limit, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const c = `${RH_SCHEMA}.cargos`
    const f = `${RH_SCHEMA}.funcionarios`
    const selectSql = `SELECT c.cargoid AS id,
                              c.nome AS cargo,
                              c.descricao,
                              COUNT(f.funcionarioid) AS qtd_funcionarios`
    const baseSql = `FROM ${c} c
                     LEFT JOIN ${f} f ON f.cargoid = c.cargoid`
    if (q) { conditions.push(`(c.nome ILIKE '%' || $${i} || '%' OR c.descricao ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const groupBy = 'GROUP BY c.cargoid, c.nome, c.descricao'
    const orderClause = 'ORDER BY c.nome ASC'
    const lim = normalizeLimit(limit)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${groupBy}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} cargo(s)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar cargos', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarTiposAusenciaRH = tool({
  description: 'Lista tipos de ausência (férias, licenças, etc.)',
  inputSchema: z.object({
    limit: z.number().default(100),
    q: z.string().optional(),
  }),
  execute: async ({ limit, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const ta = `${RH_SCHEMA}.tiposdeausencia`
    const selectSql = `SELECT ta.tipoausenciaid AS id,
                              ta.nome AS tipo_de_ausencia,
                              CASE WHEN ta.descontadosaldodeferias THEN 'Sim' ELSE 'Não' END AS desconta_saldo_ferias`
    const baseSql = `FROM ${ta} ta`
    if (q) { conditions.push(`(ta.nome ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY ta.nome ASC'
    const lim = normalizeLimit(limit)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} tipo(s) de ausência`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar tipos de ausência', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarContratosRH = tool({
  description: 'Lista contratos por funcionário (tipo, admissão/demissão, status)'.trim(),
  inputSchema: z.object({
    limit: z.number().default(20),
    status: z.string().optional(),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, status, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const ct = `${RH_SCHEMA}.contratos`
    const f = `${RH_SCHEMA}.funcionarios`
    const selectSql = `SELECT ct.contratoid AS id,
                              f.nomecompleto AS funcionario,
                              ct.tipodecontrato AS tipo_de_contrato,
                              ct.dataadmissao AS admissao,
                              ct.datademissao AS demissao,
                              ct.status`
    const baseSql = `FROM ${ct} ct
                     LEFT JOIN ${f} f ON ct.funcionarioid = f.funcionarioid`
    if (status) push('LOWER(ct.status) =', status.toLowerCase())
    if (q) { conditions.push(`(f.nomecompleto ILIKE '%' || $${i} || '%' OR ct.tipodecontrato ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'ct.dataadmissao', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY ct.dataadmissao DESC'
    const lim = normalizeLimit(limit)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} contrato(s)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar contratos', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const listarHistoricoSalarialRH = tool({
  description: 'Lista histórico salarial (funcionário, tipo de pagamento, vigência)'.trim(),
  inputSchema: z.object({
    limit: z.number().default(20),
    de: z.string().optional(),
    ate: z.string().optional(),
    q: z.string().optional(),
  }),
  execute: async ({ limit, de, ate, q }) => {
    const conditions: string[] = []
    const params: unknown[] = []
    let i = 1
    const push = (expr: string, val: unknown) => { conditions.push(`${expr} $${i}`); params.push(val); i += 1 }

    const hs = `${RH_SCHEMA}.historicosalarial`
    const ct = `${RH_SCHEMA}.contratos`
    const f = `${RH_SCHEMA}.funcionarios`
    const selectSql = `SELECT hs.historicosalarialid AS id,
                              f.nomecompleto AS funcionario,
                              hs.salariobase AS salario_base,
                              hs.tipodepagamento AS tipo_de_pagamento,
                              hs.datainiciovigencia AS inicio_vigencia,
                              hs.datafimvigencia AS fim_vigencia`
    const baseSql = `FROM ${hs} hs
                     LEFT JOIN ${ct} ct ON hs.contratoid = ct.contratoid
                     LEFT JOIN ${f} f ON ct.funcionarioid = f.funcionarioid`
    if (q) { conditions.push(`(f.nomecompleto ILIKE '%' || $${i} || '%')`); params.push(q); i += 1 }
    buildWhere(push, 'hs.datainiciovigencia', de, ate)

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const orderClause = 'ORDER BY hs.datainiciovigencia DESC'
    const lim = normalizeLimit(limit)
    const limitClause = `LIMIT $${i}::int`
    const paramsWithLimit = [...params, lim]

    const sql = `${selectSql}\n${baseSql}\n${whereClause}\n${orderClause}\n${limitClause}`.trim()
    try {
      const rows = await runQuery<Record<string, unknown>>(sql, paramsWithLimit)
      return { success: true, message: `✅ ${rows.length} registro(s)`, rows, count: rows.length, sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    } catch (error) {
      return { success: false, message: '❌ Erro ao listar histórico salarial', rows: [], count: 0, error: error instanceof Error ? error.message : String(error), sql_query: sql, sql_params: fmtParams(paramsWithLimit) }
    }
  }
})

export const indicadoresRH = tool({
  description: 'KPIs de RH: headcount, admissões/desligamentos no período, salário médio'.trim(),
  inputSchema: z.object({
    de: z.string().optional(),
    ate: z.string().optional(),
  }).optional(),
  execute: async ({ de, ate } = {}) => {
    // Consultas principais
    const baseF = `${RH_SCHEMA}.funcionarios`
    const baseCt = `${RH_SCHEMA}.contratos`
    const baseHs = `${RH_SCHEMA}.historicosalarial`

    const whereAdmissoes: string[] = []
    const paramsAdmissoes: unknown[] = []
    let i1 = 1
    const push1 = (expr: string, val: unknown) => { whereAdmissoes.push(`${expr} $${i1}`); paramsAdmissoes.push(val); i1 += 1 }
    buildWhere(push1, 'ct.dataadmissao', de, ate)

    const whereDeslig: string[] = []
    const paramsDeslig: unknown[] = []
    let i2 = 1
    const push2 = (expr: string, val: unknown) => { whereDeslig.push(`${expr} $${i2}`); paramsDeslig.push(val); i2 += 1 }
    buildWhere(push2, 'ct.datademissao', de, ate)

    // total ativos (status = 'Ativo')
    const totalAtivosSql = `SELECT COUNT(*)::int AS total FROM ${baseF} WHERE LOWER(status) = 'ativo'`
    // admissões no período
    const admissoesSql = `SELECT COUNT(*)::int AS total FROM ${baseCt} ct ${whereAdmissoes.length ? 'WHERE ' + whereAdmissoes.join(' AND ') : ''}`
    // desligamentos no período
    const desligSql = `SELECT COUNT(*)::int AS total FROM ${baseCt} ct ${whereDeslig.length ? 'WHERE ' + whereDeslig.join(' AND ') : ''}`
    // salário médio atual (média de ultimo salário base por funcionário) — aproximação
    const salarioMedioSql = `
      WITH ultimo_salario AS (
        SELECT
          ct.funcionarioid,
          hs.salariobase,
          ROW_NUMBER() OVER (PARTITION BY ct.funcionarioid ORDER BY hs.datainiciovigencia DESC) AS rn
        FROM ${baseHs} hs
        LEFT JOIN ${baseCt} ct ON hs.contratoid = ct.contratoid
      )
      SELECT AVG(salariobase)::numeric AS salario_medio FROM ultimo_salario WHERE rn = 1
    `

    try {
      const [ativosRows, admRows, desRows, salRows] = await Promise.all([
        runQuery<{ total: number }>(totalAtivosSql),
        runQuery<{ total: number }>(admissoesSql, paramsAdmissoes),
        runQuery<{ total: number }>(desligSql, paramsDeslig),
        runQuery<{ salario_medio: number | string | null }>(salarioMedioSql),
      ])

      const kpis = {
        total_ativos: ativosRows[0]?.total ?? 0,
        admissoes_periodo: admRows[0]?.total ?? 0,
        desligamentos_periodo: desRows[0]?.total ?? 0,
        salario_medio: Number(salRows[0]?.salario_medio ?? 0),
      }

      const combinedSql = JSON.stringify({
        totalAtivosSql,
        admissoesSql,
        paramsAdmissoes,
        desligSql,
        paramsDeslig,
        salarioMedioSql,
      })

      return { success: true, message: 'KPIs de RH calculados', kpis, sql_query: combinedSql }
    } catch (error) {
      return { success: false, message: '❌ Erro ao calcular KPIs de RH', error: error instanceof Error ? error.message : String(error) }
    }
  }
})

