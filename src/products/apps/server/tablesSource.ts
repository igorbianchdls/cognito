import { z } from 'zod'
import { withTablesTransaction, type Database as TablesDatabase, type TablesSession } from '@/products/tables/server/database'
import { normalize, Resolver } from '@/products/tables/server/mcpInput'
import { listRecords, summarizeRecords } from '@/products/tables/server/queries'
import { readFields, readRecord, requireTable } from '@/products/tables/server/repository'
import { saveRecord } from '@/products/tables/server/service'
import { cellSchema, listQuerySchema, TablesError, type DataRecord, type Field, type Values } from '@/products/tables/shared/contracts'
import { AppsError, VISITOR_FIELD_TYPES, type Manifest, type TableSource } from '../shared/contracts'

// Apps read and write Tables data through the declared sources of their manifest, always with
// the permissions of the person using the app. Fields, options and people are used by name.
const ref = z.string().trim().min(1).max(200)
const filter = z.object({ campo: ref, operador: z.enum(['eq', 'neq', 'contains', 'empty', 'not_empty', 'gt', 'gte', 'lt', 'lte']), valor: z.union([z.string().max(1000), z.number().finite(), z.boolean()]).optional() }).strict()
export const tablesRequestSchema = z.object({
  fonte: z.string().regex(/^[a-z][a-z0-9_]{0,49}$/),
  operacao: z.enum(['campos', 'listar', 'obter', 'criar', 'editar', 'resumir']),
  id: z.string().uuid().optional(),
  valores: z.record(z.string().min(1).max(200), cellSchema).optional(),
  expectedVersion: z.number().int().positive().optional(),
  busca: z.string().max(500).default(''),
  filtros: z.array(filter).max(30).default([]),
  ordenacao: z.array(z.object({ campo: ref, direcao: z.enum(['asc', 'desc']).default('asc') }).strict()).max(5).default([]),
  pagina: z.number().int().min(1).max(100000).default(1),
  tamanho: z.number().int().min(1).max(100).default(50),
  agrupar_por: ref.optional(),
  periodo: z.enum(['dia', 'mes', 'ano']).default('mes'),
  metricas: z.array(z.object({ campo: ref, operacao: z.enum(['soma', 'media', 'minimo', 'maximo']) }).strict()).max(10).default([]),
}).strict()
export type TablesRequest = z.infer<typeof tablesRequestSchema>
export type TablesTransaction = <T>(session: TablesSession, write: boolean, run: (db: TablesDatabase) => Promise<T>) => Promise<T>
const NEEDS = { campos: 'ler', listar: 'ler', obter: 'ler', resumir: 'ler', criar: 'criar', editar: 'editar' } as const

/** Field name used as key; repeated names get a short ID suffix, as in the chat tools. */
function fieldKeys(fields: Field[]) {
  const count = new Map<string, number>()
  for (const f of fields) count.set(f.nome, (count.get(f.nome) ?? 0) + 1)
  return new Map(fields.map(f => [f.id, count.get(f.nome)! > 1 ? `${f.nome} (${f.id.slice(0, 8)})` : f.nome]))
}
async function present(db: TablesDatabase, session: TablesSession, fields: Field[], records: DataRecord[]) {
  const people = new Set<string>(), links = new Set<string>()
  for (const r of records) for (const f of fields) {
    const v = r.valores[f.id]
    if (!Array.isArray(v)) continue
    if (['usuario', 'usuarios'].includes(f.tipo)) v.forEach(id => people.add(id))
    if (f.tipo === 'vinculo') v.forEach(id => links.add(id))
  }
  const names = new Map<string, string>()
  if (people.size) for (const m of (await db.query('SELECT id,nome FROM tables.membros() WHERE id=ANY($1::text[])', [[...people]])).rows) names.set(String(m.id), String(m.nome))
  if (links.size) for (const m of (await db.query("SELECT r.id,coalesce(r.valores->>t.campo_principal_id::text,'Sem nome') nome FROM tables.registros r JOIN tables.tabelas t ON t.empresa_id=r.empresa_id AND t.id=r.tabela_id WHERE r.empresa_id=$1 AND r.id=ANY($2::uuid[]) AND r.excluido_em IS NULL", [session.tenantId, [...links]])).rows) names.set(String(m.id), String(m.nome))
  const keys = fieldKeys(fields), visible = fields.filter(f => f.tipo !== 'anexo')
  const value = (f: Field, v: Values[string] | undefined) => {
    if (v === undefined || v === null) return null
    if (!Array.isArray(v)) return v
    const option = (id: string) => f.opcoes.find(o => o.id === id)?.nome ?? null
    if (f.tipo === 'selecao') return option(v[0])
    if (f.tipo === 'selecao_multipla') return v.map(option).filter(Boolean)
    if (f.tipo === 'usuario') return names.get(v[0]) ?? null
    if (f.tipo === 'usuarios') return v.map(id => names.get(id) ?? 'Pessoa removida')
    if (f.tipo === 'vinculo') return v.map(id => ({ id, titulo: names.get(id) ?? 'Registro indisponível' }))
    return v
  }
  return records.map(r => ({ id: r.id, versao: r.versao, criado_em: r.criado_em, atualizado_em: r.atualizado_em, valores: Object.fromEntries(visible.map(f => [keys.get(f.id)!, value(f, r.valores[f.id])])) }))
}

export async function tablesOperation(session: TablesSession, manifest: Manifest, input: TablesRequest, transaction: TablesTransaction = withTablesTransaction, visitor = false) {
  const source = manifest.tabelas.find(t => t.chave === input.fonte)
  if (!source) throw new AppsError('UNKNOWN_SOURCE', `A tabela "${input.fonte}" não está declarada no manifesto do app.`, 404)
  const need = NEEDS[input.operacao]
  if (!(source.operacoes as string[]).includes(need)) throw new AppsError('SOURCE_FORBIDDEN', `O manifesto do app não permite ${need} em "${input.fonte}".`, 403)
  if (visitor) {
    // Visitors only get what visitantes declares; "campos" lists the fields they may see or fill.
    const rules = source.visitantes
    if (!rules || need === 'editar' || input.operacao !== 'campos' && !rules[need as 'ler' | 'criar']?.length) throw new AppsError('SOURCE_FORBIDDEN', `Visitantes não podem ${need === 'editar' ? 'editar' : need} em "${input.fonte}".`, 403)
    if (input.busca) throw new AppsError('INVALID_DATA', 'A busca livre não está disponível no link público; use filtros.')
  }
  const tableId = source.tabela_id
  return transaction(session, need !== 'ler', async db => {
    const table = await requireTable(db, session, tableId, need === 'ler' ? 'read' : 'record')
    const fields = await readFields(db, session, tableId), resolver = new Resolver(db, session)
    const inTable = (record: DataRecord) => { if (record.tabela_id !== tableId) throw new TablesError('NOT_FOUND', 'Registro não encontrado nesta tabela.', 404); return record }
    const keys = fieldKeys(fields), rules = visitor ? visitorFields(fields, keys, source) : undefined
    // In public mode every field reference must be one the visitor may use; others are reported as unavailable, without listing them.
    const allowed = (list: Field[], ref: string) => { const f = list.find(f => f.id === ref || normalize(keys.get(f.id)!) === normalize(ref)); if (!f) throw new AppsError('FIELD_NOT_PUBLIC', `O campo "${ref.slice(0, 100)}" não está disponível no link público.`, 403); return f.id }
    const readable = (ref: string) => rules ? allowed(rules.ler, ref) : ref
    const output = async (records: DataRecord[]) => {
      const list = await present(db, session, fields, records)
      if (!rules) return list
      const shown = new Set(rules.ler.map(f => keys.get(f.id)!))
      return list.map(r => ({ ...r, valores: Object.fromEntries(Object.entries(r.valores).filter(([k]) => shown.has(k))) }))
    }
    if (input.operacao === 'campos') {
      const usable = rules ? fields.filter(f => rules.ler.includes(f) || rules.criar.includes(f)) : fields.filter(f => f.tipo !== 'anexo')
      return { campos: usable.map(f => ({ nome: f.nome, tipo: f.tipo, obrigatorio: f.obrigatorio, ...(f.opcoes.length ? { opcoes: f.opcoes.filter(o => !o.arquivado).map(o => o.nome) } : {}), ...(rules ? { visitantes: [...(rules.ler.includes(f) ? ['ler'] : []), ...(rules.criar.includes(f) ? ['criar'] : [])] } : {}) })) }
    }
    if (input.operacao === 'listar') {
      const filtros = input.filtros.map(f => ({ ...f, campo: readable(f.campo) })), ordenacao = input.ordenacao.map(o => ({ ...o, campo: readable(o.campo) }))
      const page = await listRecords(db, session, tableId, listQuerySchema.parse({ pagina: input.pagina, tamanho: rules ? Math.min(input.tamanho, 50) : input.tamanho, busca: input.busca, filtros: await resolver.filters(tableId, filtros), ordenacao: await resolver.sorts(tableId, ordenacao) }))
      return { registros: await output(page.registros), total: page.total, pagina: page.pagina, tem_mais: page.pagina * page.tamanho < page.total }
    }
    if (input.operacao === 'obter') {
      if (!input.id) throw new AppsError('INVALID_DATA', 'Informe o registro.')
      return { registro: (await output([inTable(await readRecord(db, session, input.id))]))[0] }
    }
    if (input.operacao === 'resumir') {
      const metricas: TablesRequest['metricas'] = []
      for (const m of input.metricas) metricas.push({ campo: (await resolver.field(tableId, readable(m.campo))).id, operacao: m.operacao })
      const filtros = input.filtros.map(f => ({ ...f, campo: readable(f.campo) }))
      return summarizeRecords(db, session, tableId, { busca: input.busca, periodo: input.periodo, metricas, filtros: await resolver.filters(tableId, filtros) as never, agrupar_por: input.agrupar_por ? (await resolver.field(tableId, readable(input.agrupar_por))).id : undefined })
    }
    if (!input.valores) throw new AppsError('INVALID_DATA', 'Informe os valores do registro.')
    const valores = await resolver.values(tableId, rules ? Object.fromEntries(Object.entries(input.valores).map(([k, v]) => [allowed(rules.criar, k), v])) : input.valores) as Values
    let expectedVersion: number | undefined
    if (input.operacao === 'editar') {
      if (!input.id) throw new AppsError('INVALID_DATA', 'Informe o registro a editar.')
      // Without a version the app edits the current one; with it, a concurrent change is reported.
      expectedVersion = input.expectedVersion ?? inTable(await readRecord(db, session, input.id)).versao
    }
    const saved = await saveRecord(db, session, tableId, { valores, expectedStructureVersion: table.versao_estrutura, expectedVersion }, input.operacao === 'editar' ? input.id : undefined)
    return { registro: (await output([saved]))[0] }
  })
}

/** Fields of a source that visitors may see and fill, by the names in visitantes. Unknown names expose nothing. */
function visitorFields(fields: Field[], keys: Map<string, string>, source: TableSource) {
  const pick = (names: string[] = []) => { const wanted = new Set(names.map(normalize)); return fields.filter(f => VISITOR_FIELD_TYPES.includes(f.tipo) && wanted.has(normalize(keys.get(f.id)!))) }
  return { ler: pick(source.visitantes?.ler), criar: pick(source.visitantes?.criar) }
}

/** Rejects sources the author cannot read, before a draft that uses them is saved or published. */
export async function checkSources(session: TablesSession, manifest: Manifest, transaction: TablesTransaction = withTablesTransaction) {
  if (!manifest.tabelas.length) return
  await transaction(session, false, async db => {
    for (const source of manifest.tabelas) {
      try { await requireTable(db, session, source.tabela_id) }
      catch { throw new AppsError('UNKNOWN_SOURCE', `A tabela de "${source.chave}" não existe ou não está disponível para você.`, 422) }
      if (!source.visitantes) continue
      const fields = await readFields(db, session, source.tabela_id), keys = fieldKeys(fields), rules = visitorFields(fields, keys, source)
      for (const op of ['ler', 'criar'] as const) for (const name of source.visitantes[op] ?? []) {
        if (rules[op].some(f => normalize(keys.get(f.id)!) === normalize(name))) continue
        const field = fields.find(f => normalize(keys.get(f.id)!) === normalize(name))
        throw new AppsError('INVALID_VISITOR_FIELD', field ? `"${source.chave}": o campo "${name}" é do tipo ${field.tipo} e não pode ser aberto a visitantes (pessoas, vínculos e anexos ficam de fora).` : `"${source.chave}": o campo "${name}" não existe na tabela. Campos: ${[...keys.values()].slice(0, 30).join(', ')}.`, 422)
      }
      const missing = source.visitantes.criar ? fields.filter(f => f.obrigatorio && !rules.criar.includes(f)) : []
      if (missing.length) throw new AppsError('INVALID_VISITOR_FIELD', `"${source.chave}": inclua em visitantes.criar os campos obrigatórios ${missing.map(f => keys.get(f.id)).join(', ')}.`, 422)
    }
  })
}
