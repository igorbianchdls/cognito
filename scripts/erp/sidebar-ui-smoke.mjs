import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'
import { build } from 'esbuild'
import { compile } from '@tailwindcss/node'
import { chromium } from 'playwright-core'

// Actual sidebar, access hook, dashboard and HTTP handlers. Clerk identity,
// Next navigation/image and the unrelated user footer are local fixtures.
const root = resolve('.'), output = resolve('.cache/dashboards/ui'), checks = [], errors = []
mkdirSync(output, { recursive: true })
const navigation = `import {useSyncExternalStore,useMemo} from 'react';const subscribe=fn=>{window.addEventListener('popstate',fn);return()=>window.removeEventListener('popstate',fn)};const snapshot=()=>window.location.href;function useLocation(){return useSyncExternalStore(subscribe,snapshot,snapshot)}export function navigate(href,replace=false){history[replace?'replaceState':'pushState']({},'',href);window.dispatchEvent(new PopStateEvent('popstate'))}export function useSearchParams(){return new URL(useLocation()).searchParams}export function usePathname(){return new URL(useLocation()).pathname}export function useRouter(){return useMemo(()=>({replace:href=>navigate(href,true),push:href=>navigate(href)}),[])}`
const auth = `import {useSyncExternalStore} from 'react';let state={isLoaded:false,isSignedIn:false,userId:null,orgId:null,sessionId:null,actor:'owner'};window.setFixtureAuth=next=>{state={...state,...next};window.dispatchEvent(new Event('fixture-auth'))};window.fixtureTokenRequests=[];const getToken=async options=>{window.fixtureTokenRequests.push(options);return 'local-fixture-session'};const subscribe=fn=>{window.addEventListener('fixture-auth',fn);return()=>window.removeEventListener('fixture-auth',fn)};const snapshot=()=>state;export function useAuth(){return {...useSyncExternalStore(subscribe,snapshot,snapshot),getToken}}export function fixtureActor(){return state.actor}`
const entry = `import React from 'react';import {createRoot} from 'react-dom/client';import {fixtureActor} from '@clerk/nextjs';import {usePathname} from 'next/navigation';import {SidebarShadcn} from '@/components/navigation/SidebarShadcn';import {SidebarProvider,SidebarInset,SidebarTrigger} from '@/components/ui/sidebar';import {DashboardRouter} from '@/products/erp/frontend/modules/dashboards/DashboardRouter';import {ErpShell} from '@/products/erp/frontend/layout/ErpShell';const realFetch=window.fetch.bind(window);window.fetch=(url,options={})=>realFetch(url,{...options,headers:{...options.headers,'x-local-actor':fixtureActor()}});function App(){const parts=usePathname().split('/'),id=parts[2]==='dashboards'?parts[3]||'visao-geral':'visao-geral';return <SidebarProvider><SidebarShadcn/><SidebarInset className='h-screen overflow-hidden'><div className='md:hidden'><SidebarTrigger/></div><ErpShell sectionId='dashboards' moduleId={id} hideSectionTabs><DashboardRouter id={id}/></ErpShell></SidebarInset></SidebarProvider>}createRoot(document.getElementById('root')).render(<App/>);`
await build({ stdin: { contents: entry, resolveDir: root, loader: 'tsx' }, outfile: resolve(output, 'bundle.js'), bundle: true, platform: 'browser', jsx: 'automatic', alias: { '@': resolve(root, 'src') }, define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'local-auth-and-navigation', setup(b) {
  b.onResolve({ filter: /^(next\/(navigation|link|image)|@clerk\/nextjs|@\/components\/nav-user)$/ }, args => ({ path: args.path, namespace: 'fixture' }))
  b.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'tsx', resolveDir: root, contents: args.path === 'next/navigation' ? navigation : args.path === '@clerk/nextjs' ? auth : args.path === '@/components/nav-user' ? `export function NavUser(){return <div className='p-3 text-sm'>Usuário de teste</div>}` : args.path === 'next/image' ? `export default function Image(props){return <img {...props}/>} ` : `import {navigate} from 'next/navigation';export default function Link({href,children,...props}){return <a {...props} href={href} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey){e.preventDefault();navigate(href)}}}>{children}</a>}` }))
} }] })
function sourceFiles(path) { return readdirSync(path, { withFileTypes: true }).flatMap(e => e.isDirectory() ? sourceFiles(resolve(path, e.name)) : /\.(ts|tsx)$/.test(e.name) ? [resolve(path, e.name)] : []) }
const sources = [...sourceFiles('src/products/erp/frontend/modules/dashboards'), ...sourceFiles('src/components/ui'), ...sourceFiles('src/components/navigation'), 'src/products/erp/frontend/layout/ErpShell.tsx']
const text = sources.map(file => readFileSync(file, 'utf8')).join('\n')
const css = await compile(readFileSync('src/app/globals.css', 'utf8'), { base: resolve('src/app'), onDependency: () => {} })
// Preserve parentheses and '=' used by sidebar width and group state classes.
writeFileSync(resolve(output, 'styles.css'), css.build([...new Set([...text.split(/[\s"'`<>{},;]+/), ...(text.match(/[\w-]+-\[[^\]\s]+\]/g) || [])])]))
writeFileSync(resolve(output, 'index.html'), '<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"><style>:root{--font-geist-sans:system-ui,sans-serif}body{margin:0}#root{min-width:0}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>')
let browser, child
try {
  child = spawn(process.execPath, ['scripts/erp/dashboards-http-smoke.mjs', '--serve-ui'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true })
  const lines = createInterface({ input: child.stdout })
  const base = await new Promise((done, reject) => {
    const timeout = setTimeout(() => reject(new Error('Local server startup timed out')), 45000)
    lines.on('line', line => { try { const data = JSON.parse(line); if (data.uiFixture) { clearTimeout(timeout); done(data.uiFixture) } } catch {} })
    child.once('exit', code => { clearTimeout(timeout); reject(new Error('Local server exited ' + code)) })
    child.stderr.on('data', chunk => errors.push(chunk.toString()))
  })
  const executablePath = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
  assert(executablePath, 'No isolated Chromium executable')
  browser = await chromium.launch({ executablePath, headless: true, args: ['--disable-gpu', '--no-first-run'] })
  const page = await browser.newPage({ viewport: { width: 1360, height: 1000 } })
  page.setDefaultTimeout(15000)
  page.on('pageerror', error => errors.push(error.message))
  let accessRequests = 0
  page.on('request', request => { if (new URL(request.url()).pathname === '/api/erp/acesso') accessRequests++ })
  const menu = page.locator('[data-slot="sidebar-content"]')
  const ready = { isLoaded: true, isSignedIn: true, userId: 'local_owner', orgId: 'local_company', sessionId: 'local_session', actor: 'owner' }
  const setAuth = value => page.evaluate(value => window.setFixtureAuth(value), value)
  const waitOwner = () => menu.getByRole('button', { name: 'Financeiro', exact: true }).waitFor()
  const route = '**/api/erp/acesso'
  await page.goto(base + '/erp/dashboards/visao-geral?from=2026-09-01&to=2026-09-30')
  await menu.getByRole('status').waitFor()
  assert.match(await menu.innerText(), /Carregando menu/)
  assert.equal(accessRequests, 0, 'Access must wait for Clerk readiness')
  await setAuth(ready); await waitOwner()
  for (const name of ['Visão geral', 'Vendas', 'Compras', 'Financeiro', 'Estoque', 'Notas fiscais', 'Clientes', 'Fornecedores', 'Produtos e serviços', 'Relatórios']) assert(await menu.getByRole('button', { name, exact: true }).isVisible(), name)
  checks.push('waits_for_session_then_renders_all_owner_navigation')
  await page.getByRole('region', { name: 'Indicadores' }).waitFor()
  assert.equal(await page.locator('[data-dashboard]').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 255, 255)')
  const sidebarBox = await page.locator('[data-slot="sidebar-container"]').boundingBox()
  const dashboardBox = await page.locator('[data-dashboard]').boundingBox()
  assert(sidebarBox && dashboardBox && dashboardBox.x >= sidebarBox.x + sidebarBox.width, 'Sidebar must not cover dashboard content')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  await page.screenshot({ path: resolve(output, 'sidebar-dashboard-white.png') })
  checks.push('white_dashboard_with_actual_sidebar_and_no_horizontal_overflow')
  await menu.getByRole('button', { name: 'Financeiro', exact: true }).click()
  await menu.getByText('Contas a pagar', { exact: true }).waitFor()
  await menu.getByText('Contas a pagar', { exact: true }).click()
  assert.match(page.url(), /\/erp\/financeiro\/contas-a-pagar$/)
  checks.push('financial_submenu_navigation')

  await page.route(route, r => r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { message: 'Falha temporária do teste' } }) }))
  await setAuth({ sessionId: 'session_failure' }); await menu.getByRole('alert').waitFor()
  assert.match(await menu.innerText(), /Falha temporária/)
  assert.equal(await menu.getByRole('button', { name: 'Financeiro', exact: true }).count(), 0)
  await page.unroute(route); await menu.getByRole('button', { name: 'Tentar novamente' }).click(); await waitOwner()
  assert(await page.evaluate(() => window.fixtureTokenRequests.some(request => request.skipCache === true)))
  checks.push('failed_access_is_visible_and_retry_refreshes_session')

  await page.route(route, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await setAuth({ sessionId: 'session_invalid' }); await menu.getByRole('alert').waitFor()
  assert.match(await menu.innerText(), /resposta recebida está incompleta/)
  await page.unroute(route); await menu.getByRole('button', { name: 'Tentar novamente' }).click(); await waitOwner()
  checks.push('malformed_permissions_never_silently_empty_the_menu')

  let release
  const held = new Promise(done => { release = done })
  await page.route(route, async r => { await held; await r.continue() })
  await setAuth({ orgId: 'restricted_company', userId: 'local_reader', actor: 'reader' })
  await menu.getByRole('status').waitFor()
  assert.equal(await menu.getByRole('button', { name: 'Financeiro', exact: true }).count(), 0)
  release(); await menu.getByRole('button', { name: 'Vendas', exact: true }).waitFor(); await page.unroute(route)
  assert.equal(await menu.getByRole('button', { name: 'Financeiro', exact: true }).count(), 0)
  assert.equal(await menu.getByRole('button', { name: 'Clientes', exact: true }).count(), 0)
  checks.push('company_and_user_switch_clears_old_permissions_and_filters_navigation')

  await page.route(route, r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ capabilities: [] }) }))
  await setAuth({ orgId: 'empty_company' }); await menu.getByRole('status').waitFor()
  await menu.getByText(/Seu perfil não possui acesso/).waitFor()
  assert.equal(await menu.getByRole('alert').count(), 0)
  await page.unroute(route)
  checks.push('legitimate_no_access_has_its_own_message')
  await setAuth({ isSignedIn: false }); await menu.getByRole('alert').waitFor()
  assert.match(await menu.innerText(), /Entre novamente/)
  assert.equal(await menu.getByRole('button', { name: 'Vendas', exact: true }).count(), 0)
  checks.push('sign_out_removes_navigation_permissions')

  await setAuth({ ...ready, sessionId: 'session_final' }); await waitOwner()
  await page.getByRole('button', { name: /Pesquisar/ }).click()
  await page.getByPlaceholder('Pesquisar páginas e recursos…').fill('contas a pagar')
  await page.getByRole('dialog').getByRole('button', { name: /Contas a pagar/ }).click()
  assert.match(page.url(), /\/erp\/financeiro\/contas-a-pagar$/)
  checks.push('menu_search_finds_authorized_destination')
  await page.setViewportSize({ width: 375, height: 900 })
  await page.getByRole('button', { name: 'Toggle Sidebar' }).click()
  await menu.getByRole('button', { name: 'Financeiro', exact: true }).waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false)
  checks.push('mobile_sidebar_opens_with_navigation')
  assert.equal(errors.length, 0, errors.join('\n'))
  writeFileSync('.cache/dashboards/sidebar-ui-smoke.json', JSON.stringify({ status: 'passed', scope: 'Actual sidebar/hook/dashboard/CSS/HTTP/Supabase; Clerk session and Next navigation/image/user footer fixtures. No production login or deployment.', checks, screenshot: resolve(output, 'sidebar-dashboard-white.png') }, null, 2))
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }))
} catch (error) {
  console.error(error.message)
  writeFileSync('.cache/dashboards/sidebar-ui-smoke.json', JSON.stringify({ status: 'failed', message: error.message, checks, errors }, null, 2))
  process.exitCode = 1
} finally {
  if (browser) await browser.close()
  if (child) child.kill()
}
