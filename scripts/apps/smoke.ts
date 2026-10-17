import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { create, saveDraft, loadPackage, duplicate, lifecycle, catalog } from '../../src/products/apps/server/service'
import { publish, unpublish, compatible } from '../../src/products/apps/server/publishing'
import { openRuntime, dataOperation } from '../../src/products/apps/server/runtime'
import { getApp, versions } from '../../src/products/apps/server/repository'
import type { Database, Session } from '../../src/products/apps/server/database'
import { hash, type PackageStore } from '../../src/products/apps/server/storage'
import { metadataSchema, validatePackage, type AppPackage } from '../../src/products/apps/shared/contracts'

process.env.APPS_RUNTIME_SECRET = 'isolated-runtime-secret-with-at-least-32-characters'
const db = new PGlite(), objects = new Map<string, string>(), checks: string[] = []
const s = { tenantId: 1, sharedUserId: 1, role: 'owner', browserSession: 'browser-fixture' } as const
const file = 'supabase/migrations/20261017100000_apps_product.sql'
const store: PackageStore = { async put(path, p) { const text = JSON.stringify(validatePackage(p)); objects.set(path, text); return { tamanho: Buffer.byteLength(text), hash: hash(text) } }, async get(path, digest) { const text = objects.get(path); assert(text); assert.equal(hash(text), digest); return JSON.parse(text) as AppPackage } }
async function run<T>(session: Session, fn: (db: Database) => Promise<T>): Promise<T> {
  await db.exec('BEGIN')
  try { await db.query("SELECT set_config('app.apps_empresa_id',$1,true),set_config('app.apps_usuario_id',$2,true),set_config('role','apps_runtime',true)", [String(session.tenantId), String(session.sharedUserId)]); const r = await fn(db as unknown as Database); await db.exec('COMMIT'); return r }
  catch (e) { await db.exec('ROLLBACK'); throw e }
}
async function check(name: string, fn: () => Promise<void>) { await fn(); checks.push(name); console.log('Passed: ' + name) }
async function main() {
 try {
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA shared;CREATE SCHEMA storage;
   CREATE TABLE shared.empresas(id bigint PRIMARY KEY,status text DEFAULT 'active');CREATE TABLE shared.usuarios(id bigint PRIMARY KEY,status text DEFAULT 'active');
   CREATE TABLE shared.usuarios_empresas(empresa_id bigint,usuario_id bigint,role text,status text DEFAULT 'active',suspenso_localmente boolean DEFAULT false);
   INSERT INTO shared.empresas(id)VALUES(1),(2);INSERT INTO shared.usuarios(id)VALUES(1),(2),(3),(4);
   INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role)VALUES(1,1,'owner'),(1,2,'viewer'),(1,3,'member'),(2,4,'owner');
   CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`)
  await db.exec(readFileSync(file, 'utf8'))
  const app = await run(s, db => create(db, s, metadataSchema.parse({ nome: 'Ideias' }), true, store))
  let runtime: Awaited<ReturnType<typeof openRuntime>>
  await check('Private schema, 9 RLS tables, cross-company reads/writes and foreign keys', async () => {
    assert.equal((await db.query<{ n: number }>("SELECT count(*)::int n FROM pg_tables WHERE schemaname='apps'")).rows[0].n, 9)
    assert.equal((await db.query<{ n: number }>("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='apps' AND c.relkind='r' AND c.relrowsecurity AND c.relforcerowsecurity")).rows[0].n, 9)
    assert.equal((await db.query<{ ok: boolean }>("SELECT has_schema_privilege('authenticated','apps','USAGE') ok")).rows[0].ok, false)
    await assert.rejects(() => run({ tenantId: 2, sharedUserId: 4, role: 'owner' }, db => getApp(db, { tenantId: 2, sharedUserId: 4, role: 'owner' }, app.id)))
    await assert.rejects(() => run(s, db => db.query("INSERT INTO apps.versoes(empresa_id,app_id,numero,manifesto,criado_por)VALUES(2,$1,2,'{}',1)", [app.id])))
    await assert.rejects(() => run({ tenantId: 1, sharedUserId: 2, role: 'viewer' }, db => db.query("UPDATE apps.apps SET nome='forbidden' WHERE id=$1 RETURNING id", [app.id]).then(r => { assert.equal(r.rows.length, 1) })))
  })
  await check('Search, complete counters, paging, and personal favorites', async () => {
    await run(s, async db => { let r = await catalog(db, s, 'Ide', 'todos', 1, 'atualizacao'); assert.equal(r.total, 1); assert.equal(r.contadores.construcao, 1); await db.query('INSERT INTO apps.favoritos(empresa_id,app_id,usuario_id)VALUES(1,$1,1)', [app.id]); r = await catalog(db, s, '', 'favoritos', 1, 'nome'); assert.equal(r.apps.length, 1) })
    await run({ ...s, sharedUserId: 2, role: 'viewer' }, async db => { assert.equal((await catalog(db, { ...s, sharedUserId: 2, role: 'viewer' }, '', 'favoritos', 1, 'nome')).total, 0); await db.query('INSERT INTO apps.favoritos(empresa_id,app_id,usuario_id)VALUES(1,$1,2)', [app.id]) })
  })
  await check('Draft conflicts, failed Storage rollback, and exact publication idempotency', async () => {
    const v = (await run(s, db => versions(db, s, app.id)))[0], p = await run(s, db => loadPackage(db, s, app.id, v.id, store))
    await assert.rejects(() => run(s, db => saveDraft(db, s, app.id, 999, p, store)))
    await assert.rejects(() => run(s, db => saveDraft(db, s, app.id, 1, p, { ...store, put: async () => { throw Error('Storage down') } })))
    assert.equal((await run(s, db => getApp(db, s, app.id))).versao_concorrencia, 1)
    const key = randomUUID(); await run(s, db => publish(db, s, app.id, 1, v.id, key, store)); await run(s, db => publish(db, s, app.id, 1, v.id, key, store))
    assert.equal((await db.query<{ n: number }>('SELECT count(*)::int n FROM apps.publicacoes')).rows[0].n, 1)
    await assert.rejects(() => run(s, db => db.query("UPDATE apps.versoes SET manifesto='{}' WHERE id=$1", [v.id])))
    await assert.rejects(() => run(s, db => db.query("UPDATE apps.arquivos SET hash_conteudo='changed' WHERE versao_id=$1", [v.id])))
    runtime = await run(s, db => openRuntime(db, s, app.id, false, undefined, store)); assert(runtime.token)
  })
  await check('App data validates types, revisions, browser binding and viewer restrictions', async () => {
    const input = { token: runtime.token!, colecao: 'itens', operacao: 'salvar' as const, pagina: 1, registro: { dados: { titulo: 'real fixture' } } }
    await assert.rejects(() => run(s, db => dataOperation(db, s, app.id, { ...input, registro: { dados: { titulo: 1 } } })))
    const result = await run(s, db => dataOperation(db, s, app.id, input)); assert('registro' in result); const record = result.registro!
    await assert.rejects(() => run(s, db => dataOperation(db, { ...s, browserSession: 'another' }, app.id, input)))
    await assert.rejects(() => run(s, db => dataOperation(db, s, app.id, { ...input, registro: { id: record.id, expectedVersion: 999, dados: { titulo: 'change' } } })))
    const viewer = { ...s, sharedUserId: 2, role: 'viewer' as const }, vr = await run(viewer, db => openRuntime(db, viewer, app.id, false, undefined, store))
    await assert.rejects(() => run(viewer, db => dataOperation(db, viewer, app.id, { ...input, token: vr.token! })))
    const data = await run(s, db => dataOperation(db, s, app.id, { token: runtime.token!, colecao: 'itens', operacao: 'listar', pagina: 1 })); assert.equal(data.total, 1)
  })
  await check('New draft preserves live package and data; compatibility rejects destructive changes', async () => {
    let a = await run(s, db => getApp(db, s, app.id)); const p = structuredClone(runtime.pacote); p.arquivos[0].conteudo = p.arquivos[0].conteudo.replace('Organize suas ideias', 'Nova versão')
    await run(s, db => saveDraft(db, s, app.id, a.versao_concorrencia, p, store))
    const opened = await run(s, db => openRuntime(db, s, app.id, false, undefined, store)); assert(!opened.pacote.arquivos[0].conteudo.includes('Nova versão'))
    assert.throws(() => compatible(runtime.pacote.manifesto, { formato: 1, entrada: 'index.html', colecoes: [] }))
    const member = { ...s, sharedUserId: 3, role: 'member' as const }; a = await run(s, db => getApp(db, s, app.id)); const vs = await run(s, db => versions(db, s, app.id))
    await assert.rejects(() => run(member, db => publish(db, member, app.id, a.versao_concorrencia, vs[0].id, randomUUID(), store)))
    await run(s, db => publish(db, s, app.id, a.versao_concorrencia, vs[0].id, randomUUID(), store))
    await assert.rejects(() => run(s, db => dataOperation(db, s, app.id, { token: runtime.token!, colecao: 'itens', operacao: 'listar', pagina: 1 })))
    runtime = await run(s, db => openRuntime(db, s, app.id, false, undefined, store)); const rows = await run(s, db => dataOperation(db, s, app.id, { token: runtime.token!, colecao: 'itens', operacao: 'listar', pagina: 1 })); assert.equal(rows.total, 1)
  })
  await check('Duplication excludes runtime records; archive/trash/recover revoke old sessions', async () => {
    const copy = await run(s, db => duplicate(db, s, app.id, store)); assert(copy.id !== app.id)
    assert.equal((await db.query<{ n: number }>('SELECT count(*)::int n FROM apps.registros WHERE app_id=$1', [copy.id])).rows[0].n, 0)
    const member = { ...s, sharedUserId: 3, role: 'member' as const }
    let a = await run(s, db => getApp(db, s, app.id))
    await assert.rejects(() => run(member, db => lifecycle(db, member, app.id, a.versao_concorrencia, 'arquivar')), /administradores/)
    await assert.rejects(() => run(member, db => lifecycle(db, member, app.id, a.versao_concorrencia, 'excluir')), /administradores/)
    let c = await run(s, db => getApp(db, s, copy.id)); await run(member, db => lifecycle(db, member, copy.id, c.versao_concorrencia, 'arquivar'))
    c = await run(s, db => getApp(db, s, copy.id, true, true)); await run(member, db => lifecycle(db, member, copy.id, c.versao_concorrencia, 'restaurar'))
    await run(s, db => lifecycle(db, s, app.id, a.versao_concorrencia, 'arquivar'))
    await assert.rejects(() => run(s, db => dataOperation(db, s, app.id, { token: runtime.token!, colecao: 'itens', operacao: 'listar', pagina: 1 })))
    a = await run(s, db => getApp(db, s, app.id)); await run(s, db => lifecycle(db, s, app.id, a.versao_concorrencia, 'excluir'))
    await assert.rejects(() => run(s, db => getApp(db, s, app.id)))
    a = await run(s, db => getApp(db, s, app.id, false, true)); await run(s, db => lifecycle(db, s, app.id, a.versao_concorrencia, 'restaurar'))
    a = await run(s, db => getApp(db, s, app.id)); assert.equal(a.publicacao_id, null)
    const vs = await run(s, db => versions(db, s, app.id)); await run(s, db => publish(db, s, app.id, a.versao_concorrencia, vs[1].id, randomUUID(), store)); a = await run(s, db => getApp(db, s, app.id)); await run(s, db => unpublish(db, s, app.id, a.versao_concorrencia))
  })
  const report = { status: 'passed', checks, migrationDigest: createHash('sha256').update(readFileSync(file)).digest('hex'), generatedAt: new Date().toISOString() }
  mkdirSync('.cache/apps', { recursive: true }); writeFileSync('.cache/apps/smoke.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
 } finally { await db.close() }
}
main().catch(e => { console.error(e); process.exitCode = 1 })
