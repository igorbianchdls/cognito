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
let checks=0;async function check(name,fn){await fn();checks++;console.log(`Passed: ${name}`);}
async function main(){
  await restoreCatalog();
  for(const file of ['01-integridade-historicos.sql','02-periodos-fechados.sql','03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql']) {
    await db.exec(readFileSync(`scripts/erp/sql/${file}`,'utf8'));
  }
  for(const file of ['20260909033000_drop_erp_financial_views.sql','20260909040000_harden_erp_service_integrity.sql','20261003170000_harden_erp_read_access.sql','20261005020000_harden_erp_stock_operations.sql','20261005021000_anchor_contract_cycles.sql']) {
    await db.exec(readFileSync(`supabase/migrations/${file}`,'utf8'));
  }
  await db.exec(readFileSync('supabase/migrations/20261003130000_create_chatgptplugin.sql','utf8'));
  await db.exec(readFileSync('supabase/migrations/20261003140000_chatgptplugin_drafts.sql','utf8'));
  await db.exec(readFileSync('supabase/migrations/20261003150000_chatgptplugin_operations_settings.sql','utf8'));
  await db.exec(readFileSync('supabase/migrations/20261003160000_create_plugin_schema.sql','utf8'));
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
    INSERT INTO erp.locais_estoque(id,tenant_id,nome,codigo,padrao) VALUES(1,1,'Local A','A',true),(2,2,'Local B','B',true);
    INSERT INTO erp.saldos_estoque(tenant_id,produto_id,local_estoque_id,quantidade_fisica) VALUES(1,101,1,7),(2,201,2,9);
    INSERT INTO erp.movimentacoes_estoque(tenant_id,produto_id,local_estoque_id,tipo,origem_tipo,quantidade,custo_unitario,saldo_apos,custo_medio_apos,chave_idempotencia) VALUES(1,101,1,'entrada','manual',7,0,7,0,'fixture-opening-1'),(2,201,2,'entrada','manual',9,0,9,0,'fixture-opening-2');
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
    const rows=(await db.query("SELECT status,error_code,duration_ms FROM plugin.executions")).rows;
    assert(rows.some(r=>r.status==='succeeded'));assert(rows.some(r=>r.error_code==='ACCESS_DENIED'));assert(rows.every(r=>r.duration_ms>=0));
  });
  await check('Limite atomico entre chamadas concorrentes',async()=>{
    const outcomes=await Promise.allSettled(Array.from({length:4},()=>audit.consumeRequestLimit(owner,2)));
    assert.equal(outcomes.filter(x=>x.status==='fulfilled').length,2);
    assert.equal((await db.query('SELECT requests FROM plugin.rate_windows')).rows[0].requests,4);
  });
  await check('Tabelas operacionais nao expostas ao navegador',async()=>{
    for(const role of ['anon','authenticated'])for(const table of ['executions','rate_windows','drafts','settings']){await db.exec(`BEGIN; SET LOCAL ROLE ${role}`);try{await assert.rejects(db.query(`SELECT * FROM plugin.${table}`),e=>e.code==='42501');}finally{await db.exec('ROLLBACK');}}
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
    const expired=await prepare({tipo:'cliente',dados:{nome:'Expirado'}});await db.query("UPDATE plugin.drafts SET expires_at=now()-interval '1 second' WHERE id=$1",[expired.rascunho_id]);await assert.rejects(decideApproval(expired.rascunho_id,session,'save'));
    const restricted=await prepare({tipo:'cliente',dados:{nome:'Sem permissao'}});await db.exec("UPDATE shared.tenant_memberships SET role='member',erp_profile_id='consulta' WHERE tenant_id=1 AND user_id=1");await assert.rejects(decideApproval(restricted.rascunho_id,session,'save'));await db.exec("UPDATE shared.tenant_memberships SET role='owner' WHERE tenant_id=1 AND user_id=1");
    const revoked=await prepare({tipo:'cliente',dados:{nome:'Revogado'}});await db.exec("UPDATE shared.tenant_memberships SET status='suspended' WHERE tenant_id=1 AND user_id=1");await assert.rejects(decideApproval(revoked.rascunho_id,session,'save'));await db.exec("UPDATE shared.tenant_memberships SET status='active' WHERE tenant_id=1 AND user_id=1");
  });
  await check('Falha na auditoria desfaz criacao e preserva proposta',async()=>{
    const draft=await prepare({tipo:'produto',dados:{nome:'Rollback',preco:12}});
    await db.exec("CREATE FUNCTION shared.reject_plugin_approval() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.tool_name='aprovar_rascunho' THEN RAISE EXCEPTION 'audit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER reject_approval BEFORE INSERT ON plugin.executions FOR EACH ROW EXECUTE FUNCTION shared.reject_plugin_approval()");
    await assert.rejects(decideApproval(draft.rascunho_id,session,'save'));
    assert.equal((await db.query("SELECT count(*)::int AS n FROM erp.produtos WHERE nome='Rollback'")).rows[0].n,0);
    assert.equal((await db.query('SELECT status FROM plugin.drafts WHERE id=$1',[draft.rascunho_id])).rows[0].status,'pending');
    const edit=await prepare({tipo:'editar_produto',dados:{registro_id:101,preco:999}});
    await assert.rejects(decideApproval(edit.rascunho_id,session,'save'));
    assert.equal(Number((await db.query('SELECT preco_venda FROM erp.produtos WHERE id=101')).rows[0].preco_venda),10);
    assert.equal((await db.query('SELECT status FROM plugin.drafts WHERE id=$1',[edit.rascunho_id])).rows[0].status,'pending');
    await db.exec('DROP TRIGGER reject_approval ON plugin.executions; DROP FUNCTION shared.reject_plugin_approval()');
  });
  await check('Edicao preserva campos e rejeita proposta desatualizada',async()=>{
    const draft=await prepare({tipo:'editar_produto',dados:{registro_id:101,preco:12}});
    assert.equal(draft.alvo.registro_id,101);assert(!('hash' in draft.alvo));
    await decideApproval(draft.rascunho_id,session,'save');
    const row=(await db.query('SELECT nome,sku,preco_venda,versao FROM erp.produtos WHERE tenant_id=1 AND id=101')).rows[0];
    assert.equal(row.nome,'Produto A');assert.equal(row.sku,'A');assert.equal(Number(row.preco_venda),12);
    const stale=await prepare({tipo:'editar_produto',dados:{registro_id:101,nome:'Desatualizado'}});
    await db.exec('UPDATE erp.produtos SET versao=versao+1 WHERE tenant_id=1 AND id=101');
    await assert.rejects(decideApproval(stale.rascunho_id,session,'save'),e=>e.code==='STALE_PROPOSAL');
    assert.equal((await db.query('SELECT nome FROM erp.produtos WHERE id=101')).rows[0].nome,'Produto A');
    const customer=await prepare({tipo:'editar_cliente',dados:{registro_id:101,nome:'Cliente revisado'}});
    await decideApproval(customer.rascunho_id,session,'save');
    assert.equal((await db.query('SELECT nome FROM erp.entidades WHERE id=101')).rows[0].nome,'Cliente revisado');
    assert.equal((await executeTool(owner,'preparar_rascunho',{empresa_id:1,chave_operacao:randomUUID(),proposta:{tipo:'editar_produto',dados:{registro_id:201,nome:'Outra empresa'}}},settings)).isError,true);
  });
  let saleId;
  await check('Confirmacao e atendimento usam a transacao auditada do ERP',async()=>{
    const sale=await prepare({tipo:'venda',dados:{cliente_id:101,data_venda:'2026-10-03',data_vencimento:'2026-10-10',itens:[{tipo:'produto',item_id:101,quantidade:1,valor_unitario:12}]}});
    saleId=Number((await decideApproval(sale.rascunho_id,session,'save')).registro_id);
    const confirmation=await prepare({tipo:'confirmar_venda',dados:{registro_id:saleId}});
    const results=await Promise.all([decideApproval(confirmation.rascunho_id,session,'save'),decideApproval(confirmation.rascunho_id,session,'save')]);assert.equal(results[0].registro_id,results[1].registro_id);
    assert.equal((await db.query('SELECT status FROM erp.vendas WHERE id=$1',[saleId])).rows[0].status,'confirmada');
    assert.equal((await db.query('SELECT count(*)::int AS n FROM erp.contas_receber WHERE venda_id=$1',[saleId])).rows[0].n,1);
    const attendance=await prepare({tipo:'atender_venda',dados:{registro_id:saleId}});
    await decideApproval(attendance.rascunho_id,session,'save');
    assert.equal((await db.query('SELECT atendimento_status FROM erp.vendas WHERE id=$1',[saleId])).rows[0].atendimento_status,'atendido');
    const financial=await call(owner,'consultar_financeiro',{empresa_id:1,tipo:'receber'});assert(financial.records.length>0);
  });
  await check('Recebimento estorno pagamento e cancelamento com repositorios reais',async()=>{
    await db.exec("INSERT INTO erp.contas_financeiras(id,tenant_id,nome,tipo) VALUES(901,1,'Caixa A','caixa'),(902,2,'Caixa B','caixa')");
    const installment=(await db.query('SELECT p.id FROM erp.contas_receber_parcelas p JOIN erp.contas_receber c ON c.id=p.conta_receber_id AND c.tenant_id=p.tenant_id WHERE c.venda_id=$1',[saleId])).rows[0];
    const receive=await prepare({tipo:'receber_parcela',dados:{registro_id:Number(installment.id),valor:12,data_pagamento:'2026-10-03',conta_financeira_id:901}});
    await decideApproval(receive.rascunho_id,session,'save');await decideApproval(receive.rascunho_id,session,'save');
    const payments=await call(owner,'listar_pagamentos',{empresa_id:1});assert.equal(payments.records.length,1);
    const reverse=await prepare({tipo:'estornar_pagamento',dados:{registro_id:Number(payments.records[0].id),motivo:'Recebimento lançado por engano'}});
    await decideApproval(reverse.rascunho_id,session,'save');
    assert.equal((await db.query('SELECT status FROM erp.contas_receber_parcelas WHERE id=$1',[installment.id])).rows[0].status,'aberto');
    await db.query("UPDATE erp.compras SET data_compra='2026-10-03',condicao_pagamento=$1::jsonb WHERE id=101",[JSON.stringify({parcelas:[{numero_parcela:1,data_vencimento:'2026-10-10',valor:10}]})]);
    await db.exec("INSERT INTO erp.compras_itens(tenant_id,compra_id,produto_id,descricao,quantidade,valor_unitario,total) VALUES(1,101,101,'Produto A',1,10,10)");
    await db.exec("INSERT INTO erp.compras_parcelas_previstas(tenant_id,compra_id,numero_parcela,data_vencimento,valor) VALUES(1,101,1,'2026-10-10',10)");
    const purchase=await prepare({tipo:'confirmar_compra',dados:{registro_id:101}});await decideApproval(purchase.rascunho_id,session,'save');
    const payable=(await db.query('SELECT p.id FROM erp.contas_pagar_parcelas p JOIN erp.contas_pagar c ON c.id=p.conta_pagar_id AND c.tenant_id=p.tenant_id WHERE c.compra_id=101')).rows[0];assert(payable);
    const pay=await prepare({tipo:'pagar_parcela',dados:{registro_id:Number(payable.id),valor:10,data_pagamento:'2026-10-03',conta_financeira_id:901}});await decideApproval(pay.rascunho_id,session,'save');
    const paid=(await db.query("SELECT id FROM erp.pagamentos WHERE tenant_id=1 AND tipo='pagar' AND estorno_de_pagamento_id IS NULL")).rows[0];
    const undo=await prepare({tipo:'estornar_pagamento',dados:{registro_id:Number(paid.id),motivo:'Pagamento indevido'}});await decideApproval(undo.rascunho_id,session,'save');
    const cancel=await prepare({tipo:'cancelar_compra',dados:{registro_id:101}});await decideApproval(cancel.rascunho_id,session,'save');
    assert.equal((await db.query('SELECT status FROM erp.compras WHERE id=101')).rows[0].status,'cancelada');
    await call(owner,'listar_contas_financeiras',{empresa_id:1});await call(owner,'verificar_fiscal_venda',{empresa_id:1,venda_id:saleId});
    const cancelSale=await prepare({tipo:'cancelar_venda',dados:{registro_id:101,motivo:'Venda desistida pelo cliente'}});await decideApproval(cancelSale.rascunho_id,session,'save');
    assert.equal((await db.query('SELECT status FROM erp.vendas WHERE id=101')).rows[0].status,'cancelada');
  });
  await check('Preferencias ficam isoladas por usuario e conexao OAuth',async()=>{
    const prefs=load('@/products/chatgptplugin/extensions/settings');
    assert.equal((await prefs.readPreferences(owner)).por_pagina,20);
    await prefs.updatePreferences(owner,{empresa_preferida:'1',por_pagina:30});
    assert.equal((await prefs.readPreferences({...owner,clientId:'outro-client'})).por_pagina,20);
    assert.equal((await prefs.readPreferences({...owner,userId:2})).empresa_preferida,'');
    await assert.rejects(prefs.updatePreferences(owner,{empresa_preferida:'999'}));
    await assert.rejects(prefs.updatePreferences(owner,{tenant_id:2}));
    await prefs.updatePreferences(owner,{por_pagina:40});assert.equal((await prefs.readPreferences(owner)).empresa_preferida,'1');
  });
  await check('ChatGPT e Claude isolam propostas limites preferencias e auditoria',async()=>{
    const key=randomUUID(),claudeDraft=randomUUID(),claudeExecution=randomUUID();
    const proposal={tipo:'cliente',dados:{nome:'Proposta Claude'}};
    await db.query("INSERT INTO plugin.drafts(id,tenant_id,user_id,oauth_client_id,operation_key,proposal,integration) VALUES($1,1,1,'client',$2,$3::jsonb,'claude')",[claudeDraft,key,JSON.stringify(proposal)]);
    const chatgptDraft=await prepare({tipo:'cliente',dados:{nome:'Proposta ChatGPT'}},key);
    assert.notEqual(chatgptDraft.rascunho_id,claudeDraft);
    assert.equal((await executeTool(owner,'obter_rascunho',{empresa_id:1,rascunho_id:claudeDraft},settings)).isError,true);
    await assert.rejects(decideApproval(claudeDraft,session,'save'),e=>e.code==='NOT_FOUND');
    await assert.rejects(decideApproval(claudeDraft,session,'cancel'),e=>e.code==='NOT_FOUND');
    const list=await call(owner,'listar_rascunhos',{empresa_id:1});assert(!list.records.some(row=>row.rascunho_id===claudeDraft));
    await db.exec("INSERT INTO plugin.rate_windows(user_id,window_start,requests,integration) VALUES(1,date_trunc('minute',now()),99,'claude'); DELETE FROM plugin.rate_windows WHERE user_id=1 AND integration='chatgpt'");
    await audit.consumeRequestLimit(owner,1);
    assert.equal((await db.query("SELECT requests FROM plugin.rate_windows WHERE integration='claude'")).rows[0].requests,99);
    await assert.rejects(audit.consumeRequestLimit(owner,1),e=>e.code==='RATE_LIMITED');
    const prefs=load('@/products/chatgptplugin/extensions/settings');
    await db.exec("INSERT INTO plugin.settings(user_id,oauth_client_id,values,integration) VALUES(1,'client','{\"por_pagina\":50}','claude')");
    assert.equal((await prefs.readPreferences(owner)).por_pagina,40);
    await prefs.updatePreferences(owner,{por_pagina:30});
    assert.equal((await db.query("SELECT values FROM plugin.settings WHERE integration='claude'")).rows[0].values.por_pagina,50);
    await db.query("INSERT INTO plugin.executions(id,user_id,oauth_client_id,tool_name,status,integration) VALUES($1,1,'client','claude-test','running','claude')",[claudeExecution]);
    await audit.finishExecution(claudeExecution,'failed','TEST',1);
    assert.equal((await db.query('SELECT status FROM plugin.executions WHERE id=$1',[claudeExecution])).rows[0].status,'running');
    await assert.rejects(db.query("INSERT INTO plugin.settings(user_id,oauth_client_id,integration) VALUES(1,'client','unknown')"),e=>e.code==='23514');
    for(const name of ['executions','rate_windows','drafts','settings'])assert.equal((await db.query('SELECT to_regclass($1) AS relation',[`shared.chatgptplugin_${name}`])).rows[0].relation,null);
  });
  await check('Perfil de vendas pre-valida fiscal sem ler configuracao completa',async()=>{
    await db.exec("INSERT INTO shared.tenant_memberships(tenant_id,user_id,role,status) VALUES(1,2,'viewer','active')");
    await db.exec("INSERT INTO shared.erp_profile_permissions(profile_id,capability) VALUES('consulta','erp.vendas.visualizar'); INSERT INTO erp.configuracoes_fiscais(tenant_id,cnpj,razao_social,token_secret_ref) VALUES(1,'12345678000199','Empresa A','secret-local')");
    const salesReader=await loadPluginPrincipal('user_2','client',['erp:read']);
    const fiscal=await call(salesReader,'verificar_fiscal_venda',{empresa_id:1,venda_id:101});
    assert(!fiscal.issues.some(issue=>['FISCAL_CONFIG_MISSING','ISSUER_DOCUMENT_MISSING'].includes(issue.code)));
    const result=await executeTool(salesReader,'listar_contas_financeiras',{empresa_id:1},settings);assert.equal(result.isError,true);
  });
  await check('Pagina financeira vazia preserva total e resumo com os mesmos filtros',async()=>{
    const {listErpEntityPage}=load('@/products/erp/server/erpRepository');
    const read=load('@/lib/erpDatabaseContext');
    await read.runWithErpDatabaseContext({tenantId:1,userId:1,readOnly:true},async()=>{
      const input={tenantId:1,entityId:'contas-a-pagar',pageSize:10};
      const first=await listErpEntityPage({...input,page:1});assert(first.total>0);
      const empty=await listErpEntityPage({...input,page:100});assert.deepEqual(empty.records,[]);assert.equal(empty.page,100);
      assert.equal(empty.total,first.total);assert.deepEqual(empty.summary,first.summary);
      const filteredFirst=await listErpEntityPage({...input,page:1,filters:{status:'pago'}});
      const filteredEmpty=await listErpEntityPage({...input,page:100,filters:{status:'pago'}});
      assert.equal(filteredEmpty.total,filteredFirst.total);assert.deepEqual(filteredEmpty.summary,filteredFirst.summary);
      const none=await listErpEntityPage({...input,page:100,query:'registro_ausente_'+randomUUID()});assert.equal(none.total,0);assert.deepEqual(none.records,[]);
    });
  });
  const apply=async(proposta)=>{const draft=await prepare(proposta),result=await decideApproval(draft.rascunho_id,session,'save');assert.equal(result.status,'saved');assert.equal((await decideApproval(draft.rascunho_id,session,'save')).registro_id,result.registro_id);return Number(result.registro_id);};
  const newIds={};
  await check('CRUD dos sete cadastros com exclusao logica e auditoria',async()=>{
    const entries=[['cliente','clientes',{nome:'Cliente CRUD'}],['fornecedor','fornecedores',{nome:'Fornecedor CRUD',email:'fornecedor@example.invalid',telefone:'85999990000'}],['vendedor','vendedores',{nome:'Vendedor CRUD'}],['produto','produtos',{nome:'Produto CRUD',preco:9}],['servico','servicos',{nome:'Servico CRUD',preco:15}],['categoria','categorias',{nome:'Categoria CRUD',tipo:'geral'}],['conta_financeira','contas-financeiras',{nome:'Conta CRUD',tipo:'caixa',data_saldo_inicial:'2026-10-04'}]];
    for(const [kind,module,dados] of entries){const id=await apply({tipo:kind,dados});newIds[kind]=id;
      await apply({tipo:'editar_'+kind,dados:{registro_id:id,nome:kind+' revisado'}});
      const found=await call(owner,'obter_cadastro',{empresa_id:1,tipo:module,registro_id:id});assert.equal(found.record.nome,kind+' revisado');if(kind==='fornecedor'){assert.equal(found.record.email,'fornecedor@example.invalid');assert.equal(found.record.telefone,'85999990000')}
      const listing=await call(owner,'buscar_cadastros',{empresa_id:1,tipo:module,busca:kind+' revisado'});assert(listing.records.some(r=>Number(r.id)===id));
      const deletion=await prepare({tipo:'excluir_'+kind,dados:{registro_id:id,motivo:'Cadastro criado apenas para teste'}});
      assert.equal((await executeTool({...owner,companies:[{...owner.companies[0],capabilities:['erp.cadastros.gerenciar']}]},'preparar_rascunho',{empresa_id:1,chave_operacao:randomUUID(),proposta:{tipo:'excluir_'+kind,dados:{registro_id:id,motivo:'Sem acesso ao historico'}}},settings)).isError,true);
      await decideApproval(deletion.rascunho_id,session,'save');
      const table=['cliente','fornecedor','vendedor'].includes(kind)?'entidades':kind==='conta_financeira'?'contas_financeiras':module;
      const row=(await db.query('SELECT ativo,excluido_em FROM erp.'+table+' WHERE tenant_id=1 AND id=$1',[id])).rows[0];assert(row.excluido_em);assert.equal(row.ativo,false);
      assert.equal((await executeTool(owner,'obter_cadastro',{empresa_id:1,tipo:module,registro_id:id},settings)).isError,true);
    }
  });
  const financialIds={};
  const moneyData=side=>({[side==='pagar'?'fornecedor_id':'cliente_id']:101,descricao:'Titulo CRUD '+side,valor_total:120,conta_financeira_id:901,data_competencia:'2026-10-04',data_emissao:'2026-10-04',categoria_id:financialIds[side+'Category'],parcelas:[{data_vencimento:'2026-10-20',valor:60},{data_vencimento:'2026-11-20',valor:60}]});
  await check('Contas a pagar e receber criadas editadas e excluidas com parcelas historicas',async()=>{
    for(const side of ['pagar','receber']){
      financialIds[side+'Category']=await apply({tipo:'categoria',dados:{nome:'Categoria '+side,tipo:side==='pagar'?'despesa':'receita'}});
      const id=await apply({tipo:'conta_'+side,dados:moneyData(side)});financialIds[side]=id;
      const found=await call(owner,'obter_titulo_financeiro',{empresa_id:1,tipo:side,conta_id:id});assert.equal(found.installments.length,2);assert.equal(found.record.conta_financeira_id,'901');assert.equal(Number(found.record.valor_total),120);
      await apply({tipo:'editar_conta_'+side,dados:{...moneyData(side),registro_id:id,descricao:'Titulo revisado',valor_total:90,parcelas:[{data_vencimento:'2026-10-25',valor:90}]}});
      const edited=await call(owner,'obter_titulo_financeiro',{empresa_id:1,tipo:side,conta_id:id});assert.equal(edited.installments.length,1);assert.equal(Number(edited.record.valor_total),90);assert.equal(edited.record.descricao,'Titulo revisado');
      const old=(await db.query('SELECT count(*)::int AS n FROM erp.contas_'+side+'_parcelas WHERE tenant_id=1 AND conta_'+side+'_id=$1 AND excluido_em IS NOT NULL',[id])).rows[0];assert.equal(old.n,2);
      await apply({tipo:'excluir_conta_'+side,dados:{registro_id:id,motivo:'Excluir titulo sem movimento'}});
      assert((await db.query('SELECT excluido_em FROM erp.contas_'+side+' WHERE id=$1',[id])).rows[0].excluido_em);
      assert.equal((await executeTool(owner,'obter_titulo_financeiro',{empresa_id:1,tipo:side,conta_id:id},settings)).isError,true);
    }
  });
  await check('CRUD comercial preserva rascunho e nao gera financeiro nem estoque',async()=>{
    for(const kind of ['venda','orcamento','compra']){const purchase=kind==='compra',table=purchase?'compras':'vendas';
      const dados={ [purchase?'fornecedor_id':'cliente_id']:101,[purchase?'data_compra':'data_venda']:'2026-10-04',data_vencimento:'2026-10-20',itens:[{tipo:'produto',item_id:101,quantidade:1,valor_unitario:12}]};
      const id=await apply({tipo:kind,dados});await apply({tipo:'editar_'+kind,dados:{...dados,registro_id:id,itens:[{tipo:'produto',item_id:101,quantidade:3,valor_unitario:12}]}});
      const row=(await db.query('SELECT status,total FROM erp.'+table+' WHERE tenant_id=1 AND id=$1',[id])).rows[0];assert.equal(row.status,'rascunho');assert.equal(Number(row.total),36);
      const financial=(await db.query('SELECT count(*)::int AS n FROM erp.contas_'+(purchase?'pagar':'receber')+' WHERE tenant_id=1 AND '+(purchase?'compra_id':'venda_id')+'=$1',[id])).rows[0];assert.equal(financial.n,0);
      await apply({tipo:'excluir_'+kind,dados:{registro_id:id,motivo:'Descartar documento de teste'}});assert((await db.query('SELECT excluido_em FROM erp.'+table+' WHERE id=$1',[id])).rows[0].excluido_em);
    }
  });
  await check('Valores referencias e permissoes bloqueiam propostas financeiras invalidas',async()=>{
    for(const dados of [{...moneyData('pagar'),valor_total:119},{...moneyData('pagar'),fornecedor_id:201},{...moneyData('pagar'),categoria_id:financialIds.receberCategory},{...moneyData('pagar'),conta_financeira_id:902}])assert.equal((await executeTool(owner,'preparar_rascunho',{empresa_id:1,chave_operacao:randomUUID(),proposta:{tipo:'conta_pagar',dados}},settings)).isError,true);
    assert.equal((await executeTool({...owner,companies:[{...owner.companies[0],capabilities:['erp.financeiro.visualizar']}]},'preparar_rascunho',{empresa_id:1,chave_operacao:randomUUID(),proposta:{tipo:'conta_pagar',dados:moneyData('pagar')}},settings)).isError,true);
  });
  await check('Titulos com pagamento mesmo estornado e origens comerciais ficam protegidos',async()=>{
    for(const side of ['pagar','receber']){const id=await apply({tipo:'conta_'+side,dados:moneyData(side)});const part=(await db.query('SELECT id FROM erp.contas_'+side+'_parcelas WHERE tenant_id=1 AND conta_'+side+'_id=$1 ORDER BY id',[id])).rows[0];
      await apply({tipo:side==='pagar'?'pagar_parcela':'receber_parcela',dados:{registro_id:Number(part.id),valor:60,data_pagamento:'2026-10-04',conta_financeira_id:901}});
      const payment=(await db.query('SELECT id FROM erp.pagamentos WHERE tenant_id=1 AND conta_'+side+'_parcela_id=$1 AND estorno_de_pagamento_id IS NULL',[part.id])).rows[0];
      await apply({tipo:'estornar_pagamento',dados:{registro_id:Number(payment.id),motivo:'Estorno para testar preservacao'}});
      for(const proposal of [{tipo:'editar_conta_'+side,dados:{...moneyData(side),registro_id:id}},{tipo:'excluir_conta_'+side,dados:{registro_id:id,motivo:'Deve bloquear exclusao'}}]){const draft=await prepare(proposal);await assert.rejects(decideApproval(draft.rascunho_id,session,'save'),/histórico/);assert.equal((await call(owner,'obter_rascunho',{empresa_id:1,rascunho_id:draft.rascunho_id})).status,'pending');}
    }
    const title=(await db.query('SELECT id FROM erp.contas_receber WHERE tenant_id=1 AND venda_id=$1',[saleId])).rows[0];const draft=await prepare({tipo:'excluir_conta_receber',dados:{registro_id:Number(title.id),motivo:'Titulo de venda'}});await assert.rejects(decideApproval(draft.rascunho_id,session,'save'),/origem/);
    const deletion=await prepare({tipo:'excluir_venda',dados:{registro_id:saleId,motivo:'Venda confirmada'}});await assert.rejects(decideApproval(deletion.rascunho_id,session,'save'),/rascunho/);
    const cad=await prepare({tipo:'excluir_produto',dados:{registro_id:101,motivo:'Produto com historico'}});await assert.rejects(decideApproval(cad.rascunho_id,session,'save'),/vínculos/);
  });
  await check('Cobrancas existentes e falha de auditoria impedem alteracao parcial',async()=>{
    const id=await apply({tipo:'conta_receber',dados:moneyData('receber')}),part=(await db.query('SELECT id FROM erp.contas_receber_parcelas WHERE tenant_id=1 AND conta_receber_id=$1 ORDER BY id',[id])).rows[0];
    await db.query("INSERT INTO erp.cobrancas(tenant_id,conta_receber_parcela_id,provedor,tipo,status,valor,data_vencimento,chave_idempotencia) VALUES(1,$1,'teste','pix','pendente',60,'2026-10-20',$2)",[part.id,randomUUID()]);
    const d=await prepare({tipo:'excluir_conta_receber',dados:{registro_id:id,motivo:'Titulo com cobranca'}});await assert.rejects(decideApproval(d.rascunho_id,session,'save'),/cobrança/);
    const draft=await prepare({tipo:'conta_pagar',dados:moneyData('pagar')}),before=(await db.query('SELECT count(*)::int AS n FROM erp.contas_pagar')).rows[0].n;
    await db.exec("CREATE FUNCTION shared.reject_crud_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'audit failure'; END $$; CREATE TRIGGER reject_crud BEFORE INSERT ON plugin.executions FOR EACH ROW EXECUTE FUNCTION shared.reject_crud_audit()");
    await assert.rejects(decideApproval(draft.rascunho_id,session,'save'));assert.equal((await db.query('SELECT count(*)::int AS n FROM erp.contas_pagar')).rows[0].n,before);
    await db.exec('DROP TRIGGER reject_crud ON plugin.executions; DROP FUNCTION shared.reject_crud_audit()');
    assert.equal((await call(owner,'obter_rascunho',{empresa_id:1,rascunho_id:draft.rascunho_id})).status,'pending');
  });
  await check('Edicao financeira preserva campos omitidos e so limpa valores explicitamente',async()=>{
    const center=Number((await db.query("INSERT INTO erp.centros_custo(tenant_id,nome,codigo) VALUES(1,'Centro de teste','CENTRO-TESTE') RETURNING id")).rows[0].id);
    await db.exec("INSERT INTO erp.contas_financeiras(id,tenant_id,nome,tipo) VALUES(903,1,'Outra conta de teste','caixa')");
    for(const side of ['pagar','receber']){
      const id=await apply({tipo:'conta_'+side,dados:{...moneyData(side),numero_documento:'DOCUMENTO-ORIGINAL',centro_custo_id:center,observacoes:'Observacao original'}});
      const omitted={...moneyData(side),registro_id:id,descricao:'Descricao revisada'};delete omitted.conta_financeira_id;
      await apply({tipo:'editar_conta_'+side,dados:omitted});
      const title=(await db.query('SELECT numero_documento,centro_custo_id,observacoes FROM erp.contas_'+side+' WHERE tenant_id=1 AND id=$1',[id])).rows[0];
      assert.equal(title.numero_documento,'DOCUMENTO-ORIGINAL');assert.equal(Number(title.centro_custo_id),center);assert.equal(title.observacoes,'Observacao original');
      const parts=(await db.query('SELECT id,conta_financeira_id FROM erp.contas_'+side+'_parcelas WHERE tenant_id=1 AND conta_'+side+'_id=$1 AND excluido_em IS NULL ORDER BY id',[id])).rows;
      assert.equal(parts.length,2);assert(parts.every(part=>Number(part.conta_financeira_id)===901));
      await db.query('UPDATE erp.contas_'+side+'_parcelas SET conta_financeira_id=903 WHERE tenant_id=1 AND id=$1',[parts[1].id]);
      const draft=await prepare({tipo:'editar_conta_'+side,dados:omitted});
      await assert.rejects(decideApproval(draft.rascunho_id,session,'save'),/contas financeiras diferentes/);
      assert.deepEqual((await db.query('SELECT id,conta_financeira_id FROM erp.contas_'+side+'_parcelas WHERE tenant_id=1 AND conta_'+side+'_id=$1 AND excluido_em IS NULL ORDER BY id',[id])).rows.map(part=>Number(part.conta_financeira_id)),[901,903]);
      await apply({tipo:'editar_conta_'+side,dados:{...omitted,numero_documento:null,centro_custo_id:null,observacoes:null,conta_financeira_id:null}});
      const cleared=(await db.query('SELECT numero_documento,centro_custo_id,observacoes FROM erp.contas_'+side+' WHERE tenant_id=1 AND id=$1',[id])).rows[0];
      assert.deepEqual(cleared,{numero_documento:null,centro_custo_id:null,observacoes:null});
      const clearedParts=(await db.query('SELECT conta_financeira_id FROM erp.contas_'+side+'_parcelas WHERE tenant_id=1 AND conta_'+side+'_id=$1 AND excluido_em IS NULL',[id])).rows;
      assert(clearedParts.every(part=>part.conta_financeira_id===null));
    }
  });
  await check('Periodos fechados e propostas desatualizadas protegem edicao financeira',async()=>{
    const id=await apply({tipo:'conta_pagar',dados:moneyData('pagar')});
    const stale=await prepare({tipo:'editar_conta_pagar',dados:{...moneyData('pagar'),registro_id:id}});await db.query("UPDATE erp.contas_pagar SET observacoes='Mudou' WHERE tenant_id=1 AND id=$1",[id]);await assert.rejects(decideApproval(stale.rascunho_id,session,'save'),e=>e.code==='STALE_PROPOSAL');
    await db.exec("INSERT INTO erp.fechamentos_periodos(tenant_id,modulo,periodo_inicio,periodo_fim,criado_por) VALUES(1,'financeiro','2026-10-01','2026-10-31',1)");
    const deletion=await prepare({tipo:'excluir_conta_pagar',dados:{registro_id:id,motivo:'Periodo fechado'}});await assert.rejects(decideApproval(deletion.rascunho_id,session,'save'),e=>e.code==='PERIOD_CLOSED');
    const creation=await prepare({tipo:'conta_pagar',dados:moneyData('pagar')});await assert.rejects(decideApproval(creation.rascunho_id,session,'save'),e=>e.code==='PERIOD_CLOSED');
  });
  console.log(JSON.stringify({status:'passed',checks,proposalTypes:44,realDatabaseAccess:false,localPostgres:true}));
}
try{await main();}catch(error){console.error(error.message);process.exitCode=1;}finally{await db.close();}
