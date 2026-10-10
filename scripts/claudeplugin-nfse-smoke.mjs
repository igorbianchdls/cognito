// NFS-e simulada pelo plugin do Claude, de ponta a ponta: endpoint HTTP do Claude + cliente MCP oficial,
// repositórios reais num PostgreSQL local (PGlite) e cards renderizados com os resultados reais.
// Base local copiada de chatgptplugin-database-smoke.mjs: não lê .env nem acessa banco ou rede externos.
import {applySharedMigration} from './shared/schema-contract.mjs'
import {applyRecentMigrations} from './erp/phase0-migrations.mjs'
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';
import { db, restoreCatalog } from './erp/evolution-fixture.mjs';

// PostgreSQL local: este teste nao le .env nem permite conexoes externas.
const root=resolve('.'); const require=createRequire(import.meta.url); const cache=new Map(); const stubs={};
function load(name,parent=resolve(root,'entry.ts')) {
  if(Object.hasOwn(stubs,name))return stubs[name];
  if(!name.startsWith('.')&&!name.startsWith('@/')&&!name.startsWith(root))return require(name);
  let file=name.startsWith('@/')?resolve(root,'src',name.slice(2)):resolve(dirname(parent),name);
  if(!existsSync(file))file=['.ts','.tsx','/index.ts'].map(s=>file+s).find(existsSync);
  assert(file,`Modulo ausente: ${name}`);if(cache.has(file))return cache.get(file).exports;
  const record={exports:{}};cache.set(file,record);
  const source=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
  vm.runInThisContext('(function(require,module,exports){'+source+'\n})',{filename:file})(dep=>load(dep,file),record,record.exports);
  return record.exports;
}
const postgres=load('@/lib/postgres'); const context=load('@/lib/erpDatabaseContext');let queue=Promise.resolve();
const storageObjects=new Map(),fiscalStorage=load('@/products/erp/server/fiscal/fiscalPdfStorage');
stubs['./fiscalPdfStorage']={...fiscalStorage,uploadFiscalPdf:async(file,bytes)=>{assert.equal(bytes.length,file.tamanho);if(storageObjects.has(file.caminho))assert.deepEqual(storageObjects.get(file.caminho),bytes);else storageObjects.set(file.caminho,Buffer.from(bytes));},readFiscalPdf:async file=>{assert(storageObjects.has(file.caminho));return Buffer.from(storageObjects.get(file.caminho));}};
stubs['@/lib/postgres']={...postgres,runQuery(sql,params){
  const ambient=postgres.getErpTransactionClient();if(ambient)return ambient.query(sql,params).then(r=>r.rows);
  const saved=context.getErpDatabaseContext();
  const task=queue.then(async()=>{
    postgres.assertErpTenantScopedQuery(sql,params);
    assert(saved?.readOnly,'Consulta MCP deve ser somente leitura');
    await db.exec('BEGIN; SET TRANSACTION READ ONLY; SET LOCAL ROLE erp_runtime');
    try {
      await db.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(saved.tenantId),String(saved.userId)]);
      return (await db.query(sql,params)).rows;
    }catch(error){console.error('Local SQL failure:',error.code,error.message);throw error;
    }finally{await db.exec('ROLLBACK');}
  });queue=task.catch(()=>undefined);return task;
},withTransaction(fn){
  const ambient=postgres.getErpTransactionClient();if(ambient)return fn(ambient);
  const saved=context.getErpDatabaseContext();
  const task=queue.then(async()=>{
    assert(saved&&!saved.readOnly,'Apenas a revisao autenticada abre transacao de escrita');
    await db.exec('BEGIN');
    const client={release(){},async query(sql,params){
      postgres.assertErpTenantScopedQuery(sql,params);
      const erp=/\berp\.[a-z_][a-z0-9_]*/i.test(sql);
      if(erp){await db.exec('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(saved.tenantId),String(saved.userId)]);}
      try{return await db.query(sql,params);}catch(error){console.error('Local transaction failure:',error.code,error.message);throw error;}finally{if(erp)await db.exec('RESET ROLE').catch(()=>undefined);}
    }};
    try{const result=await fn(client);await db.exec('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(saved.tenantId),String(saved.userId)]);await db.exec('COMMIT');return result;}catch(error){await db.exec('ROLLBACK');throw error;}
  });queue=task.catch(()=>undefined);return task;
}};
stubs['../shared/database']={pluginQuery:async(sql,params)=>(await db.query(sql,params)).rows};
stubs['@clerk/nextjs/server']={clerkClient:()=>{throw new Error('Autenticacao externa proibida no teste');}};

import { mkdirSync, writeFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:http';
import { chromium } from 'playwright-core';
let checks=0;async function check(name,fn){await fn();checks++;console.log(`Passed: ${name}`);}
const NOTE_TOOLS=['listar_notas_servico','obter_nota_servico','criar_nota_servico','editar_nota_servico','emitir_nota_servico','consultar_nota_servico','cancelar_nota_servico','excluir_nota_servico'];
const OUT='.cache/claudeplugin-nfse';
async function main(){
  await restoreCatalog();
  for(const file of ['01-integridade-historicos.sql','02-periodos-fechados.sql','03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql'])await db.exec(readFileSync(`scripts/erp/sql/${file}`,'utf8'));
  for(const file of ['20260909033000_drop_erp_financial_views.sql','20260909040000_harden_erp_service_integrity.sql','20261003170000_harden_erp_read_access.sql','20261005020000_harden_erp_stock_operations.sql','20261005021000_anchor_contract_cycles.sql',
    '20261003130000_create_chatgptplugin.sql','20261003140000_chatgptplugin_drafts.sql','20261003150000_chatgptplugin_operations_settings.sql','20261003160000_create_plugin_schema.sql'])await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
  await applySharedMigration(db);
  for(const file of ['20261006010000_prepare_erp_fiscal_integration.sql','20261006020000_service_invoice_simulation.sql','20261007120000_empresa_fuso_horario.sql'])await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
  await applyRecentMigrations(db);
  for(const file of ['20261009150000_service_invoice_pdf_layout.sql','20261009150100_service_invoice_pdf_layout_activate.sql','20261010110000_fiscal_pdf_storage_prepare.sql','20261010110100_fiscal_pdf_storage_finalize.sql'])await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
  // Dados fictícios completos para o DPS: prestador, tomador com CNPJ (ISS retido) e serviço com cTribNac.
  await db.exec(`
    INSERT INTO shared.empresas(id,name,slug) VALUES(1,'Empresa A','a'),(2,'Empresa B','b');
    INSERT INTO shared.usuarios(id,email,full_name,clerk_user_id) VALUES(1,'a@example.invalid','Owner','user_1');
    INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role,status) VALUES(1,1,'owner','active'),(2,1,'owner','active');
    INSERT INTO erp.configuracoes_fiscais(empresa_id,cnpj,razao_social,inscricao_municipal,regime_tributario,endereco_codigo_municipio,endereco_municipio,endereco_uf,ambiente,provedor,padrao,serie_dps,aliquota_iss_padrao)
      VALUES(2,'11222333000181','Empresa B Ltda','123456','simples_nacional','2304400','Fortaleza','CE','homologacao','simulador_local',true,'1',5);
    INSERT INTO erp.entidades(id,empresa_id,nome,tipo_pessoa,documento,email,eh_cliente,cidade,uf,logradouro,numero,bairro)
      VALUES(201,2,'Aurora Clínica Integrada','juridica','11444777000161','financeiro@example.invalid',true,'Fortaleza','CE','Rua Demonstrativa 1','100','Centro');
    INSERT INTO erp.servicos(id,empresa_id,nome,codigo,codigo_tributacao_nacional) VALUES(301,2,'Suporte técnico mensal','SRV-001','010701');
    UPDATE erp.entidades_enderecos SET cep='60000629',codigo_municipio='2304400' WHERE empresa_id=2 AND entidade_id=201;
  `);
  process.env.CLERK_SECRET_KEY=process.env.CLERK_SECRET_KEY||'sk_test_local_only';
  const {loadPluginPrincipal}=load('@/products/mcpcore/auth/resolvePrincipal');
  const {handleClaudeRequest}=load('@/products/claudeplugin/mcp/handleRequest');
  const {executionDependencies}=load('@/products/mcpcore/application/executeTool');
  const {renderCardsHtml}=load('@/products/mcpcore/ui/resource');
  const {CLAUDEPLUGIN_VERSION}=load('@/products/claudeplugin/shared/version');
  const settings={integration:'claude',resource:'https://erp.example.invalid/api/claude/mcp',metadataUrl:'https://erp.example.invalid/.well-known/oauth-protected-resource/api/claude/mcp',
    issuer:'https://test.clerk.accounts.dev',scope:'erp:read',clientIds:['*'],origins:['https://erp.example.invalid','https://claude.ai'],toolTimeoutMs:15000,requestsPerMinute:600};
  // Login do Claude substituído por um token local; o usuário e as permissões vêm do banco.
  const principal=await loadPluginPrincipal('user_1','dcr_client_1',['erp:read','erp:write']);
  const deps={config:()=>settings,execution:executionDependencies,limit:async()=>{},
    resolve:async request=>{if(request.headers.get('authorization')!=='Bearer local')throw new Error('Token ausente');return principal}};
  const {Client}=await import('@modelcontextprotocol/sdk/client/index.js');
  const {StreamableHTTPClientTransport}=await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
  const fetchClaude=(input,init)=>handleClaudeRequest(new Request(input instanceof Request?input.url:String(input),{...init,headers:{...Object.fromEntries(new Headers(init?.headers)),authorization:'Bearer local'}}),deps);
  const client=new Client({name:'claude-ai',version:'1.0.0'});
  await client.connect(new StreamableHTTPClientTransport(new URL(settings.resource),{fetch:fetchClaude}));
  const raw={};
  async function tool(name,args,key){const result=await client.callTool({name,arguments:{empresa_id:2,...args}});if(key)raw[key]={name,args:{empresa_id:2,...args},result};
    if(result.isError)throw Object.assign(new Error(name+': '+result.content[0].text),{result});return result.structuredContent.data}
  async function write(name,dados,key){const preview=await tool(name,{chave_operacao:randomUUID(),dados});assert.equal(preview.etapa,'previa',name);assert.equal(preview.status,'pending',name);
    const done=await tool(name,preview.confirmar.argumentos,key);assert.equal(done.status,'saved',JSON.stringify(done));assert(done.registro_id,name);return {preview,done}}
  const note=id=>tool('obter_nota_servico',{nota_id:Number(id)});
  const dados={cliente_id:201,data_competencia:'2026-10-01',codigo_municipio_prestacao:'2304400',itens:[{item_id:301,descricao:'Suporte técnico mensal',quantidade:2,valor_unitario:650}],
    aliquota_iss:5,iss_retido:true,retencoes_federais:{irrf:1.5}};
  let id,draft;
  await check('Cliente MCP oficial conecta ao endpoint do Claude e lista as 8 tools de nota',async()=>{
    assert.equal(client.getServerVersion()?.name,'cognito-claudeplugin');const {tools}=await client.listTools();assert.equal(tools.length,46);
    for(const name of NOTE_TOOLS)assert(tools.some(t=>t.name===name),name);
    for(const t of tools.filter(t=>NOTE_TOOLS.includes(t.name)&&!/^(listar|obter)_/.test(t.name)))assert.equal(t.annotations.destructiveHint,true,t.name);
  });
  await check('criar_nota_servico: prévia com totais do ERP e execução salva o rascunho',async()=>{
    const {preview,done}=await write('criar_nota_servico',dados,'criada');assert.equal(preview.proposta.total,1300);assert.equal(preview.proposta.valor_iss,65);id=Number(done.registro_id);
    const n=await note(id);assert.equal(n.record.status,'rascunho');assert.equal(n.items.length,1);assert.equal(Number(n.totals.valor_iss),65);assert.equal(Number(n.totals.retencao_iss),65);
    assert.match(n.record.pdf_url,/^https:\/\/erp\.example\.invalid\/api\/public\/nfse\/[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);assert(Date.parse(n.links_expiram_em)>Date.now());assert.equal(n.record.xml_url,null);assert.equal(n.dados_editaveis.cliente_id,201);
    assert.equal(Number(n.record.retencoes_federais),19.5);assert.equal(Number(n.record.valor_liquido),1215.5);assert.equal(n.record.local_prestacao,'Fortaleza (2304400)');
  });
  await check('editar_nota_servico: rascunho corrigido com dados_editaveis',async()=>{
    const current=await note(id);await write('editar_nota_servico',{...current.dados_editaveis,registro_id:id,observacoes:'Revisado pelo Claude'});
    const n=await note(id);assert.equal(n.record.observacoes,'Revisado pelo Claude');assert.equal(Number(n.record.versao),2);
  });
  await check('emitir_nota_servico (timeout) e consultar_nota_servico autorizam a nota',async()=>{
    await write('emitir_nota_servico',{registro_id:id,cenario:'timeout'});assert.equal((await note(id)).record.status,'aguardando_retorno');
    await write('consultar_nota_servico',{registro_id:id});const n=await note(id);assert.equal(n.record.status,'emitida');
    assert.match(String(n.record.chave_acesso),/^\d{50}$/);assert(n.record.codigo_verificacao);assert.match(String(n.record.xml_url),/\/api\/public\/nfse\//);
    const byNumber=await tool('obter_nota_servico',{numero:String(n.record.numero)});assert.equal(Number(byNumber.record.id),id);
    await assert.rejects(tool('obter_nota_servico',{numero:'999999'}),/NOT_FOUND/);
    const listed=await tool('listar_notas_servico',{status:'emitida'});assert(listed.records.some(r=>Number(r.id)===id));
  });
  await check('Link temporário abre PDF e XML sem sessão e recusa token adulterado ou expirado',async()=>{
    const {GET}=load('@/products/erp/api/handlers/notas-servico/publicLink'),links=load('@/products/erp/server/fiscal/serviceInvoiceLinks');
    const fetchLink=async url=>{const token=new URL(url).pathname.split('/').pop();return GET(new Request(url),{params:Promise.resolve({token})})};
    const n=await note(id),pdf=await fetchLink(n.record.pdf_url);assert.equal(pdf.status,200);assert.equal(pdf.headers.get('content-type'),'application/pdf');
    assert.equal(Buffer.from(await pdf.arrayBuffer()).subarray(0,5).toString(),'%PDF-');assert.match(pdf.headers.get('cache-control'),/no-store/);
    const xml=await fetchLink(n.record.xml_url);assert.equal(xml.status,200);const xmlText=await xml.text();assert.match(xmlText,/<NFSe/);
    // Endereço do tomador no DPS (código IBGE, CEP e logradouro do endereço principal do cliente).
    const end=(xmlText.match(/<toma>.*?<end>(.*?)<\/end>/s)||[])[1]||'';
    for(const tag of ['<cMun>2304400</cMun>','<CEP>60000629</CEP>','<xLgr>Rua Demonstrativa 1</xLgr>','<nro>100</nro>','<xBairro>Centro</xBairro>'])assert(end.includes(tag),tag);
    const token=new URL(n.record.pdf_url).pathname.split('/').pop(),[payload,sig]=token.split('.');
    const forged=Buffer.from(JSON.stringify({...JSON.parse(Buffer.from(payload,'base64url').toString()),nota:999})).toString('base64url')+'.'+sig;
    assert.equal((await GET(new Request('https://x/api/public/nfse/'+forged),{params:Promise.resolve({token:forged})})).status,404);
    const old=links.createServiceInvoiceLinkToken({empresa:2,usuario:1,nota:id,tipo:'pdf'},Date.now()-16*60*1000).token;
    assert.equal((await GET(new Request('https://x/api/public/nfse/'+old),{params:Promise.resolve({token:old})})).status,404);
    const otherCompany=links.createServiceInvoiceLinkToken({empresa:1,usuario:1,nota:id,tipo:'pdf'}).token;
    assert.equal((await GET(new Request('https://x/api/public/nfse/'+otherCompany),{params:Promise.resolve({token:otherCompany})})).status,404);
  });
  await check('Nota emitida não aceita edição nem segunda emissão',async()=>{
    const current=await note(id);
    await assert.rejects(write('editar_nota_servico',{...current.dados_editaveis,registro_id:id,observacoes:'Mudança proibida'}));
    await assert.rejects(write('emitir_nota_servico',{registro_id:id}));
  });
  await check('cancelar_nota_servico exige motivo e mantém o PDF original',async()=>{
    await assert.rejects(tool('cancelar_nota_servico',{chave_operacao:randomUUID(),dados:{registro_id:id,codigo_motivo:'2',motivo:'curto'}}));
    await write('cancelar_nota_servico',{registro_id:id,codigo_motivo:'2',motivo:'Serviço não foi prestado ao cliente'});assert.equal((await note(id)).record.status,'cancelada');
    const pdfs=(await db.query('SELECT versao,layout_versao FROM erp.notas_fiscais_pdfs WHERE empresa_id=2 AND nota_fiscal_id=$1 ORDER BY versao,layout_versao',[id])).rows;
    assert(pdfs.length>=3,'versões de PDF: '+pdfs.length);mkdirSync(OUT,{recursive:true});
    const files=await context.runWithErpDatabaseContext({tenantId:2,userId:1,readOnly:true},async()=>{
      const repository=load('@/products/erp/server/fiscal/serviceInvoiceRepository');return [await repository.getServiceInvoicePdf(2,id,pdfs[0].versao,pdfs[0].layout_versao),await repository.getServiceInvoicePdf(2,id,pdfs.at(-1).versao,pdfs.at(-1).layout_versao)];});
    writeFileSync(`${OUT}/nota-rascunho.pdf`,files[0].bytes);writeFileSync(`${OUT}/nota-cancelada.pdf`,files[1].bytes);
    assert.equal(files[1].bytes.subarray(0,5).toString(),'%PDF-');
  });
  await check('excluir_nota_servico remove rascunho e a nota some das consultas',async()=>{
    const {done}=await write('criar_nota_servico',{...dados,observacoes:'Rascunho para excluir'});const other=Number(done.registro_id);
    await write('excluir_nota_servico',{registro_id:other,motivo:'Rascunho duplicado'});
    await assert.rejects(note(other),/NOT_FOUND/);assert(!(await tool('listar_notas_servico',{})).records.some(r=>Number(r.id)===other));
  });
  await check('Chamadas auditadas na integração claude',async()=>{
    const rows=(await db.query("SELECT tool_name,status FROM plugin.executions WHERE integration='claude'")).rows;
    for(const name of NOTE_TOOLS)assert(rows.some(r=>r.tool_name===name),name);
  });
  // Cards com os resultados reais, no formato do Claude (inline com no máximo 2 ações).
  const {done:fresh}=await write('criar_nota_servico',{...dados,observacoes:'Rascunho para o card'},'resultado');draft=Number(fresh.registro_id);
  await tool('listar_notas_servico',{},'lista');await tool('obter_nota_servico',{nota_id:draft},'rascunho');
  const encoded=JSON.stringify(renderCardsHtml({name:'claudeplugin-cards',version:CLAUDEPLUGIN_VERSION,host:'claude'})).replaceAll('<','\\u003c');
  const host=toolName=>`<!doctype html><html><body style="margin:0"><iframe id="app" title="ERP" style="width:100%;height:1400px;border:0"></iframe><script>
window.calls=[];window.links=[];window.messages=[];window.modes=[];window.ready=false;const frame=document.getElementById('app');frame.srcdoc=${encoded};
window.deliver=(input,result)=>{frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-input',params:{arguments:input}},'*');frame.contentWindow.postMessage({jsonrpc:'2.0',method:'ui/notifications/tool-result',params:result},'*')};
addEventListener('message',async e=>{if(e.source!==frame.contentWindow)return;const m=e.data;if(m.method==='ui/notifications/initialized'){window.ready=true;return}if(m.id===undefined)return;let result={};
 if(m.method==='ui/initialize')result={protocolVersion:'2026-01-26',hostInfo:{name:'claude-test',version:'1'},hostCapabilities:{},hostContext:{theme:'light',displayMode:'inline',timeZone:'America/Sao_Paulo',safeAreaInsets:{top:0,right:0,bottom:34,left:0},toolInfo:{tool:{name:'${toolName}'}}}};
 if(m.method==='tools/call'){calls.push(m.params);result=await(await fetch('/call',{method:'POST',body:JSON.stringify(m.params)})).json()}
 if(m.method==='ui/request-display-mode'){modes.push(m.params.mode);result={mode:m.params.mode}}
 if(m.method==='ui/open-link')links.push(m.params.url);
 if(m.method==='ui/message')messages.push(Array.isArray(m.params.content)?m.params.content.map(c=>c.text).join(''):'CONTENT_NAO_E_LISTA');
 frame.contentWindow.postMessage({jsonrpc:'2.0',id:m.id,result},'*')});</script></body></html>`;
  let current='';
  const server=createServer(async(req,res)=>{
    if(req.url==='/call'){const chunks=[];for await(const chunk of req)chunks.push(Buffer.from(chunk));const call=JSON.parse(Buffer.concat(chunks).toString());
      res.setHeader('Content-Type','application/json');res.end(JSON.stringify(await client.callTool(call)));return}
    res.setHeader('Content-Type','text/html; charset=utf-8');res.end(current)});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
  const executable=process.env.CHATGPTPLUGIN_TEST_BROWSER||['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync);
  assert(executable,'Navegador necessário para verificar os cards');
  const browser=await chromium.launch({executablePath:executable,headless:true});
  async function open({name,args,result}){current=host(name);const page=await browser.newPage({viewport:{width:900,height:1100}});page.errors=[];page.on('pageerror',e=>page.errors.push(e.message));
    await page.goto(url);await page.waitForFunction(()=>window.ready);await page.evaluate(([a,r])=>window.deliver(a,r),[args,result]);return page}
  const frame=page=>page.frameLocator('#app');const win=page=>page.evaluate(()=>({calls:window.calls,links:window.links,modes:window.modes,messages:window.messages}));
  async function inline(page){const f=frame(page);assert.equal(await f.locator('select').count(),0);assert(await f.locator('.actions button').count()<=2,'no máximo 2 ações')}
  async function done(page,name){assert.deepEqual(page.errors,[],name);await frame(page).locator('main').screenshot({path:`${OUT}/${name}.png`});await page.close()}
  try{
    await check('Card da lista de notas',async()=>{const page=await open(raw.lista),f=frame(page);await f.getByRole('heading',{name:/Notas de serviço/}).waitFor();await inline(page);
      await f.locator('.narrow').getByText('Aurora Clínica Integrada').first().waitFor();await done(page,'nfse-lista')});
    await check('Card do rascunho: Emitir gera prévia, Confirmar emite de verdade',async()=>{const page=await open(raw.rascunho),f=frame(page);await f.locator('.eyebrow',{hasText:'Rascunho de NFS-e'}).waitFor();await f.getByRole('heading',{name:'Aurora Clínica Integrada'}).waitFor();await inline(page);
      assert.equal(await f.locator('.actions button').first().innerText(),'Emitir');await frame(page).locator('main').screenshot({path:`${OUT}/nfse-detalhe-rascunho.png`});
      await f.getByRole('button',{name:'Emitir'}).click();await f.getByText('Prévia — nada foi salvo ainda.').waitFor();await frame(page).locator('main').screenshot({path:`${OUT}/nfse-previa-emitir.png`});assert.equal((await win(page)).calls.at(-1).name,'emitir_nota_servico');
      await f.getByRole('button',{name:'Confirmar',exact:true}).click();await f.getByText('Emissão processada pelo simulador.').waitFor();
      await f.getByRole('button',{name:'Abrir PDF'}).waitFor();assert.equal((await note(draft)).record.status,'emitida');await done(page,'nfse-emitida-pelo-card')});
    await check('Card da nota emitida: Abrir PDF pede ao host para abrir o link',async()=>{await tool('obter_nota_servico',{nota_id:draft},'emitida');const page=await open(raw.emitida),f=frame(page);
      await f.locator('.eyebrow',{hasText:/^NFS-e nº /}).waitFor();await inline(page);await frame(page).locator('main').screenshot({path:`${OUT}/nfse-detalhe-emitida.png`});
      await f.getByRole('button',{name:'Abrir PDF'}).click();await page.waitForFunction(()=>window.links.length===1);
      assert.match((await win(page)).links[0],/^https:\/\/erp\.example\.invalid\/api\/public\/nfse\//);await done(page,'nfse-abrir-pdf')});
    await check('Card da nota emitida: Cancelar nota pede pela conversa no formato do MCP Apps',async()=>{const page=await open(raw.emitida),f=frame(page);
      await f.locator('.eyebrow',{hasText:/^NFS-e nº /}).waitFor();await f.getByRole('button',{name:'Ver detalhes'}).click();await f.getByText('Identificação fiscal').waitFor();await frame(page).locator('main').screenshot({path:`${OUT}/nfse-detalhe-completo.png`});await f.getByRole('button',{name:'Cancelar nota'}).click();
      await page.waitForFunction(()=>window.messages.length===1);const [message]=(await win(page)).messages;assert.match(message,new RegExp('^Quero cancelar a NFS-e nº .*\(ID '+draft+'\)'));await done(page,'nfse-cancelar-pela-conversa')});
    await check('Card de resultado busca a nota atualizada (já emitida: Abrir PDF)',async()=>{const page=await open(raw.resultado),f=frame(page);await f.getByText('Rascunho de NFS-e criado.').waitFor();await f.getByRole('button',{name:'Abrir PDF'}).waitFor();await inline(page);
      await done(page,'nfse-resultado-criar')});
    await check('Prévias de criar e cancelar com resumo e valores',async()=>{
      await tool('criar_nota_servico',{chave_operacao:randomUUID(),dados:{...dados,observacoes:'Prévia para o card'}},'previaCriar');
      let page=await open(raw.previaCriar),f=frame(page);await f.getByText('Prévia — nada foi salvo ainda.').waitFor();await f.getByText('Valor líquido a receber').waitFor();await inline(page);await done(page,'nfse-previa-criar');
      await tool('cancelar_nota_servico',{chave_operacao:randomUUID(),dados:{registro_id:draft,codigo_motivo:'2',motivo:'Serviço não foi prestado ao cliente'}},'previaCancelar');
      page=await open(raw.previaCancelar);f=frame(page);await f.getByText('Serviço não prestado').waitFor();await f.getByRole('button',{name:'Confirmar mesmo assim'}).waitFor();await done(page,'nfse-previa-cancelar')});
  }finally{await browser.close();await new Promise(r=>server.close(()=>r()));await client.close()}
  console.log(JSON.stringify({status:'passed',checks,tools:NOTE_TOOLS.length,artifacts:OUT,realClaude:false,realOAuth:false,localPostgres:true}));
}
main().catch(error=>{console.error(error);process.exitCode=1});
