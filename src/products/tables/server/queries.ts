import type { Database, TablesSession } from './database'
import { listQuerySchema, TablesError, type Field, type ListQuery, type RecordPage, type ViewConfig } from '../shared/contracts'
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
