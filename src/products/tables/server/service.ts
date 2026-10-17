import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import type { Database, TablesSession } from './database'
import { assertVersion, getBundle, lockRecord, readFields, readRecord, requireBase, requireTable } from './repository'
import { validateView } from './queries'
import { baseInputSchema, fieldInputSchema, nameSchema, recordInputSchema, TablesError, viewConfigSchema, viewInputSchema, type Base, type CellValue, type DataRecord, type Field, type RecordDetail, type Values } from '../shared/contracts'

type BaseInput = z.infer<typeof baseInputSchema>
type FieldInput = z.infer<typeof fieldInputSchema>
type RecordInput = z.infer<typeof recordInputSchema>
type ViewInput = z.infer<typeof viewInputSchema>

export async function listBases(db: Database, session: TablesSession): Promise<Base[]> {
  return (await db.query('SELECT * FROM tables.bases WHERE empresa_id=$1 AND excluido_em IS NULL ORDER BY posicao,id', [session.tenantId])).rows as Base[]
}

async function insertField(db: Database, session: TablesSession, table: { id: string; base_id: string }, input: Omit<FieldInput, 'expectedStructureVersion'>, position: number) {
  const id = randomUUID()
  await db.query('INSERT INTO tables.campos(id,empresa_id,base_id,tabela_id,nome,tipo,obrigatorio,configuracao,tabela_destino_id,posicao) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [id, session.tenantId, table.base_id, table.id, input.nome, input.tipo, input.obrigatorio, input.configuracao, input.tabela_destino_id, position])
  for (const [index, option] of input.opcoes.entries()) await db.query('INSERT INTO tables.campo_opcoes(id,empresa_id,tabela_id,campo_id,nome,cor,posicao) VALUES($1,$2,$3,$4,$5,$6,$7)', [option.id ?? randomUUID(), session.tenantId, table.id, id, option.nome, option.cor, index])
  return id
}

export async function createTable(db: Database, session: TablesSession, baseId: string, name: string, projects = false) {
  await requireBase(db, session, baseId)
  // Serialize append positions on the parent instead of relying on a racing max().
  await db.query('SELECT id FROM tables.bases WHERE empresa_id=$1 AND id=$2 FOR UPDATE', [session.tenantId, baseId])
  const id = randomUUID()
  const table = (await db.query('INSERT INTO tables.tabelas(id,empresa_id,base_id,nome,posicao,criado_por,atualizado_por) SELECT $1,$2,$3,$4,coalesce(max(posicao),-1)+1,$5,$5 FROM tables.tabelas WHERE empresa_id=$2 AND base_id=$3 RETURNING *', [id, session.tenantId, baseId, nameSchema.parse(name), session.sharedUserId])).rows[0]
  const input = (nome: string, tipo: Field['tipo'], opcoes: { nome: string; cor: string }[] = []): Omit<FieldInput, 'expectedStructureVersion'> => ({ nome, tipo, opcoes, obrigatorio: false, configuracao: { moeda: 'BRL' }, tabela_destino_id: null })
  const fields = [input(projects ? 'Nome do projeto' : 'Nome', 'texto')]
  if (projects) fields.push(
    input('Status', 'selecao', [{ nome: 'A fazer', cor: '#94a3b8' }, { nome: 'Em andamento', cor: '#3b82f6' }, { nome: 'Em revisão', cor: '#f59e0b' }, { nome: 'Concluído', cor: '#22c55e' }]),
    input('Responsável', 'usuario'), input('Prazo', 'data'),
    input('Prioridade', 'selecao', [{ nome: 'Alta', cor: '#f43f5e' }, { nome: 'Média', cor: '#f59e0b' }, { nome: 'Baixa', cor: '#22c55e' }]),
    input('Cliente', 'texto'), input('Orçamento', 'moeda'),
  )
  const ids: string[] = []
  for (const [index, field] of fields.entries()) ids.push(await insertField(db, session, { id, base_id: baseId }, field, index))
  await db.query('UPDATE tables.tabelas SET campo_principal_id=$3 WHERE empresa_id=$1 AND id=$2', [session.tenantId, id, ids[0]])
  const views = [{ nome: 'Grade', tipo: 'grade', configuracao: viewConfigSchema.parse({}) }]
  if (projects) views.push({ nome: 'Kanban', tipo: 'kanban', configuracao: viewConfigSchema.parse({ agrupamento: ids[1] }) }, { nome: 'Calendário', tipo: 'calendario', configuracao: viewConfigSchema.parse({ campo_data: ids[3] }) })
  for (const [index, view] of views.entries()) await db.query('INSERT INTO tables.visualizacoes(empresa_id,base_id,tabela_id,nome,tipo,configuracao,posicao,criado_por) VALUES($1,$2,$3,$4,$5,$6,$7,$8)', [session.tenantId, baseId, id, view.nome, view.tipo, view.configuracao, index, session.sharedUserId])
  return { ...table, campo_principal_id: ids[0] }
}

export async function createBase(db: Database, session: TablesSession, input: BaseInput) {
  const id = randomUUID()
  const base = (await db.query('INSERT INTO tables.bases(id,empresa_id,nome,descricao,cor,posicao,criado_por,atualizado_por) SELECT $1,$2,$3,$4,$5,coalesce(max(posicao),-1)+1,$6,$6 FROM tables.bases WHERE empresa_id=$2 RETURNING *', [id, session.tenantId, input.nome, input.descricao, input.cor, session.sharedUserId])).rows[0]
  const tabela = await createTable(db, session, id, input.modelo === 'projetos' ? 'Projetos' : 'Tabela 1', input.modelo === 'projetos')
  return { base, tabela }
}

export async function getBase(db: Database, session: TablesSession, id: string) {
  const base = await requireBase(db, session, id)
  const tabelas = (await db.query('SELECT * FROM tables.tabelas WHERE empresa_id=$1 AND base_id=$2 AND excluido_em IS NULL ORDER BY posicao,id', [session.tenantId, id])).rows
  return { base, tabelas }
}

export async function changeBase(db: Database, session: TablesSession, id: string, input: { nome: string; descricao: string; cor: string; expectedVersion: number }) {
  const base = await requireBase(db, session, id)
  assertVersion(base.versao, input.expectedVersion)
  const result = await db.query('UPDATE tables.bases SET nome=$3,descricao=$4,cor=$5,versao=versao+1,atualizado_por=$6,atualizado_em=now() WHERE empresa_id=$1 AND id=$2 AND versao=$7 RETURNING *', [session.tenantId, id, input.nome, input.descricao, input.cor, session.sharedUserId, input.expectedVersion])
  if (!result.rows[0]) throw new TablesError('VERSION_CONFLICT', 'A base foi alterada. Atualize a tela.', 409)
  return result.rows[0]
}

export async function changeTable(db: Database, session: TablesSession, id: string, input: { nome: string; expectedStructureVersion: number }) {
  const table = await requireTable(db, session, id, 'structure')
  assertVersion(table.versao_estrutura, input.expectedStructureVersion)
  return (await db.query('UPDATE tables.tabelas SET nome=$3,versao_estrutura=versao_estrutura+1,atualizado_por=$4,atualizado_em=now() WHERE empresa_id=$1 AND id=$2 RETURNING *', [session.tenantId, id, input.nome, session.sharedUserId])).rows[0]
}

function validateFieldInput(input: FieldInput) {
  if ((input.tipo === 'vinculo') !== Boolean(input.tabela_destino_id)) throw new TablesError('INVALID_FIELD', 'Selecione a tabela de destino do vínculo.')
  if (!['selecao', 'selecao_multipla'].includes(input.tipo) && input.opcoes.length) throw new TablesError('INVALID_FIELD', 'Opções são permitidas apenas em campos de seleção.')
}

export async function saveField(db: Database, session: TablesSession, tableId: string, input: FieldInput, fieldId?: string) {
  validateFieldInput(input)
  const table = await requireTable(db, session, tableId, 'structure')
  assertVersion(table.versao_estrutura, input.expectedStructureVersion)
  if (input.tabela_destino_id) {
    const target = await requireTable(db, session, input.tabela_destino_id)
    if (target.base_id !== table.base_id) throw new TablesError('INVALID_FIELD', 'Escolha uma tabela desta base.')
  }
  const fields = await readFields(db, session, tableId)
  let field = fields.find(f => f.id === fieldId)
  if (fieldId && !field) throw new TablesError('NOT_FOUND', 'Campo não encontrado.', 404)
  if (fieldId === table.campo_principal_id && input.tipo !== 'texto') throw new TablesError('PRIMARY_FIELD', 'O campo principal deve continuar sendo texto.')
  const hasRecords = (await db.query('SELECT EXISTS(SELECT 1 FROM tables.registros WHERE empresa_id=$1 AND tabela_id=$2) existe', [session.tenantId, tableId])).rows[0].existe
  if (hasRecords && field && (field.tipo !== input.tipo || field.tabela_destino_id !== input.tabela_destino_id)) throw new TablesError('FIELD_CONVERSION', 'A tabela já possui registros. Preserve o tipo e o destino deste campo.')
  if (hasRecords && input.obrigatorio && !field?.obrigatorio) throw new TablesError('REQUIRED_FIELD', 'Nesta primeira versão, crie campos obrigatórios antes de adicionar os registros.')
  let id = fieldId
  if (!id) id = await insertField(db, session, table, input, fields.length ? Number(fields[fields.length - 1].posicao) + 1 : 0)
  else {
    await db.query('UPDATE tables.campos SET nome=$4,tipo=$5,obrigatorio=$6,configuracao=$7,tabela_destino_id=$8 WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3', [session.tenantId, tableId, id, input.nome, input.tipo, input.obrigatorio, input.configuracao, input.tabela_destino_id])
    const retained = input.opcoes.filter(o => o.id).map(o => o.id)
    await db.query('UPDATE tables.campo_opcoes SET arquivado_em=now() WHERE empresa_id=$1 AND campo_id=$2 AND NOT(id=ANY($3::uuid[])) AND arquivado_em IS NULL', [session.tenantId, id, retained])
    for (const [index, option] of input.opcoes.entries()) {
      if (option.id && field?.opcoes.some(o => o.id === option.id)) await db.query('UPDATE tables.campo_opcoes SET nome=$4,cor=$5,posicao=$6,arquivado_em=NULL WHERE empresa_id=$1 AND campo_id=$2 AND id=$3', [session.tenantId, id, option.id, option.nome, option.cor, index])
      else await db.query('INSERT INTO tables.campo_opcoes(id,empresa_id,tabela_id,campo_id,nome,cor,posicao) VALUES($1,$2,$3,$4,$5,$6,$7)', [option.id ?? randomUUID(), session.tenantId, tableId, id, option.nome, option.cor, index])
    }
  }
  await db.query('UPDATE tables.tabelas SET versao_estrutura=versao_estrutura+1,atualizado_em=now(),atualizado_por=$3 WHERE empresa_id=$1 AND id=$2', [session.tenantId, tableId, session.sharedUserId])
  field = (await readFields(db, session, tableId)).find(f => f.id === id)
  return { campo: field, versao_estrutura: table.versao_estrutura + 1 }
}

export async function deleteField(db: Database, session: TablesSession, tableId: string, fieldId: string, version: number) {
  const table = await requireTable(db, session, tableId, 'structure')
  assertVersion(table.versao_estrutura, version)
  if (table.campo_principal_id === fieldId) throw new TablesError('PRIMARY_FIELD', 'O campo principal não pode ser excluído.')
  const found = await db.query('UPDATE tables.campos SET excluido_em=now() WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3 AND excluido_em IS NULL RETURNING id', [session.tenantId, tableId, fieldId])
  if (!found.rows[0]) throw new TablesError('NOT_FOUND', 'Campo não encontrado.', 404)
  const views = await db.query('SELECT id,configuracao FROM tables.visualizacoes WHERE empresa_id=$1 AND tabela_id=$2', [session.tenantId, tableId])
  for (const view of views.rows) {
    const config = viewConfigSchema.parse(view.configuracao)
    config.filtros = config.filtros.filter(f => f.campo !== fieldId)
    config.ordenacao = config.ordenacao.filter(f => f.campo !== fieldId)
    if (config.agrupamento === fieldId) config.agrupamento = null
    if (config.campo_data === fieldId) config.campo_data = null
    await db.query('UPDATE tables.visualizacoes SET configuracao=$3,versao=versao+1 WHERE empresa_id=$1 AND id=$2', [session.tenantId, view.id, config])
  }
  await db.query('UPDATE tables.tabelas SET versao_estrutura=versao_estrutura+1,atualizado_por=$3,atualizado_em=now() WHERE empresa_id=$1 AND id=$2', [session.tenantId, tableId, session.sharedUserId])
}

function normalizeValue(field: Field, value: CellValue): CellValue {
  if (value === null || value === '') return null
  if (['selecao', 'selecao_multipla', 'usuario', 'usuarios', 'vinculo'].includes(field.tipo)) {
    const values = [...new Set(Array.isArray(value) ? value : [String(value)])]
    if (['selecao', 'usuario'].includes(field.tipo) && values.length > 1) throw new TablesError('INVALID_VALUE', `${field.nome} aceita apenas uma escolha.`)
    if (field.tipo === 'usuario' || field.tipo === 'usuarios') values.forEach(v => { if (!/^[1-9]\d*$/.test(v) || !Number.isSafeInteger(Number(v))) throw new TablesError('INVALID_VALUE', 'Usuário inválido.') })
    else values.forEach(v => z.string().uuid().parse(v))
    return values
  }
  if (field.tipo === 'anexo') throw new TablesError('INVALID_VALUE', 'Use o envio de arquivo para alterar anexos.')
  if (field.tipo === 'numero') return z.number().finite().parse(value)
  if (field.tipo === 'moeda') return z.string().regex(/^-?\d+(\.\d{1,6})?$/, 'Informe um valor decimal válido.').parse(String(value))
  if (field.tipo === 'checkbox') return z.boolean().parse(value)
  const text = z.string().parse(value)
  if (field.tipo === 'email') z.string().email().parse(text)
  if (field.tipo === 'url') { const url = z.string().url().parse(text); if (!['https:', 'http:'].includes(new URL(url).protocol)) throw new TablesError('INVALID_VALUE', 'Use um endereço HTTP ou HTTPS.') }
  if (field.tipo === 'data') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text)) || new Date(text).toISOString().slice(0, 10) !== text) throw new TablesError('INVALID_VALUE', 'Informe uma data válida.')
  }
  if (field.tipo === 'data_hora') z.string().datetime({ offset: true }).parse(text)
  return text
}

export async function saveRecord(db: Database, session: TablesSession, tableId: string, input: RecordInput, recordId?: string): Promise<DataRecord> {
  const table = recordId ? await lockRecord(db, session, recordId, z.number().int().positive().parse(input.expectedVersion)) : await requireTable(db, session, tableId, 'record')
  if (table.id !== tableId) throw new TablesError('NOT_FOUND', 'Registro não encontrado nesta tabela.', 404)
  assertVersion(table.versao_estrutura, input.expectedStructureVersion)
  const fields = await readFields(db, session, tableId)
  const fieldMap = new Map(fields.map(f => [f.id, f]))
  const patch: Values = {}
  for (const [id, value] of Object.entries(input.valores)) {
    const field = fieldMap.get(id)
    if (!field) throw new TablesError('INVALID_FIELD', 'Um dos campos foi removido. Atualize a tabela.', 409)
    patch[id] = normalizeValue(field, value)
  }
  const previous: Values = recordId ? (await readRecord(db, session, recordId)).valores : {}
  const next = { ...previous, ...patch }
  for (const field of fields) if (field.obrigatorio && (next[field.id] == null || next[field.id] === '' || Array.isArray(next[field.id]) && !(next[field.id] as string[]).length)) throw new TablesError('REQUIRED_FIELD', `Preencha o campo ${field.nome}.`)
  const simple: Values = {}
  for (const [id, value] of Object.entries(patch)) if (!['selecao', 'selecao_multipla', 'usuario', 'usuarios', 'vinculo', 'anexo'].includes(fieldMap.get(id)!.tipo)) simple[id] = value
  const id = recordId ?? randomUUID()
  if (recordId) await db.query('UPDATE tables.registros SET valores=valores||$3::jsonb,versao=versao+1,atualizado_em=clock_timestamp(),atualizado_por=$4 WHERE empresa_id=$1 AND id=$2', [session.tenantId, id, JSON.stringify(simple), session.sharedUserId])
  else {
    // Position is a stable starting order, not a unique business identifier.
    await db.query('INSERT INTO tables.registros(id,empresa_id,base_id,tabela_id,valores,posicao,criado_por,atualizado_por) SELECT $1,$2,$3,$4,$5::jsonb,coalesce(max(posicao),-1)+1,$6,$6 FROM tables.registros WHERE empresa_id=$2 AND tabela_id=$4', [id, session.tenantId, table.base_id, tableId, JSON.stringify(simple), session.sharedUserId])
  }
  for (const [fieldId, value] of Object.entries(patch)) {
    const field = fieldMap.get(fieldId)!
    const values = Array.isArray(value) ? value : []
    if (['selecao', 'selecao_multipla'].includes(field.tipo)) {
      await db.query('DELETE FROM tables.registro_opcoes WHERE empresa_id=$1 AND registro_id=$2 AND campo_id=$3', [session.tenantId, id, fieldId])
      for (const option of values) await db.query('INSERT INTO tables.registro_opcoes(empresa_id,tabela_id,registro_id,campo_id,opcao_id) VALUES($1,$2,$3,$4,$5)', [session.tenantId, tableId, id, fieldId, option])
    } else if (['usuario', 'usuarios'].includes(field.tipo)) {
      await db.query('DELETE FROM tables.registro_usuarios WHERE empresa_id=$1 AND registro_id=$2 AND campo_id=$3', [session.tenantId, id, fieldId])
      for (const user of values) await db.query('INSERT INTO tables.registro_usuarios(empresa_id,tabela_id,registro_id,campo_id,usuario_id) VALUES($1,$2,$3,$4,$5)', [session.tenantId, tableId, id, fieldId, user])
    } else if (field.tipo === 'vinculo') {
      await requireTable(db, session, field.tabela_destino_id!)
      await db.query('DELETE FROM tables.registro_vinculos WHERE empresa_id=$1 AND registro_id=$2 AND campo_id=$3', [session.tenantId, id, fieldId])
      for (const target of values) {
        const found = await db.query('SELECT id FROM tables.registros WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3 AND excluido_em IS NULL', [session.tenantId, field.tabela_destino_id, target])
        if (!found.rows[0]) throw new TablesError('INVALID_LINK', 'Um dos registros vinculados não está disponível.')
        await db.query('INSERT INTO tables.registro_vinculos(empresa_id,base_id,tabela_id,registro_id,campo_id,tabela_destino_id,registro_destino_id) VALUES($1,$2,$3,$4,$5,$6,$7)', [session.tenantId, table.base_id, tableId, id, fieldId, field.tabela_destino_id, target])
      }
    }
  }
  return readRecord(db, session, id)
}

export async function saveView(db: Database, session: TablesSession, tableId: string, input: ViewInput, id?: string) {
  const table = await requireTable(db, session, tableId, 'record')
  const fields = await readFields(db, session, tableId)
  validateView(input.configuracao, fields, input.tipo)
  if (input.campos.some(c => !fields.some(f => f.id === c.campo_id))) throw new TablesError('INVALID_FIELD', 'Um dos campos não pertence à tabela.')
  if (id) {
    const result = await db.query('UPDATE tables.visualizacoes SET nome=$4,tipo=$5,configuracao=$6,versao=versao+1 WHERE empresa_id=$1 AND tabela_id=$2 AND id=$3 AND versao=$7 RETURNING id', [session.tenantId, tableId, id, input.nome, input.tipo, input.configuracao, input.expectedVersion])
    if (!result.rows[0]) throw new TablesError('VERSION_CONFLICT', 'A visualização foi alterada. Atualize a tabela.', 409)
  } else {
    id = randomUUID()
    await db.query('INSERT INTO tables.visualizacoes(id,empresa_id,base_id,tabela_id,nome,tipo,configuracao,posicao,criado_por) SELECT $1,$2,$3,$4,$5,$6,$7,coalesce(max(posicao),-1)+1,$8 FROM tables.visualizacoes WHERE empresa_id=$2 AND tabela_id=$4', [id, session.tenantId, table.base_id, tableId, input.nome, input.tipo, input.configuracao, session.sharedUserId])
  }
  await db.query('DELETE FROM tables.visualizacao_campos WHERE empresa_id=$1 AND visualizacao_id=$2', [session.tenantId, id])
  for (const field of input.campos) await db.query('INSERT INTO tables.visualizacao_campos(empresa_id,tabela_id,visualizacao_id,campo_id,visivel,largura,posicao) VALUES($1,$2,$3,$4,$5,$6,$7)', [session.tenantId, tableId, id, field.campo_id, field.visivel, field.largura, field.posicao])
  return (await getBundle(db, session, tableId)).visualizacoes.find(v => v.id === id)
}

export async function recordDetail(db: Database, session: TablesSession, id: string): Promise<RecordDetail> {
  const registro = await readRecord(db, session, id)
  await requireTable(db, session, registro.tabela_id)
  const comentarios = (await db.query("SELECT c.id,c.texto,c.criado_em,coalesce(m.nome,'Usuário removido') autor FROM tables.comentarios c LEFT JOIN tables.membros() m ON m.id=c.autor_id::text WHERE c.empresa_id=$1 AND c.registro_id=$2 AND c.excluido_em IS NULL ORDER BY c.criado_em,c.id", [session.tenantId, id])).rows
  const historico = (await db.query("SELECT * FROM (SELECT DISTINCT ON(h.operacao_id) h.id,h.acao,h.entidade,h.criado_em,h.operacao_id,coalesce(m.nome,'Usuário removido') autor FROM tables.historico h LEFT JOIN tables.membros() m ON m.id=h.autor_id::text WHERE h.empresa_id=$1 AND h.registro_id=$2 ORDER BY h.operacao_id,(h.acao='INSERT') DESC,h.criado_em DESC,h.id) operacoes ORDER BY criado_em DESC,id LIMIT 100", [session.tenantId, id])).rows
  const anexos = (await db.query("SELECT id,campo_id,nome,mime_type,tamanho::float8,estado FROM tables.anexos WHERE empresa_id=$1 AND registro_id=$2 AND estado='confirmado' ORDER BY criado_em,id", [session.tenantId, id])).rows
  return { registro, comentarios, historico, anexos } as RecordDetail
}

export async function addComment(db: Database, session: TablesSession, id: string, text: string) {
  const record = await readRecord(db, session, id)
  await requireTable(db, session, record.tabela_id)
  return (await db.query('INSERT INTO tables.comentarios(empresa_id,registro_id,autor_id,texto) VALUES($1,$2,$3,$4) RETURNING id', [session.tenantId, id, session.sharedUserId, text])).rows[0]
}

const removable = { bases: 'bases', tabelas: 'tabelas', registros: 'registros' } as const
export async function trash(db: Database, session: TablesSession, kind: keyof typeof removable, id: string, version: number) {
  if (kind === 'registros') await lockRecord(db, session, id, version)
  else if (kind === 'tabelas') assertVersion((await requireTable(db, session, id, 'structure')).versao_estrutura, version)
  else assertVersion((await requireBase(db, session, id)).versao, version)
  const versionColumn = kind === 'tabelas' ? 'versao_estrutura' : 'versao'
  const result = await db.query(`UPDATE tables.${removable[kind]} SET excluido_em=now(),${versionColumn}=${versionColumn}+1,atualizado_em=now(),atualizado_por=$4 WHERE empresa_id=$1 AND id=$2 AND ${versionColumn}=$3 AND excluido_em IS NULL RETURNING id`, [session.tenantId, id, version, session.sharedUserId])
  if (!result.rows[0]) throw new TablesError('VERSION_CONFLICT', 'Os dados mudaram. Atualize a tela.', 409)
}

export async function listTrash(db: Database, session: TablesSession) {
  return (await db.query(`SELECT b.id,b.nome,'bases' tipo,b.excluido_em,NULL::uuid pai_id FROM tables.bases b WHERE b.empresa_id=$1 AND b.excluido_em IS NOT NULL
    UNION ALL SELECT t.id,t.nome,'tabelas',t.excluido_em,t.base_id FROM tables.tabelas t JOIN tables.bases b ON b.empresa_id=t.empresa_id AND b.id=t.base_id WHERE t.empresa_id=$1 AND t.excluido_em IS NOT NULL AND b.excluido_em IS NULL
    UNION ALL SELECT r.id,coalesce(nullif(r.valores->>t.campo_principal_id::text,''),'Sem nome'),'registros',r.excluido_em,r.tabela_id FROM tables.registros r JOIN tables.tabelas t ON t.empresa_id=r.empresa_id AND t.id=r.tabela_id JOIN tables.bases b ON b.empresa_id=t.empresa_id AND b.id=t.base_id WHERE r.empresa_id=$1 AND r.excluido_em IS NOT NULL AND t.excluido_em IS NULL AND b.excluido_em IS NULL
    UNION ALL SELECT c.id,c.nome,'campos',c.excluido_em,c.tabela_id FROM tables.campos c JOIN tables.tabelas t ON t.empresa_id=c.empresa_id AND t.id=c.tabela_id JOIN tables.bases b ON b.empresa_id=t.empresa_id AND b.id=t.base_id WHERE c.empresa_id=$1 AND c.excluido_em IS NOT NULL AND t.excluido_em IS NULL AND b.excluido_em IS NULL ORDER BY excluido_em DESC LIMIT 100`, [session.tenantId])).rows
}

export async function restore(db: Database, session: TablesSession, kind: keyof typeof removable | 'campos', id: string) {
  if (kind === 'campos') {
    const field = (await db.query('SELECT * FROM tables.campos WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NOT NULL', [session.tenantId, id])).rows[0]
    if (!field) throw new TablesError('NOT_FOUND', 'Campo não encontrado na lixeira.', 404)
    await requireTable(db, session, field.tabela_id, 'structure')
    if (field.tabela_destino_id) await requireTable(db, session, field.tabela_destino_id)
    // New records may have been created while the column was absent.
    const restored = await db.query('UPDATE tables.campos SET excluido_em=NULL,obrigatorio=false WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NOT NULL RETURNING id', [session.tenantId, id])
    if (!restored.rows[0]) throw new TablesError('VERSION_CONFLICT', 'Este campo já foi restaurado. Atualize a tela.', 409)
    await db.query('UPDATE tables.tabelas SET versao_estrutura=versao_estrutura+1,atualizado_em=now(),atualizado_por=$3 WHERE empresa_id=$1 AND id=$2', [session.tenantId, field.tabela_id, session.sharedUserId])
    return
  }
  const row = (await db.query(`SELECT * FROM tables.${removable[kind]} WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NOT NULL`, [session.tenantId, id])).rows[0]
  if (!row) throw new TablesError('NOT_FOUND', 'Item não encontrado na lixeira.', 404)
  if (kind === 'registros') await requireTable(db, session, row.tabela_id, 'record')
  if (kind === 'tabelas') await requireBase(db, session, row.base_id)
  const versionColumn = kind === 'tabelas' ? 'versao_estrutura' : 'versao'
  await db.query(`UPDATE tables.${removable[kind]} SET excluido_em=NULL,${versionColumn}=${versionColumn}+1,atualizado_em=now(),atualizado_por=$3 WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NOT NULL`, [session.tenantId, id, session.sharedUserId])
}
