import { z } from 'zod'
import type { Database, TablesSession } from './database'
import { readFields, recordSelect, requireRole, requireTable } from './repository'
import { buildRecordQuery } from './queries'
import { saveRecord } from './service'
import { withComputed } from './derived'
import { Resolver } from './mcpInput'
import { isComputed, listQuerySchema, TablesError, viewConfigSchema, type DataRecord, type Field, type Filter, type ListQuery, type Values } from '../shared/contracts'

// CSV in the format Excel opens in Brazil: ";" between columns, decimal comma, UTF-8 with BOM.
const EXPORT_LIMIT = 20_000
const quote = (value: string) => /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
const decimal = (value: unknown) => value === null || value === undefined || value === '' ? '' : String(value).replace('.', ',')

export async function exportCsv(db: Database, session: TablesSession, tableId: string, input: ListQuery) {
  const table = await requireTable(db, session, tableId), fields = await readFields(db, session, tableId)
  let query = listQuerySchema.parse(input), extra: { filtros: Filter[]; combinacao: 'e' | 'ou' }[] = []
  if (query.visualizacao) {
    const found = (await db.query('SELECT configuracao FROM tables.visualizacoes WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3', [session.tenantId, tableId, query.visualizacao])).rows[0]
    if (!found) throw new TablesError('NOT_FOUND', 'Visualização não encontrada.', 404)
    const config = viewConfigSchema.parse(found.configuracao)
    extra = query.filtros.length ? [{ filtros: query.filtros, combinacao: query.combinacao }] : []
    query = { ...query, filtros: config.filtros, combinacao: config.combinacao, ordenacao: query.ordenacao.length ? query.ordenacao : config.ordenacao }
  }
  const compiled = buildRecordQuery(session.tenantId, tableId, fields, query, extra)
  const params = [...compiled.params, EXPORT_LIMIT + 1]
  const rows = await withComputed(db, session, fields, (await db.query(`${recordSelect} WHERE ${compiled.where} ORDER BY ${compiled.order} LIMIT $${params.length}`, params)).rows as DataRecord[])
  if (rows.length > EXPORT_LIMIT) throw new TablesError('EXPORT_TOO_LARGE', `A exportação passa de ${EXPORT_LIMIT.toLocaleString('pt-BR')} registros. Use filtros para exportar em partes.`)
  const people = new Map((await db.query('SELECT id,nome FROM tables.membros()')).rows.map(r => [String(r.id), String(r.nome)]))
  const linkIds = [...new Set(rows.flatMap(r => fields.filter(f => f.tipo === 'vinculo').flatMap(f => (r.valores[f.id] as string[] | undefined) ?? [])))]
  const titles = new Map(linkIds.length ? (await db.query("SELECT r.id,coalesce(r.valores->>t.campo_principal_id::text,'Sem nome') nome FROM tables.registros r JOIN tables.tabelas t ON t.empresa_id=r.empresa_id AND t.id=r.tabela_id WHERE r.empresa_id=$1 AND r.id=ANY($2::uuid[])", [session.tenantId, linkIds])).rows.map(r => [String(r.id), String(r.nome)]) : [])
  const fileIds = [...new Set(rows.flatMap(r => fields.filter(f => f.tipo === 'anexo').flatMap(f => (r.valores[f.id] as string[] | undefined) ?? [])))]
  const files = new Map(fileIds.length ? (await db.query('SELECT id,nome FROM tables.anexos WHERE empresa_id=$1 AND id=ANY($2::uuid[])', [session.tenantId, fileIds])).rows.map(r => [String(r.id), String(r.nome)]) : [])
  const cell = (field: Field, value: Values[string] | undefined): string => {
    if (value === null || value === undefined) return ''
    const list = Array.isArray(value) ? value : []
    switch (field.tipo) {
      case 'selecao': case 'selecao_multipla': return list.map(id => field.opcoes.find(o => o.id === id)?.nome ?? '').filter(Boolean).join(', ')
      case 'usuario': case 'usuarios': case 'criado_por': case 'alterado_por': return list.map(id => people.get(id) ?? 'Pessoa removida').join(', ')
      case 'busca': return list.join(', ')
      case 'porcentagem': return decimal(value) + '%'
      case 'vinculo': return list.map(id => titles.get(id) ?? '').filter(Boolean).join(', ')
      case 'anexo': return list.map(id => files.get(id) ?? '').filter(Boolean).join(', ')
      case 'numero': case 'moeda': case 'avaliacao': case 'autonumero': case 'agregacao': return decimal(value)
      case 'formula': return typeof value === 'number' ? decimal(value) : typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)
      case 'checkbox': return value ? 'Sim' : 'Não'
      default: return String(value)
    }
  }
  const lines = [fields.map(f => quote(f.nome)).join(';'), ...rows.map(r => fields.map(f => quote(cell(f, r.valores[f.id]))).join(';'))]
  return { nome: table.nome, csv: '﻿' + lines.join('\r\n') + '\r\n', registros: rows.length }
}

// ---- Import --------------------------------------------------------------------------------
export const importSchema = z.object({ colunas: z.array(z.string().uuid()).min(1).max(200), linhas: z.array(z.array(z.string().max(100_000))).min(1).max(500), primeira_linha: z.number().int().min(1).default(2), expectedStructureVersion: z.number().int().positive() }).strict()
const TRUE = new Set(['sim', 's', 'true', 'verdadeiro', '1', 'x', 'yes', 'y']), FALSE = new Set(['não', 'nao', 'n', 'false', 'falso', '0', 'no', ''])
const list = (text: string) => text.split(/[,\n]/).map(v => v.trim()).filter(Boolean)
function number(text: string) {
  let t = text.replace(/[R$\s ]/g, '')
  // "1.234,56" and "1234,56" are Brazilian; "1,234.56" and "1234.56" are not.
  if (t.includes(',') && (!t.includes('.') || t.lastIndexOf(',') > t.lastIndexOf('.'))) t = t.replace(/\./g, '').replace(',', '.')
  else t = t.replace(/,/g, '')
  if (!/^-?\d+(\.\d+)?$/.test(t)) throw new TablesError('INVALID_VALUE', `"${text.slice(0, 40)}" não é um número.`)
  return t
}
function date(text: string) {
  const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/), iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/)
  const [y, m, d] = br ? [br[3], br[2], br[1]] : iso ? [iso[1], iso[2], iso[3]] : ['', '', '']
  const value = y ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : ''
  if (!value || new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) !== value) throw new TablesError('INVALID_VALUE', `"${text.slice(0, 40)}" não é uma data (use dd/mm/aaaa).`)
  return value
}
function dateTime(text: string) {
  const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})[ T](\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  const value = br ? `${br[3]}-${br[2].padStart(2, '0')}-${br[1].padStart(2, '0')}T${br[4].padStart(2, '0')}:${br[5]}:${br[6] ?? '00'}-03:00` : text
  if (!Number.isFinite(Date.parse(value)) || !/T\d{2}:\d{2}/.test(value)) throw new TablesError('INVALID_VALUE', `"${text.slice(0, 40)}" não é data e hora (use dd/mm/aaaa hh:mm).`)
  return new Date(value).toISOString()
}
/** Text of a cell to the value the field accepts; names stay names, resolved afterwards. */
function convert(field: Field, raw: string): unknown {
  const text = raw.trim()
  if (field.tipo === 'checkbox') { const k = text.toLocaleLowerCase('pt-BR'); if (TRUE.has(k)) return true; if (FALSE.has(k)) return false; throw new TablesError('INVALID_VALUE', `"${text.slice(0, 40)}": use Sim ou Não.`) }
  if (!text) return null
  switch (field.tipo) {
    case 'numero': case 'porcentagem': return Number(number(text.replace(/%$/, '')))
    case 'avaliacao': { const n = Number(number(text)); if (!Number.isInteger(n)) throw new TablesError('INVALID_VALUE', 'Use um número inteiro de estrelas.'); return n }
    case 'moeda': return number(text)
    case 'data': return date(text)
    case 'data_hora': return dateTime(text)
    case 'selecao': case 'usuario': return text
    case 'selecao_multipla': case 'usuarios': case 'vinculo': return list(text)
    default: return text
  }
}
/** Creates one record per line. Each line runs on its own: valid lines are saved, the others come back with the reason. */
export async function importRows(db: Database, session: TablesSession, tableId: string, raw: unknown) {
  const input = importSchema.parse(raw)
  const table = await requireTable(db, session, tableId, 'record'); await requireRole(db, session, table.base_id, 'editor')
  if (table.versao_estrutura !== input.expectedStructureVersion) throw new TablesError('VERSION_CONFLICT', 'A estrutura da tabela mudou. Recarregue antes de importar.', 409)
  const fields = await readFields(db, session, tableId), resolver = new Resolver(db, session)
  const columns = input.colunas.map(id => { const f = fields.find(f => f.id === id); if (!f) throw new TablesError('INVALID_FIELD', 'Uma das colunas aponta para um campo removido.'); if (f.tipo === 'anexo') throw new TablesError('INVALID_FIELD', `${f.nome}: anexos não podem ser importados por CSV.`); if (isComputed(f.tipo)) throw new TablesError('INVALID_FIELD', `${f.nome} é preenchido pelo sistema e não pode ser importado.`); return f })
  if (new Set(input.colunas).size !== input.colunas.length) throw new TablesError('INVALID_FIELD', 'Cada campo pode receber só uma coluna.')
  let criados = 0
  const erros: { linha: number; mensagem: string }[] = []
  for (const [index, line] of input.linhas.entries()) {
    if (line.every(v => !v.trim())) continue
    await db.query('SAVEPOINT linha_csv')
    try {
      const named: Record<string, unknown> = {}
      columns.forEach((f, i) => { try { named[f.id] = convert(f, line[i] ?? '') } catch (e) { throw new TablesError('INVALID_VALUE', `${f.nome}: ${(e as Error).message}`) } })
      const valores = await resolver.values(tableId, named) as Values
      await saveRecord(db, session, tableId, { valores, expectedStructureVersion: table.versao_estrutura })
      await db.query('RELEASE SAVEPOINT linha_csv'); criados++
    } catch (error) {
      await db.query('ROLLBACK TO SAVEPOINT linha_csv')
      erros.push({ linha: input.primeira_linha + index, mensagem: error instanceof TablesError ? error.message : 'Valor incompatível com o campo.' })
      if (erros.length >= 100) break
    }
  }
  return { criados, erros }
}
