import type { Database, TablesSession } from './database'
import { DERIVED_TYPES, listQuerySchema, TablesError, viewConfigSchema, type DataRecord, type Field, type Filter, type ListQuery, type RecordPage, type ViewConfig } from '../shared/contracts'
import { readFields, recordSelect, requireTable } from './repository'
import { withComputed } from './derived'

const relations = { selecao: ['registro_opcoes', 'opcao_id'], selecao_multipla: ['registro_opcoes', 'opcao_id'], usuario: ['registro_usuarios', 'usuario_id'], usuarios: ['registro_usuarios', 'usuario_id'], vinculo: ['registro_vinculos', 'registro_destino_id'], anexo: ['anexos', 'id'] } as const
export function validateView(config: ViewConfig, fields: Field[], kind?: string) {
  const fieldMap = new Map(fields.map(f => [f.id, f]))
  for (const id of [...config.filtros.map(f => f.campo), ...config.ordenacao.map(f => f.campo), config.agrupamento, config.campo_data].filter(Boolean)) if (!fieldMap.has(id!)) throw new TablesError('INVALID_FIELD', 'A visualização referencia um campo indisponível.')
  if (kind === 'kanban' && fieldMap.get(config.agrupamento ?? '')?.tipo !== 'selecao') throw new TablesError('INVALID_VIEW', 'Escolha um campo de seleção única para o Kanban.')
  if (kind === 'linha_do_tempo' && (!['data', 'data_hora'].includes(fieldMap.get(config.campo_data ?? '')?.tipo ?? '') || config.campo_fim && !['data', 'data_hora'].includes(fieldMap.get(config.campo_fim)?.tipo ?? ''))) throw new TablesError('INVALID_VIEW', 'Escolha campos de data para o início e o fim da linha do tempo.')
  if (kind === 'calendario' && !['data', 'data_hora', 'criado_em', 'alterado_em'].includes(fieldMap.get(config.campo_data ?? '')?.tipo ?? '')) throw new TablesError('INVALID_VIEW', 'Escolha um campo de data para o calendário.')
}

export function buildRecordQuery(company: number, tableId: string, fields: Field[], query: ListQuery, extra: { filtros: Filter[]; combinacao: 'e' | 'ou' }[] = []) {
  const params: unknown[] = [company, tableId]
  const bind = (value: unknown) => { params.push(value); return `$${params.length}` }
  const byId = new Map(fields.map(f => [f.id, f]))
  const where = ['r.empresa_id=$1', 'r.tabela_id=$2', 'r.excluido_em IS NULL']
  const getField = (id: string) => {
    const field = byId.get(id)
    if (!field) throw new TablesError('INVALID_FIELD', 'Um dos campos da consulta não está disponível.')
    if (DERIVED_TYPES.includes(field.tipo)) throw new TablesError('INVALID_FILTER', `${field.nome} é calculado na leitura e ainda não pode ser usado em filtros, ordenação ou agrupamento.`)
    return field
  }
  const textValue = (field: Field) => `r.valores->>${bind(field.id)}`
  function typedValue(field: Field) {
    if (field.tipo === 'autonumero') return 'r.numero'
    if (field.tipo === 'criado_em') return 'r.criado_em'
    if (field.tipo === 'alterado_em') return 'r.atualizado_em'
    if (field.tipo === 'criado_por') return 'r.criado_por::text'
    if (field.tipo === 'alterado_por') return 'r.atualizado_por::text'
    const expr = textValue(field)
    if (['numero', 'moeda', 'porcentagem', 'avaliacao'].includes(field.tipo)) return `nullif(${expr},'')::numeric`
    if (field.tipo === 'data') return `nullif(${expr},'')::date`
    if (field.tipo === 'data_hora') return `nullif(${expr},'')::timestamptz`
    if (field.tipo === 'checkbox') return `nullif(${expr},'')::boolean`
    return expr
  }
  if (query.busca.trim()) {
    // Values or option names that contain the text. The search runs in tables.buscar_registros, where the
    // trigram index works under row level security; here only the matching IDs are used.
    where.push(`r.id=ANY(ARRAY(SELECT tables.buscar_registros($2::uuid,${bind(query.busca.trim())})))`)
  }
  // Each group of conditions combines with E or OU; groups add up with E.
  const conditions = (filters: Filter[], mode: 'e' | 'ou') => {
    const parts: string[] = []
    for (const filter of filters) parts.push(condition(filter))
    if (parts.length) where.push(parts.length === 1 ? parts[0] : `(${parts.join(mode === 'ou' ? ' OR ' : ' AND ')})`)
  }
  function condition(filter: Filter): string {
    const field = getField(filter.campo)
    const rel = relations[field.tipo as keyof typeof relations]
    if (rel) {
      if (!['eq', 'neq', 'empty', 'not_empty'].includes(filter.operador)) throw new TablesError('INVALID_FILTER', 'Esse operador não é compatível com o campo.')
      const match = ['eq', 'neq'].includes(filter.operador) ? ` AND x.${rel[1]}::text=${bind(String(filter.valor ?? ''))}` : ''
      const active = field.tipo === 'anexo' ? " AND x.estado='confirmado'" : ''
      const expr = `EXISTS(SELECT 1 FROM tables.${rel[0]} x WHERE x.empresa_id=r.empresa_id AND x.registro_id=r.id AND x.campo_id=${bind(field.id)}${match}${active})`
      return ['neq', 'empty'].includes(filter.operador) ? `NOT ${expr}` : expr
    }
    const expr = typedValue(field)
    if (filter.operador === 'empty') return `nullif((${expr})::text,'') IS NULL`
    if (filter.operador === 'not_empty') return `nullif((${expr})::text,'') IS NOT NULL`
    {
      if (filter.valor === undefined) throw new TablesError('INVALID_FILTER', 'Informe o valor do filtro.')
      if (filter.operador === 'contains') {
        if (['numero', 'moeda', 'porcentagem', 'avaliacao', 'autonumero', 'data', 'data_hora', 'criado_em', 'alterado_em', 'checkbox'].includes(field.tipo)) throw new TablesError('INVALID_FILTER', 'Use uma comparação compatível com o tipo do campo.')
        return `position(lower(${bind(String(filter.valor))}) in lower(coalesce((${expr})::text,'')))>0`
      } else {
        const op = { eq: '=', neq: '<>', gt: '>', gte: '>=', lt: '<', lte: '<=' }[filter.operador]
        const value = bind(String(filter.valor))
        const cast = ['numero', 'moeda', 'porcentagem', 'avaliacao', 'autonumero'].includes(field.tipo) ? '::numeric' : field.tipo === 'data' ? '::date' : ['data_hora', 'criado_em', 'alterado_em'].includes(field.tipo) ? '::timestamptz' : field.tipo === 'checkbox' ? '::boolean' : '::text'
        return `(${expr}) ${op} ${value}${cast}`
      }
    }
  }
  conditions(query.filtros, query.combinacao)
  for (const group of extra) conditions(group.filtros, group.combinacao)
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
  let query = listQuerySchema.parse(input), extra: { filtros: Filter[]; combinacao: 'e' | 'ou' }[] = []
  if (query.visualizacao) {
    const found = await db.query('SELECT configuracao FROM tables.visualizacoes WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3', [session.tenantId, tableId, query.visualizacao])
    if (!found.rows[0]) throw new TablesError('NOT_FOUND', 'Visualização não encontrada.', 404)
    const config = found.rows[0].configuracao as ViewConfig
    const order = query.ordenacao.length ? query.ordenacao : config.ordenacao
    // The view's own conditions keep their E/OU; the ones added on screen (calendar month) add with E.
    extra = query.filtros.length ? [{ filtros: query.filtros, combinacao: query.combinacao }] : []
    query = { ...query, filtros: config.filtros, combinacao: config.combinacao, ordenacao: config.agrupamento ? [{ campo: config.agrupamento, direcao: 'asc' }, ...order.filter(s => s.campo !== config.agrupamento)] : order }
  }
  const compiled = buildRecordQuery(session.tenantId, tableId, fields, query, extra)
  const total = (await db.query(`SELECT count(*)::int total FROM tables.registros r WHERE ${compiled.where}`, compiled.whereParams)).rows[0].total
  const sumParams = [...compiled.whereParams]
  const sumParts = fields.filter(f => ['numero', 'moeda', 'porcentagem'].includes(f.tipo)).map(field => {
    sumParams.push(field.id)
    const id = `$${sumParams.length}`
    return `${id}::text, coalesce(sum(nullif(r.valores->>${id},'')::numeric),0)::text`
  })
  const somas = sumParts.length ? (await db.query(`SELECT jsonb_build_object(${sumParts.join(',')}) somas FROM tables.registros r WHERE ${compiled.where}`, sumParams)).rows[0].somas : {}
  const dataParams = [...compiled.params, query.tamanho, (query.pagina - 1) * query.tamanho]
  const records = await db.query(`${recordSelect} WHERE ${compiled.where} ORDER BY ${compiled.order} LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`, dataParams)
  return { registros: await withComputed(db, session, fields, records.rows as DataRecord[]), total, pagina: query.pagina, tamanho: query.tamanho, somas } as RecordPage
}

export type SummaryInput = { busca: string; filtros: Filter[]; combinacao?: 'e' | 'ou'; visualizacao?: string; agrupar_por?: string; periodo: 'dia' | 'mes' | 'ano'; metricas: { campo: string; operacao: 'soma' | 'media' | 'minimo' | 'maximo' }[] }
const GROUP_LIMIT = 50

/** Counts and aggregates the whole filtered set in the database, optionally grouped by one field. */
export async function summarizeRecords(db: Database, session: TablesSession, tableId: string, input: SummaryInput) {
  await requireTable(db, session, tableId)
  const fields = await readFields(db, session, tableId), byId = new Map(fields.map(f => [f.id, f]))
  let filtros = input.filtros, combinacao: 'e' | 'ou' = input.combinacao ?? 'e', extra: { filtros: Filter[]; combinacao: 'e' | 'ou' }[] = []
  if (input.visualizacao) {
    const found = await db.query('SELECT configuracao FROM tables.visualizacoes WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3', [session.tenantId, tableId, input.visualizacao])
    if (!found.rows[0]) throw new TablesError('NOT_FOUND', 'Visualização não encontrada.', 404)
    const config = viewConfigSchema.parse(found.rows[0].configuracao)
    extra = filtros.length ? [{ filtros, combinacao: 'e' }] : []
    filtros = config.filtros; combinacao = config.combinacao
  }
  const compiled = buildRecordQuery(session.tenantId, tableId, fields, listQuerySchema.parse({ busca: input.busca, filtros, combinacao }), extra)
  const params = [...compiled.whereParams]
  const bind = (list: unknown[], value: unknown) => { list.push(value); return `$${list.length}` }
  const labels: string[] = []
  const metrics = input.metricas.map((metric, index) => {
    const field = byId.get(metric.campo)
    if (!field) throw new TablesError('INVALID_FIELD', 'Um campo da métrica não está disponível.')
    const numeric = ['numero', 'moeda', 'porcentagem', 'avaliacao'].includes(field.tipo), date = ['data', 'data_hora'].includes(field.tipo)
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
  else if (group.tipo === 'criado_por' || group.tipo === 'alterado_por') expression = group.tipo === 'criado_por' ? 'r.criado_por::text' : 'r.atualizado_por::text'
  else if (group.tipo === 'criado_em' || group.tipo === 'alterado_em') {
    const unit = { dia: 'day', mes: 'month', ano: 'year' }[input.periodo], format = { dia: 'YYYY-MM-DD', mes: 'YYYY-MM', ano: 'YYYY' }[input.periodo]
    expression = `to_char(date_trunc('${unit}',(${group.tipo === 'criado_em' ? 'r.criado_em' : 'r.atualizado_em'} AT TIME ZONE 'America/Sao_Paulo')),'${format}')`
  }
  else if (group.tipo === 'checkbox') expression = `coalesce(nullif(r.valores->>${key},''),'false')`
  else if (['texto', 'texto_longo', 'email', 'url', 'telefone'].includes(group.tipo)) expression = `nullif(r.valores->>${key},'')`
  else if (group.tipo === 'avaliacao') expression = `nullif(r.valores->>${key},'')`
  else if (['data', 'data_hora'].includes(group.tipo)) {
    const unit = { dia: 'day', mes: 'month', ano: 'year' }[input.periodo], format = { dia: 'YYYY-MM-DD', mes: 'YYYY-MM', ano: 'YYYY' }[input.periodo]
    const value = group.tipo === 'data' ? `nullif(r.valores->>${key},'')::date` : `(nullif(r.valores->>${key},'')::timestamptz AT TIME ZONE 'America/Sao_Paulo')`
    expression = `to_char(date_trunc('${unit}',${value}),'${format}')`
  } else throw new TablesError('INVALID_GROUP', 'Agrupe por seleção, pessoas, vínculo, checkbox, texto ou data.')
  // System fields group by a column of the record: the bound field id is not used there.
  if (!expression.includes(key) && !join.includes(key)) groupParams.pop()
  const rows = (await db.query(`SELECT ${expression} chave, count(*)::int quantidade${metricColumns} FROM tables.registros r ${join} WHERE ${compiled.where} GROUP BY 1 ORDER BY quantidade DESC, chave ASC NULLS LAST LIMIT ${GROUP_LIMIT + 1}`, groupParams)).rows

  const keys = rows.map(r => r.chave).filter((k): k is string => typeof k === 'string')
  const names = new Map<string, string>(group.opcoes.map(o => [o.id, o.nome]))
  if (['usuario', 'usuarios', 'criado_por', 'alterado_por'].includes(group.tipo) && keys.length) for (const m of (await db.query('SELECT id,nome FROM tables.membros() WHERE id=ANY($1::text[])', [keys])).rows) names.set(String(m.id), String(m.nome))
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
