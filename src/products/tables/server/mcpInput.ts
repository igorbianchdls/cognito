import type { Database, TablesSession } from './database'
import { getBundle, readFields, readRecord } from './repository'
import { readMcp, type Input } from './mcp'
import { summarizeRecords } from './queries'
import { TablesError, type Field } from '../shared/contracts'

// The public MCP tools accept names where people think in names (fields, options,
// people, linked records, views). Everything is resolved to IDs here, once, before
// previews, snapshots and execution, which keep working only with IDs.

/** Public tool that owns each internal operation, used in previews and confirmations. */
export const PUBLIC_TOOL: Record<string, string> = {
  criar_base: 'salvar_base', editar_base: 'salvar_base', compartilhar_base: 'salvar_base', criar_tabela: 'salvar_tabela', editar_tabela: 'salvar_tabela',
  criar_campo: 'salvar_campo', editar_campo: 'salvar_campo', salvar_registros: 'salvar_registros',
  criar_registro: 'salvar_registros', editar_registro: 'salvar_registros', criar_registros_em_lote: 'salvar_registros', editar_registros_em_lote: 'salvar_registros',
  criar_visualizacao: 'salvar_visualizacao', editar_visualizacao: 'salvar_visualizacao', excluir_visualizacao: 'salvar_visualizacao',
  adicionar_comentario: 'comentar', mover_para_lixeira: 'lixeira', mover_registros_para_lixeira: 'lixeira', restaurar_item: 'lixeira',
  preparar_upload: 'anexos', confirmar_upload: 'anexos', remover_anexo: 'anexos',
}

export const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR')
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const invalid = (message: string) => new TablesError('INVALID_INPUT', message)
const defined = (value: Input) => Object.fromEntries(Object.entries(value).filter(([, v]) => v !== undefined))

type Named = { id: string; nome: string; email?: string }
function pick<T extends Named>(items: T[], ref: string, kind: string): T {
  const exact = items.find(item => item.id === ref)
  if (exact) return exact
  const key = normalize(ref), found = items.filter(item => normalize(item.nome) === key || (item.email && normalize(item.email) === key))
  if (found.length === 1) return found[0]
  if (found.length > 1) throw new TablesError('AMBIGUOUS_REFERENCE', `Há mais de ${kind} chamado "${ref}". Informe o ID.`)
  const sample = items.slice(0, 20).map(item => item.nome).join(', ')
  throw new TablesError('UNKNOWN_REFERENCE', `Não encontrei ${kind} "${ref}".${sample ? ` Disponíveis: ${sample}${items.length > 20 ? '…' : ''}.` : ''}`)
}

export class Resolver {
  private fields = new Map<string, Field[]>()
  private people?: Named[]
  constructor(private db: Database, private session: TablesSession) {}
  async fieldsOf(tableId: string) {
    if (!this.fields.has(tableId)) this.fields.set(tableId, await readFields(this.db, this.session, tableId))
    return this.fields.get(tableId)!
  }
  async field(tableId: string, ref: string) { return pick(await this.fieldsOf(tableId), ref, 'um campo') }
  async members() { return this.people ??= (await this.db.query('SELECT id,nome,email FROM tables.membros()')).rows as Named[] }
  async choices(field: Field, refs: string[]): Promise<string[]> {
    if (['selecao', 'selecao_multipla'].includes(field.tipo)) return refs.map(ref => pick(field.opcoes, ref, `uma opção de ${field.nome}`).id)
    if (['usuario', 'usuarios'].includes(field.tipo)) { const people = await this.members(); return refs.map(ref => pick(people, ref, 'uma pessoa').id) }
    if (field.tipo !== 'vinculo' || !field.tabela_destino_id) return refs
    const ids: string[] = []
    for (const ref of refs) {
      if (UUID.test(ref)) { ids.push(ref); continue }
      // Linked records are found by their primary field, as people see them in the table.
      const rows = (await this.db.query("SELECT r.id FROM tables.registros r JOIN tables.tabelas t ON t.empresa_id=r.empresa_id AND t.id=r.tabela_id WHERE r.empresa_id=$1 AND r.tabela_id=$2 AND r.excluido_em IS NULL AND lower(r.valores->>t.campo_principal_id::text)=lower($3) LIMIT 2", [this.session.tenantId, field.tabela_destino_id, ref.trim()])).rows
      if (rows.length !== 1) throw new TablesError(rows.length ? 'AMBIGUOUS_REFERENCE' : 'UNKNOWN_REFERENCE', rows.length ? `Há mais de um registro "${ref}" para vincular em ${field.nome}. Informe o ID.` : `Não encontrei o registro "${ref}" para vincular em ${field.nome}.`)
      ids.push(String(rows[0].id))
    }
    return ids
  }
  async values(tableId: string, values: Input = {}) {
    const out: Input = {}
    for (const [ref, value] of Object.entries(values)) {
      const field = await this.field(tableId, ref)
      if (field.id in out) throw invalid(`Informe ${field.nome} uma única vez.`)
      const relational = ['selecao', 'selecao_multipla', 'usuario', 'usuarios', 'vinculo'].includes(field.tipo)
      out[field.id] = relational && value !== null ? await this.choices(field, (Array.isArray(value) ? value : [value]).map(String)) : value
    }
    return out
  }
  async relations(tableId: string, relations: Input[] = []) {
    const out: Input[] = []
    for (const change of relations) { const field = await this.field(tableId, change.campo); out.push({ campo_id: field.id, modo: change.modo, valores: await this.choices(field, change.valores) }) }
    return out
  }
  async filters(tableId: string, filters: Input[] = []) {
    const out: Input[] = []
    for (const filter of filters) {
      const field = await this.field(tableId, filter.campo)
      const relational = ['selecao', 'selecao_multipla', 'usuario', 'usuarios', 'vinculo'].includes(field.tipo)
      const valor = relational && ['eq', 'neq'].includes(filter.operador) && filter.valor !== undefined ? (await this.choices(field, [String(filter.valor)]))[0] : filter.valor
      out.push(defined({ campo: field.id, operador: filter.operador, valor }))
    }
    return out
  }
  async sorts(tableId: string, sorts: Input[] = []) {
    const out: Input[] = []
    for (const sort of sorts) out.push({ campo: (await this.field(tableId, sort.campo)).id, direcao: sort.direcao ?? 'asc' })
    return out
  }
  async view(tableId: string, ref: string) { return pick((await getBundle(this.db, this.session, tableId)).visualizacoes, ref, 'uma visualização') }
}

/** Runs a public read tool with names resolved to IDs. */
export async function readTables(db: Database, session: TablesSession, key: string, input: Input) {
  const r = new Resolver(db, session), page = { pagina: input.pagina ?? 1, tamanho: input.tamanho ?? 10 }
  if (key === 'listar_bases') return input.base_id ? readMcp(db, session, 'obter_base', { base_id: input.base_id, ...page }) : readMcp(db, session, 'listar_bases', { busca: input.busca, ...page })
  if (key === 'obter_tabela') {
    const extra: Input = {}
    if (input.campo) { extra.campo_id = (await r.field(input.tabela_id, input.campo)).id; extra.secao = 'campos' }
    if (input.visualizacao) { extra.visualizacao_id = (await r.view(input.tabela_id, input.visualizacao)).id; extra.secao = 'visualizacoes' }
    return readMcp(db, session, 'obter_tabela', { tabela_id: input.tabela_id, secao: input.secao, opcoes_pagina: input.opcoes_pagina, ...page, ...extra })
  }
  if (key === 'consultar_registros') {
    const fields = input.campos ? await Promise.all(input.campos.map((c: string) => r.field(input.tabela_id, c))) : undefined
    return readMcp(db, session, 'consultar_registros', defined({
      tabela_id: input.tabela_id, busca: input.busca, ...page, filtros: await r.filters(input.tabela_id, input.filtros), combinacao: input.combinacao, ordenacao: await r.sorts(input.tabela_id, input.ordenacao),
      campos: fields?.map(f => f.id), visualizacao: input.visualizacao ? (await r.view(input.tabela_id, input.visualizacao)).id : undefined,
    }))
  }
  if (key === 'obter_registro') {
    const record = await readRecord(db, session, input.registro_id)
    const campos = input.campos ? (await Promise.all(input.campos.map((c: string) => r.field(record.tabela_id, c)))).map(f => f.id) : undefined
    const trecho = input.trecho ? { campo_id: (await r.field(record.tabela_id, input.trecho.campo)).id, inicio: input.trecho.inicio, tamanho: input.trecho.tamanho } : undefined
    return readMcp(db, session, 'obter_registro', defined({ registro_id: input.registro_id, campos, trecho }))
  }
  if (key === 'resumir') {
    const metricas: { campo: string; operacao: 'soma' | 'media' | 'minimo' | 'maximo' }[] = []
    for (const metric of input.metricas ?? []) metricas.push({ campo: (await r.field(input.tabela_id, metric.campo)).id, operacao: metric.operacao })
    return summarizeRecords(db, session, input.tabela_id, {
      busca: input.busca ?? '', periodo: input.periodo ?? 'mes', metricas, filtros: await r.filters(input.tabela_id, input.filtros) as never,
      agrupar_por: input.agrupar_por ? (await r.field(input.tabela_id, input.agrupar_por)).id : undefined,
      visualizacao: input.visualizacao ? (await r.view(input.tabela_id, input.visualizacao)).id : undefined,
    })
  }
  if (key === 'listar_atividade') return readMcp(db, session, input.tipo === 'historico' ? 'consultar_historico' : 'listar_comentarios', { registro_id: input.registro_id, ...page })
  return readMcp(db, session, key, input)
}

export type ResolvedWrite = { op: string; dados: Input; direct: boolean }

/** Maps a public write tool to the internal operation, with IDs. direct = only adds data. */
export async function resolveWrite(db: Database, session: TablesSession, key: string, d: Input): Promise<ResolvedWrite> {
  const r = new Resolver(db, session)
  const structure = d.expectedStructureVersion ? { expectedStructureVersion: d.expectedStructureVersion } : {}
  const version = d.expectedVersion ? { expectedVersion: d.expectedVersion } : {}
  if (key === 'salvar_base') {
    if (!d.base_id) { if (!d.nome) throw invalid('Informe o nome da nova base.'); return { op: 'criar_base', dados: defined({ nome: d.nome, descricao: d.descricao, cor: d.cor, modelo: d.modelo }), direct: true } }
    if (d.modelo) throw invalid('O modelo só pode ser escolhido ao criar a base.')
    if (d.acesso || d.membros) {
      if (d.nome || d.descricao !== undefined || d.cor) throw invalid('Mude o compartilhamento separado do nome, descrição e cor.')
      const people = await r.members()
      const membros = d.membros?.map((m: Input) => ({ usuario_id: pick(people, m.pessoa, 'uma pessoa').id, papel: m.papel }))
      return { op: 'compartilhar_base', dados: defined({ base_id: d.base_id, acesso: d.acesso, membros, ...version }), direct: false }
    }
    const alteracoes = defined({ nome: d.nome, descricao: d.descricao, cor: d.cor })
    if (!Object.keys(alteracoes).length) throw invalid('Informe o que deve mudar na base.')
    return { op: 'editar_base', dados: { base_id: d.base_id, alteracoes, ...version }, direct: false }
  }
  if (key === 'salvar_tabela') {
    if (d.tabela_id) { if (d.base_id) throw invalid('Use base_id para criar ou tabela_id para renomear, não os dois.'); return { op: 'editar_tabela', dados: { tabela_id: d.tabela_id, nome: d.nome, ...structure }, direct: false } }
    if (!d.base_id) throw invalid('Informe base_id para criar ou tabela_id para renomear.')
    return { op: 'criar_tabela', dados: { base_id: d.base_id, nome: d.nome }, direct: true }
  }
  if (key === 'salvar_campo') {
    const fields = await r.fieldsOf(d.tabela_id), existing = d.campo ? pick(fields, d.campo, 'um campo') : undefined
    const destination = d.tabela_destino ? pick((await getBundle(db, session, d.tabela_id)).tabelas, d.tabela_destino, 'uma tabela').id : undefined
    // Options named like existing ones keep their IDs, so records keep their choices.
    const opcoes = d.opcoes?.map((o: string | Input) => typeof o === 'string' ? { nome: o } : o).map((o: Input) => {
      const same = !o.id && existing?.opcoes.find(e => normalize(e.nome) === normalize(o.nome))
      return defined(same ? { id: same.id, nome: o.nome, cor: o.cor ?? same.cor } : o)
    })
    // Lookups and aggregations name the link of this table and the field of the linked table.
    const link = d.vinculo ? pick(fields, d.vinculo, 'um campo de vínculo') : undefined
    const remote = d.campo_vinculado ? (link?.tabela_destino_id ? pick(await r.fieldsOf(link.tabela_destino_id), d.campo_vinculado, 'um campo da tabela vinculada') : (() => { throw invalid('Informe vinculo junto com campo_vinculado.') })()) : undefined
    const config = defined({ moeda: d.moeda, formula: d.formula, maximo: d.maximo, vinculo: link?.id, campo: remote?.id, operacao: d.operacao })
    const attrs = defined({ nome: d.nome, tipo: d.tipo, obrigatorio: d.obrigatorio, configuracao: Object.keys(config).length ? { ...(existing?.configuracao ?? {}), ...config } : undefined, tabela_destino_id: destination, opcoes })
    if (existing) {
      if (!Object.keys(attrs).length) throw invalid('Informe o que deve mudar no campo.')
      return { op: 'editar_campo', dados: { tabela_id: d.tabela_id, campo_id: existing.id, alteracoes: attrs, ...structure }, direct: false }
    }
    if (!d.nome || !d.tipo) throw invalid('Informe nome e tipo do novo campo.')
    return { op: 'criar_campo', dados: { tabela_id: d.tabela_id, campo: attrs, ...structure }, direct: true }
  }
  if (key === 'salvar_registros') {
    const registros: Input[] = []
    for (const item of d.registros) registros.push(defined({ registro_id: item.registro_id, valores: await r.values(d.tabela_id, item.valores), relacoes: await r.relations(d.tabela_id, item.relacoes), expectedVersion: item.expectedVersion }))
    return { op: 'salvar_registros', dados: { tabela_id: d.tabela_id, registros, ...structure }, direct: registros.length === 1 && !registros[0].registro_id }
  }
  if (key === 'salvar_visualizacao') {
    const bundle = await getBundle(db, session, d.tabela_id), fields = bundle.campos
    const view = d.visualizacao ? pick(bundle.visualizacoes, d.visualizacao, 'uma visualização') : undefined
    if (d.acao !== 'criar' && !view) throw invalid('Informe a visualização a editar ou excluir.')
    if (d.acao === 'excluir') return { op: 'excluir_visualizacao', dados: { tabela_id: d.tabela_id, visualizacao_id: view!.id, ...version }, direct: false }
    const fieldId = (ref: string | null | undefined) => ref === null ? null : ref === undefined ? undefined : pick(fields, ref, 'um campo').id
    const tipo = d.tipo ?? view?.tipo ?? 'grade'
    const configuracao = defined({
      filtros: d.filtros && await r.filters(d.tabela_id, d.filtros), ordenacao: d.ordenacao && await r.sorts(d.tabela_id, d.ordenacao),
      agrupamento: fieldId(d.agrupar_por) ?? (d.acao === 'criar' && tipo === 'kanban' ? fields.find(f => f.tipo === 'selecao')?.id : undefined),
      campo_data: fieldId(d.campo_data) ?? (d.acao === 'criar' && ['calendario', 'linha_do_tempo'].includes(tipo) ? fields.find(f => ['data', 'data_hora'].includes(f.tipo))?.id : undefined),
      campo_fim: fieldId(d.campo_fim), combinacao: d.combinacao, mensagem: d.mensagem,
    })
    // Listed fields are shown in that order; the others stay hidden.
    const visible = d.campos_visiveis?.map((ref: string) => pick(fields, ref, 'um campo').id) as string[] | undefined
    const campos = visible && fields.map((f, i) => ({ campo_id: f.id, visivel: visible.includes(f.id), largura: view?.campos.find(c => c.campo_id === f.id)?.largura ?? 180, posicao: visible.includes(f.id) ? visible.indexOf(f.id) : visible.length + i }))
    if (d.acao === 'criar') {
      if (!d.nome) throw invalid('Informe o nome da nova visualização.')
      return { op: 'criar_visualizacao', dados: { tabela_id: d.tabela_id, visualizacao: defined({ nome: d.nome, tipo, configuracao, campos }) }, direct: true }
    }
    const alteracoes = defined({ nome: d.nome, tipo: d.tipo, configuracao: Object.keys(configuracao).length ? configuracao : undefined, campos })
    if (!Object.keys(alteracoes).length) throw invalid('Informe o que deve mudar na visualização.')
    return { op: 'editar_visualizacao', dados: { tabela_id: d.tabela_id, visualizacao_id: view!.id, alteracoes, ...version }, direct: false }
  }
  if (key === 'comentar') return { op: 'adicionar_comentario', dados: { registro_id: d.registro_id, texto: d.texto }, direct: true }
  if (key === 'lixeira') {
    if (d.tipo !== 'registros' && d.ids.length > 1) throw invalid('Envie um item por vez para bases, tabelas e campos.')
    if (d.acao === 'restaurar') { if (d.ids.length > 1) throw invalid('Restaure um item por vez.'); return { op: 'restaurar_item', dados: { tipo: d.tipo, item_id: d.ids[0] }, direct: false } }
    if (d.tipo === 'registros') {
      const first = await readRecord(db, session, d.ids[0])
      return { op: 'mover_registros_para_lixeira', dados: { tabela_id: first.tabela_id, registros: d.ids.map((id: string) => ({ registro_id: id, ...(d.ids.length === 1 ? version : {}) })) }, direct: false }
    }
    return { op: 'mover_para_lixeira', dados: { tipo: d.tipo, item_id: d.ids[0], ...version }, direct: false }
  }
  if (key === 'anexos') {
    if (d.acao === 'preparar') {
      if (!d.registro_id || !d.campo) throw invalid('Informe registro_id e o campo de anexo.')
      const record = await readRecord(db, session, d.registro_id)
      return { op: 'preparar_upload', dados: defined({ registro_id: d.registro_id, campo_id: (await r.field(record.tabela_id, d.campo)).id, nome: d.nome, mime_type: d.mime_type, tamanho: d.tamanho }), direct: true }
    }
    if (!d.anexo_id) throw invalid('Informe anexo_id.')
    return { op: d.acao === 'confirmar' ? 'confirmar_upload' : 'remover_anexo', dados: { anexo_id: d.anexo_id }, direct: d.acao === 'confirmar' }
  }
  throw new TablesError('NOT_FOUND', 'Operação desconhecida.', 404)
}
