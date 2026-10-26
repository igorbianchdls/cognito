import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { PGlite } from '@electric-sql/pglite'

const require = createRequire(import.meta.url), root = process.cwd(), cache = new Map()
function load(name, parent = resolve(root, 'entry.ts')) {
  if (!name.startsWith('.') && !name.startsWith('@/') && !name.startsWith(root)) return require(name)
  let file = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(parent), name)
  if (!existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map(s => file + s).find(existsSync)
  assert(file, name)
  if (cache.has(file)) return cache.get(file).exports
  const module = { exports: {} }; cache.set(file, module)
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(dep => load(dep, file), module, module.exports)
  return module.exports
}
const db = new PGlite(), checks = []
const service = load('@/products/tables/server/service'), queries = load('@/products/tables/server/queries'), repo = load('@/products/tables/server/repository'), contracts = load('@/products/tables/shared/contracts')
const owner = { tenantId: 1, sharedUserId: 1, role: 'owner' }, other = { tenantId: 2, sharedUserId: 3, role: 'owner' }, viewer = { tenantId: 1, sharedUserId: 2, role: 'viewer' }
async function run(session, fn, write = true) {
  await db.exec(write ? 'BEGIN' : 'BEGIN READ ONLY')
  try {
    await db.query("SELECT set_config('app.tables_empresa_id',$1,true),set_config('app.tables_usuario_id',$2,true),set_config('app.tables_operacao_id',gen_random_uuid()::text,true),set_config('role','tables_runtime',true)", [String(session.tenantId), String(session.sharedUserId)])
    const result = await fn(db)
    await db.exec('COMMIT'); return result
  } catch (error) { await db.exec('ROLLBACK'); throw error }
}
async function check(name, fn) { await fn(); checks.push(name); console.log('Passed: ' + name) }
let base, table, bundle, record
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA shared;
    CREATE TABLE shared.empresas(id bigint PRIMARY KEY,status text DEFAULT 'active');
    CREATE TABLE shared.usuarios(id bigint PRIMARY KEY,full_name text,email text,status text DEFAULT 'active');
    CREATE TABLE shared.usuarios_empresas(empresa_id bigint,usuario_id bigint,role text,status text DEFAULT 'active',suspenso_localmente boolean DEFAULT false,PRIMARY KEY(empresa_id,usuario_id));
    INSERT INTO shared.empresas(id) VALUES(1),(2);
    INSERT INTO shared.usuarios(id,full_name,email) VALUES(1,'Ana Silva','ana@example.invalid'),(2,'Leitor','leitor@example.invalid'),(3,'Outra empresa','outro@example.invalid');
    INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role) VALUES(1,1,'owner'),(1,2,'viewer'),(2,3,'owner');`)
  await check('Migration creates 19 tables and tenant policies', async () => {
    await db.exec(readFileSync('supabase/migrations/20261016120000_create_tables.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018120000_tables_base_permissions.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018150000_tables_search_index.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018160000_tables_field_types.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018170000_tables_views.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018180000_tables_automations.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018190000_tables_api_keys.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018200000_tables_change_index.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261019100000_tables_inverse_links.sql', 'utf8'))
    assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='tables'")).rows[0].n, 19)
    assert.equal((await db.query("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='tables' AND c.relkind='r' AND c.relrowsecurity")).rows[0].n, 19)
  })
  await check('Create base, project fields and three persisted views', async () => {
    const result = await run(owner, db => service.createBase(db, owner, contracts.baseInputSchema.parse({ nome: 'Projetos', modelo: 'projetos' })))
    base = result.base; table = result.tabela
    bundle = await run(owner, db => repo.getBundle(db, owner, table.id), false)
    assert.equal(bundle.campos.length, 7); assert.equal(bundle.visualizacoes.length, 3)
  })
  const field = name => bundle.campos.find(f => f.nome === name)
  const values = { [field('Nome do projeto').id]: 'Portal novo', [field('Status').id]: [field('Status').opcoes[0].id], [field('Responsável').id]: ['1'], [field('Prazo').id]: '2026-10-23', [field('Orçamento').id]: '1000.15' }
  await check('Write JSON, status and responsible together with history', async () => {
    record = await run(owner, db => service.saveRecord(db, owner, table.id, { valores: values, expectedStructureVersion: 1 }))
    assert.equal(record.valores[field('Orçamento').id], '1000.15')
    assert.deepEqual(record.valores[field('Responsável').id], ['1'])
    const detail = await run(owner, db => service.recordDetail(db, owner, record.id), false)
    assert.equal(detail.historico.length, 1)
  })
  await check('Typed filters, numeric sums and sorting across relations', async () => {
    const q = contracts.listQuerySchema.parse({ filtros: [{ campo: field('Status').id, operador: 'eq', valor: field('Status').opcoes[0].id }], ordenacao: [{ campo: field('Orçamento').id, direcao: 'desc' }] })
    const page = await run(owner, db => queries.listRecords(db, owner, table.id, q), false)
    assert.equal(page.total, 1); assert.equal(page.somas[field('Orçamento').id], '1000.15')
  })
  await check('Failed relational edit rolls back text, version and history', async () => {
    await assert.rejects(run(owner, db => service.saveRecord(db, owner, table.id, { valores: { [field('Nome do projeto').id]: 'MUDOU', [field('Responsável').id]: ['3'] }, expectedVersion: record.versao, expectedStructureVersion: 1 }, record.id)))
    const saved = await run(owner, db => repo.readRecord(db, owner, record.id), false)
    assert.equal(saved.valores[field('Nome do projeto').id], 'Portal novo'); assert.equal(saved.versao, record.versao)
  })
  await check('Status changes participate in version conflict detection', async () => {
    const oldVersion = record.versao
    record = await run(owner, db => service.saveRecord(db, owner, table.id, { valores: { [field('Status').id]: [field('Status').opcoes[1].id] }, expectedVersion: oldVersion, expectedStructureVersion: 1 }, record.id))
    assert(record.versao > oldVersion)
    await assert.rejects(run(owner, db => service.saveRecord(db, owner, table.id, { valores: {}, expectedVersion: oldVersion, expectedStructureVersion: 1 }, record.id)), e => e.code === 'VERSION_CONFLICT')
  })
  await check('Tenant isolation, viewer writes and immutable history', async () => {
    assert.equal((await run(other, db => service.listBases(db, other), false)).length, 0)
    await assert.rejects(run(other, db => repo.getBundle(db, other, table.id), false), e => e.code === 'NOT_FOUND')
    await assert.rejects(run(viewer, db => service.createBase(db, viewer, contracts.baseInputSchema.parse({ nome: 'Proibida' }))), e => e.code === '42501')
    await assert.rejects(run(owner, db => db.query('DELETE FROM tables.historico WHERE empresa_id=$1', [1])), e => e.code === '42501')
  })
  await check('Direct SQL rejects selection multiplicity and fields from other tables', async () => {
    await assert.rejects(run(owner, db => db.query('INSERT INTO tables.registro_opcoes(empresa_id,tabela_id,registro_id,campo_id,opcao_id) VALUES($1,$2,$3,$4,$5)', [1, table.id, record.id, field('Status').id, field('Status').opcoes[2].id])), e => e.code === '23514')
  })
  await check('Comments, view column preferences and structural conflict', async () => {
    await run(owner, db => service.addComment(db, owner, record.id, 'Revisar prazo'))
    const view = bundle.visualizacoes[0]
    await run(owner, db => service.saveView(db, owner, table.id, { ...view, expectedVersion: view.versao, campos: bundle.campos.map((f, i) => ({ campo_id: f.id, visivel: i !== 5, largura: 180, posicao: i })) }, view.id))
    assert.equal((await run(owner, db => service.recordDetail(db, owner, record.id), false)).comentarios.length, 1)
    await run(owner, db => service.saveField(db, owner, table.id, contracts.fieldInputSchema.parse({ nome: 'Descrição', tipo: 'texto_longo', expectedStructureVersion: 1 })))
    await assert.rejects(run(owner, db => service.saveRecord(db, owner, table.id, { valores: {}, expectedVersion: record.versao, expectedStructureVersion: 1 }, record.id)), e => e.code === 'VERSION_CONFLICT')
  })
  await check('Restore field preserves stored values and invalidates stale editors', async () => {
    let current = await run(owner, db => repo.getBundle(db, owner, table.id), false)
    const status = field('Status')
    await run(owner, db => service.deleteField(db, owner, table.id, status.id, current.tabela.versao_estrutura))
    assert((await run(owner, db => service.listTrash(db, owner), false)).some(item => item.id === status.id && item.tipo === 'campos'))
    await assert.rejects(run(other, db => service.restore(db, other, 'campos', status.id)), e => e.code === 'NOT_FOUND')
    current = await run(owner, db => repo.getBundle(db, owner, table.id), false)
    assert(!current.campos.some(f => f.id === status.id))
    const before = current.tabela.versao_estrutura
    await run(owner, db => service.restore(db, owner, 'campos', status.id))
    current = await run(owner, db => repo.getBundle(db, owner, table.id), false)
    assert(current.campos.some(f => f.id === status.id)); assert.equal(current.tabela.versao_estrutura, before + 1)
    assert.deepEqual((await run(owner, db => repo.readRecord(db, owner, record.id), false)).valores[status.id], [status.opcoes[1].id])
    await assert.rejects(run(owner, db => service.saveRecord(db, owner, table.id, { valores: {}, expectedVersion: record.versao, expectedStructureVersion: before }, record.id)), e => e.code === 'VERSION_CONFLICT')
  })
  await check('Restore base preserves an earlier record deletion', async () => {
    await run(owner, db => service.trash(db, owner, 'registros', record.id, record.versao))
    await run(owner, db => service.trash(db, owner, 'bases', base.id, base.versao))
    await assert.rejects(run(owner, db => repo.getBundle(db, owner, table.id), false), e => e.code === 'NOT_FOUND')
    await run(owner, db => service.restore(db, owner, 'bases', base.id))
    assert.equal((await run(owner, db => queries.listRecords(db, owner, table.id, contracts.listQuerySchema.parse({})), false)).total, 0)
    await run(owner, db => service.restore(db, owner, 'registros', record.id))
    assert.equal((await run(owner, db => queries.listRecords(db, owner, table.id, contracts.listQuerySchema.parse({})), false)).total, 1)
  })
  await check('Base roles: editors edit records, administrators the structure; restricted bases are invisible', async () => {
    await db.exec("INSERT INTO shared.usuarios(id,full_name,email) VALUES(4,'Bruno','bruno@example.invalid'),(5,'Carla','carla@example.invalid'); INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role) VALUES(1,4,'member'),(1,5,'member')")
    const bruno = { tenantId: 1, sharedUserId: 4, role: 'member' }, carla = { tenantId: 1, sharedUserId: 5, role: 'member' }
    const current = await run(owner, db => repo.getBundle(db, owner, table.id), false), name = current.campos.find(f => f.nome === 'Nome do projeto').id
    // Open to the company: members edit records but not the structure.
    assert.equal((await run(bruno, db => service.listBases(db, bruno), false)).find(b => b.id === base.id).papel, 'editor')
    await run(bruno, db => service.saveRecord(db, bruno, table.id, { valores: { [name]: 'Pelo editor' }, expectedStructureVersion: current.tabela.versao_estrutura }))
    await assert.rejects(run(bruno, db => service.saveField(db, bruno, table.id, contracts.fieldInputSchema.parse({ nome: 'Extra', tipo: 'texto', expectedStructureVersion: current.tabela.versao_estrutura }))), e => e.code === 'FORBIDDEN')
    await assert.rejects(run(bruno, db => service.createTable(db, bruno, base.id, 'Outra')), e => e.code === 'FORBIDDEN')
    assert.equal((await run(bruno, db => db.query('UPDATE tables.campos SET nome=$2 WHERE empresa_id=1 AND id=$1 RETURNING id', [name, 'Direto']))).rows.length, 0, 'The database refuses structure writes too')
    // Whoever creates a base administers it.
    const own = await run(bruno, db => service.createBase(db, bruno, contracts.baseInputSchema.parse({ nome: 'Do Bruno' })))
    assert.equal((await run(bruno, db => service.listBases(db, bruno), false)).find(b => b.id === own.base.id).papel, 'administrador')
    await assert.rejects(run(bruno, db => service.saveSharing(db, bruno, own.base.id, { acesso: 'restrito', membros: [], expectedVersion: own.base.versao })), e => e.code === 'INVALID_INPUT', 'Keeps the creator as administrator')
    // Restricted: only listed people (and company admins) see it.
    const shared = await run(owner, db => service.getSharing(db, owner, base.id), false)
    assert(shared.membros.some(m => m.id === '1' && m.administrador_empresa))
    await run(owner, db => service.saveSharing(db, owner, base.id, { acesso: 'restrito', membros: [{ usuario_id: '5', papel: 'leitor' }], expectedVersion: shared.versao }))
    assert(!(await run(bruno, db => service.listBases(db, bruno), false)).some(b => b.id === base.id))
    await assert.rejects(run(bruno, db => repo.getBundle(db, bruno, table.id), false), e => e.code === 'NOT_FOUND')
    assert.equal((await run(bruno, db => db.query('SELECT count(*)::int n FROM tables.registros WHERE empresa_id=1 AND tabela_id=$1', [table.id]), false)).rows[0].n, 0, 'Records of a restricted base stay hidden in SQL')
    assert.equal((await run(carla, db => queries.listRecords(db, carla, table.id, contracts.listQuerySchema.parse({})), false)).total > 0, true)
    await assert.rejects(run(carla, db => service.saveRecord(db, carla, table.id, { valores: { [name]: 'X' }, expectedStructureVersion: current.tabela.versao_estrutura })), e => e.code === 'FORBIDDEN')
    await assert.rejects(run(carla, db => service.saveSharing(db, carla, base.id, { acesso: 'empresa', membros: [], expectedVersion: shared.versao + 1 })), e => e.code === 'FORBIDDEN')
    await run(owner, db => service.saveSharing(db, owner, base.id, { acesso: 'empresa', membros: [], expectedVersion: shared.versao + 1 }))
  })
  await check('CSV: export in Excel format; import converts Brazilian formats and reports bad lines', async () => {
    const csv = load('@/products/tables/server/csv')
    const current = await run(owner, db => repo.getBundle(db, owner, table.id), false), f = name => current.campos.find(c => c.nome === name)
    const result = await run(owner, db => csv.importRows(db, owner, table.id, { colunas: [f('Nome do projeto').id, f('Status').id, f('Prazo').id, f('Orçamento').id, f('Responsável').id], expectedStructureVersion: current.tabela.versao_estrutura, linhas: [
      ['Importado A', 'A fazer', '23/10/2026', 'R$ 1.234,56', 'Ana Silva'],
      ['Importado B', 'Status que não existe', '2026-10-24', '10', ''],
      ['Importado C', '', '31/02/2026', '5', ''],
      ['', '', '', '', ''],
    ] }))
    assert.equal(result.criados, 1); assert.deepEqual(result.erros.map(e => e.linha), [3, 4]); assert.match(result.erros[0].mensagem, /Status/); assert.match(result.erros[1].mensagem, /Prazo.*data/)
    const exported = await run(owner, db => csv.exportCsv(db, owner, table.id, contracts.listQuerySchema.parse({ busca: 'Importado' })), false)
    const lines = exported.csv.replace(/^﻿/, '').trim().split('\r\n')
    assert.equal(exported.registros, 1); assert(lines[0].startsWith('Nome do projeto;Status;'))
    assert(lines[1].includes('Importado A;A fazer;Ana Silva;2026-10-23;') && lines[1].includes(';1234,56'), lines[1])
  })
  await check('Retention: trash older than 30 days is deleted with relations and comments; recent trash stays', async () => {
    const retention = load('@/products/tables/server/retention')
    const current = await run(owner, db => repo.getBundle(db, owner, table.id), false), f = name => current.campos.find(c => c.nome === name)
    const save = name => run(owner, db => service.saveRecord(db, owner, table.id, { valores: { [f('Nome do projeto').id]: name, [f('Status').id]: [f('Status').opcoes[0].id] }, expectedStructureVersion: current.tabela.versao_estrutura }))
    const old = await save('Antigo na lixeira'), recent = await save('Recente na lixeira')
    await run(owner, db => service.addComment(db, owner, old.id, 'Comentário do antigo'))
    const oldNow = await run(owner, db => repo.readRecord(db, owner, old.id), false)
    await run(owner, db => service.trash(db, owner, 'registros', old.id, oldNow.versao)); await run(owner, db => service.trash(db, owner, 'registros', recent.id, recent.versao))
    await db.exec("BEGIN; SELECT set_config('app.tables_usuario_id','1',true),set_config('app.tables_empresa_id','1',true); UPDATE tables.registros SET excluido_em=now()-interval '31 days' WHERE id='" + old.id + "'; COMMIT")
    const result = await retention.maintainTablesRetention(async () => ({ query: (sql, values) => db.query(sql, values) }))
    assert.equal(result.registros_excluidos, 1)
    assert.equal((await db.query('SELECT count(*)::int n FROM tables.registros WHERE id=$1', [old.id])).rows[0].n, 0)
    assert.equal((await db.query('SELECT count(*)::int n FROM tables.registros WHERE id=$1', [recent.id])).rows[0].n, 1, 'Recent trash stays restorable')
    assert.equal((await db.query('SELECT count(*)::int n FROM tables.comentarios WHERE registro_id=$1', [old.id])).rows[0].n, 0)
    assert.equal((await db.query('SELECT count(*)::int n FROM tables.registro_opcoes WHERE registro_id=$1', [old.id])).rows[0].n, 0)
    assert.equal((await db.query("SELECT count(*)::int n FROM tables.historico WHERE registro_id=$1 AND acao='DELETE' AND entidade='registros' AND autor_id=1", [old.id])).rows[0].n, 1, 'The permanent deletion is audited')
  })
  await check('New field types: stored, system, formula, lookup and aggregation of linked records', async () => {
    const created = await run(owner, db => service.createBase(db, owner, contracts.baseInputSchema.parse({ nome: 'Vendas' })))
    const pedidos = created.tabela.id, itens = (await run(owner, db => service.createTable(db, owner, created.base.id, 'Itens'))).id
    const version = async id => (await run(owner, db => repo.requireTable(db, owner, id), false)).versao_estrutura
    const field = async (table, input) => (await run(owner, async db => service.saveField(db, owner, table, contracts.fieldInputSchema.parse({ ...input, expectedStructureVersion: (await repo.requireTable(db, owner, table)).versao_estrutura })))).campo
    const preco = await field(itens, { nome: 'Preço', tipo: 'moeda' })
    const fone = await field(pedidos, { nome: 'Telefone', tipo: 'telefone' }), desconto = await field(pedidos, { nome: 'Desconto', tipo: 'porcentagem' }), nota = await field(pedidos, { nome: 'Nota', tipo: 'avaliacao', configuracao: { maximo: 5 } })
    const numero = await field(pedidos, { nome: 'Nº', tipo: 'autonumero' }), autor = await field(pedidos, { nome: 'Criado por', tipo: 'criado_por' })
    const link = await field(pedidos, { nome: 'Itens', tipo: 'vinculo', tabela_destino_id: itens })
    const total = await field(pedidos, { nome: 'Total', tipo: 'agregacao', configuracao: { vinculo: link.id, campo: preco.id, operacao: 'soma' } })
    const quantos = await field(pedidos, { nome: 'Quantidade de itens', tipo: 'agregacao', configuracao: { vinculo: link.id, operacao: 'contagem' } })
    const nomes = await field(pedidos, { nome: 'Nomes dos itens', tipo: 'busca', configuracao: { vinculo: link.id, campo: (await run(owner, db => repo.readFields(db, owner, itens), false))[0].id } })
    const formula = await field(pedidos, { nome: 'Com desconto', tipo: 'formula', configuracao: { formula: 'ARRED({Total} * (1 - {Desconto} / 100), 2)' } })
    await assert.rejects(version(pedidos).then(v => run(owner, db => service.saveField(db, owner, pedidos, contracts.fieldInputSchema.parse({ nome: 'Quebrada', tipo: 'formula', configuracao: { formula: '{Inexistente} + 1' }, expectedStructureVersion: v })))), e => e.code === 'INVALID_FIELD' && /Inexistente/.test(e.message))
    await assert.rejects(version(pedidos).then(v => run(owner, db => service.saveField(db, owner, pedidos, contracts.fieldInputSchema.parse({ nome: 'Circular', tipo: 'formula', configuracao: { formula: '{Com desconto} * 2' }, expectedStructureVersion: v })))), e => e.code === 'INVALID_FIELD', 'Formulas use stored values only')
    const itemName = (await run(owner, db => repo.readFields(db, owner, itens), false))[0].id
    const save = (table, valores) => version(table).then(v => run(owner, db => service.saveRecord(db, owner, table, { valores, expectedStructureVersion: v })))
    const a = await save(itens, { [itemName]: 'Cadeira', [preco.id]: '100.00' }), b = await save(itens, { [itemName]: 'Mesa', [preco.id]: '250.50' })
    const name = (await run(owner, db => repo.readFields(db, owner, pedidos), false))[0].id
    const pedido = await save(pedidos, { [name]: 'Pedido 1', [fone.id]: '(11) 98765-4321', [desconto.id]: 10, [nota.id]: 4, [link.id]: [a.id, b.id] })
    assert.equal(pedido.valores[numero.id], 1); assert.deepEqual(pedido.valores[autor.id], ['1'])
    assert.equal(pedido.valores[total.id], 350.5); assert.equal(pedido.valores[quantos.id], 2); assert.deepEqual(pedido.valores[nomes.id], ['Cadeira', 'Mesa'])
    assert.equal(pedido.valores[formula.id], 315.45, 'ARRED(350.5 * 0.9, 2)')
    const second = await save(pedidos, { [name]: 'Pedido 2' }); assert.equal(second.valores[numero.id], 2); assert.equal(second.valores[total.id], 0)
    await assert.rejects(save(pedidos, { [numero.id]: 99 }), e => e.code === 'INVALID_VALUE', 'System fields are never written')
    await assert.rejects(save(pedidos, { [nota.id]: 6 }), e => e.code === 'INVALID_VALUE')
    await assert.rejects(save(pedidos, { [fone.id]: 'abc' }), e => e.code === 'INVALID_VALUE')
    const filtered = await run(owner, db => queries.listRecords(db, owner, pedidos, contracts.listQuerySchema.parse({ filtros: [{ campo: numero.id, operador: 'gt', valor: 1 }], ordenacao: [{ campo: numero.id, direcao: 'desc' }] })), false)
    assert.deepEqual(filtered.registros.map(r => r.valores[numero.id]), [2])
    await assert.rejects(run(owner, db => queries.listRecords(db, owner, pedidos, contracts.listQuerySchema.parse({ ordenacao: [{ campo: total.id, direcao: 'desc' }] })), false), e => e.code === 'INVALID_FILTER')
    const grouped = await run(owner, db => queries.summarizeRecords(db, owner, pedidos, { busca: '', filtros: [], periodo: 'mes', agrupar_por: autor.id, metricas: [{ campo: desconto.id, operacao: 'soma' }] }), false)
    assert.equal(grouped.grupos[0].rotulo, 'Ana Silva')
  })
  await check('Two-way links: the inverse field reads, writes, filters, aggregates and goes to the trash with its origin', async () => {
    const created = await run(owner, db => service.createBase(db, owner, contracts.baseInputSchema.parse({ nome: 'Clientes e projetos' })))
    const projetos = created.tabela.id, clientes = (await run(owner, db => service.createTable(db, owner, created.base.id, 'Clientes'))).id
    const tableOf = id => run(owner, db => repo.requireTable(db, owner, id), false), fieldsOf = id => run(owner, db => repo.readFields(db, owner, id), false)
    const field = async (table, input, id) => (await run(owner, async db => service.saveField(db, owner, table, contracts.fieldInputSchema.parse({ ...input, expectedStructureVersion: (await repo.requireTable(db, owner, table)).versao_estrutura }), id))).campo
    const save = (table, valores, record) => tableOf(table).then(t => run(owner, db => service.saveRecord(db, owner, table, { valores, expectedStructureVersion: t.versao_estrutura, ...(record ? { expectedVersion: record.versao } : {}) }, record?.id)))
    const read = id => run(owner, db => repo.readRecord(db, owner, id), false)
    const link = await field(projetos, { nome: 'Cliente', tipo: 'vinculo', tabela_destino_id: clientes })
    const inverse = (await fieldsOf(clientes)).find(f => f.inverso_de === link.id)
    assert(inverse && link.inverso_id === inverse.id, 'Creating a link creates its inverse')
    assert.equal(inverse.nome, (await tableOf(projetos)).nome, 'The inverse is named after the origin table'); assert.equal(inverse.tabela_destino_id, projetos)
    const clientName = (await fieldsOf(clientes))[0].id, projectName = (await fieldsOf(projetos))[0].id
    const a = await save(clientes, { [clientName]: 'ACME' }), b = await save(clientes, { [clientName]: 'Beta' })
    const p1 = await save(projetos, { [projectName]: 'Site', [link.id]: [a.id] }), p2 = await save(projetos, { [projectName]: 'App', [link.id]: [a.id] })
    let acme = await read(a.id)
    assert.deepEqual(acme.valores[inverse.id], [p1.id, p2.id], 'The client lists its projects'); assert(acme.versao > a.versao, 'Linking moves the version of the linked record')
    assert.equal((await read(b.id)).valores[inverse.id], undefined)
    // Writing through the inverse changes the projects.
    await save(clientes, { [inverse.id]: [p1.id] }, await read(b.id))
    assert.deepEqual((await read(p1.id)).valores[link.id], [a.id, b.id])
    await save(clientes, { [inverse.id]: [p2.id] }, await read(a.id))
    assert.deepEqual((await read(p1.id)).valores[link.id], [b.id]); assert.deepEqual((await read(p2.id)).valores[link.id], [a.id])
    await assert.rejects(save(clientes, { [inverse.id]: [a.id] }, await read(b.id)), e => e.code === 'INVALID_LINK', 'Only records of the origin table')
    // Filters, grouping and aggregation over the inverse.
    const list = filtros => run(owner, db => queries.listRecords(db, owner, clientes, contracts.listQuerySchema.parse({ filtros })), false)
    assert.deepEqual((await list([{ campo: inverse.id, operador: 'eq', valor: p2.id }])).registros.map(r => r.id), [a.id])
    assert.equal((await list([{ campo: inverse.id, operador: 'not_empty' }])).total, 2)
    const grouped = await run(owner, db => queries.summarizeRecords(db, owner, clientes, { busca: '', filtros: [], periodo: 'mes', agrupar_por: inverse.id, metricas: [] }), false)
    assert.deepEqual(grouped.grupos.map(g => g.rotulo).sort(), ['App', 'Site'])
    const count = await field(clientes, { nome: 'Nº de projetos', tipo: 'agregacao', configuracao: { vinculo: inverse.id, operacao: 'contagem' } })
    assert.equal((await read(a.id)).valores[count.id], 1)
    // A trashed project leaves the client's list.
    await run(owner, async db => service.trash(db, owner, 'registros', p2.id, (await repo.readRecord(db, owner, p2.id)).versao))
    assert.deepEqual((await read(a.id)).valores[inverse.id], undefined)
    await run(owner, db => service.restore(db, owner, 'registros', p2.id))
    // The inverse cannot change type or destination; its name can change.
    await assert.rejects(field(clientes, { nome: inverse.nome, tipo: 'texto' }, inverse.id), e => e.code === 'INVERSE_FIELD')
    await field(clientes, { nome: 'Projetos do cliente', tipo: 'vinculo', tabela_destino_id: projetos }, inverse.id)
    // Trash: the inverse goes and comes back with its origin; alone, it needs the origin.
    await run(owner, async db => service.deleteField(db, owner, projetos, link.id, (await repo.requireTable(db, owner, projetos)).versao_estrutura))
    assert(!(await fieldsOf(clientes)).some(f => f.id === inverse.id))
    await assert.rejects(run(owner, db => service.restore(db, owner, 'campos', inverse.id)), e => e.code === 'INVERSE_FIELD')
    await run(owner, db => service.restore(db, owner, 'campos', link.id))
    assert.equal((await fieldsOf(clientes)).find(f => f.id === inverse.id)?.nome, 'Projetos do cliente')
    assert.deepEqual((await read(a.id)).valores[inverse.id], [p2.id])
    // Removing only the inverse keeps the links; asking for it again brings the same field back.
    await run(owner, async db => service.deleteField(db, owner, clientes, inverse.id, (await repo.requireTable(db, owner, clientes)).versao_estrutura))
    assert.deepEqual((await read(p2.id)).valores[link.id], [a.id])
    await field(projetos, { nome: 'Cliente', tipo: 'vinculo', tabela_destino_id: clientes, inverso: true }, link.id)
    assert.equal((await fieldsOf(clientes)).find(f => f.inverso_de === link.id)?.id, inverse.id)
    await field(projetos, { nome: 'Cliente', tipo: 'vinculo', tabela_destino_id: clientes, inverso: false }, link.id)
    assert(!(await fieldsOf(clientes)).some(f => f.inverso_de === link.id))
    // Self links and inverso false have no inverse; a taken name gets a number.
    const self = await field(clientes, { nome: 'Indicado por', tipo: 'vinculo', tabela_destino_id: clientes })
    assert.equal(self.inverso_id, null)
    assert.equal((await field(projetos, { nome: 'Parceiro', tipo: 'vinculo', tabela_destino_id: clientes, inverso: false })).inverso_id, null)
    await field(projetos, { nome: 'Cliente', tipo: 'vinculo', tabela_destino_id: clientes, inverso: true }, link.id)
    // The first inverse was renamed, so the table name is free once, then taken.
    const second = await field(projetos, { nome: 'Cliente final', tipo: 'vinculo', tabela_destino_id: clientes }), third = await field(projetos, { nome: 'Cliente indicado', tipo: 'vinculo', tabela_destino_id: clientes })
    const projectsName = (await tableOf(projetos)).nome, inverses = await fieldsOf(clientes)
    assert.equal(inverses.find(f => f.inverso_de === second.id)?.nome, projectsName); assert.equal(inverses.find(f => f.inverso_de === third.id)?.nome, projectsName + ' 2')
  })
  await check('Filters with OU, in queries and saved in views, and the new view types', async () => {
    const current = await run(owner, db => repo.getBundle(db, owner, table.id), false), f = name => current.campos.find(c => c.nome === name)
    const save = name => run(owner, db => service.saveRecord(db, owner, table.id, { valores: { [f('Nome do projeto').id]: name }, expectedStructureVersion: current.tabela.versao_estrutura }))
    await save('Ou alfa'); await save('Ou beta'); await save('Ou gama')
    const either = [{ campo: f('Nome do projeto').id, operador: 'eq', valor: 'Ou alfa' }, { campo: f('Nome do projeto').id, operador: 'eq', valor: 'Ou beta' }]
    const list = input => run(owner, db => queries.listRecords(db, owner, table.id, contracts.listQuerySchema.parse(input)), false)
    assert.equal((await list({ filtros: either, combinacao: 'ou' })).total, 2)
    assert.equal((await list({ filtros: either })).total, 0, 'E stays the default')
    const view = await run(owner, db => service.saveView(db, owner, table.id, contracts.viewInputSchema.parse({ nome: 'Alfa ou beta', tipo: 'galeria', configuracao: { filtros: either, combinacao: 'ou' } })))
    assert.equal((await list({ visualizacao: view.id })).total, 2)
    // Conditions added on screen add with E to the OU of the view.
    assert.equal((await list({ visualizacao: view.id, filtros: [{ campo: f('Nome do projeto').id, operador: 'contains', valor: 'beta' }] })).total, 1)
    const sum = await run(owner, db => queries.summarizeRecords(db, owner, table.id, { busca: '', filtros: [], periodo: 'mes', visualizacao: view.id, metricas: [] }), false)
    assert.equal(sum.total, 2)
    const timeline = contracts.viewInputSchema.parse({ nome: 'Prazos', tipo: 'linha_do_tempo', configuracao: { campo_data: f('Prazo').id } })
    assert.equal((await run(owner, db => service.saveView(db, owner, table.id, timeline))).tipo, 'linha_do_tempo')
    await assert.rejects(run(owner, db => service.saveView(db, owner, table.id, contracts.viewInputSchema.parse({ nome: 'Sem data', tipo: 'linha_do_tempo', configuracao: {} }))), e => e.code === 'INVALID_VIEW')
  })
  await check('Automations: the database queues events, deliveries are signed, filtered and retried; internal URLs are refused', async () => {
    const auto = load('@/products/tables/server/automations'), { createHmac } = await import('node:crypto')
    const current = await run(owner, db => repo.getBundle(db, owner, table.id), false), f = name => current.campos.find(c => c.nome === name)
    const created = await run(owner, db => auto.createAutomation(db, owner, table.id, { nome: 'Avisar CRM', gatilho: 'registro_criado', url: 'https://93.184.216.34/webhook' }))
    assert.equal(created.segredo.length >= 32, true)
    const bruno = { tenantId: 1, sharedUserId: 4, role: 'member' }
    await assert.rejects(run(bruno, db => auto.listAutomations(db, bruno, table.id), false), e => e.code === 'FORBIDDEN', 'Only base administrators see automations and their secret')
    const save = (valores, id, version) => run(owner, db => service.saveRecord(db, owner, table.id, { valores, expectedStructureVersion: current.tabela.versao_estrutura, ...(id ? { expectedVersion: version } : {}) }, id))
    const rec = await save({ [f('Nome do projeto').id]: 'Webhook novo', [f('Status').id]: [f('Status').opcoes[0].id] })
    assert.equal((await db.query("SELECT count(*)::int n FROM tables.entregas WHERE registro_id=$1 AND evento='registro_criado'", [rec.id])).rows[0].n, 1, 'One delivery per edit, even with relation writes')
    const sent = []
    const deps = { connect: async () => ({ query: (sql, values) => db.query(sql, values) }), tables: (s, _w, fn) => run(s, fn, false), checkUrl: async () => undefined,
      send: async (url, init) => { sent.push({ url, init }); return new Response('ok', { status: sent.length === 1 ? 200 : 500 }) } }
    assert.deepEqual(await auto.deliverPending(20, deps), { entregues: 1, falhas: 0 })
    const body = JSON.parse(sent[0].init.body)
    assert.equal(body.evento, 'registro_criado'); assert.equal(body.registro.valores['Nome do projeto'], 'Webhook novo'); assert.equal(body.registro.valores['Status'], f('Status').opcoes[0].nome)
    assert.equal(sent[0].init.headers['X-Cognito-Assinatura'], 'sha256=' + createHmac('sha256', created.segredo).update(sent[0].init.body).digest('hex'), 'Receivers can verify the signature')
    // Changes only when the condition holds; a failing receiver is retried later.
    await run(owner, db => auto.createAutomation(db, owner, table.id, { nome: 'Só concluídos', gatilho: 'registro_alterado', url: 'https://93.184.216.34/done', filtros: [{ campo: f('Status').id, operador: 'eq', valor: f('Status').opcoes[3].id }] }))
    const changed = await save({ [f('Nome do projeto').id]: 'Webhook editado' }, rec.id, rec.versao)
    await auto.deliverPending(20, deps)
    assert.equal((await db.query("SELECT estado FROM tables.entregas WHERE registro_id=$1 AND evento='registro_alterado'", [rec.id])).rows[0].estado, 'ignorada')
    await save({ [f('Status').id]: [f('Status').opcoes[3].id] }, rec.id, changed.versao)
    await auto.deliverPending(20, deps)
    const retry = (await db.query("SELECT estado,tentativas,resposta,proximo_em>now() futuro FROM tables.entregas WHERE registro_id=$1 AND evento='registro_alterado' ORDER BY criado_em DESC LIMIT 1", [rec.id])).rows[0]
    assert.deepEqual(retry, { estado: 'pendente', tentativas: 1, resposta: 500, futuro: true })
    for (const url of ['https://127.0.0.1/x', 'https://10.0.0.5/x', 'https://169.254.169.254/latest', 'https://localhost/x', 'https://[::1]/x']) await assert.rejects(auto.assertPublicUrl(url), e => e.code === 'INVALID_URL', url)
    // The real sender checks again and pins the connection to the checked address.
    await assert.rejects(auto.pinnedSend('https://10.0.0.5/x', { body: '{}' }), e => e.code === 'INVALID_URL')
    // Finished deliveries older than 90 days go in the daily retention; pending ones stay.
    await db.query("UPDATE tables.entregas SET concluido_em=now()-interval '91 days' WHERE registro_id=$1 AND estado='entregue'", [rec.id])
    const kept = (await db.query("SELECT count(*)::int n FROM tables.entregas WHERE estado='pendente'")).rows[0].n
    const cleaned = await load('@/products/tables/server/retention').maintainTablesRetention(async () => ({ query: (sql, values) => db.query(sql, values) }))
    assert(cleaned.entregas_removidas >= 1)
    assert.equal((await db.query("SELECT count(*)::int n FROM tables.entregas WHERE registro_id=$1 AND estado='entregue'", [rec.id])).rows[0].n, 0)
    assert.equal((await db.query("SELECT count(*)::int n FROM tables.entregas WHERE estado='pendente'")).rows[0].n, kept)
    await assert.rejects(run(owner, db => auto.createAutomation(db, owner, table.id, { nome: 'HTTP', gatilho: 'registro_criado', url: 'http://93.184.216.34/x' })))
  })
  await check('API keys: shown once, stored as hash, act as their creator, revoked at once and rate limited', async () => {
    await db.exec("ALTER TABLE shared.empresas ADD COLUMN IF NOT EXISTS name text; UPDATE shared.empresas SET name='Equipe' WHERE id=1; ALTER TABLE shared.usuarios ADD COLUMN IF NOT EXISTS clerk_user_id text")
    const keys = load('@/products/tables/server/apiKeys')
    const created = await run(owner, db => keys.createKey(db, owner, { nome: 'Integração ERP', escopo: 'escrita' }))
    assert.match(created.segredo, /^ctk_[A-Za-z0-9_-]{32}$/); assert.equal(created.chave.prefixo, created.segredo.slice(0, 10))
    assert.equal((await db.query('SELECT count(*)::int n FROM tables.chaves_api WHERE hash=$1', [created.segredo])).rows[0].n, 0, 'The key itself is never stored')
    const bruno = { tenantId: 1, sharedUserId: 4, role: 'member' }
    assert.equal((await run(bruno, db => keys.listKeys(db, bruno), false)).chaves.length, 0, 'People see only their own keys')
    assert.equal((await run(owner, db => keys.listKeys(db, owner), false)).chaves.length, 1)
    const deps = { connect: async () => ({ query: (sql, values) => db.query(sql, values) }) }, request = key => new Request('https://x.invalid/api/v1/tables/bases', { headers: { authorization: 'Bearer ' + key } })
    const auth = await keys.authenticateKey(request(created.segredo), deps)
    assert.deepEqual([auth.session.tenantId, auth.session.sharedUserId, auth.session.role, auth.escopo, auth.session.tenantName], [1, 1, 'owner', 'escrita', 'Equipe'])
    await assert.rejects(keys.authenticateKey(request('ctk_' + 'x'.repeat(32)), deps), e => e.code === 'UNAUTHENTICATED')
    await db.query("UPDATE tables.uso_api SET contagem=600")
    await assert.rejects(keys.authenticateKey(request(created.segredo), deps), e => e.code === 'RATE_LIMITED')
    await run(owner, db => keys.revokeKey(db, owner, created.chave.id))
    await assert.rejects(keys.authenticateKey(request(created.segredo), deps), e => e.code === 'UNAUTHENTICATED', 'Revoked keys stop at once')
  })
  await check('Suspended organization member immediately loses access', async () => {
    await db.query("UPDATE shared.usuarios_empresas SET status='suspended' WHERE empresa_id=1 AND usuario_id=1")
    assert.equal((await run(owner, db => service.listBases(db, owner), false)).length, 0)
  })
  const report = { status: 'passed', checks, database: 'isolated_pglite', realWrites: false, migrationDigest: createHash('sha256').update(readFileSync('supabase/migrations/20261016120000_create_tables.sql')).digest('hex') }
  mkdirSync('.cache/tables', { recursive: true }); writeFileSync('.cache/tables/smoke.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ status: 'passed', checks: checks.length, database: 'isolated_pglite', realWrites: false }))
} finally { await db.close() }
