import type { Database, TablesSession } from './database'
import { readFields } from './repository'
import { evaluateFormula, FormulaError, formulaReferences, parseFormula, type FormulaValue } from '../shared/formula'
import { DERIVED_TYPES, SYSTEM_TYPES, TablesError, type CellValue, type DataRecord, type Field } from '../shared/contracts'

// Values the system fills in when records are read: record number, dates and authors, formulas,
// lookups (busca) and aggregations of linked records. They are never stored in valores.
type Row = DataRecord & { numero?: number | string; criado_por?: number | string; atualizado_por?: number | string }
const NUMERIC = ['numero', 'moeda', 'porcentagem', 'avaliacao', 'autonumero']
const normalize = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').trim().toLocaleLowerCase('pt-BR')

/** Rejects configurations that cannot be computed, before the field is saved. */
export function validateComputed(field: { nome: string; tipo: string; configuracao: Record<string, unknown> }, fields: Field[], target?: Field[]) {
  if (field.tipo === 'formula') {
    const source = String(field.configuracao.formula ?? '')
    if (!source) throw new TablesError('INVALID_FIELD', 'Escreva a fórmula, por exemplo {Preço} * {Quantidade}.')
    let refs: string[]
    try { refs = formulaReferences(parseFormula(source)) } catch (e) { throw new TablesError('INVALID_FIELD', `Fórmula: ${(e as Error).message}`) }
    for (const ref of refs) {
      const f = fields.find(f => normalize(f.nome) === normalize(ref))
      if (!f) throw new TablesError('INVALID_FIELD', `Fórmula: não existe o campo {${ref}}.`)
      // Lookups and aggregations are computed before formulas; a formula over another formula is not supported.
      if (f.tipo === 'formula') throw new TablesError('INVALID_FIELD', `Fórmula: {${ref}} também é uma fórmula; repita a expressão em vez de referenciá-la.`)
    }
  }
  if (field.tipo === 'busca' || field.tipo === 'agregacao') {
    const link = fields.find(f => f.id === field.configuracao.vinculo)
    if (!link || link.tipo !== 'vinculo') throw new TablesError('INVALID_FIELD', 'Escolha um campo de vínculo desta tabela.')
    const operation = String(field.configuracao.operacao ?? '')
    if (field.tipo === 'agregacao' && !operation) throw new TablesError('INVALID_FIELD', 'Escolha a operação: contagem, soma, média, mínimo ou máximo.')
    if (field.tipo === 'agregacao' && operation === 'contagem') return
    const remote = target?.find(f => f.id === field.configuracao.campo)
    if (!remote) throw new TablesError('INVALID_FIELD', 'Escolha o campo da tabela vinculada.')
    if (DERIVED_TYPES.includes(remote.tipo)) throw new TablesError('INVALID_FIELD', 'Escolha um campo com valores na tabela vinculada.')
    if (field.tipo === 'agregacao' && !NUMERIC.includes(remote.tipo)) throw new TablesError('INVALID_FIELD', `${remote.nome} não é numérico: use contagem ou escolha um campo de número.`)
  }
}

export async function withComputed(db: Database, session: TablesSession, fields: Field[], records: Row[]): Promise<DataRecord[]> {
  const system = fields.filter(f => SYSTEM_TYPES.includes(f.tipo)), derived = fields.filter(f => DERIVED_TYPES.includes(f.tipo))
  if (!records.length || !system.length && !derived.length) return records
  let members: Map<string, string> | undefined
  const people = async () => members ??= new Map((await db.query('SELECT id,nome FROM tables.membros()')).rows.map(r => [String(r.id), String(r.nome)]))
  for (const r of records) for (const f of system) {
    r.valores[f.id] = f.tipo === 'autonumero' ? Number(r.numero) : f.tipo === 'criado_em' ? new Date(r.criado_em).toISOString() : f.tipo === 'alterado_em' ? new Date(r.atualizado_em).toISOString() : [String(f.tipo === 'criado_por' ? r.criado_por : r.atualizado_por)]
  }
  // Text of a value as people read it, for formulas and lookups.
  const display = async (field: Field, value: CellValue | undefined): Promise<FormulaValue> => {
    if (value === undefined || value === null || Array.isArray(value) && !value.length) return null
    if (NUMERIC.includes(field.tipo)) return Number(value)
    if (field.tipo === 'checkbox') return Boolean(value)
    if (['selecao', 'selecao_multipla'].includes(field.tipo)) return (value as string[]).map(id => field.opcoes.find(o => o.id === id)?.nome ?? '').filter(Boolean).join(', ')
    if (['usuario', 'usuarios', 'criado_por', 'alterado_por'].includes(field.tipo)) { const names = await people(); return (value as string[]).map(id => names.get(id) ?? 'Pessoa removida').join(', ') }
    if (field.tipo === 'vinculo' || field.tipo === 'anexo') return (value as string[]).length
    return String(value)
  }
  // Linked records of every lookup and aggregation of the page, read once per target table.
  const remote = new Map<string, { fields: Field[]; rows: Map<string, Row> }>()
  for (const f of derived.filter(f => f.tipo !== 'formula')) {
    const link = fields.find(l => l.id === f.configuracao.vinculo)
    if (!link?.tabela_destino_id || remote.has(link.tabela_destino_id)) continue
    const ids = [...new Set(records.flatMap(r => fields.filter(l => l.tabela_destino_id === link.tabela_destino_id).flatMap(l => (r.valores[l.id] as string[] | undefined) ?? [])))]
    const { recordSelect } = await import('./repository')
    const rows = ids.length ? (await db.query(`${recordSelect} WHERE r.empresa_id=$1 AND r.id=ANY($2::uuid[]) AND r.excluido_em IS NULL`, [session.tenantId, ids])).rows as Row[] : []
    const targetFields = await readFields(db, session, link.tabela_destino_id)
    await withComputed(db, session, targetFields.filter(t => SYSTEM_TYPES.includes(t.tipo)), rows)
    remote.set(link.tabela_destino_id, { fields: targetFields, rows: new Map(rows.map(r => [r.id, r])) })
  }
  const parsed = new Map(derived.filter(f => f.tipo === 'formula').map(f => { try { return [f.id, parseFormula(String(f.configuracao.formula ?? ''))] as const } catch { return [f.id, null] as const } }))
  for (const r of records) {
    for (const f of derived.filter(f => f.tipo !== 'formula')) {
      const link = fields.find(l => l.id === f.configuracao.vinculo), target = link?.tabela_destino_id ? remote.get(link.tabela_destino_id) : undefined
      const linked = ((link ? r.valores[link.id] : undefined) as string[] | undefined ?? []).map(id => target?.rows.get(id)).filter((x): x is Row => Boolean(x))
      if (f.tipo === 'agregacao' && f.configuracao.operacao === 'contagem') { r.valores[f.id] = linked.length; continue }
      const source = target?.fields.find(t => t.id === f.configuracao.campo)
      if (!source) { r.valores[f.id] = null; continue }
      if (f.tipo === 'busca') { r.valores[f.id] = (await Promise.all(linked.map(l => display(source, l.valores[source.id])))).filter(v => v !== null && v !== '').map(String); continue }
      const numbers = linked.map(l => l.valores[source.id]).filter(v => v !== null && v !== undefined && v !== '').map(Number).filter(Number.isFinite)
      const op = f.configuracao.operacao
      r.valores[f.id] = !numbers.length ? (op === 'soma' ? 0 : null) : op === 'soma' ? round(numbers.reduce((a, b) => a + b, 0)) : op === 'media' ? round(numbers.reduce((a, b) => a + b, 0) / numbers.length) : op === 'minimo' ? Math.min(...numbers) : Math.max(...numbers)
    }
    for (const f of derived.filter(f => f.tipo === 'formula')) {
      const tree = parsed.get(f.id)
      if (!tree) { r.valores[f.id] = '#ERRO'; continue }
      const values = new Map<string, FormulaValue>()
      for (const ref of formulaReferences(tree)) { const field = fields.find(x => normalize(x.nome) === normalize(ref)); values.set(normalize(ref), field ? await display(field, r.valores[field.id]) : null) }
      try { const result = evaluateFormula(tree, name => values.get(normalize(name)) ?? null); r.valores[f.id] = typeof result === 'number' ? (Number.isFinite(result) ? round(result) : null) : result }
      catch (e) { r.valores[f.id] = e instanceof FormulaError ? '#ERRO' : null }
    }
  }
  return records
}
const round = (n: number) => Math.round(n * 1e6) / 1e6
