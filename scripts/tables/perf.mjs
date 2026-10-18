// Teste de carga do Tables num banco isolado (PGlite com pg_trgm): 20 mil registros numa tabela,
// com o mesmo código do servidor. Mede listagem, ordenação, filtro, busca e resumo.
// PGlite é mais lento que o Postgres de produção: os limites só pegam regressões grandes.
// Uso: node scripts/tables/perf.mjs [quantidade]
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { PGlite } from '@electric-sql/pglite'
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm'

const require = createRequire(import.meta.url), root = process.cwd(), cache = new Map()
function load(name, parent = resolve(root, 'entry.ts')) {
  if (!name.startsWith('.') && !name.startsWith('@/') && !name.startsWith(root)) return require(name)
  let file = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(parent), name)
  if (!existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map(s => file + s).find(existsSync)
  assert(file, name)
  if (cache.has(file)) return cache.get(file).exports
  const mod = { exports: {} }; cache.set(file, mod)
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(dep => load(dep, file), mod, mod.exports)
  return mod.exports
}
const total = Number(process.argv[2] ?? 20000)
const db = new PGlite({ extensions: { pg_trgm } })
const service = load('@/products/tables/server/service'), queries = load('@/products/tables/server/queries'), repo = load('@/products/tables/server/repository'), contracts = load('@/products/tables/shared/contracts')
const owner = { tenantId: 1, sharedUserId: 1, role: 'owner' }
async function run(fn, write = false) {
  await db.exec(write ? 'BEGIN' : 'BEGIN READ ONLY')
  try {
    await db.query("SELECT set_config('app.tables_empresa_id','1',true),set_config('app.tables_usuario_id','1',true),set_config('app.tables_operacao_id',gen_random_uuid()::text,true),set_config('role','tables_runtime',true)")
    const result = await fn(db); await db.exec('COMMIT'); return result
  } catch (error) { await db.exec('ROLLBACK'); throw error }
}
const timings = {}
async function measure(name, limit, fn) {
  await fn() // warm up plans and caches
  const start = performance.now(); const result = await fn(); const ms = Math.round(performance.now() - start)
  timings[name] = ms; console.log(`${name.padEnd(36)} ${String(ms).padStart(5)} ms (limite ${limit})`)
  assert(ms <= limit, `${name} demorou ${ms} ms`)
  return result
}
try {
  await db.exec(`CREATE ROLE anon; CREATE ROLE authenticated; CREATE SCHEMA shared; CREATE SCHEMA extensions;
    CREATE TABLE shared.empresas(id bigint PRIMARY KEY,status text DEFAULT 'active');
    CREATE TABLE shared.usuarios(id bigint PRIMARY KEY,full_name text,email text,status text DEFAULT 'active');
    CREATE TABLE shared.usuarios_empresas(empresa_id bigint,usuario_id bigint,role text,status text DEFAULT 'active',suspenso_localmente boolean DEFAULT false,PRIMARY KEY(empresa_id,usuario_id));
    INSERT INTO shared.empresas(id) VALUES(1); INSERT INTO shared.usuarios(id,full_name,email) VALUES(1,'Ana','ana@example.invalid'); INSERT INTO shared.usuarios_empresas VALUES(1,1,'owner');`)
  for (const file of ['20261016120000_create_tables.sql', '20261018120000_tables_base_permissions.sql', '20261018150000_tables_search_index.sql', '20261018160000_tables_field_types.sql', '20261018170000_tables_views.sql', '20261018180000_tables_automations.sql', '20261018190000_tables_api_keys.sql', '20261018200000_tables_change_index.sql', '20261019100000_tables_inverse_links.sql']) await db.exec(readFileSync('supabase/migrations/' + file, 'utf8'))
  assert.equal((await db.query("SELECT count(*)::int n FROM pg_indexes WHERE indexname='registros_busca'")).rows[0].n, 1, 'Search index created')
  const { tabela } = await run(d => service.createBase(d, owner, contracts.baseInputSchema.parse({ nome: 'Carga', modelo: 'projetos' })), true)
  const bundle = await run(d => repo.getBundle(d, owner, tabela.id)), f = name => bundle.campos.find(c => c.nome === name)
  const status = f('Status'), name = f('Nome do projeto').id, budget = f('Orçamento').id, client = f('Cliente').id
  // Bulk load straight in SQL, as an import would end up storing it.
  const started = performance.now()
  await db.exec("SELECT set_config('app.tables_usuario_id','1',false),set_config('app.tables_empresa_id','1',false)")
  await db.query(`INSERT INTO tables.registros(empresa_id,base_id,tabela_id,valores,posicao,criado_por,atualizado_por)
    SELECT 1,$1,$2,jsonb_build_object($3::text,'Projeto '||g||' '||(ARRAY['alfa','beta','gama','delta'])[1+g%4],$4::text,((g*37)%100000)::text||'.50',$5::text,'Cliente '||(g%250)),g,1,1 FROM generate_series(1,$6) g`, [tabela.base_id, tabela.id, name, budget, client, total])
  await db.query(`INSERT INTO tables.registro_opcoes(empresa_id,tabela_id,registro_id,campo_id,opcao_id) SELECT 1,$1,r.id,$2,($3::uuid[])[1+(r.posicao::int%4)] FROM tables.registros r WHERE r.tabela_id=$1`, [tabela.id, status.id, status.opcoes.map(o => o.id)])
  await db.exec('ANALYZE')
  console.log(`${total} registros carregados em ${Math.round(performance.now() - started)} ms`)
  const list = input => run(d => queries.listRecords(d, owner, tabela.id, contracts.listQuerySchema.parse(input)))
  const first = await measure('Primeira página (50)', 3000, () => list({}))
  assert.equal(first.total, total)
  await measure('Página 100', 3000, () => list({ pagina: 100 }))
  await measure('Ordenar por orçamento', 4000, () => list({ ordenacao: [{ campo: budget, direcao: 'desc' }] }))
  const filtered = await measure('Filtrar por status', 3000, () => list({ filtros: [{ campo: status.id, operador: 'eq', valor: status.opcoes[1].id }] }))
  assert.equal(filtered.total, total / 4)
  const found = await measure('Busca livre (índice de trigramas)', 1000, () => list({ busca: 'projeto 12345 ' }))
  assert(found.total >= 1)
  await measure('Busca por opção ("Em andamento")', 4000, () => list({ busca: 'em andamento' }))
  const summary = await measure('Resumo por status com soma', 3000, () => run(d => queries.summarizeRecords(d, owner, tabela.id, { busca: '', filtros: [], periodo: 'mes', agrupar_por: status.id, metricas: [{ campo: budget, operacao: 'soma' }] })))
  assert.equal(summary.total, total)
  console.log(JSON.stringify({ status: 'passed', registros: total, timings }))
} finally { await db.close() }
