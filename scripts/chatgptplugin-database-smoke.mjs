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
stubs['@/lib/postgres']={...postgres,runQuery(sql,params){
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
  const saved=context.getErpDatabaseContext();
  const task=queue.then(async()=>{
    assert(saved&&!saved.readOnly,'Apenas a revisao autenticada abre transacao de escrita');
    await db.exec('BEGIN');
    const client={release(){},async query(sql,params){
      postgres.assertErpTenantScopedQuery(sql,params);
      const erp=/\berp\.[a-z_][a-z0-9_]*/i.test(sql);
      if(erp){await db.exec('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(saved.tenantId),String(saved.userId)]);}
      try{return await db.query(sql,params);}finally{if(erp)await db.exec('RESET ROLE');}
    }};
    try{const result=await fn(client);await db.exec('COMMIT');return result;}catch(error){await db.exec('ROLLBACK');throw error;}
  });queue=task.catch(()=>undefined);return task;
}};
stubs['../shared/database']={pluginQuery:async(sql,params)=>(await db.query(sql,params)).rows};
stubs['@clerk/nextjs/server']={clerkClient:()=>{throw new Error('Autenticacao externa proibida no teste');}};
let checks=0;async function check(name,fn){await fn();checks++;console.log(`Passed: ${name}`);}
async function main(){
  await restoreCatalog();
  for(const file of ['01-integridade-historicos.sql','02-periodos-fechados.sql','03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql']) {
    await db.exec(readFileSync(`scripts/erp/sql/${file}`,'utf8'));
  }
  for(const file of ['20260909033000_drop_erp_financial_views.sql','20260909040000_harden_erp_service_integrity.sql']) {
    await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
  }
  await db.exec(readFileSync('supabase/migrations/20261003130000_create_chatgptplugin.sql','utf8'));
  await db.exec(readFileSync('supabase/migrations/20261003140000_chatgptplugin_drafts.sql','utf8'));
  await db.exec(`
    INSERT INTO shared.erp_permission_profiles(id,nome) VALUES('consulta','Consulta');
    INSERT INTO shared.erp_profile_permissions(profile_id,capability) VALUES('consulta','erp.cadastros.visualizar');
    INSERT INTO shared.tenants(id,name,slug) VALUES(1,'Empresa A','a'),(2,'Empresa B','b');
    INSERT INTO shared.users(id,email,full_name,clerk_user_id) VALUES(1,'a@example.invalid','Owner','user_1'),(2,'b@example.invalid','Viewer','user_2');
    INSERT INTO shared.tenant_memberships(tenant_id,user_id,role,status) VALUES(1,1,'owner','active'),(2,1,'owner','active'),(1,2,'viewer','active');
    INSERT INTO erp.entidades(id,tenant_id,nome,eh_cliente,eh_fornecedor) VALUES(101,1,'Cliente A',true,true),(201,2,'Cliente B',true,true);
    INSERT INTO erp.produtos(id,tenant_id,nome,sku,preco_venda,ativo) VALUES(101,1,'Produto A','A',10,true),(201,2,'Produto B','B',20,true);
    INSERT INTO erp.vendas(id,tenant_id,cliente_id,numero,status,subtotal,total) VALUES(101,1,101,'A-1','rascunho',10,10),(201,2,201,'B-1','rascunho',20,20);
    INSERT INTO erp.vendas_itens(tenant_id,venda_id,produto_id,descricao,quantidade,valor_unitario,total) VALUES(1,101,101,'Produto A',1,10,10);
    INSERT INTO erp.locais_estoque(id,tenant_id,nome,codigo) VALUES(1,1,'Local A','A'),(2,2,'Local B','B');
    INSERT INTO erp.saldos_estoque(tenant_id,produto_id,local_estoque_id,quantidade_fisica) VALUES(1,101,1,7),(2,201,2,9);
    INSERT INTO erp.compras(id,tenant_id,fornecedor_id,numero,status,subtotal,total) VALUES(101,1,101,'CA-1','rascunho',10,10),(201,2,201,'CB-1','rascunho',20,20);
    INSERT INTO erp.vendas(id,tenant_id,cliente_id,numero,status,tipo_documento,subtotal,total) VALUES(102,1,101,'OA-1','rascunho','orcamento',10,10),(202,2,201,'OB-1','rascunho','orcamento',20,20);
  `);
  const {loadPluginPrincipal}=load('@/products/chatgptplugin/auth/resolvePrincipal');
  const {executeTool}=load('@/products/chatgptplugin/application/executeTool');
  const audit=load('@/products/chatgptplugin/audit/executionRepository');
  const settings={toolTimeoutMs:15000,resource:'https://erp.example.invalid/api/mcp',metadataUrl:'https://erp.example.invalid/.well-known/oauth-protected-resource/api/mcp'};
  const owner=await loadPluginPrincipal('user_1','client',['erp:read','erp:write']);
  const viewer=await loadPluginPrincipal('user_2','client',['erp:read']);
  async function call(p,name,args){const result=await executeTool(p,name,args,settings);assert(!result.isError,JSON.stringify(result));return result.structuredContent.data;}
  await check('Identidade e perfis carregados do banco',async()=>{assert.equal(owner.companies.length,2);assert.equal(viewer.companies.length,1);assert.deepEqual(viewer.companies[0].capabilities,['erp.cadastros.visualizar']);});
  await check('Todas as consultas usam repositorios reais',async()=>{
    await call(owner,'meu_acesso',{});await call(owner,'resumo_erp',{empresa_id:1});
    for(const tipo of ['clientes','fornecedores','produtos','servicos'])await call(owner,'buscar_cadastros',{empresa_id:1,tipo});
    const vendas=await call(owner,'listar_vendas',{empresa_id:1});assert(vendas.records.some(r=>r.numero==='A-1'));
    const venda=await call(owner,'obter_venda',{empresa_id:1,venda_id:101});assert.equal(venda.items.length,1);assert(!('cliente_documento' in venda.sale));
    await call(owner,'consultar_financeiro',{empresa_id:1,tipo:'pagar'});await call(owner,'consultar_financeiro',{empresa_id:1,tipo:'receber'});
    const estoque=await call(owner,'consultar_estoque',{empresa_id:1});assert.equal(estoque.records.length,1);assert.equal(estoque.records[0].produto,'Produto A');
    const compras=await call(owner,'listar_compras',{empresa_id:1});assert.equal(compras.records[0].numero,'CA-1');
    const compra=await call(owner,'obter_compra',{empresa_id:1,compra_id:101});assert.equal(compra.purchase.numero,'CA-1');assert(!('fornecedor_documento' in compra.purchase));
    const quotes=await call(owner,'listar_orcamentos',{empresa_id:1});assert.equal(quotes.records.length,1);assert.equal(quotes.records[0].numero,'OA-1');
    for(const tipo of ['dre-caixa','posicao-financeira','vendas-clientes','vendas-vendedores','vendas-produtos','compras-fornecedores','compras-categorias','valor-estoque']) {
      const report=await call(owner,'consultar_relatorio',{empresa_id:1,tipo,inicio:'2026-01-01',fim:'2026-10-03'});assert(Array.isArray(report.records));assert.equal(report.report,tipo);
    }
  });
  await check('Dados e IDs nao atravessam empresas',async()=>{
    for(const empresa_id of [1,2]){const data=await call(owner,'buscar_cadastros',{empresa_id,tipo:'produtos'});assert.equal(data.records.length,1);assert.equal(data.records[0].nome,empresa_id===1?'Produto A':'Produto B');}
    assert.equal((await executeTool(owner,'obter_venda',{empresa_id:1,venda_id:201},settings)).isError,true);
    assert.equal((await executeTool(viewer,'listar_vendas',{empresa_id:1},settings)).isError,true);
    assert.equal((await executeTool(viewer,'buscar_cadastros',{empresa_id:2,tipo:'produtos'},settings)).isError,true);
  });
  await check('Alteracao de vinculo revoga acesso',async()=>{
    await db.exec('DELETE FROM shared.tenant_memberships WHERE tenant_id=1 AND user_id=2');
    await assert.rejects(loadPluginPrincipal('user_2','client',['erp:read']));
  });
  await check('Auditoria persiste sem argumentos ou resultados',async()=>{
    const rows=(await db.query("SELECT status,error_code,duration_ms FROM shared.chatgptplugin_executions")).rows;
    assert(rows.some(r=>r.status==='succeeded'));assert(rows.some(r=>r.error_code==='ACCESS_DENIED'));assert(rows.every(r=>r.duration_ms>=0));
  });
  await check('Limite atomico entre chamadas concorrentes',async()=>{
    const outcomes=await Promise.allSettled(Array.from({length:4},()=>audit.consumeRequestLimit(owner,2)));
    assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,2);
    assert.equal((await db.query('SELECT requests FROM shared.chatgptplugin_rate_windows')).rows[0].requests,4);
  });
  await check('Tabelas operacionais nao expostas ao navegador',async()=>{
    for(const role of ['anon','authenticated'])for(const table of ['chatgptplugin_executions','chatgptplugin_drafts']){await db.exec(`BEGIN; SET LOCAL ROLE ${role}`);try{await assert.rejects(db.query(`SELECT * FROM shared.${table}`),e=>e.code==='42501');}finally{await db.exec('ROLLBACK');}}
  });
  const {randomUUID}=require('node:crypto');
  const {decideApproval}=load('@/products/chatgptplugin/approvals/approvalRepository');
  const session={tenantId:1,sharedUserId:1,clerkUserId:'user_1',capabilities:owner.companies[0].capabilities};
  const prepare=async(proposta,key=randomUUID())=>call(owner,'preparar_rascunho',{empresa_id:1,chave_operacao:key,proposta});
  await check('Propostas persistem sem alterar ERP e tentativas sao idempotentes',async()=>{
    const key=randomUUID(),proposta={tipo:'cliente',dados:{nome:'Novo cliente'}};
    const before=(await db.query('SELECT count(*)::int AS n FROM erp.entidades')).rows[0].n;
    const first=await prepare(proposta,key),second=await prepare(proposta,key);assert.equal(first.rascunho_id,second.rascunho_id);assert.equal(first.status,'pending');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM erp.entidades')).rows[0].n,before);
    assert.equal((await executeTool(owner,'preparar_rascunho',{empresa_id:1,chave_operacao:key,proposta:{tipo:'cliente',dados:{nome:'Outro'}}},settings)).isError,true);
    assert.equal((await executeTool({...owner,scopes:['erp:read']},'preparar_rascunho',{empresa_id:1,chave_operacao:randomUUID(),proposta},settings)).isError,true);
    const status=await call(owner,'obter_rascunho',{empresa_id:1,rascunho_id:first.rascunho_id});assert.equal(status.status,'pending');
    const list=await call(owner,'listar_rascunhos',{empresa_id:1});assert.equal(list.records.length,1);
    await assert.rejects(decideApproval(first.rascunho_id,{...session,tenantId:2},'save'));
    await assert.rejects(decideApproval(first.rascunho_id,{...session,sharedUserId:2,clerkUserId:'user_2'},'save'));
    const results=await Promise.all([decideApproval(first.rascunho_id,session,'save'),decideApproval(first.rascunho_id,session,'save')]);
    assert.equal(results[0].registro_id,results[1].registro_id);assert.equal((await db.query('SELECT count(*)::int AS n FROM erp.entidades')).rows[0].n,before+1);
    assert.equal((await call(owner,'obter_rascunho',{empresa_id:1,rascunho_id:first.rascunho_id})).status,'saved');
  });
  await check('Produtos orcamentos e vendas criados pelos repositorios reais',async()=>{
    const proposals=[{tipo:'produto',dados:{nome:'Produto novo',preco:15}},...['orcamento','venda'].map(tipo=>({tipo,dados:{cliente_id:101,data_venda:'2026-10-03',data_vencimento:'2026-10-10',itens:[{tipo:'produto',item_id:101,quantidade:2,valor_unitario:10,desconto:1}]}}))];
    for(const proposta of proposals){const draft=await prepare(proposta);const result=await decideApproval(draft.rascunho_id,session,'save');assert.equal(result.status,'saved');if(proposta.tipo!=='produto'){const sale=(await db.query('SELECT status,tipo_documento,total FROM erp.vendas WHERE tenant_id=$1 AND id=$2',[1,result.registro_id])).rows[0];assert.equal(sale.status,'rascunho');assert.equal(sale.tipo_documento,proposta.tipo);assert.equal(Number(sale.total),19);}}
  });
  await check('Referencias de outra empresa rejeitadas antes da proposta',async()=>{
    const args={empresa_id:1,chave_operacao:randomUUID(),proposta:{tipo:'venda',dados:{cliente_id:201,data_venda:'2026-10-03',data_vencimento:'2026-10-10',itens:[{tipo:'produto',item_id:101,quantidade:1,valor_unitario:10}]}}};
    assert.equal((await executeTool(owner,'preparar_rascunho',args,settings)).isError,true);
    args.proposta.dados.cliente_id=101;args.proposta.dados.itens[0].item_id=201;assert.equal((await executeTool(owner,'preparar_rascunho',args,settings)).isError,true);
    args.proposta.dados.itens[0].item_id=101;args.proposta.dados.itens[0].desconto=100;assert.equal((await executeTool(owner,'preparar_rascunho',args,settings)).isError,true);
  });
  await check('Cancelamento prazo e revogacao bloqueiam salvamento',async()=>{
    const cancelled=await prepare({tipo:'cliente',dados:{nome:'Cancelado'}});await decideApproval(cancelled.rascunho_id,session,'cancel');await assert.rejects(decideApproval(cancelled.rascunho_id,session,'save'));
    const expired=await prepare({tipo:'cliente',dados:{nome:'Expirado'}});await db.query("UPDATE shared.chatgptplugin_drafts SET expires_at=now()-interval '1 second' WHERE id=$1",[expired.rascunho_id]);await assert.rejects(decideApproval(expired.rascunho_id,session,'save'));
    const restricted=await prepare({tipo:'cliente',dados:{nome:'Sem permissao'}});await db.exec("UPDATE shared.tenant_memberships SET role='member',erp_profile_id='consulta' WHERE tenant_id=1 AND user_id=1");await assert.rejects(decideApproval(restricted.rascunho_id,session,'save'));await db.exec("UPDATE shared.tenant_memberships SET role='owner' WHERE tenant_id=1 AND user_id=1");
    const revoked=await prepare({tipo:'cliente',dados:{nome:'Revogado'}});await db.exec("UPDATE shared.tenant_memberships SET status='suspended' WHERE tenant_id=1 AND user_id=1");await assert.rejects(decideApproval(revoked.rascunho_id,session,'save'));await db.exec("UPDATE shared.tenant_memberships SET status='active' WHERE tenant_id=1 AND user_id=1");
  });
  await check('Falha na auditoria desfaz criacao e preserva proposta',async()=>{
    const draft=await prepare({tipo:'produto',dados:{nome:'Rollback',preco:12}});
    await db.exec("CREATE FUNCTION shared.reject_plugin_approval() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tool_name='aprovar_rascunho' THEN RAISE EXCEPTION 'audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_approval BEFORE INSERT ON shared.chatgptplugin_executions FOR EACH ROW EXECUTE FUNCTION shared.reject_plugin_approval()");
    await assert.rejects(decideApproval(draft.rascunho_id,session,'save'));
    assert.equal((await db.query("SELECT count(*)::int AS n FROM erp.produtos WHERE nome='Rollback'")).rows[0].n,0);
    assert.equal((await db.query('SELECT status FROM shared.chatgptplugin_drafts WHERE id=$1',[draft.rascunho_id])).rows[0].status,'pending');
    await db.exec('DROP TRIGGER reject_approval ON shared.chatgptplugin_executions; DROP FUNCTION shared.reject_plugin_approval()');
  });
  console.log(JSON.stringify({status:'passed',checks,realDatabaseAccess:false,localPostgres:true}));
}
try{await main();}catch(error){console.error(error.message);process.exitCode=1;}finally{await db.close();}
