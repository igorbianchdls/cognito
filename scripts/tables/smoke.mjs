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
  await check('Migration creates 14 tables and tenant policies', async () => {
    await db.exec(readFileSync('supabase/migrations/20261016120000_create_tables.sql', 'utf8'))
    assert.equal((await db.query("SELECT count(*)::int n FROM pg_tables WHERE schemaname='tables'")).rows[0].n, 14)
    assert.equal((await db.query("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='tables' AND c.relkind='r' AND c.relrowsecurity")).rows[0].n, 14)
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
  await check('Suspended organization member immediately loses access', async () => {
    await db.query("UPDATE shared.usuarios_empresas SET status='suspended' WHERE empresa_id=1 AND usuario_id=1")
    assert.equal((await run(owner, db => service.listBases(db, owner), false)).length, 0)
  })
  const report = { status: 'passed', checks, database: 'isolated_pglite', realWrites: false, migrationDigest: createHash('sha256').update(readFileSync('supabase/migrations/20261016120000_create_tables.sql')).digest('hex') }
  mkdirSync('.cache/tables', { recursive: true }); writeFileSync('.cache/tables/smoke.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ status: 'passed', checks: checks.length, database: 'isolated_pglite', realWrites: false }))
} finally { await db.close() }
