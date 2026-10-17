import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { PGlite } from '@electric-sql/pglite'

// Isolated SQL, Storage responses and fictitious identities. The separate
// deployment HTTP validation exercises real authentication and private Storage.
process.env.TABLES_SUPABASE_SERVICE_ROLE_KEY = 'isolated_fixture_key'
process.env.SUPABASE_DB_URL = 'postgresql://postgres.abcdefghijklmnopqrst:fixture@localhost/postgres'
const db = new PGlite(), modules = new Map(), require = createRequire(import.meta.url), root = process.cwd(), checks = [], paths = []
class IsolatedPool {
  query(sql, params) { return db.query(sql, params) }
  async connect() { return { query: (sql, params) => db.query(sql, params), release() {} } }
}
function load(name, parent = resolve(root, 'entry.ts')) {
  if (name === 'pg') return { Pool: IsolatedPool }
  if (name === '@/lib/postgres') return { buildPostgresPoolConfig: () => ({}) }
  if (!name.startsWith('.') && !name.startsWith('@/') && !name.startsWith(root)) return require(name)
  let file = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(parent), name)
  if (!existsSync(file)) file = ['.ts', '/index.ts'].map(s => file + s).find(existsSync)
  assert(file, name); if (modules.has(file)) return modules.get(file).exports
  const module = { exports: {} }; modules.set(file, module)
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(dep => load(dep, file), module, module.exports)
  return module.exports
}
const storage = load('@/products/tables/server/storage'), service = load('@/products/tables/server/service'), repository = load('@/products/tables/server/repository'), contracts = load('@/products/tables/shared/contracts'), maintenance = load('@/products/tables/server/maintenance')
const actor = { tenantId: 1, sharedUserId: 1, role: 'owner' }
async function run(fn) {
  await db.exec('BEGIN')
  try {
    await db.query("SELECT set_config('app.tables_empresa_id','1',true),set_config('app.tables_usuario_id','1',true),set_config('app.tables_operacao_id',gen_random_uuid()::text,true),set_config('role','tables_runtime',true)")
    const value = await fn(db); await db.exec('COMMIT'); return value
  } catch (error) { await db.exec('ROLLBACK'); throw error }
}
async function check(name, fn) { await fn(); checks.push(name); console.log('Passed: ' + name) }
const originalFetch = globalThis.fetch, objects = new Map()
const isolatedFetch = async (url, init = {}) => {
  const parsed = new URL(url), path = parsed.pathname.replace('/storage/v1/', ''), json = body => Response.json(body)
  if (path.startsWith('object/upload/sign/')) {
    const key = path.slice('object/upload/sign/'.length)
    if (init.method === 'POST') return json({ url: '/object/upload/sign/' + key + '?token=fixture' })
    if (init.method === 'PUT' && parsed.searchParams.get('token') === 'fixture') { objects.set(key, Buffer.from(init.body)); return json({}) }
  }
  if (path.startsWith('object/authenticated/')) {
    const bytes = objects.get(path.slice('object/authenticated/'.length))
    return new Response(null, { status: bytes ? 200 : 404, headers: bytes ? { 'content-length': String(bytes.length) } : {} })
  }
  if (path.startsWith('object/sign/')) {
    const key = path.slice('object/sign/'.length)
    if (init.method === 'POST') return json({ signedURL: '/object/sign/' + key + '?token=fixture' })
    const bytes = parsed.searchParams.get('token') === 'fixture' && objects.get(key)
    return new Response(bytes || null, { status: bytes ? 200 : 403 })
  }
  if (path === 'object/tables-anexos' && init.method === 'DELETE') {
    for (const key of JSON.parse(init.body).prefixes) objects.delete('tables-anexos/' + key)
    return json([])
  }
  throw new Error('Unexpected isolated Storage request')
}
globalThis.fetch = isolatedFetch
try {
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA shared;
    CREATE TABLE shared.empresas(id bigint PRIMARY KEY,status text DEFAULT 'active');
    CREATE TABLE shared.usuarios(id bigint PRIMARY KEY,full_name text,email text,status text DEFAULT 'active');
    CREATE TABLE shared.usuarios_empresas(empresa_id bigint,usuario_id bigint,role text,status text DEFAULT 'active',suspenso_localmente boolean DEFAULT false,PRIMARY KEY(empresa_id,usuario_id));
    INSERT INTO shared.empresas(id) VALUES(1);INSERT INTO shared.usuarios(id,full_name,email) VALUES(1,'Teste Tables','tables@example.invalid');INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role) VALUES(1,1,'owner');`)
  await db.exec(readFileSync('supabase/migrations/20261016120000_create_tables.sql', 'utf8'))
  await db.exec(readFileSync('supabase/migrations/20261018120000_tables_base_permissions.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018150000_tables_search_index.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018160000_tables_field_types.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018170000_tables_views.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018180000_tables_automations.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018190000_tables_api_keys.sql', 'utf8'))
    await db.exec(readFileSync('supabase/migrations/20261018200000_tables_change_index.sql', 'utf8'))
  const { tabela } = await run(db => service.createBase(db, actor, contracts.baseInputSchema.parse({ nome: 'Teste isolado de anexos' })))
  const { campo } = await run(db => service.saveField(db, actor, tabela.id, contracts.fieldInputSchema.parse({ nome: 'Documentos', tipo: 'anexo', expectedStructureVersion: 1 })))
  let record = await run(db => service.saveRecord(db, actor, tabela.id, { valores: {}, expectedStructureVersion: 2 }))
  const contents = Buffer.from('Tables: teste de armazenamento privado.\n')
  async function prepare(upload = true) {
    record = await run(db => repository.readRecord(db, actor, record.id))
    const file = await run(db => storage.prepareAttachment(db, actor, record.id, { nome: 'tables-teste.txt', tamanho: contents.length, mime_type: 'text/plain', campo_id: campo.id, expectedVersion: record.versao }))
    paths.push((await db.query('SELECT caminho FROM tables.anexos WHERE id=$1', [file.anexo_id])).rows[0].caminho)
    if (upload) { const r = await fetch(file.upload_url, { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: contents }); assert(r.ok, 'Signed upload HTTP ' + r.status) }
    return file.anexo_id
  }
  let confirmed, expired, pending, excluded, missing
  await check('Signed upload, confirmation and private download protocol', async () => {
    confirmed = await prepare()
    await run(db => storage.attachmentAction(db, actor, confirmed, 'confirmar'))
    const { url } = await run(db => storage.attachmentAction(db, actor, confirmed, 'download'))
    assert.equal(new URL(url).searchParams.get('download'), 'tables-teste.txt')
    const r = await fetch(url); assert(r.ok); assert.deepEqual(Buffer.from(await r.arrayBuffer()), contents)
    const privateUrl = new URL(url); privateUrl.search = ''; assert(!(await fetch(privateUrl)).ok)
  })
  await check('Expired pending uploads cannot be confirmed', async () => {
    expired = await prepare(); pending = await prepare(); excluded = await prepare(); missing = await prepare(false)
    await run(db => storage.attachmentAction(db, actor, excluded, 'excluir'))
    await run(db => db.query("UPDATE tables.anexos SET criado_em=now()-interval '25 hours' WHERE id=ANY($1::uuid[])", [[confirmed, expired, excluded, missing]]))
    await assert.rejects(run(db => storage.attachmentAction(db, actor, expired, 'confirmar')), e => e.code === 'EXPIRED_UPLOAD')
  })
  await check('Failed physical deletion keeps metadata for retry', async () => {
    globalThis.fetch = async (url, init) => init?.method === 'DELETE' ? new Response('{}', { status: 503 }) : isolatedFetch(url, init)
    const report = await maintenance.maintainTablesStorage(); assert.equal(report.failed, 3); assert.equal(report.removed, 0)
    assert.equal((await db.query('SELECT count(*)::int n FROM tables.anexos')).rows[0].n, 5)
    globalThis.fetch = isolatedFetch
  })
  await check('Cleanup removes abandoned/excluded files, preserves new and confirmed files', async () => {
    const report = await maintenance.maintainTablesStorage(); assert.equal(report.removed, 3); assert.equal(report.failed, 0)
    const remaining = (await db.query('SELECT id FROM tables.anexos')).rows.map(r => r.id).sort()
    assert.deepEqual(remaining, [confirmed, pending].sort())
    assert.equal((await maintenance.maintainTablesStorage()).removed, 0)
    const { url } = await run(db => storage.attachmentAction(db, actor, confirmed, 'download')); assert((await fetch(url)).ok)
  })
  mkdirSync('.cache/tables', { recursive: true }); const report = { status: 'passed', checks, isolatedStorage: true, productionDatabaseWrites: false, generatedAt: new Date().toISOString() }
  writeFileSync('.cache/tables/storage.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', checks, code: error.code ?? error.name, message: error instanceof assert.AssertionError ? error.message : 'Storage verification failed; credentials omitted.' })); process.exitCode = 1
} finally {
  globalThis.fetch = isolatedFetch
  for (const path of paths) await storage.removeStoredAttachment(path).catch(() => { process.exitCode = 1 })
  globalThis.fetch = originalFetch
  await db.close()
}
