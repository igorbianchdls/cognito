import assert from 'node:assert/strict'
import { randomUUID, createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { create, saveDraft, loadPackage, duplicate, lifecycle, catalog } from '../../src/products/apps/server/service'
import { publish, unpublish, compatible } from '../../src/products/apps/server/publishing'
import { openRuntime, dataOperation, runtimeManifest } from '../../src/products/apps/server/runtime'
import { getApp, versions } from '../../src/products/apps/server/repository'
import { checkSources, tablesOperation, tablesRequestSchema, type TablesTransaction } from '../../src/products/apps/server/tablesSource'
import type { Database, Session } from '../../src/products/apps/server/database'
import { hash, type PackageStore } from '../../src/products/apps/server/storage'
import { manifestSchema, metadataSchema, validatePackage, type AppPackage, type Manifest } from '../../src/products/apps/shared/contracts'
import { createBase } from '../../src/products/tables/server/service'
import { TablesError } from '../../src/products/tables/shared/contracts'

process.env.APPS_RUNTIME_SECRET = 'isolated-runtime-secret-with-at-least-32-characters'
const db = new PGlite(), objects = new Map<string, string>(), checks: string[] = []
const s = { tenantId: 1, sharedUserId: 1, role: 'owner', browserSession: 'browser-fixture' } as const
const migrations = ['20261016120000_create_tables.sql', '20261017100000_apps_product.sql', '20261017150000_apps_files_in_database.sql'].map(f => 'supabase/migrations/' + f)
// Legacy packages (before files moved to the database) are still read from Storage.
const store: PackageStore = { async put(path, p) { const text = JSON.stringify(validatePackage(p)); objects.set(path, text); return { tamanho: Buffer.byteLength(text), hash: hash(text) } }, async get(path, digest) { const text = objects.get(path); assert(text); assert.equal(hash(text), digest); return JSON.parse(text) as AppPackage } }
async function run<T>(session: Session, fn: (db: Database) => Promise<T>): Promise<T> {
  await db.exec('BEGIN')
  try { await db.query("SELECT set_config('app.apps_empresa_id',$1,true),set_config('app.apps_usuario_id',$2,true),set_config('role','apps_runtime',true)", [String(session.tenantId), String(session.sharedUserId)]); const r = await fn(db as unknown as Database); await db.exec('COMMIT'); return r }
  catch (e) { await db.exec('ROLLBACK'); throw e }
}
// Same context as the product's Tables transaction, on the isolated database.
const tables: TablesTransaction = async (session, write, fn) => {
  if (write && session.role === 'viewer') throw new TablesError('READ_ONLY', 'Seu acesso permite apenas consultas.', 403)
  await db.exec('BEGIN')
  try { await db.query("SELECT set_config('app.tables_empresa_id',$1,true),set_config('app.tables_usuario_id',$2,true),set_config('app.tables_operacao_id',gen_random_uuid()::text,true),set_config('role','tables_runtime',true)", [String(session.tenantId), String(session.sharedUserId)]); const r = await fn(db as never); await db.exec('COMMIT'); return r }
  catch (e) { await db.exec('ROLLBACK'); throw e }
}
const count = async (sql: string, params: unknown[] = []) => (await db.query<{ n: number }>(sql, params)).rows[0].n
async function check(name: string, fn: () => Promise<void>) { await fn(); checks.push(name); console.log('Passed: ' + name) }
async function main() {
 try {
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA shared;CREATE SCHEMA storage;
   CREATE TABLE shared.empresas(id bigint PRIMARY KEY,status text DEFAULT 'active');CREATE TABLE shared.usuarios(id bigint PRIMARY KEY,status text DEFAULT 'active',full_name text,email text,clerk_user_id text);
   CREATE TABLE shared.usuarios_empresas(empresa_id bigint,usuario_id bigint,role text,status text DEFAULT 'active',suspenso_localmente boolean DEFAULT false,PRIMARY KEY(empresa_id,usuario_id));
   INSERT INTO shared.empresas(id)VALUES(1),(2);INSERT INTO shared.usuarios(id,full_name,email)VALUES(1,'Ana','ana@example.invalid'),(2,'Leitor','leitor@example.invalid'),(3,'Bruno','bruno@example.invalid'),(4,'Outra','outra@example.invalid');
   INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role)VALUES(1,1,'owner'),(1,2,'viewer'),(1,3,'member'),(2,4,'owner');
   CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`)
  for (const file of migrations) await db.exec(readFileSync(file, 'utf8'))
  const app = await run(s, db => create(db, s, metadataSchema.parse({ nome: 'Ideias' }), true))
  let runtime: Awaited<ReturnType<typeof openRuntime>>
  await check('Private schema, 11 RLS tables, cross-company reads/writes and foreign keys', async () => {
    assert.equal(await count("SELECT count(*)::int n FROM pg_tables WHERE schemaname='apps'"), 11)
    assert.equal(await count("SELECT count(*)::int n FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='apps' AND c.relkind='r' AND c.relrowsecurity AND c.relforcerowsecurity"), 11)
    assert.equal((await db.query<{ ok: boolean }>("SELECT has_schema_privilege('authenticated','apps','USAGE') ok")).rows[0].ok, false)
    await assert.rejects(() => run({ tenantId: 2, sharedUserId: 4, role: 'owner' }, db => getApp(db, { tenantId: 2, sharedUserId: 4, role: 'owner' }, app.id)))
    await assert.rejects(() => run(s, db => db.query("INSERT INTO apps.versoes(empresa_id,app_id,numero,manifesto,criado_por)VALUES(2,$1,2,'{}',1)", [app.id])))
    await assert.rejects(() => run({ tenantId: 1, sharedUserId: 2, role: 'viewer' }, db => db.query("UPDATE apps.apps SET nome='forbidden' WHERE id=$1 RETURNING id", [app.id]).then(r => { assert.equal(r.rows.length, 1) })))
    assert.equal(await count('SELECT count(*)::int n FROM apps.conteudos WHERE empresa_id=2'), 0)
  })
  await check('Files live in the database: one row per file, unchanged contents are not stored twice', async () => {
    const v = (await run(s, db => versions(db, s, app.id)))[0]
    assert.equal(v.versao_formato, 2); assert.equal(objects.size, 0, 'Saving must not use Storage')
    assert.equal(await count('SELECT count(*)::int n FROM apps.versao_arquivos WHERE versao_id=$1', [v.id]), 3)
    const before = await count('SELECT count(*)::int n FROM apps.conteudos'), p = await run(s, db => loadPackage(db, s, app.id, v.id))
    let a = await run(s, db => getApp(db, s, app.id)); await run(s, db => saveDraft(db, s, app.id, a.versao_concorrencia, p))
    assert.equal(await count('SELECT count(*)::int n FROM apps.conteudos'), before, 'Same contents are reused')
    p.arquivos[1].conteudo += '\nh1{letter-spacing:-1px}'; a = await run(s, db => getApp(db, s, app.id)); await run(s, db => saveDraft(db, s, app.id, a.versao_concorrencia, p))
    assert.equal(await count('SELECT count(*)::int n FROM apps.conteudos'), before + 1, 'Only the changed file adds content')
    assert.deepEqual((await run(s, db => loadPackage(db, s, app.id, v.id))).arquivos.map(f => f.caminho), p.arquivos.map(f => f.caminho))
  })
  await check('Legacy Storage packages still load and convert to database files on the next save', async () => {
    const legacy = randomUUID(), version = randomUUID(), file = randomUUID(), p = await run(s, async db => loadPackage(db, s, app.id, (await versions(db, s, app.id))[0].id))
    const path = `1/${legacy}/${version}/${file}.json`, saved = await store.put(path, p)
    await run(s, async db => {
      await db.query("INSERT INTO apps.apps(id,empresa_id,nome,slug,criado_por,atualizado_por) VALUES($1,1,'Legado','legado',1,1)", [legacy])
      await db.query("INSERT INTO apps.versoes(id,empresa_id,app_id,numero,manifesto,versao_formato,criado_por) VALUES($1,1,$2,1,$3::jsonb,1,1)", [version, legacy, JSON.stringify({ formato: 1, entrada: 'index.html', colecoes: p.manifesto.colecoes })])
      await db.query("INSERT INTO apps.arquivos(id,empresa_id,app_id,versao_id,caminho_logico,caminho_storage,finalidade,mime_type,tamanho,hash_conteudo,criado_por,estado_upload) VALUES($1,1,$2,$3,$4,$5,'pacote','application/json',$6,$7,1,'confirmado')", [file, legacy, version, file + '.json', path, saved.tamanho, saved.hash])
    })
    assert.equal((await run(s, db => loadPackage(db, s, legacy, version, store))).arquivos.length, 3)
    const a = await run(s, db => getApp(db, s, legacy)); await run(s, db => saveDraft(db, s, legacy, a.versao_concorrencia, p))
    assert.equal((await run(s, db => versions(db, s, legacy)))[0].versao_formato, 2)
    assert.equal((await run(s, db => loadPackage(db, s, legacy, version))).arquivos.length, 3)
  })
  await check('Draft conflicts, sealed files and exact publication idempotency', async () => {
    const v = (await run(s, db => versions(db, s, app.id)))[0], p = await run(s, db => loadPackage(db, s, app.id, v.id))
    await assert.rejects(() => run(s, db => saveDraft(db, s, app.id, 999, p)))
    const a = await run(s, db => getApp(db, s, app.id)), key = randomUUID()
    await run(s, db => publish(db, s, app.id, a.versao_concorrencia, v.id, key, store)); await run(s, db => publish(db, s, app.id, a.versao_concorrencia, v.id, key, store))
    assert.equal(await count('SELECT count(*)::int n FROM apps.publicacoes'), 1)
    await assert.rejects(() => run(s, db => db.query("UPDATE apps.versoes SET manifesto='{}' WHERE id=$1", [v.id])))
    await assert.rejects(() => run(s, db => db.query('DELETE FROM apps.versao_arquivos WHERE versao_id=$1', [v.id])), /selada/)
    assert.equal((await run(s, db => versions(db, s, app.id)))[0].hash_conteudo?.length, 64)
    const member = { ...s, sharedUserId: 3, role: 'member' as const }
    assert.equal((await run(member, db => db.query("UPDATE apps.publicacoes SET estado='encerrada',encerrado_em=now() WHERE app_id=$1 AND estado='ativa' RETURNING id", [app.id]))).rows.length, 0, 'Only administrators take an app offline')
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
  await check('Tables sources: names, manifest operations, member permissions and company isolation', async () => {
    const created = await tables(s, false, db => createBase(db as never, s, { nome: 'Projetos', descricao: '', cor: '#8b5cf6', modelo: 'projetos' })) as unknown as { tabela: { id: string } }
    const manifest: Manifest = manifestSchema.parse({ formato: 1, entrada: 'index.html', tabelas: [{ chave: 'projetos', tabela_id: created.tabela.id, operacoes: ['ler', 'criar'] }] })
    const op = (input: object, session: Session = s) => tablesOperation(session, manifest, tablesRequestSchema.parse({ fonte: 'projetos', ...input }), tables)
    const saved = await op({ operacao: 'criar', valores: { 'Nome do projeto': 'Portal', status: 'em andamento', 'Responsável': 'ana@example.invalid', 'Orçamento': '1200.50' } }) as { registro: { id: string; valores: Record<string, unknown> } }
    assert.equal(saved.registro.valores['Status'], 'Em andamento'); assert.equal(saved.registro.valores['Responsável'], 'Ana')
    const list = await op({ operacao: 'listar', filtros: [{ campo: 'Status', operador: 'eq', valor: 'Em andamento' }] }) as { total: number }
    assert.equal(list.total, 1)
    const summary = await op({ operacao: 'resumir', agrupar_por: 'Status', metricas: [{ campo: 'Orçamento', operacao: 'soma' }] }) as { grupos: { rotulo: string; quantidade: number }[] }
    assert.deepEqual(summary.grupos.map(g => [g.rotulo, g.quantidade]), [['Em andamento', 1]])
    assert((await op({ operacao: 'campos' }) as { campos: { nome: string; opcoes?: string[] }[] }).campos.find(c => c.nome === 'Status')!.opcoes!.includes('A fazer'))
    assert.equal(((await op({ operacao: 'obter', id: saved.registro.id })) as { registro: { id: string } }).registro.id, saved.registro.id)
    await assert.rejects(() => op({ operacao: 'editar', id: saved.registro.id, valores: { 'Status': 'A fazer' } }), (e: { code?: string }) => e.code === 'SOURCE_FORBIDDEN')
    await assert.rejects(() => tablesOperation(s, manifest, tablesRequestSchema.parse({ fonte: 'outra', operacao: 'listar' }), tables), (e: { code?: string }) => e.code === 'UNKNOWN_SOURCE')
    await assert.rejects(() => op({ operacao: 'criar', valores: { 'Nome do projeto': 'Leitor' } }, { tenantId: 1, sharedUserId: 2, role: 'viewer' }), (e: { code?: string }) => e.code === 'READ_ONLY')
    await assert.rejects(() => op({ operacao: 'listar' }, { tenantId: 2, sharedUserId: 4, role: 'owner' }), 'Another company cannot read the table')
    await assert.rejects(() => op({ operacao: 'criar', valores: { 'Status': 'Inexistente' } }), (e: { code?: string }) => e.code === 'UNKNOWN_REFERENCE')
    await checkSources(s, manifest, tables)
    await assert.rejects(() => checkSources(s, manifestSchema.parse({ formato: 1, entrada: 'index.html', tabelas: [{ chave: 'x', tabela_id: randomUUID(), operacoes: ['ler'] }] }), tables), (e: { code?: string }) => e.code === 'UNKNOWN_SOURCE')

    // Published apps authorize with their runtime token; previews with the edited version (editors only).
    const a = await run(s, db => getApp(db, s, app.id)), p = structuredClone(runtime.pacote); p.manifesto = manifest
    await run(s, db => saveDraft(db, s, app.id, a.versao_concorrencia, { ...p, manifesto: { ...manifest, colecoes: runtime.pacote.manifesto.colecoes } }))
    const draft = (await run(s, db => versions(db, s, app.id)))[0]
    assert.equal((await run(s, db => runtimeManifest(db, s, app.id, { versao: draft.id }))).tabelas.length, 1)
    await assert.rejects(() => run(s, db => runtimeManifest(db, { ...s, sharedUserId: 2, role: 'viewer' }, app.id, { versao: draft.id })))
    assert.equal((await run(s, db => runtimeManifest(db, s, app.id, { token: runtime.token! }))).tabelas.length, 0, 'The published version keeps its own sources')
  })
  await check('Module syntax is refused; text that only mentions import is accepted', async () => {
    const base = await run(s, async db => loadPackage(db, s, app.id, (await versions(db, s, app.id))[0].id))
    const withFile = (caminho: string, conteudo: string) => validatePackage({ ...base, arquivos: [...base.arquivos.filter(f => f.caminho !== caminho), { caminho, codificacao: 'utf8', conteudo }] })
    withFile('extra.js', 'const aviso = "import concluído"; console.log(aviso)')
    assert.throws(() => withFile('extra.js', "import x from 'y'"), /imports/)
    assert.throws(() => withFile('extra.css', "@import url('https://example.invalid/a.css');"), /@import/)
  })
  await check('New draft preserves live package and data; compatibility rejects destructive changes', async () => {
    let a = await run(s, db => getApp(db, s, app.id)); const p = structuredClone(runtime.pacote); p.arquivos[0].conteudo = p.arquivos[0].conteudo.replace('Organize suas ideias', 'Nova versão')
    await run(s, db => saveDraft(db, s, app.id, a.versao_concorrencia, p))
    const opened = await run(s, db => openRuntime(db, s, app.id, false, undefined, store)); assert(!opened.pacote.arquivos[0].conteudo.includes('Nova versão'))
    assert.throws(() => compatible(runtime.pacote.manifesto, manifestSchema.parse({ formato: 1, entrada: 'index.html' })))
    const member = { ...s, sharedUserId: 3, role: 'member' as const }; a = await run(s, db => getApp(db, s, app.id)); const vs = await run(s, db => versions(db, s, app.id))
    await assert.rejects(() => run(member, db => publish(db, member, app.id, a.versao_concorrencia, vs[0].id, randomUUID(), store)))
    await run(s, db => publish(db, s, app.id, a.versao_concorrencia, vs[0].id, randomUUID(), store))
    await assert.rejects(() => run(s, db => dataOperation(db, s, app.id, { token: runtime.token!, colecao: 'itens', operacao: 'listar', pagina: 1 })))
    runtime = await run(s, db => openRuntime(db, s, app.id, false, undefined, store)); const rows = await run(s, db => dataOperation(db, s, app.id, { token: runtime.token!, colecao: 'itens', operacao: 'listar', pagina: 1 })); assert.equal(rows.total, 1)
  })
  await check('Duplication excludes runtime records; archive/trash/recover revoke old sessions', async () => {
    const copy = await run(s, db => duplicate(db, s, app.id)); assert(copy.id !== app.id)
    assert.equal(await count('SELECT count(*)::int n FROM apps.registros WHERE app_id=$1', [copy.id]), 0)
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
  const report = { status: 'passed', checks, migrationDigests: Object.fromEntries(migrations.map(f => [f, createHash('sha256').update(readFileSync(f)).digest('hex')])), generatedAt: new Date().toISOString() }
  mkdirSync('.cache/apps', { recursive: true }); writeFileSync('.cache/apps/smoke.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
 } finally { await db.close() }
}
main().catch(e => { console.error(e); process.exitCode = 1 })
