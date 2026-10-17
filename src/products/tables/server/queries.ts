import type { Database, TablesSession } from './database'
import { listQuerySchema, TablesError, type Field, type Filter, type ListQuery, type RecordPage, type ViewConfig } from '../shared/contracts'
import { readFields, recordSelect, requireTable } from './repository'

const relations = { selecao: ['registro_opcoes', 'opcao_id'], selecao_multipla: ['registro_opcoes', 'opcao_id'], usuario: ['registro_usuarios', 'usuario_id'], usuarios: ['registro_usuarios', 'usuario_id'], vinculo: ['registro_vinculos', 'registro_destino_id'], anexo: ['anexos', 'id'] } as const
export function validateView(config: ViewConfig, fields: Field[], kind?: string) {
  const fieldMap = new Map(fields.map(f => [f.id, f]))
  for (const id of [...config.filtros.map(f => f.campo), ...config.ordenacao.map(f => f.campo), config.agrupamento, config.campo_data].filter(Boolean)) if (!fieldMap.has(id!)) throw new TablesError('INVALID_FIELD', 'A visualização referencia um campo indisponível.')
  if (kind === 'kanban' && fieldMap.get(config.agrupamento ?? '')?.tipo !== 'selecao') throw new TablesError('INVALID_VIEW', 'Escolha um campo de seleção única para o Kanban.')
  if (kind === 'calendario' && !['data', 'data_hora'].includes(fieldMap.get(config.campo_data ?? '')?.tipo ?? '')) throw new TablesError('INVALID_VIEW', 'Escolha um campo de data para o calendário.')
}

export function buildRecordQuery(company: number, tableId: string, fields: Field[], query: ListQuery) {
  const params: unknown[] = [company, tableId]
  const bind = (value: unknown) => { params.push(value); return `$${params.length}` }
  const byId = new Map(fields.map(f => [f.id, f]))
  const where = ['r.empresa_id=$1', 'r.tabela_id=$2', 'r.excluido_em IS NULL']
  const getField = (id: string) => { const field = byId.get(id); if (!field) throw new TablesError('INVALID_FIELD', 'Um dos campos da consulta não está disponível.'); return field }
  const textValue = (field: Field) => `r.valores->>${bind(field.id)}`
  function typedValue(field: Field) {
    const expr = textValue(field)
    if (['numero', 'moeda'].includes(field.tipo)) return `nullif(${expr},'')::numeric`
    if (field.tipo === 'data') return `nullif(${expr},'')::date`
    if (field.tipo === 'data_hora') return `nullif(${expr},'')::timestamptz`
    if (field.tipo === 'checkbox') return `nullif(${expr},'')::boolean`
    return expr
  }
  if (query.busca.trim()) {
    const term = bind(query.busca.trim())
    where.push(`(EXISTS(SELECT 1 FROM jsonb_each_text(r.valores) j WHERE position(lower(${term}) in lower(j.value))>0)
      OR EXISTS(SELECT 1 FROM tables.registro_opcoes ro JOIN tables.campo_opcoes o ON o.empresa_id=ro.empresa_id AND o.id=ro.opcao_id WHERE ro.empresa_id=r.empresa_id AND ro.registro_id=r.id AND position(lower(${term}) in lower(o.nome))>0))`)
  }
  for (const filter of query.filtros) {
    const field = getField(filter.campo)
    const rel = relations[field.tipo as keyof typeof relations]
    if (rel) {
      if (!['eq', 'neq', 'empty', 'not_empty'].includes(filter.operador)) throw new TablesError('INVALID_FILTER', 'Esse operador não é compatível com o campo.')
      const match = ['eq', 'neq'].includes(filter.operador) ? ` AND x.${rel[1]}::text=${bind(String(filter.valor ?? ''))}` : ''
      const active = field.tipo === 'anexo' ? " AND x.estado='confirmado'" : ''
      const expr = `EXISTS(SELECT 1 FROM tables.${rel[0]} x WHERE x.empresa_id=r.empresa_id AND x.registro_id=r.id AND x.campo_id=${bind(field.id)}${match}${active})`
      where.push(['neq', 'empty'].includes(filter.operador) ? `NOT ${expr}` : expr)
      continue
    }
    const expr = typedValue(field)
    if (filter.operador === 'empty') where.push(`nullif((${expr})::text,'') IS NULL`)
    else if (filter.operador === 'not_empty') where.push(`nullif((${expr})::text,'') IS NOT NULL`)
    else {
      if (filter.valor === undefined) throw new TablesError('INVALID_FILTER', 'Informe o valor do filtro.')
      if (filter.operador === 'contains') {
        if (['numero', 'moeda', 'data', 'data_hora', 'checkbox'].includes(field.tipo)) throw new TablesError('INVALID_FILTER', 'Use uma comparação compatível com o tipo do campo.')
        where.push(`position(lower(${bind(String(filter.valor))}) in lower(coalesce((${expr})::text,'')))>0`)
      } else {
        const op = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' }[filter.operador]
        const value = bind(String(filter.valor))
        const cast = ['numero', 'moeda'].includes(field.tipo) ? '::numeric' : field.tipo === 'data' ? '::date' : field.tipo === 'data_hora' ? '::timestamptz' : field.tipo === 'checkbox' ? '::boolean' : '::text'
        where.push(`(${expr}) ${op} ${value}${cast}`)
      }
    }
  }
  const whereParams = [...params]
  const order = query.ordenacao.map(sort => {
    const field = getField(sort.campo)
    let expr: string
    if (['selecao', 'selecao_multipla'].includes(field.tipo)) expr = `(SELECT min(o.nome) FROM tables.registro_opcoes ro JOIN tables.campo_opcoes o ON o.empresa_id=ro.empresa_id AND o.id=ro.opcao_id WHERE ro.empresa_id=r.empresa_id AND ro.registro_id=r.id AND ro.campo_id=${bind(field.id)})`
    else if (relations[field.tipo as keyof typeof relations]) throw new TablesError('INVALID_SORT', 'Escolha texto, número, seleção ou data para ordenar.')
    else expr = typedValue(field)
    return `${expr} ${sort.direcao === 'desc' ? 'DESC' : 'ASC'} NULLS LAST`
  })
  order.push('r.posicao ASC', 'r.id ASC')
  return { params, whereParams, where: where.join(' AND '), order: order.join(', ') }
}

export async function listRecords(db: Database, session: TablesSession, tableId: string, input: ListQuery): Promise<RecordPage> {
  await requireTable(db, session, tableId)
  const fields = await readFields(db, session, tableId)
  let query = listQuerySchema.parse(input)
  if (query.visualizacao) {
    const found = await db.query('SELECT configuracao FROM tables.visualizacoes WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3', [session.tenantId, tableId, query.visualizacao])
    if (!found.rows[0]) throw new TablesError('NOT_FOUND', 'Visualização não encontrada.', 404)
    const config = found.rows[0].configuracao as ViewConfig
    const order = query.ordenacao.length ? query.ordenacao : config.ordenacao
    query = { ...query, filtros: [...config.filtros, ...query.filtros], ordenacao: config.agrupamento ? [{ campo: config.agrupamento, direcao: 'asc' }, ...order.filter(s => s.campo !== config.agrupamento)] : order }
  }
  const compiled = buildRecordQuery(session.tenantId, tableId, fields, query)
  const total = (await db.query(`SELECT count(*)::int total FROM tables.registros r WHERE ${compiled.where}`, compiled.whereParams)).rows[0].total
  const sumParams = [...compiled.whereParams]
  const sumParts = fields.filter(f => ['numero', 'moeda'].includes(f.tipo)).map(field => {
    sumParams.push(field.id)
    const id = `$${sumParams.length}`
    return `${id}::text, coalesce(sum(nullif(r.valores->>${id},'')::numeric),0)::text`
  })
  const somas = sumParts.length ? (await db.query(`SELECT jsonb_build_object(${sumParts.join(',')}) somas FROM tables.registros r WHERE ${compiled.where}`, sumParams)).rows[0].somas : {}
  const dataParams = [...compiled.params, query.tamanho, (query.pagina - 1) * query.tamanho]
  const records = await db.query(`${recordSelect} WHERE ${compiled.where} ORDER BY ${compiled.order} LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`, dataParams)
  return { registros: records.rows, total, pagina: query.pagina, tamanho: query.tamanho, somas } as RecordPage
}

export type SummaryInput = { busca: string; filtros: Filter[]; visualizacao?: string; agrupar_por?: string; periodo: 'dia' | 'mes' | 'ano'; metricas: { campo: string; operacao: 'soma' | 'media' | 'minimo' | 'maximo' }[] }
const GROUP_LIMIT = 50

/** Counts and aggregates the whole filtered set in the database, optionally grouped by one field. */
export async function summarizeRecords(db: Database, session: TablesSession, tableId: string, input: SummaryInput) {
  await requireTable(db, session, tableId)
  const fields = await readFields(db, session, tableId), byId = new Map(fields.map(f => [f.id, f]))
  let filtros = input.filtros
  if (input.visualizacao) {
    const found = await db.query('SELECT configuracao FROM tables.visualizacoes WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3', [session.tenantId, tableId, input.visualizacao])
    if (!found.rows[0]) throw new TablesError('NOT_FOUND', 'Visualização não encontrada.', 404)
    filtros = [...(found.rows[0].configuracao as ViewConfig).filtros, ...filtros]
  }
  const compiled = buildRecordQuery(session.tenantId, tableId, fields, listQuerySchema.parse({ busca: input.busca, filtros }))
  const params = [...compiled.whereParams]
  const bind = (list: unknown[], value: unknown) => { list.push(value); return `$${list.length}` }
  const labels: string[] = []
  const metrics = input.metricas.map((metric, index) => {
    const field = byId.get(metric.campo)
    if (!field) throw new TablesError('INVALID_FIELD', 'Um campo da métrica não está disponível.')
    const numeric = ['numero', 'moeda'].includes(field.tipo), date = ['data', 'data_hora'].includes(field.tipo)
    if (!numeric && !(date && ['minimo', 'maximo'].includes(metric.operacao))) throw new TablesError('INVALID_METRIC', `${field.nome}: soma e média valem para número ou moeda; mínimo e máximo também para datas.`)
    const key = bind(params, field.id)
    const expr = numeric ? `nullif(r.valores->>${key},'')::numeric` : field.tipo === 'data' ? `nullif(r.valores->>${key},'')::date` : `nullif(r.valores->>${key},'')::timestamptz`
    labels.push(`${{ soma: 'soma', media: 'média', minimo: 'mínimo', maximo: 'máximo' }[metric.operacao]} de ${field.nome}`)
    return `(${metric.operacao === 'media' ? `round(avg(${expr}),2)` : `${{ soma: 'sum', minimo: 'min', maximo: 'max' }[metric.operacao]}(${expr})`})::text m${index}`
  })
  const metricColumns = metrics.length ? ',' + metrics.join(',') : ''
  const read = (row: Record<string, unknown>) => Object.fromEntries(labels.map((label, i) => [label, row[`m${i}`] ?? null]))
  const totals = (await db.query(`SELECT count(*)::int total${metricColumns} FROM tables.registros r WHERE ${compiled.where}`, params)).rows[0]
  const result: Record<string, unknown> = { total: totals.total, metricas: read(totals) }
  if (!input.agrupar_por) return result

  const group = byId.get(input.agrupar_por)
  if (!group) throw new TablesError('INVALID_FIELD', 'O campo de agrupamento não está disponível.')
  const groupParams = [...params], key = bind(groupParams, group.id)
  const joined = { selecao: ['registro_opcoes', 'opcao_id'], selecao_multipla: ['registro_opcoes', 'opcao_id'], usuario: ['registro_usuarios', 'usuario_id'], usuarios: ['registro_usuarios', 'usuario_id'], vinculo: ['registro_vinculos', 'registro_destino_id'] }[group.tipo as string]
  let join = '', expression: string
  if (joined) { join = `LEFT JOIN tables.${joined[0]} g ON g.empresa_id=r.empresa_id AND g.registro_id=r.id AND g.campo_id=${key}`; expression = `g.${joined[1]}::text` }
  else if (group.tipo === 'checkbox') expression = `coalesce(nullif(r.valores->>${key},''),'false')`
  else if (['texto', 'texto_longo', 'email', 'url'].includes(group.tipo)) expression = `nullif(r.valores->>${key},'')`
  else if (['data', 'data_hora'].includes(group.tipo)) {
    const unit = { dia: 'day', mes: 'month', ano: 'year' }[input.periodo], format = { dia: 'YYYY-MM-DD', mes: 'YYYY-MM', ano: 'YYYY' }[input.periodo]
    const value = group.tipo === 'data' ? `nullif(r.valores->>${key},'')::date` : `(nullif(r.valores->>${key},'')::timestamptz AT TIME ZONE 'America/Sao_Paulo')`
    expression = `to_char(date_trunc('${unit}',${value}),'${format}')`
  } else throw new TablesError('INVALID_GROUP', 'Agrupe por seleção, pessoas, vínculo, checkbox, texto ou data.')
  const rows = (await db.query(`SELECT ${expression} chave, count(*)::int quantidade${metricColumns} FROM tables.registros r ${join} WHERE ${compiled.where} GROUP BY 1 ORDER BY quantidade DESC, chave ASC NULLS LAST LIMIT ${GROUP_LIMIT + 1}`, groupParams)).rows

  const keys = rows.map(r => r.chave).filter((k): k is string => typeof k === 'string')
  const names = new Map<string, string>(group.opcoes.map(o => [o.id, o.nome]))
  if (['usuario', 'usuarios'].includes(group.tipo) && keys.length) for (const m of (await db.query('SELECT id,nome FROM tables.membros() WHERE id=ANY($1::text[])', [keys])).rows) names.set(String(m.id), String(m.nome))
  if (group.tipo === 'vinculo' && keys.length) for (const m of (await db.query("SELECT r.id,coalesce(r.valores->>t.campo_principal_id::text,'Sem nome') nome FROM tables.registros r JOIN tables.tabelas t ON t.empresa_id=r.empresa_id AND t.id=r.tabela_id WHERE r.empresa_id=$1 AND r.id=ANY($2::uuid[])", [session.tenantId, keys])).rows) names.set(String(m.id), String(m.nome))
  const label = (k: unknown) => k === null || k === undefined ? 'Sem valor' : group.tipo === 'checkbox' ? (k === 'true' ? 'Sim' : 'Não') : names.get(String(k)) ?? String(k)
  return {
    ...result,
    agrupado_por: { id: group.id, nome: group.nome, tipo: group.tipo, ...(['data', 'data_hora'].includes(group.tipo) ? { periodo: input.periodo } : {}) },
    grupos: rows.slice(0, GROUP_LIMIT).map(r => ({ valor: r.chave ?? null, rotulo: label(r.chave), quantidade: r.quantidade, metricas: read(r) })),
    grupos_omitidos: rows.length > GROUP_LIMIT,
    ...(['selecao_multipla', 'usuarios', 'vinculo'].includes(group.tipo) ? { observacao: 'Registros com várias escolhas contam em cada grupo.' } : {}),
  }
}
