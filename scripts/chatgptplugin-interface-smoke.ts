import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync,mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright-core'
import { renderPanelHtml } from '../src/products/chatgptplugin/extensions/panel'
import { approvalRequest } from '../src/products/chatgptplugin/approvals/http'
import type { ErpAccessContext } from '../src/products/erp/server/erpAccess'

async function main() {
  const resource='https://erp.example.invalid/api/mcp',id='d0000000-0000-4000-8000-000000000001'
  const session:ErpAccessContext={tenantId:1,sharedUserId:1,clerkUserId:'user_1',email:'test@example.invalid',tenantName:'Empresa A',role:'owner',authMode:'clerk',erpProfile:'administrador',capabilities:['erp.cadastros.gerenciar']}
  let decisions=0
  const deps={session:async()=>session,config:()=>({resource} as ReturnType<typeof import('../src/products/chatgptplugin/shared/config').getPluginConfig>),load:async()=>({}) as ReturnType<typeof import('../src/products/chatgptplugin/approvals/approvalRepository').loadApproval>,decide:async()=>{decisions++;return {status:'saved',registro_id:'1'}}}
  const post=(origin:string,body:unknown={decision:'save'})=>new Request(resource,{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)})
  assert.equal((await approvalRequest(post('https://attacker.invalid'),id,deps)).status,403)
  assert.equal((await approvalRequest(post('https://erp.example.invalid'),id,{...deps,session:async()=>null})).status,401)
  assert.equal((await approvalRequest(post('https://erp.example.invalid',{decision:'save',proposal:{nome:'Injected'}}),id,deps)).status,400)
  assert.equal((await approvalRequest(post('https://erp.example.invalid',{decision:'save',junk:'x'.repeat(2000)}),id,deps)).status,413)
  assert.equal(decisions,0)
  assert.equal((await approvalRequest(post('https://erp.example.invalid'),id,deps)).status,200);assert.equal(decisions,1)
  const executable=process.env.CHATGPTPLUGIN_TEST_BROWSER || ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
  if(!executable)throw new Error('Navegador local ausente; verificacao visual nao executada.')
  const html=renderPanelHtml(resource)
  const encoded=JSON.stringify(html).replaceAll('<','\\u003c')
  const host=`<!doctype html><html><body style="margin:0"><iframe title="ERP" id="app" style="width:100%;height:900px;border:0"></iframe><script>
    window.calls=[];window.opened=[];const frame=document.getElementById('app');frame.srcdoc=${encoded};
    addEventListener('message',e=>{if(e.source!==frame.contentWindow)return;const m=e.data;if(m.id===undefined)return;let result={};if(m.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'test',version:'1'},hostCapabilities:{},hostContext:{theme:'light'}};
    if(m.method==='tools/call'){calls.push(m.params);let data={};if(m.params.name==='meu_acesso')data={empresas:[{id:1,name:'Empresa A'},{id:2,name:'Empresa B'}]};else if(m.params.name==='listar_rascunhos')data={records:[{proposta:{tipo:'cliente',dados:{nome:'Novo cliente'}},status:'pending',revisao_url:'https://erp.example.invalid/chatgptplugin/approvals/${id}'}],hasMore:false};else data={records:[{id:'1',nome:'<img src=x onerror="window.hacked=true">',status:'ativo'}],total:45};result={structuredContent:{ok:true,data}};}
    if(m.method==='ui/open-link'){opened.push(m.params.url);result={};}frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result},'*');});</script></body></html>`
  const server=createServer((_req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(host)})
  await new Promise<void>(r=>server.listen(0,'127.0.0.1',r))
  const port=(server.address() as {port:number}).port
  const browser=await chromium.launch({executablePath:executable,headless:true})
  try {
    const page=await browser.newPage({viewport:{width:1100,height:950}})
    await page.goto(`http://127.0.0.1:${port}`)
    const frame=page.frameLocator('#app')
    await frame.getByText('Escolha a empresa para consultar.').waitFor()
    await frame.getByLabel('Empresa',{exact:true}).selectOption('2')
    await frame.getByText('45 registros',{exact:true}).waitFor()
    assert.equal(await frame.locator('#content img').count(),0)
    await frame.getByRole('button',{name:'Próxima',exact:true}).click()
    await frame.getByText('Página 2',{exact:true}).waitFor()
    await frame.getByRole('button',{name:'Meus rascunhos',exact:true}).click()
    await frame.getByText('Aguardando revisão',{exact:true}).waitFor()
    await frame.getByRole('button',{name:'Abrir revisão no ERP',exact:true}).click()
    await page.waitForFunction(()=>((window as unknown as {opened:string[]}).opened.length===1))
    const calls=await page.evaluate(()=>(window as unknown as {calls:{name:string;arguments:{empresa_id?:number;pagina?:number}}[]}).calls)
    assert(calls.filter(c=>!['meu_acesso','ler_configuracoes'].includes(c.name)).every(c=>c.arguments.empresa_id===2))
    assert(calls.some(c=>c.arguments.pagina===2));assert(!calls.some(c=>c.name.includes('aprovar')))
    mkdirSync('.cache',{recursive:true});await page.screenshot({path:resolve('.cache/chatgptplugin-panel.png'),fullPage:true})
    console.log(JSON.stringify({status:'passed',approvalHttp:true,panelBridge:true,xssBlocked:true,pagination:true,companySelection:true,humanReviewLink:true,realChatGPT:false}))
  } finally {await browser.close();await new Promise<void>((r,j)=>server.close(error=>error?j(error):r()))}
}
void main().catch(error=>{console.error(error.message);process.exitCode=1})
