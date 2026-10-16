import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import vm from 'node:vm'
import ts from 'typescript'
import { PGlite } from '@electric-sql/pglite'
import { build } from 'esbuild'
import { compile } from '@tailwindcss/node'
import { chromium } from 'playwright-core'

const root = process.cwd(), output = resolve('.cache/tables/ui'), require = createRequire(import.meta.url), modules = new Map(), checks = [], errors = []
mkdirSync(output, { recursive: true })
const db = new PGlite()
let tail = Promise.resolve()
class LocalPool {
  async connect() { const previous = tail; let unlock; tail = new Promise(r => { unlock = r }); await previous; return { query: (sql, params) => db.query(sql, params), release: () => unlock() } }
}
const actor = { tenantId: 1, sharedUserId: 1, role: 'owner', tenantName: 'Equipe de demonstração', fullName: 'Ana Silva', email: 'ana@example.invalid' }
function load(name, parent = resolve(root, 'entry.ts')) {
  if (name === 'pg') return { Pool: LocalPool }
  if (name === '@/lib/postgres') return { buildPostgresPoolConfig: () => ({}) }
  if (name === '@/products/auth/server/authTenantResolver') return { resolveAuthTenant: async () => actor }
  if (!name.startsWith('.') && !name.startsWith('@/') && !name.startsWith(root)) return require(name)
  let file = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(parent), name)
  if (!existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map(s => file + s).find(existsSync)
  assert(file, name); if (modules.has(file)) return modules.get(file).exports
  const module = { exports: {} }; modules.set(file, module)
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename: file })(dep => load(dep, file), module, module.exports)
  return module.exports
}

const navigation = `import {useMemo,useSyncExternalStore} from 'react';const subscribe=f=>{window.addEventListener('popstate',f);return()=>window.removeEventListener('popstate',f)};const snapshot=()=>location.href;export const useLocation=()=>useSyncExternalStore(subscribe,snapshot,snapshot);export function navigate(url,replace=false){history[replace?'replaceState':'pushState']({},'',url);window.dispatchEvent(new PopStateEvent('popstate'))}export function useRouter(){return useMemo(()=>({push:navigate,replace:u=>navigate(u,true)}),[])}export function usePathname(){return new URL(useLocation()).pathname}export function useParams(){const url=new URL(useLocation());return {path:url.pathname.split('/').filter(Boolean).slice(1)}}export function useSearchParams(){return new URL(useLocation()).searchParams}`
const clerk = `const getToken=async()=> 'isolated_fixture_token';export function useAuth(){return {isLoaded:true,isSignedIn:true,userId:'local_owner',orgId:'local_org',sessionId:'local_session',getToken}}`
const entry = `import React from 'react';import{createRoot}from'react-dom/client';import TablesPage from '@/products/tables/frontend/TablesPage';createRoot(document.getElementById('root')).render(<TablesPage/>);`
console.log('Preparing isolated browser bundle…')
await build({ stdin: { contents: entry, resolveDir: root, loader: 'tsx' }, outfile: resolve(output, 'bundle.js'), bundle: true, platform: 'browser', jsx: 'automatic', alias: { '@': resolve(root, 'src') }, define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'isolated-navigation-and-identity', setup(b) {
  b.onResolve({ filter: /^(next\/(navigation|link|image)|@clerk\/nextjs)$/ }, args => ({ path: args.path, namespace: 'fixture' }))
  b.onResolve({ filter: /products\/auth\/frontend\/components\/AuthUserMenu$/ }, () => ({ path: 'user-menu', namespace: 'fixture' }))
  b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'tsx', resolveDir: root, contents: args.path === 'next/navigation' ? navigation : args.path === '@clerk/nextjs' ? clerk : args.path === 'user-menu' ? `export function AuthUserMenu(){return <div style={{padding:12,fontSize:12}}>Ana Silva</div>}` : args.path === 'next/image' ? `export default function Image(props){return <img {...props}/>} ` : `import{navigate}from'next/navigation';export default function Link({href,children,...p}){return <a href={href} {...p} onClick={e=>{e.preventDefault();navigate(href)}}>{children}</a>}` }))
} }] })
function files(path) { return readdirSync(path, { withFileTypes: true }).flatMap(f => f.isDirectory() ? files(resolve(path, f.name)) : /\.tsx?$/.test(f.name) ? [resolve(path, f.name)] : []) }
const text = [...files('src/products/tables/frontend'), ...files('src/components/ui'), 'src/components/navigation/SidebarShadcn.tsx', 'src/components/navigation/nav-main-simple.tsx'].map(f => readFileSync(f, 'utf8')).join('\n')
const css = await compile(readFileSync('src/app/globals.css', 'utf8'), { base: resolve('src/app'), onDependency: () => {} })
writeFileSync(resolve(output, 'styles.css'), css.build([...new Set([...text.split(/[\s"'`<>={},;]+/), ...(text.match(/[\w-]+-\[[^\]\s]+\]/g) || [])])]))
writeFileSync(resolve(output, 'index.html'), '<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/bundle.css"><style>:root{--font-geist-sans:system-ui,sans-serif}body{margin:0}#root{height:100vh}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>')
let server, browser
try {
  await db.exec(`CREATE ROLE anon;CREATE ROLE authenticated;CREATE SCHEMA shared;
    CREATE TABLE shared.empresas(id bigint PRIMARY KEY,status text DEFAULT 'active');
    CREATE TABLE shared.usuarios(id bigint PRIMARY KEY,full_name text,email text,status text DEFAULT 'active');
    CREATE TABLE shared.usuarios_empresas(empresa_id bigint,usuario_id bigint,role text,status text DEFAULT 'active',suspenso_localmente boolean DEFAULT false,PRIMARY KEY(empresa_id,usuario_id));
    INSERT INTO shared.empresas(id)VALUES(1);INSERT INTO shared.usuarios(id,full_name,email)VALUES(1,'Ana Silva','ana@example.invalid'),(2,'Pedro Martins','pedro@example.invalid');
    INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role)VALUES(1,1,'owner'),(1,2,'member');`)
  await db.exec(readFileSync('supabase/migrations/20261016120000_create_tables.sql', 'utf8'))
  process.env.SUPABASE_DB_URL = 'postgresql://fixture:fixture@127.0.0.1/isolated_only'
  const { tablesHandler } = load('@/products/tables/api/handlers')
  server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${req.headers.host}`)
      if (url.pathname.startsWith('/api/tables')) {
        const chunks = []; for await (const chunk of req) chunks.push(chunk)
        const body = Buffer.concat(chunks)
        const request = new Request(url, { method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body } : {}) })
        const result = await tablesHandler(request, { params: Promise.resolve({ path: url.pathname.split('/').filter(Boolean).slice(2) }) })
        res.writeHead(result.status, Object.fromEntries(result.headers)); res.end(Buffer.from(await result.arrayBuffer())); return
      }
      if (url.pathname === '/api/erp/acesso') { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ capabilities: ['erp.relatorios.visualizar', 'erp.vendas.visualizar', 'erp.compras.visualizar', 'erp.financeiro.visualizar', 'erp.estoque.visualizar', 'erp.cadastros.visualizar'] })); return }
      if (url.pathname === '/logoOttoIcon.svg') { res.writeHead(200, { 'content-type': 'image/svg+xml' }); res.end(readFileSync('public/logoOttoIcon.svg')); return }
      const filename = ['/bundle.js', '/bundle.css', '/styles.css'].includes(url.pathname) ? url.pathname.slice(1) : 'index.html'
      res.writeHead(200, { 'content-type': filename.endsWith('.js') ? 'application/javascript' : filename.endsWith('.css') ? 'text/css' : 'text/html' }); res.end(readFileSync(resolve(output, filename)))
    } catch (error) { errors.push(String(error)); res.writeHead(500); res.end('Fixture error') }
  })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  const base = `http://127.0.0.1:${server.address().port}`
  const executable = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
  assert(executable)
  browser = await chromium.launch({ executablePath: executable, headless: true, args: ['--disable-gpu', '--no-first-run'] })
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  page.setDefaultTimeout(20000)
  page.on('pageerror', error => errors.push(error.message))
  const dialog = () => page.getByRole('dialog')
  const save = async () => { await dialog().getByRole('button', { name: 'Salvar', exact: true }).click(); await dialog().waitFor({ state: 'hidden' }) }
  const check = (name) => { checks.push(name); console.log('Passed: ' + name) }
  await page.goto(base + '/tables')
  await page.getByRole('button', { name: 'Criar minha primeira base' }).click()
  await dialog().getByLabel('Nome', { exact: true }).fill('Gestão de projetos')
  await save()
  await page.getByRole('tab', { name: 'Grade', exact: true }).waitFor()
  assert((await page.locator('[data-slot="sidebar-gap"]').boundingBox()).width >= 200, 'Sidebar spacer must use the production Tailwind variable-width utility')
  check('create_project_base_from_empty_state')
  await page.getByRole('button', { name: 'Novo registro', exact: true }).first().click()
  await dialog().getByLabel('Nome do projeto').fill('Redesign do site')
  await dialog().getByLabel('Status', { exact: true }).selectOption({ label: 'Em andamento' })
  await dialog().getByLabel('Responsável', { exact: true }).selectOption('1')
  await dialog().getByLabel('Prazo', { exact: true }).fill('2026-10-23')
  await dialog().getByLabel('Orçamento', { exact: true }).fill('18500')
  await save()
  await page.getByRole('button', { name: 'Nome do projeto: Redesign do site', exact: true }).waitFor()
  check('create_record_with_typed_values_and_relations')
  await page.getByRole('button', { name: 'Novo registro', exact: true }).first().click()
  await dialog().getByLabel('Nome do projeto').fill('Portal do cliente')
  await dialog().getByLabel('Status', { exact: true }).selectOption({ label: 'A fazer' })
  await dialog().getByLabel('Orçamento', { exact: true }).fill('12000.50')
  await save()
  await page.getByText('R$ 30.500,50', { exact: true }).waitFor()
  await page.screenshot({ path: resolve(output, 'tables-grade-desktop.png') })
  check('grid_displays_exact_aggregate')
  await page.getByRole('button', { name: 'Nome do projeto: Redesign do site', exact: true }).click()
  await page.locator('.tables-cell-editor').getByLabel('Nome do projeto').fill('Redesign aprovado')
  await page.getByRole('button', { name: 'Salvar célula' }).click()
  await page.getByRole('button', { name: 'Nome do projeto: Redesign aprovado', exact: true }).waitFor()
  check('inline_edit_persists')
  await page.getByRole('button', { name: 'Abrir Redesign aprovado' }).click()
  await dialog().getByLabel('Novo comentário').fill('Pronto para revisão.')
  await dialog().getByRole('button', { name: 'Comentar', exact: true }).click()
  await dialog().getByText('Pronto para revisão.', { exact: true }).waitFor()
  await dialog().getByRole('button', { name: 'Close', exact: true }).click()
  check('record_details_comments_and_history')
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click()
  await dialog().getByRole('button', { name: 'Adicionar condição' }).click()
  await dialog().getByLabel('Campo do filtro 1').selectOption({ label: 'Nome do projeto' })
  await dialog().getByLabel('Operador do filtro 1').selectOption('contains')
  await dialog().getByLabel('Nome do projeto', { exact: true }).fill('Redesign')
  await save()
  await page.getByText('1 registros', { exact: true }).first().waitFor()
  assert.equal(await page.getByRole('button', { name: 'Nome do projeto: Portal do cliente', exact: true }).count(), 0)
  check('saved_view_filter_changes_rows_and_totals')
  await page.getByRole('tab', { name: 'Kanban', exact: true }).click()
  await page.locator('.tables-kanban-column').first().waitFor()
  await page.getByRole('button', { name: 'Portal do cliente', exact: false }).waitFor()
  await page.screenshot({ path: resolve(output, 'tables-kanban-desktop.png') })
  check('kanban_uses_same_records_with_own_view_config')
  await page.getByRole('tab', { name: 'Calendário', exact: true }).click()
  await page.locator('.tables-calendar-grid').waitFor()
  await page.screenshot({ path: resolve(output, 'tables-calendario-desktop.png') })
  check('calendar_renders_saved_date_view')
  await page.getByRole('tab', { name: 'Grade', exact: true }).click()
  await page.getByRole('button', { name: 'Adicionar campo', exact: true }).click()
  await dialog().getByLabel('Nome', { exact: true }).fill('Aprovado')
  await dialog().getByLabel('Tipo', { exact: true }).selectOption('checkbox')
  await save()
  await page.getByRole('button', { name: 'Editar campo Aprovado', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Aprovado: vazio', exact: true }).click()
  await page.getByRole('button', { name: 'Aprovado: true', exact: true }).waitFor()
  check('add_field_and_toggle_boolean_cell')
  await page.getByRole('button', { name: 'Editar campo Aprovado', exact: true }).click()
  await dialog().getByRole('button', { name: 'Excluir campo', exact: true }).click()
  await dialog().waitFor({ state: 'hidden' })
  await page.getByRole('button', { name: 'Abrir lixeira' }).click()
  await dialog().getByText('Aprovado', { exact: true }).waitFor()
  await dialog().getByRole('button', { name: 'Restaurar', exact: true }).click()
  await dialog().getByText('A lixeira está vazia.', { exact: true }).waitFor()
  await dialog().getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Aprovado: true', exact: true }).waitFor()
  check('restore_deleted_field_preserves_cell_value')
  await page.getByLabel('Selecionar registro 1', { exact: true }).check()
  await page.getByRole('button', { name: 'Mover para lixeira', exact: true }).click()
  await page.getByText('0 registros', { exact: true }).first().waitFor()
  await page.getByRole('button', { name: 'Abrir lixeira' }).click()
  await dialog().getByText('Redesign aprovado', { exact: true }).waitFor()
  await dialog().getByRole('button', { name: 'Restaurar', exact: true }).click()
  await dialog().getByText('A lixeira está vazia.', { exact: true }).waitFor()
  await dialog().getByRole('button', { name: 'Close', exact: true }).click()
  await page.getByRole('button', { name: 'Nome do projeto: Redesign aprovado', exact: true }).waitFor()
  check('bulk_delete_and_restore')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: resolve(output, 'tables-grade-mobile.png') })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), false)
  check('mobile_page_has_no_document_overflow')
  assert.equal(errors.length, 0, errors.join('\n'))
  writeFileSync(resolve(output, 'report.json'), JSON.stringify({ status: 'passed', checks, scope: 'Real product UI, HTTP handlers and SQL. Isolated PostgreSQL and fixture identity/navigation. No production writes.' }, null, 2))
  console.log(JSON.stringify({ status: 'passed', checks: checks.length, screenshots: output }))
} catch (error) {
  console.error(error.stack ?? error.message)
  writeFileSync(resolve(output, 'report.json'), JSON.stringify({ status: 'failed', checks, error: error.message, errors }, null, 2))
  if (browser) { const pages = browser.contexts().flatMap(c => c.pages()); if (pages[0]) await pages[0].screenshot({ path: resolve(output, 'failure.png') }).catch(() => {}) }
  process.exitCode = 1
} finally { if (browser) await browser.close(); if (server) await new Promise(done => server.close(done)); await db.close() }
