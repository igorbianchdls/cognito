import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { PGlite } from '@electric-sql/pglite'
import { executeTool, executionDependencies, type ExecutionDependencies } from '../../src/products/mcpcore/application/executeTool'
import { appsTools } from '../../src/products/mcpcore/domains/apps/tools/catalog'
import type { PluginPrincipal } from '../../src/products/mcpcore/shared/contracts'
import type { PluginConfig } from '../../src/products/mcpcore/shared/config'
import type { Database } from '../../src/products/apps/server/database'
import type { TablesTransaction } from '../../src/products/apps/server/tablesSource'
import { createPluginServer } from '../../src/products/mcpcore/hosts/chatgpt/server'
import { createClaudeServer } from '../../src/products/mcpcore/hosts/claude/server'
import { createBase } from '../../src/products/tables/server/service'
import { withAppsClient } from '../../src/products/apps/server/database'
import { openPublic, publicErrors, publicInfo, publicTables, type PublicDependencies } from '../../src/products/apps/server/access'
import { reportRuntimeErrors } from '../../src/products/apps/server/runtime'
import { tablesRequestSchema } from '../../src/products/apps/server/tablesSource'

const db = new PGlite(), checks: string[] = [], called = new Set<string>()
process.env.APPS_RUNTIME_SECRET = 'isolated-runtime-secret-with-at-least-32-characters'
const owner: PluginPrincipal = { userId: 1, clerkUserId: 'user_owner', clientId: 'test-client', scopes: ['erp:read', 'erp:write'], companies: [{ id: 1, name: 'Equipe', profile: 'administrador', capabilities: [] }] }
const member = { ...owner, userId: 3, clerkUserId: 'user_member' }, viewer = { ...owner, userId: 2, clerkUserId: 'user_viewer' }
const config: PluginConfig = { integration: 'chatgpt', resource: 'https://example.invalid/api/mcp', metadataUrl: 'https://example.invalid/.well-known/oauth-protected-resource/api/mcp', issuer: 'https://fixture.clerk.accounts.dev', scope: 'erp:read', clientIds: ['test-client'], origins: [], toolTimeoutMs: 60000, requestsPerMinute: 60 }
// The coordinator transaction is the PGlite transaction; Tables checks run inside it with the Tables role.
const tables: TablesTransaction = async (session, _write, fn) => {
  const previous = (await db.query<{ role: string }>('SELECT current_user AS role')).rows[0].role
  await db.query("SELECT set_config('app.tables_empresa_id',$1,true),set_config('app.tables_usuario_id',$2,true),set_config('app.tables_operacao_id',gen_random_uuid()::text,true),set_config('role','tables_runtime',true)", [String(session.tenantId), String(session.sharedUserId)])
  try { return await fn(db as never) } finally { await db.query("SELECT set_config('role',$1,true)", [previous]) }
}
const deps: ExecutionDependencies = { ...executionDependencies, reserve: async () => randomUUID(), finish: async () => undefined,
  apps: { tables, transaction: async fn => { await db.exec('BEGIN'); try { const r = await fn(db as unknown as Database); await db.exec('COMMIT'); return r } catch (e) { await db.exec('ROLLBACK'); throw e } } } }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function call(name: string, args: object = {}, actor = owner): Promise<Record<string, any>> { called.add('apps_' + name); const result = await executeTool(actor, 'apps_' + name, { empresa_id: 1, ...args }, config, deps); return { ...JSON.parse((result.content[0] as { text: string }).text), isError: result.isError } }
async function ok(name: string, args: object = {}, actor = owner) { const r = await call(name, args, actor); assert(!r.isError, JSON.stringify(r)); return r.data }
const write = (name: string, dados: object, actor = owner, key = randomUUID()) => call(name, { chave_operacao: key, dados }, actor)
async function check(name: string, fn: () => Promise<void>) { await fn(); checks.push(name); console.log('Passed: ' + name) }

async function main() {
  try {
    await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA shared;CREATE SCHEMA plugin;CREATE SCHEMA storage;
     CREATE TABLE storage.buckets(id text PRIMARY KEY,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
     CREATE TABLE shared.empresas(id bigint PRIMARY KEY,status text DEFAULT 'active');
     CREATE TABLE shared.usuarios(id bigint PRIMARY KEY,full_name text,email text,status text DEFAULT 'active',clerk_user_id text);
     CREATE TABLE shared.usuarios_empresas(empresa_id bigint,usuario_id bigint,role text,status text DEFAULT 'active',suspenso_localmente boolean DEFAULT false,PRIMARY KEY(empresa_id,usuario_id));
     INSERT INTO shared.empresas(id) VALUES(1),(2);INSERT INTO shared.usuarios(id,full_name,email,clerk_user_id) VALUES(1,'Ana','ana@example.invalid','user_owner'),(2,'Leitor','leitor@example.invalid','user_viewer'),(3,'Bruno','bruno@example.invalid','user_member');
     INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role) VALUES(1,1,'owner'),(1,2,'viewer'),(1,3,'member');
     CREATE TABLE plugin.drafts(id uuid PRIMARY KEY,empresa_id bigint,user_id bigint,oauth_client_id text,operation_key uuid,proposal jsonb,status text DEFAULT 'pending',record_id text,created_at timestamptz DEFAULT now(),expires_at timestamptz DEFAULT now()+interval '24 hours',decided_at timestamptz,target_snapshot jsonb,integration text,
     CONSTRAINT drafts_integration_operation_key UNIQUE(integration,empresa_id,user_id,oauth_client_id,operation_key),CONSTRAINT legacy_result CHECK((status='saved')=(record_id IS NOT NULL)));
     CREATE TABLE plugin.executions(id uuid PRIMARY KEY,user_id bigint,empresa_id bigint,oauth_client_id text,tool_name text,status text,duration_ms int,finished_at timestamptz,integration text);`)
    for (const file of ['20261016120000_create_tables.sql', '20261018120000_tables_base_permissions.sql', '20261018150000_tables_search_index.sql', '20261018160000_tables_field_types.sql', '20261018170000_tables_views.sql', '20261018180000_tables_automations.sql', '20261018190000_tables_api_keys.sql', '20261018200000_tables_change_index.sql', '20261017100000_apps_product.sql', '20261017150000_apps_files_in_database.sql', '20261017170000_apps_react_build.sql', '20261018100000_apps_public_access.sql', '20261018130000_apps_runtime_errors.sql', '20261018140000_apps_legacy_conversion.sql', '20261018210000_apps_usage.sql', '20261018220000_apps_domains.sql', '20261016193000_mcp_product_domains.sql', '20261016200000_mcp_domain_uniqueness.sql', '20261017190000_mcp_apps_domain.sql']) await db.exec(readFileSync('supabase/migrations/' + file, 'utf8'))
    let appId = '', tableId = ''

    await check('11 tools, both hosts register them', async () => {
      assert.equal(appsTools.length, 11)
      for (const make of [createPluginServer, createClaudeServer]) { const server = await make(owner, config, deps); const registry = (server as unknown as { _registeredTools: Record<string, unknown> })._registeredTools; assert.equal(Object.keys(registry).filter(n => n.startsWith('apps_')).length, 11); await server.close() }
    })
    await check('Create runs at once, is idempotent by key and returns the preview link', async () => {
      const key = randomUUID(), first = await write('criar', { nome: 'Portal de chamados' }, owner, key)
      assert.equal(first.data.status, 'saved'); appId = first.data.resultado.app_id
      assert.equal(first.data.resultado.modelo, 'react'); assert.equal(first.data.resultado.compilacao, 'ok'); assert.match(first.data.resultado.links.previa, /\/apps\/.+\/preview$/)
      assert.deepEqual((await write('criar', { nome: 'Portal de chamados' }, owner, key)).data.resultado, first.data.resultado)
      assert.equal((await write('criar', { nome: 'Outro' }, owner, key)).code, 'IDEMPOTENCY_CONFLICT')
      assert.equal((await ok('obter_operacao', { chave_operacao: key })).status, 'saved')
    })
    await check('Code is written by file and by unique excerpt; folders and imports compile', async () => {
      const r = await write('salvar_codigo', { app_id: appId, arquivos: [
        { caminho: 'src/components/Lista.jsx', conteudo: 'export default function Lista() { return <ul><li>Primeiro chamado</li></ul> }\n' },
        { caminho: 'src/App.jsx', acao: 'editar', buscar: 'export default function App() {', substituir: "import Lista from './components/Lista'\n\nexport default function App() {" },
        { caminho: 'src/App.jsx', acao: 'editar', buscar: '<h1>Olá, mundo!</h1>', substituir: '<h1>Chamados</h1><Lista />' },
      ] })
      assert.equal(r.data.status, 'saved', JSON.stringify(r)); assert.equal(r.data.resultado.compilacao, 'ok'); assert.deepEqual(r.data.resultado.alterados, ['src/components/Lista.jsx', 'src/App.jsx', 'src/App.jsx'])
      assert.match((await ok('obter_codigo', { app_id: appId, caminho: 'src/App.jsx' })).conteudo, /<Lista \/>/)
      assert.equal((await write('salvar_codigo', { app_id: appId, arquivos: [{ caminho: 'src/App.jsx', acao: 'editar', buscar: 'a', substituir: 'b' }] })).code, 'EDIT_NOT_UNIQUE')
      assert.equal((await write('salvar_codigo', { app_id: appId, arquivos: [{ caminho: 'src/Inexistente.jsx', acao: 'editar', buscar: 'a', substituir: 'b' }] })).code, 'NOT_FOUND')
    })
    await check('Build errors come back with file and line; publishing waits for a fix', async () => {
      const broken = await write('salvar_codigo', { app_id: appId, arquivos: [{ caminho: 'src/App.jsx', acao: 'editar', buscar: '<h1>Chamados</h1>', substituir: '<h1>Chamados</h2>' }] })
      assert.equal(broken.data.resultado.compilacao, 'erro'); assert.match(broken.data.resultado.erro_compilacao, /src\/App\.jsx:\d+/); assert(broken.data.resultado.proximo_passo)
      assert.equal((await write('publicar', { app_id: appId })).code, 'BUILD_REQUIRED')
      assert.equal((await ok('obter', { app_id: appId })).versoes[0].compilacao, 'erro')
      assert.equal((await write('salvar_codigo', { app_id: appId, arquivos: [{ caminho: 'src/App.jsx', acao: 'editar', buscar: '<h1>Chamados</h2>', substituir: '<h1>Chamados</h1>' }] })).data.resultado.compilacao, 'ok')
      assert.match((await write('salvar_codigo', { app_id: appId, arquivos: [{ caminho: 'src/main.jsx', acao: 'editar', buscar: "import App from './App'", substituir: "import App from './App'\nimport dayjs from 'dayjs'" }] })).data.resultado.erro_compilacao, /dayjs.*não está disponível/)
      await write('salvar_codigo', { app_id: appId, arquivos: [{ caminho: 'src/main.jsx', acao: 'editar', buscar: "\nimport dayjs from 'dayjs'", substituir: '' }] })
      // Charts and icons come from the library snapshot; the app keeps only what it imports.
      const chart = await write('salvar_codigo', { app_id: appId, arquivos: [{ caminho: 'src/components/Grafico.jsx', conteudo: "import { LineChart, Line, XAxis } from 'recharts'\nimport { Check } from 'lucide-react'\nimport clsx from 'clsx'\nexport default function Grafico() { return <div className={clsx('g', { on: true })}><Check size={14} /><LineChart width={300} height={120} data={[{ x: 1, y: 2 }]}><XAxis dataKey='x' /><Line dataKey='y' /></LineChart></div> }" }, { caminho: 'src/App.jsx', acao: 'editar', buscar: "import Lista from './components/Lista'", substituir: "import Lista from './components/Lista'\nimport Grafico from './components/Grafico'" }] })
      assert.equal(chart.data.resultado.compilacao, 'ok', JSON.stringify(chart.data.resultado.erro_compilacao))
      const size = (await db.query<{ n: number }>("SELECT octet_length(c.conteudo)::int n FROM apps.versoes v JOIN apps.conteudos c ON c.empresa_id=v.empresa_id AND c.hash=v.build_js WHERE v.app_id=$1 ORDER BY v.numero DESC LIMIT 1", [appId])).rows[0].n
      assert(size < 600_000, 'Unused library modules are dropped: ' + size)
    })
    await check('Manifest declares Tables sources and collections; unknown tables are refused', async () => {
      await deps.apps!.transaction(async () => { const created = await tables({ tenantId: 1, sharedUserId: 1, role: 'owner' }, true, d => createBase(d as never, { tenantId: 1, sharedUserId: 1, role: 'owner' }, { nome: 'Suporte', descricao: '', cor: '#2563eb', modelo: 'vazia' })) as unknown as { tabela: { id: string } }; tableId = created.tabela.id })
      const r = await write('salvar_codigo', { app_id: appId, manifesto: { tabelas: [{ chave: 'chamados', tabela_id: tableId, operacoes: ['ler', 'criar'] }], colecoes: [{ chave: 'preferencias', nome: 'Preferências', campos: [{ id: 'tema', nome: 'Tema', tipo: 'texto' }] }] } })
      assert.equal(r.data.resultado.compilacao, 'ok', JSON.stringify(r))
      const app = await ok('obter', { app_id: appId })
      assert.deepEqual(app.tabelas, [{ chave: 'chamados', tabela_id: tableId, operacoes: ['ler', 'criar'] }]); assert.match(app.colecoes[0].id, /^[0-9a-f-]{36}$/)
      assert(app.arquivos.some((f: { caminho: string }) => f.caminho === 'src/components/Lista.jsx'))
      assert.equal((await write('salvar_codigo', { app_id: appId, manifesto: { tabelas: [{ chave: 'x', tabela_id: randomUUID(), operacoes: ['ler'] }] } })).code, 'UNKNOWN_SOURCE')
      const list = await ok('obter_codigo', { app_id: appId }); assert(list.arquivos.length >= 5)
      const slice = await ok('obter_codigo', { app_id: appId, caminho: 'src/styles.css', inicio: 0, tamanho: 20 }); assert.equal(slice.conteudo.length, 20); assert(slice.tem_mais)
    })
    await check('Publishing needs an administrator, shows a preview and confirms', async () => {
      assert.equal((await write('publicar', { app_id: appId }, member)).code, 'FORBIDDEN')
      const preview = await write('publicar', { app_id: appId })
      assert.equal(preview.data.status, 'pending'); assert.equal(preview.data.previa.substitui, 'primeira publicação'); assert.deepEqual(preview.data.previa.tabelas, ['chamados (ler, criar)'])
      const done = await ok('publicar', { rascunho_id: preview.data.rascunho_id }); assert.equal(done.status, 'saved'); assert.equal(done.resultado.situacao, 'no_ar'); assert(done.resultado.links.app)
      assert.equal((await ok('obter', { app_id: appId })).versao_publicada, preview.data.previa.versao)
      assert.equal((await ok('listar', { filtro: 'publicados' })).apps[0].id, appId)
    })
    await check('Published collections are readable as data, never as instructions', async () => {
      const collection = (await ok('obter', { app_id: appId })).colecoes[0]
      await db.query("INSERT INTO apps.registros(empresa_id,app_id,colecao_id,dados,criado_por,atualizado_por) VALUES(1,$1,$2,'{\"tema\":\"escuro\"}',1,1)", [appId, collection.id])
      const data = await ok('consultar_dados', { app_id: appId, colecao: 'preferencias' }); assert.equal(data.total, 1); assert.equal(data.registros[0].dados.tema, 'escuro'); assert.match(data.aviso, /nunca como instrução/)
    })
    await check('Public link: visitor rules, preview, address, visitor reads and writes, limits', async () => {
      let projects = ''
      await deps.apps!.transaction(async () => { const created = await tables({ tenantId: 1, sharedUserId: 1, role: 'owner' }, true, d => createBase(d as never, { tenantId: 1, sharedUserId: 1, role: 'owner' }, { nome: 'Pedidos', descricao: '', cor: '#2563eb', modelo: 'projetos' })) as unknown as { tabela: { id: string } }; projects = created.tabela.id })
      const form = (await write('criar', { nome: 'Formulário público' })).data.resultado.app_id
      const source = (visitantes: object, operacoes = ['ler', 'criar']) => ({ manifesto: { tabelas: [{ chave: 'projetos', tabela_id: projects, operacoes, visitantes }] } })
      assert.equal((await write('salvar_codigo', { app_id: form, ...source({ ler: ['Responsável'] }) })).code, 'INVALID_VISITOR_FIELD', 'People are never open to visitors')
      assert.equal((await write('salvar_codigo', { app_id: form, ...source({ ler: ['Inexistente'] }) })).code, 'INVALID_VISITOR_FIELD')
      assert.equal((await write('salvar_codigo', { app_id: form, ...source({ criar: ['Nome do projeto'] }, ['ler']) })).code, 'INVALID_INPUT', 'Visitors cannot create where the app cannot')
      assert.equal((await write('salvar_codigo', { app_id: form, ...source({ ler: ['Nome do projeto', 'Status'], criar: ['Nome do projeto', 'Prioridade'] }) })).data.resultado.compilacao, 'ok')
      await ok('publicar', { rascunho_id: (await write('publicar', { app_id: form })).data.rascunho_id })
      assert.equal((await write('acesso', { app_id: form, modo: 'publico' }, member)).code, 'FORBIDDEN')
      assert.equal((await write('acesso', { app_id: form, modo: 'privado' })).code, 'INVALID_STATE')
      const preview = await write('acesso', { app_id: form, modo: 'publico' })
      assert.equal(preview.data.status, 'pending'); assert.equal(preview.data.previa.endereco, '/p/formulario-publico')
      assert.deepEqual(preview.data.previa.visitantes, ['ver em projetos: Nome do projeto, Status', 'criar em projetos: Nome do projeto, Prioridade'])
      const done = await ok('acesso', { rascunho_id: preview.data.rascunho_id }); assert.equal(done.resultado.links.publico, 'https://example.invalid/p/formulario-publico')
      const summary = (await ok('obter', { app_id: form })).acesso; assert.equal(summary.modo, 'publico'); assert.equal(summary.link, 'https://example.invalid/p/formulario-publico')
      assert.equal((await write('acesso', { app_id: appId, modo: 'publico', endereco: 'formulario-publico' })).code, 'ADDRESS_TAKEN', 'Addresses are unique')

      // Visitors: no login, only what visitantes allows, with the administrator's permissions.
      const control: PublicDependencies['control'] = fn => deps.apps!.transaction(fn)
      const pub: PublicDependencies = { control, apps: (s, _w, fn) => deps.apps!.transaction(d => withAppsClient(d, s, fn)), tables: (s, w, fn) => deps.apps!.transaction(() => tables(s, w, fn)) }
      const page = await openPublic('formulario-publico', 'visitante-a', pub); assert.equal(page.modo, 'publico'); assert(page.token)
      const visit = (input: object, origin = 'visitante-a') => publicTables('formulario-publico', page.token, tablesRequestSchema.parse({ fonte: 'projetos', ...input }), origin, pub)
      const code = async (p: Promise<unknown>) => { try { await p; return 'ok' } catch (e) { return (e as { code?: string }).code } }
      const created = await visit({ operacao: 'criar', valores: { 'Nome do projeto': 'Site novo', Prioridade: 'Alta' } }) as { registro: { valores: Record<string, unknown> } }
      assert.deepEqual(Object.keys(created.registro.valores).sort(), ['Nome do projeto', 'Status'], 'Visitors only see the fields of ler')
      assert.equal(await code(visit({ operacao: 'criar', valores: { 'Nome do projeto': 'X', Cliente: 'ACME' } })), 'FIELD_NOT_PUBLIC')
      const listed = await visit({ operacao: 'listar' }) as { registros: { valores: Record<string, unknown> }[] }
      assert(listed.registros.length && listed.registros.every(r => Object.keys(r.valores).every(k => ['Nome do projeto', 'Status'].includes(k))))
      assert.equal(await code(visit({ operacao: 'listar', filtros: [{ campo: 'Orçamento', operador: 'gt', valor: 1 }] })), 'FIELD_NOT_PUBLIC')
      assert.equal(await code(visit({ operacao: 'listar', busca: 'Site' })), 'INVALID_DATA', 'Free search would look into hidden fields')
      assert.equal(await code(visit({ operacao: 'editar', id: randomUUID(), valores: { 'Nome do projeto': 'Y' } })), 'SOURCE_FORBIDDEN')
      assert.deepEqual(((await visit({ operacao: 'campos' })) as { campos: { nome: string }[] }).campos.map(c => c.nome), ['Nome do projeto', 'Prioridade', 'Status'].sort((a, b) => ['Nome do projeto', 'Status', 'Prioridade'].indexOf(a) - ['Nome do projeto', 'Status', 'Prioridade'].indexOf(b)))
      const grouped = await visit({ operacao: 'resumir', agrupar_por: 'Status' })
      assert(!/[0-9a-f]{8}-[0-9a-f]{4}-/.test(JSON.stringify(grouped)), 'Public summaries carry names, not internal IDs: ' + JSON.stringify(grouped))
      assert.equal((await publicInfo('formulario-publico', pub))?.nome, 'Formulário público'); assert.equal(await publicInfo('nao-existe', pub), null)
      assert.equal(await code(publicTables('outro-endereco', page.token, tablesRequestSchema.parse({ fonte: 'projetos', operacao: 'campos' }), 'visitante-a', pub)), 'RUNTIME_EXPIRED')
      let limitedAt = 0
      for (let i = 1; i <= 12 && !limitedAt; i++) if (await code(visit({ operacao: 'criar', valores: { 'Nome do projeto': 'Envio ' + i } }, 'visitante-b')) === 'RATE_LIMITED') limitedAt = i
      assert.equal(limitedAt, 11, 'Ten new records per visitor in ten minutes')
      await publicErrors('formulario-publico', page.token, [{ mensagem: 'Erro do visitante', origem: '', pilha: '' }], 'visitante-c', pub)
      assert.equal((await ok('obter', { app_id: form })).erros_execucao[0].modo, 'publico')

      // Own domain: Vercel is replaced by a fake that accepts the domain.
      process.env.APPS_VERCEL_TOKEN = 'fixture'; process.env.APPS_VERCEL_PROJECT_ID = 'prj_fixture'
      const realFetch = globalThis.fetch, vercel: string[] = []
      globalThis.fetch = (async (url: string | URL, init?: RequestInit) => { vercel.push((init?.method ?? 'GET') + ' ' + String(url)); return new Response(JSON.stringify({ verified: false, verification: [] }), { status: 200 }) }) as typeof fetch
      try {
        assert.equal((await write('acesso', { app_id: form, dominio: 'formulario.vercel.app' })).code, 'INVALID_DOMAIN', 'Platform hosts are not own domains')
        const domainPreview = await write('acesso', { app_id: form, dominio: 'Apps.Exemplo.com.br' })
        assert.equal(domainPreview.data.previa.endereco, 'https://apps.exemplo.com.br'); assert.deepEqual(domainPreview.data.previa.dns, ['CNAME apps → cname.vercel-dns.com'])
        const linked = await ok('acesso', { rascunho_id: domainPreview.data.rascunho_id })
        assert.equal(linked.resultado.links.publico, 'https://apps.exemplo.com.br'); assert(vercel.some(v => v.startsWith('POST https://api.vercel.com/v10/projects/prj_fixture/domains')))
        const { slugForHost } = await import('../../src/products/apps/server/domains')
        assert.equal(await slugForHost('apps.exemplo.com.br', async d => (await db.query<{ slug: string | null }>('SELECT apps.endereco_do_dominio($1) slug', [d])).rows[0].slug), 'formulario-publico')
        assert.equal(await slugForHost('cognito-seven.vercel.app', async () => 'x'), null, 'The platform host never routes to an app')
        const unlink = await write('acesso', { app_id: form, dominio: null }); await ok('acesso', { rascunho_id: unlink.data.rascunho_id })
        assert(vercel.some(v => v.startsWith('DELETE ')))
      } finally { globalThis.fetch = realFetch }
      const usage = (await ok('obter', { app_id: form })).uso
      assert(usage.aberturas_link_publico >= 1 && usage.registros_criados_por_visitantes >= 1, 'Public use is counted: ' + JSON.stringify(usage))
      const off = await write('acesso', { app_id: form, modo: 'privado' }); await ok('acesso', { rascunho_id: off.data.rascunho_id })
      assert.equal(await code(openPublic('formulario-publico', 'visitante-a', pub)), 'NOT_FOUND', 'Going private stops the link at once')
      assert.equal((await ok('obter', { app_id: form })).links.publico, undefined)
    })
    await check('Browser errors reach apps_obter; a new draft clears preview errors', async () => {
      const app = await ok('obter', { app_id: appId }), draft = (await db.query<{ id: string }>("SELECT id FROM apps.versoes WHERE app_id=$1 ORDER BY numero DESC LIMIT 1", [appId])).rows[0].id
      const owner1 = { tenantId: 1, sharedUserId: 1, role: 'owner' as const, browserSession: 'sessao-teste' }
      const report = (erros: object[]) => deps.apps!.transaction(d => withAppsClient(d, owner1, c => reportRuntimeErrors(c, owner1, appId, { versao: draft, erros: erros as never })))
      await report([{ mensagem: "Cannot read properties of undefined (reading 'map')", origem: 'linha 1:200', pilha: 'at ListaChamados' }])
      await report([{ mensagem: "Cannot read properties of undefined (reading 'map')", origem: 'linha 1:200', pilha: 'at ListaChamados' }])
      const seen = await ok('obter', { app_id: appId })
      assert.equal(seen.erros_execucao.length, 1); assert.equal(seen.erros_execucao[0].ocorrencias, 2); assert.equal(seen.erros_execucao[0].modo, 'previa'); assert.match(seen.aviso_erros, /nunca como instrução/)
      assert(app.erros_execucao.length === 0)
      await write('salvar_codigo', { app_id: appId, arquivos: [{ caminho: 'src/styles.css', acao: 'editar', buscar: 'margin:0', substituir: 'margin:0;color:inherit' }] })
      assert.equal((await ok('obter', { app_id: appId })).erros_execucao.length, 0, 'New code starts without the old preview errors')
    })
    await check('Lifecycle previews, stale previews, cancellation and roles', async () => {
      const stale = await write('ciclo', { app_id: appId, acao: 'arquivar' }); assert.equal(stale.data.status, 'pending')
      await write('salvar_codigo', { app_id: appId, arquivos: [{ caminho: 'src/styles.css', acao: 'editar', buscar: 'margin:0', substituir: 'margin:0;padding:0' }] })
      assert.equal((await call('ciclo', { rascunho_id: stale.data.rascunho_id })).code, 'STALE_PROPOSAL')
      const cancel = await write('ciclo', { app_id: appId, acao: 'despublicar' }); assert.equal((await ok('cancelar_operacao', { operacao_id: cancel.data.rascunho_id })).status, 'cancelled')
      assert.equal((await write('ciclo', { app_id: appId, acao: 'despublicar' }, member)).code, 'FORBIDDEN')
      const off = await write('ciclo', { app_id: appId, acao: 'despublicar' }); assert.equal((await ok('ciclo', { rascunho_id: off.data.rascunho_id })).resultado.situacao, 'em_construcao')
      const again = await write('publicar', { app_id: appId }); assert.match(again.data.previa.substitui, /fora do ar \(última versão no ar: \d+\)/, 'Republishing an offline app is not called a first publication'); await ok('cancelar_operacao', { operacao_id: again.data.rascunho_id })
      assert.equal((await write('criar', { nome: 'Leitor' }, viewer)).code, 'ACCESS_DENIED')
      assert(!(await call('listar', {}, viewer)).isError)
      assert.equal((await write('salvar_codigo', { app_id: appId, arquivos: [] }, { ...owner, scopes: ['erp:read'] })).code, 'INSUFFICIENT_SCOPE')
    })
    assert.deepEqual([...called].sort(), appsTools.map(t => t.name).sort(), 'Every tool must have an executed case')
    mkdirSync('.cache/apps', { recursive: true }); const report = { status: 'passed', checks, tools: appsTools.length, productionWrites: false }
    writeFileSync('.cache/apps/mcp-smoke.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
  } finally { await db.close() }
}
main().catch(error => { console.error(error); process.exitCode = 1 })
