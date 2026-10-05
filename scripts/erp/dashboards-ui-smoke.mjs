import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,readdirSync,mkdirSync,existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {spawn} from 'node:child_process'
import {createInterface} from 'node:readline'
import {build} from 'esbuild'
import {compile} from '@tailwindcss/node'
import {chromium} from 'playwright-core'

// Isolated headless component test. Production components, CSS, handlers and
// Supabase SQL run unchanged; only Next navigation and Clerk session are local fixtures.
const root=resolve('.'),output=resolve('.cache/dashboards/ui'),checks=[],errors=[]
mkdirSync(output,{recursive:true})
const navigation=`import {useSyncExternalStore,useMemo} from 'react';const subscribe=fn=>{window.addEventListener('popstate',fn);return()=>window.removeEventListener('popstate',fn)};const snapshot=()=>window.location.href;export const useLocation=()=>useSyncExternalStore(subscribe,snapshot,snapshot);export function navigate(href,replace=false){history[replace?'replaceState':'pushState']({},'',href);window.dispatchEvent(new PopStateEvent('popstate'))}export function useSearchParams(){return new URL(useLocation()).searchParams}export function usePathname(){return new URL(useLocation()).pathname}export function useRouter(){return useMemo(()=>({replace:href=>navigate(href,true),push:href=>navigate(href)}),[])}`
const entry=`import React from 'react';import {createRoot} from 'react-dom/client';import {usePathname} from 'next/navigation';import {DashboardRouter} from '@/products/erp/frontend/modules/dashboards/DashboardRouter';import {DashboardRecordsPage} from '@/products/erp/frontend/modules/dashboards/components/DashboardRecordsPage';import {ErpShell} from '@/products/erp/frontend/layout/ErpShell';const realFetch=window.fetch.bind(window);window.fetch=(url,options={})=>realFetch(url,{...options,headers:{...options.headers,'x-local-actor':'owner'}});function App(){const parts=usePathname().split('/'),id=parts[3]||'visao-geral';return <div style={{height:'100vh'}}><ErpShell sectionId='dashboards' moduleId={id} hideSectionTabs>{parts[4]==='registros'?<DashboardRecordsPage id={id}/>:<DashboardRouter id={id}/>}</ErpShell></div>}createRoot(document.getElementById('root')).render(<App/>);`
await build({stdin:{contents:entry,resolveDir:root,loader:'tsx'},outfile:resolve(output,'bundle.js'),bundle:true,platform:'browser',jsx:'automatic',alias:{'@':resolve(root,'src')},define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'local-external-session-and-navigation',setup(b){b.onResolve({filter:/^(next\/(navigation|link)|@clerk\/nextjs)$/},args=>({path:args.path,namespace:'fixture'}));b.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'tsx',resolveDir:root,contents:args.path==='next/navigation'?navigation:args.path==='next/link'?`import React from 'react';import {navigate} from 'next/navigation';export default function Link({href,children,...props}){return <a {...props} href={href} onClick={e=>{if(e.button===0&&!e.metaKey&&!e.ctrlKey){e.preventDefault();navigate(href)}}}>{children}</a>}`:`export function useAuth(){return {orgId:'local_verified_company',userId:'local_verified_owner'}}`}))}}]})
function sourceFiles(path){return readdirSync(path,{withFileTypes:true}).flatMap(e=>e.isDirectory()?sourceFiles(resolve(path,e.name)):/\.(ts|tsx)$/.test(e.name)?[resolve(path,e.name)]:[])}
const text=[...sourceFiles('src/products/erp/frontend/modules/dashboards'),'src/components/ui/button.tsx','src/components/ui/input.tsx','src/products/erp/frontend/layout/ErpShell.tsx'].map(f=>readFileSync(f,'utf8')).join('\n')
const css=await compile(readFileSync('src/app/globals.css','utf8'),{base:resolve('src/app'),onDependency:()=>{}})
writeFileSync(resolve(output,'styles.css'),css.build([...new Set(text.split(/[\s"'`<>={}(),;]+/))]))
writeFileSync(resolve(output,'index.html'),'<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/styles.css"><style>:root{--font-geist-sans:system-ui,sans-serif}body{margin:0}#root{min-width:0}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>')
let browser,child
try{
  child=spawn(process.execPath,['scripts/erp/dashboards-http-smoke.mjs','--serve-ui'],{cwd:root,stdio:['ignore','pipe','pipe'],windowsHide:true})
  const lines=createInterface({input:child.stdout}),base=await new Promise((done,reject)=>{const timeout=setTimeout(()=>reject(new Error('UI fixture startup timed out')),45000);lines.on('line',line=>{try{const data=JSON.parse(line);if(data.uiFixture){clearTimeout(timeout);done(data.uiFixture)}}catch{}});child.once('exit',code=>{clearTimeout(timeout);reject(new Error('UI fixture exited '+code))});child.stderr.on('data',chunk=>errors.push(chunk.toString()))})
  const executable=['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);assert(executable,'No isolated Chromium executable')
  browser=await chromium.launch({executablePath:executable,headless:true,args:['--disable-gpu','--no-first-run']})
  const page=await browser.newPage({viewport:{width:1360,height:900}})
  page.on('pageerror',e=>errors.push(e.message))
  const panels=['visao-geral','financeiro','vendas','compras','estoque','resultados','servicos']
  for(const width of [1360,375]){
    await page.setViewportSize({width,height:900})
    for(const id of panels){
      await page.goto(base+'/erp/dashboards/'+id+'?from=2026-09-01&to=2026-09-30');await page.getByRole('region',{name:'Indicadores'}).waitFor({timeout:30000});assert.equal(await page.getByRole('alert').count(),0)
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth);assert.equal(overflow,false,id+' '+width+' horizontal overflow')
      assert(await page.locator('.recharts-surface').count()>0,id+' chart missing')
      await page.screenshot({path:resolve(output,id+'-'+width+'.png'),fullPage:false});checks.push('render_'+id+'_'+width)
    }
  }
  await page.setViewportSize({width:1360,height:900});await page.goto(base+'/erp/dashboards/vendas?from=2026-09-01&to=2026-09-30');await page.getByRole('region',{name:'Indicadores'}).waitFor();await page.getByRole('link',{name:/Vendas confirmadas/}).click();await page.getByRole('table').waitFor();assert.match(await page.locator('body').innerText(),/87\.123,74/);assert.match(page.url(),/source=vendas.*from=2026-09-01/);await page.getByRole('button',{name:'Próxima',exact:true}).click();await page.getByText('Página 2 de 2').waitFor();checks.push('indicator_navigation_preserves_filters','records_pagination')
  await page.screenshot({path:resolve(output,'registros-1360.png')});await page.setViewportSize({width:375,height:900});await page.screenshot({path:resolve(output,'registros-375.png')});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>window.innerWidth),false);checks.push('records_mobile_horizontal_scroll')
  await page.setViewportSize({width:1360,height:900});await page.goto(base+'/erp/dashboards/vendas?from=2026-09-01&to=2026-09-30');await page.getByRole('region',{name:'Indicadores'}).waitFor();await page.getByLabel('De',{exact:true}).fill('2025-01-01');await page.getByLabel('Até',{exact:true}).fill('2025-01-31');await page.getByRole('button',{name:'Aplicar período'}).click();await page.getByText('Nenhum movimento neste período.').waitFor();assert.match(page.url(),/from=2025-01-01/);checks.push('date_filter_and_empty_state')
  await page.getByRole('button',{name:'Mês anterior',exact:true}).click();await page.getByRole('region',{name:'Indicadores'}).waitFor();await page.getByLabel('Comparar período anterior').uncheck();await page.getByRole('region',{name:'Indicadores'}).waitFor();assert.equal(await page.getByText(/Comparação:/).count(),0);checks.push('comparison_toggle')
  await page.goto(base+'/erp/dashboards/financeiro?from=2026-11-01&to=2026-12-31');await page.getByRole('region',{name:'Indicadores'}).waitFor();await page.getByLabel('Incluir previsões financeiras').check();await page.getByRole('link',{name:/Previsões incluídas/}).waitFor();checks.push('forecast_toggle')
  await page.route('**/api/erp/dashboards/vendas?**',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:{code:'OPERATION_TIMEOUT',message:'Falha temporária do teste'}})}));await page.goto(base+'/erp/dashboards/vendas?from=2026-09-01&to=2026-09-30');await page.getByRole('alert').waitFor();assert.match(await page.getByRole('alert').innerText(),/Falha temporária/);await page.unroute('**/api/erp/dashboards/vendas?**');await page.getByRole('button',{name:'Tentar novamente'}).click();await page.getByRole('region',{name:'Indicadores'}).waitFor();checks.push('api_error_and_retry')
  assert.equal(errors.length,0,errors.join('\n'));writeFileSync('.cache/dashboards/ui-smoke.json',JSON.stringify({status:'passed',scope:'Isolated browser, actual dashboard components/CSS/HTTP/Supabase; Next navigation and Clerk session fixtures.',checks,screenshots:output},null,2));console.log(JSON.stringify({status:'passed',checks:checks.length,screenshots:output}))
}catch(error){console.error(error.message);writeFileSync('.cache/dashboards/ui-smoke.json',JSON.stringify({status:'failed',message:error.message,checks,errors},null,2));process.exitCode=1}
finally{if(browser)await browser.close();if(child)child.kill()}
