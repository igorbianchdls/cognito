import type { Database, TablesSession } from './database'
import { TablesError, viewConfigSchema, type Base, type BaseRole, type DataTable, type Field, type DataRecord, type TableBundle, type View } from '../shared/contracts'

const LEVEL: Record<BaseRole, number> = { leitor: 1, editor: 2, administrador: 3 }
const NEEDS: Record<BaseRole, string> = { leitor: 'ver esta base', editor: 'editar registros e visualizações desta base', administrador: 'mudar a estrutura ou o compartilhamento desta base' }
/** Friendly check of the person's role in a base; the database policies enforce the same rule. */
export async function requireRole(db: Database, session: TablesSession, baseId: string, needed: BaseRole) {
  const papel = (await db.query('SELECT tables.papel_base($1) papel', [baseId])).rows[0]?.papel as BaseRole | null
  if (!papel) throw new TablesError('NOT_FOUND', 'Base não encontrada.', 404)
  if (LEVEL[papel] < LEVEL[needed]) throw new TablesError('FORBIDDEN', `Seu papel nesta base (${papel}) não permite ${NEEDS[needed]}.`, 403)
  return papel
}

export async function requireBase(db: Database, session: TablesSession, id: string): Promise<Base> {
  const result = await db.query('SELECT *,tables.papel_base(id) papel FROM tables.bases WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL', [session.tenantId, id])
  if (!result.rows[0]) throw new TablesError('NOT_FOUND', 'Base não encontrada.', 404)
  return result.rows[0] as Base
}

export async function requireTable(db: Database, session: TablesSession, id: string, lock: 'read' | 'record' | 'structure' = 'read'): Promise<DataTable> {
  const result = await db.query(`SELECT t.* FROM tables.tabelas t JOIN tables.bases b ON b.empresa_id=t.empresa_id AND b.id=t.base_id WHERE t.empresa_id=$1 AND t.id=$2 AND t.excluido_em IS NULL AND b.excluido_em IS NULL ${lock === 'structure' ? 'FOR UPDATE OF t' : lock === 'record' ? 'FOR SHARE OF t' : ''}`, [session.tenantId, id])
  if (!result.rows[0]) {
    // Locks need write rights in the base: a table people can read but not change is reported as such.
    if (lock !== 'read' && (await db.query('SELECT 1 FROM tables.tabelas t JOIN tables.bases b ON b.empresa_id=t.empresa_id AND b.id=t.base_id WHERE t.empresa_id=$1 AND t.id=$2 AND t.excluido_em IS NULL AND b.excluido_em IS NULL', [session.tenantId, id])).rows[0]) throw new TablesError('FORBIDDEN', 'Seu papel nesta base permite apenas consultar.', 403)
    throw new TablesError('NOT_FOUND', 'Tabela não encontrada.', 404)
  }
  return result.rows[0] as DataTable
}

export async function readFields(db: Database, session: TablesSession, tableId: string): Promise<Field[]> {
  const result = await db.query(`SELECT c.*,coalesce((SELECT jsonb_agg(jsonb_build_object('id',o.id,'nome',o.nome,'cor',o.cor,'posicao',o.posicao,'arquivado',o.arquivado_em IS NOT NULL) ORDER BY o.posicao,o.id) FROM tables.campo_opcoes o WHERE o.empresa_id=c.empresa_id AND o.campo_id=c.id),'[]') opcoes FROM tables.campos c WHERE c.empresa_id=$1 AND c.tabela_id=$2 AND c.excluido_em IS NULL ORDER BY c.posicao,c.id`, [session.tenantId, tableId])
  return result.rows as Field[]
}

export const recordSelect = `SELECT r.id,r.tabela_id,r.versao,r.posicao,r.criado_em,r.atualizado_em,r.numero,r.criado_por,r.atualizado_por,
  r.valores
  || coalesce((SELECT jsonb_object_agg(s.campo_id,s.valores) FROM (SELECT o.campo_id,jsonb_agg(o.opcao_id::text ORDER BY o.opcao_id) valores FROM tables.registro_opcoes o WHERE o.empresa_id=r.empresa_id AND o.registro_id=r.id GROUP BY o.campo_id) s),'{}')
  || coalesce((SELECT jsonb_object_agg(s.campo_id,s.valores) FROM (SELECT u.campo_id,jsonb_agg(u.usuario_id::text ORDER BY u.usuario_id) valores FROM tables.registro_usuarios u WHERE u.empresa_id=r.empresa_id AND u.registro_id=r.id GROUP BY u.campo_id) s),'{}')
  || coalesce((SELECT jsonb_object_agg(s.campo_id,s.valores) FROM (SELECT v.campo_id,jsonb_agg(v.registro_destino_id::text ORDER BY v.posicao,v.registro_destino_id) valores FROM tables.registro_vinculos v WHERE v.empresa_id=r.empresa_id AND v.registro_id=r.id GROUP BY v.campo_id) s),'{}')
  || coalesce((SELECT jsonb_object_agg(s.campo_id,s.valores) FROM (SELECT a.campo_id,jsonb_agg(a.id::text ORDER BY a.criado_em,a.id) valores FROM tables.anexos a WHERE a.empresa_id=r.empresa_id AND a.registro_id=r.id AND a.estado='confirmado' GROUP BY a.campo_id) s),'{}') valores
  FROM tables.registros r`

export async function readRecord(db: Database, session: TablesSession, id: string): Promise<DataRecord> {
  const result = await db.query(`${recordSelect} WHERE r.empresa_id=$1 AND r.id=$2 AND r.excluido_em IS NULL`, [session.tenantId, id])
  if (!result.rows[0]) throw new TablesError('NOT_FOUND', 'Registro não encontrado.', 404)
  const record = result.rows[0] as DataRecord
  // Number, dates, authors, formulas and linked values are filled in on every read.
  const { withComputed } = await import('./derived')
  return (await withComputed(db, session, await readFields(db, session, record.tabela_id), [record]))[0]
}

export async function lockRecord(db: Database, session: TablesSession, id: string, expectedVersion?: number) {
  const lookup = await db.query('SELECT tabela_id FROM tables.registros WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL', [session.tenantId, id])
  if (!lookup.rows[0]) throw new TablesError('NOT_FOUND', 'Registro não encontrado.', 404)
  const table = await requireTable(db, session, lookup.rows[0].tabela_id, 'record')
  const result = await db.query('SELECT versao FROM tables.registros WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE', [session.tenantId, id])
  if (!result.rows[0]) throw new TablesError('NOT_FOUND', 'Registro não encontrado.', 404)
  if (expectedVersion !== undefined) assertVersion(result.rows[0].versao, expectedVersion)
  return table
}

export function assertVersion(actual: number, expected: number) {
  if (actual !== expected) throw new TablesError('VERSION_CONFLICT', 'Os dados foram alterados. Atualize a tela antes de salvar novamente.', 409)
}

export async function getBundle(db: Database, session: TablesSession, id: string): Promise<TableBundle> {
  const tabela = await requireTable(db, session, id)
  const campos = await readFields(db, session, id)
  const views = await db.query(`SELECT v.*,coalesce((SELECT jsonb_agg(jsonb_build_object('campo_id',c.campo_id,'visivel',c.visivel,'largura',c.largura,'posicao',c.posicao) ORDER BY c.posicao,c.campo_id) FROM tables.visualizacao_campos c WHERE c.empresa_id=v.empresa_id AND c.visualizacao_id=v.id),'[]') campos FROM tables.visualizacoes v WHERE v.empresa_id=$1 AND v.tabela_id=$2 ORDER BY v.posicao,v.id`, [session.tenantId, id])
  const visualizacoes = views.rows.map(v => ({ ...v, configuracao: viewConfigSchema.parse(v.configuracao) })) as View[]
  const usuarios = (await db.query('SELECT * FROM tables.membros()')).rows
  const tabelas = (await db.query('SELECT * FROM tables.tabelas WHERE empresa_id=$1 AND base_id=$2 AND excluido_em IS NULL ORDER BY posicao,id', [session.tenantId, tabela.base_id])).rows
  return { tabela, campos, visualizacoes, usuarios, tabelas } as TableBundle
}
