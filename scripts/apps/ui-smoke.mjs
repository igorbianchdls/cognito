import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { build } from 'esbuild'
import { chromium } from 'playwright-core'
import { starter } from '../../src/products/apps/shared/starter.ts'

const out = resolve('.cache/apps/ui'); mkdirSync(out, { recursive: true })
const appId = '10000000-0000-4000-8000-000000000001', versionId = '20000000-0000-4000-8000-000000000001', colId = '30000000-0000-4000-8000-000000000001'
let pkg = starter(colId), published = null
const app = { id: appId, nome: 'Ideias da equipe', descricao: 'Um espaço para organizar as próximas ideias.', cor: '#7259d6', icone: 'clipboard', versao_concorrencia: 1, atualizado_em: new Date().toISOString(), arquivado_em: null, excluido_em: null, favorito: false, publicacao_id: null, versao_publicada_id: null, tem_rascunho: true }
const errors = [], calls = [], checks = []
const mocks = {
 '@clerk/nextjs': "export const useAuth=()=>({userId:'fixture',sessionId:'fixture',orgId:'fixture',getToken:async()=> 'fixture'});",
 'next/navigation': "export const useParams=()=>({path:location.pathname.split('/').filter(Boolean).slice(1)});export const useRouter=()=>({push:p=>location.assign(p)});export const usePathname=()=>location.pathname;",
 '@/components/navigation/SidebarShadcn': "import React from 'react';export function SidebarShadcn(){return <aside style={{width:232,flexShrink:0,padding:'25px 19px',background:'#f7f7f4',borderRight:'1px solid #e8e8e5',font:'13px system-ui'}}><h2 style={{fontSize:28,marginBottom:40}}>otto</h2>{['Visão geral','Vendas','Compras','Financeiro','Estoque','Notas fiscais','Clientes','Fornecedores','Produtos e serviços','Relatórios'].map(s=><p key={s} style={{margin:'21px 0',color:'#777'}}>{s}</p>)}<hr style={{border:'1px solid #e8e8e5',margin:'25px 0'}}/><p>TABLES</p><p>Minhas bases</p><hr style={{border:'1px solid #e8e8e5',margin:'25px 0'}}/><p>APPS</p><p style={{background:'#e8e8e3',padding:10,borderRadius:6}}>Meus apps</p><a href='/apps/novo'>+ Novo app</a></aside>}",
 '@/components/ui/sidebar': "import React from 'react';export const SidebarProvider=({children})=><div style={{display:'flex',height:'100vh'}}>{children}</div>;export const SidebarInset=({children})=><div style={{flex:1,minWidth:0}}>{children}</div>;export const SidebarTrigger=()=>null;",
 'next/link': "import React from 'react';export default function Link(p){return <a {...p}/>}",
}
await build({ stdin: { contents: "import React from 'react';import{createRoot}from'react-dom/client';import AppsPage from '@/products/apps/frontend/AppsPage';createRoot(document.getElementById('root')).render(<AppsPage/>);", resolveDir: process.cwd(), loader: 'tsx' }, outfile: resolve(out, 'bundle.js'), bundle: true, platform: 'browser', jsx: 'automatic', alias: { '@': resolve('src') }, define: { 'process.env.NODE_ENV': '"production"' }, plugins: [{ name: 'fixture-boundaries', setup(b) { b.onResolve({ filter: /.*/ }, args => args.path in mocks ? { path: args.path, namespace: 'mocks' } : null); b.onLoad({ filter: /.*/, namespace: 'mocks' }, args => ({ contents: mocks[args.path], loader: 'jsx', resolveDir: process.cwd() })) } }] })
let server, browser
try {
 server = createServer(async (req, res) => {
  try {
   const url = new URL(req.url, 'http://localhost'), chunks = []; for await (const chunk of req) chunks.push(chunk)
   const body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {}, path = url.pathname.replace('/api/apps', ''), action = path.split('/')[2]
   const json = data => { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(data)) }
   if (url.pathname.startsWith('/api/apps')) {
    calls.push({ method: req.method, path, body })
    if (req.method === 'GET' && !path) { const search = url.searchParams.get('busca')?.toLowerCase() ?? '', match = app.nome.toLowerCase().includes(search); json({ apps: match ? [app] : [], total: match ? 1 : 0, pagina: 1, contadores: { todos: 1, publicados: app.publicacao_id ? 1 : 0, construcao: app.publicacao_id ? 0 : 1, favoritos: app.favorito ? 1 : 0, arquivados: 0, lixeira: 0 }, podeEditar: true }); return }
    if (req.method === 'POST' && !path) { Object.assign(app, body); json({ app }); return }
    if (action === 'favorito') { app.favorito = body.favorito; json({ ok: true }); return }
    if (action === 'conteudo') { json({ pacote: pkg, versaoId: versionId }); return }
    if (action === 'rascunho') { pkg = { manifesto: body.manifesto, arquivos: body.arquivos }; app.versao_concorrencia++; app.tem_rascunho = true; json({ app, versoes: [{ id: versionId, numero: 1, estado: 'rascunho', manifesto: pkg.manifesto, criado_em: new Date().toISOString() }], podeEditar: true, podePublicar: true }); return }
    if (action === 'publicar') { published = structuredClone(pkg); app.publicacao_id = randomUUID(); app.versao_publicada_id = versionId; app.tem_rascunho = false; app.versao_concorrencia++; json({ ok: true }); return }
    if (action === 'runtime') { const preview = url.searchParams.get('modo') === 'previa'; json({ app, pacote: preview ? pkg : published, versaoId: versionId, modo: preview ? 'previa' : 'publicado', token: preview ? null : 'fixture' }); return }
    json({ app, versoes: [{ id: versionId, numero: 1, estado: app.tem_rascunho ? 'rascunho' : 'pronta', manifesto: pkg.manifesto, criado_em: new Date().toISOString() }], podeEditar: true, podePublicar: true }); return
   }
   if (url.pathname === '/bundle.js' || url.pathname === '/bundle.css') { res.writeHead(200, { 'content-type': url.pathname.endsWith('.js') ? 'text/javascript' : 'text/css' }); res.end(readFileSync(resolve(out, url.pathname.slice(1)))); return }
   res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width, initial-scale=1"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}a{color:inherit;text-decoration:none}button{font-family:inherit}h1,h2,p{margin:0}button{border:0;background:none}hr{border:0}button:disabled{opacity:.5}</style><link rel="stylesheet" href="/bundle.css"><div id="root"></div><script src="/bundle.js"></script></html>')
  } catch (e) { errors.push(String(e)); res.writeHead(500); res.end('Fixture failed') }
 })
 await new Promise(done => server.listen(0, '127.0.0.1', done))
 const origin = `http://127.0.0.1:${server.address().port}`, executable = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync); assert(executable)
 browser = await chromium.launch({ executablePath: executable, headless: true, args: ['--disable-gpu', '--no-sandbox'] })
 const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } }); page.on('pageerror', e => { errors.push(e.message); console.log('Browser error:', e.message) }); page.on('console', e => { if (e.type() === 'error') console.log('Browser console:', e.text().slice(0, 700)) })
 await page.goto(origin + '/apps'); await page.getByRole('link', { name: app.nome, exact: true }).waitFor(); await page.screenshot({ path: resolve(out, 'catalogo-desktop.png'), fullPage: true })
 await page.getByRole('button', { name: 'Visualização em lista' }).click(); assert.equal(await page.locator('.apps-list').count(), 1)
 await page.getByRole('button', { name: 'Favoritar ' + app.nome }).click(); await page.getByRole('button', { name: 'Remover ' + app.nome + ' dos favoritos' }).waitFor()
 await page.locator('summary[aria-label="Ações de ' + app.nome + '"]').click(); await page.getByRole('button', { name: 'Arquivar', exact: true }).click(); await page.getByRole('button', { name: 'Confirmar arquivamento' }).waitFor(); assert(!calls.some(c => c.path.endsWith('/arquivar')))
 await page.mouse.click(700, 20); assert.equal(await page.locator('details.apps-menu[open]').count(), 0); checks.push('Archive asks for confirmation and the menu closes on outside click')
 await page.getByRole('textbox', { name: 'Buscar apps' }).fill('nada'); await page.getByText('Nenhum app encontrado').waitFor(); checks.push('Catalog search, empty state, grid/list and favorites')
 await page.goto(origin + '/apps/novo'); await page.getByRole('textbox', { name: 'Nome do app' }).fill('App da equipe'); await page.getByRole('button', { name: 'Criar app', exact: true }).click(); await page.getByRole('textbox', { name: 'Código de index.html' }).waitFor()
 assert(await page.locator('.ce-area pre .ce-tag').count() > 0); await page.getByRole('button', { name: 'app.js', exact: true }).click(); const js = page.getByRole('textbox', { name: 'Código de app.js' }); const original = await js.inputValue()
 await js.fill(original + '\nfunction quebrada( {'); await page.locator('.ce-problem').waitFor(); await js.fill(original); await page.locator('.ce-ok').waitFor(); const layers = await page.locator('.ce-area').evaluate(a => { const p = a.querySelector('pre'), t = a.querySelector('textarea'); t.scrollLeft = 99999; t.dispatchEvent(new Event('scroll')); return [p.scrollWidth, t.scrollWidth, p.scrollLeft, t.scrollLeft, p.scrollHeight, t.scrollHeight] }); assert.equal(layers[2], layers[3]); assert(layers[0] >= layers[1] && layers[4] >= layers[5]); await page.screenshot({ path: resolve(out, 'editor-desktop.png') }); checks.push('Code editor highlights source and reports JavaScript syntax errors')
 await page.getByRole('button', { name: 'index.html', exact: true }).click(); await page.getByRole('textbox', { name: 'Código de index.html' }).fill(pkg.arquivos[0].conteudo.replace('Organize suas ideias', 'Ideias compartilhadas')); await page.getByRole('textbox', { name: 'Código de index.html' }).press('Control+s'); await page.getByText('Rascunho salvo. A versão publicada continua disponível.').waitFor(); checks.push('Create app, edit source and save draft')
 await page.getByRole('link', { name: 'Prévia', exact: true }).click(); const frame = page.frameLocator('iframe[title="App da equipe"]')
 await frame.getByRole('heading', { name: 'Ideias compartilhadas' }).waitFor(); await page.getByText('Conectado', { exact: true }).waitFor()
 await frame.getByPlaceholder('Escreva uma ideia').fill('Ideia temporária'); await frame.getByRole('button', { name: 'Adicionar' }).click(); await frame.getByText('Ideia temporária', { exact: true }).waitFor()
 await frame.getByRole('button', { name: 'Remover' }).click(); await frame.getByText('Ideia temporária', { exact: true }).waitFor({ state: 'detached' })
 assert(!calls.some(c => c.path.endsWith('/dados'))); assert.equal(await frame.locator('body').evaluate(() => { try { return parent.document.body.textContent } catch { return 'isolated' } }), 'isolated')
 const network = await frame.locator('body').evaluate(async () => { try { await fetch('/api/tables'); return 'allowed' } catch { return 'blocked' } }); assert.equal(network, 'blocked')
 await page.screenshot({ path: resolve(out, 'previa-desktop.png'), fullPage: true }); checks.push('Real sandbox frame, SDK handshake, ephemeral data CRUD and blocked host/network access')
 await page.getByRole('link', { name: 'Visão geral', exact: true }).click(); await page.getByRole('button', { name: 'Publicar versão 1' }).click(); await page.getByText('Versão publicada.', { exact: true }).waitFor(); await page.getByRole('link', { name: 'Abrir app', exact: true }).click(); await frame.getByRole('heading', { name: 'Ideias compartilhadas' }).waitFor(); checks.push('Publish saved version and open published package')
 await page.setViewportSize({ width: 390, height: 844 }); await page.goto(origin + '/apps'); await page.addStyleTag({ content: 'aside{display:none!important}' }); await page.getByRole('link', { name: app.nome, exact: true }).waitFor(); await page.screenshot({ path: resolve(out, 'catalogo-mobile.png'), fullPage: true }); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)); checks.push('Mobile catalog has no horizontal overflow')
 assert.deepEqual(errors, []); const report = { status: 'passed', checks, api: 'isolated fixtures', runtime: 'real browser sandbox', generatedAt: new Date().toISOString() }; writeFileSync('.cache/apps/ui.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
} finally { await browser?.close(); if (server) await new Promise(done => server.close(done)) }
