import {db,restoreCatalog,assert} from './evolution-fixture.mjs';
import {catalog} from './evolution-catalog.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';

// Apenas PostgreSQL em memoria e dados ficticios. Nao carrega credenciais.
const migration=readFileSync('supabase/migrations/20261003170000_harden_erp_read_access.sql','utf8');
const checks=[];
async function check(name,fn){await fn();checks.push(name);}
async function runtime(user,fn,tenant=1){
  await db.exec('BEGIN');
  try{
    await db.query("SELECT set_config('app.erp_user_id',$1,true),set_config('app.erp_tenant_id',$2,true)",[String(user),String(tenant)]);
    await db.exec('SET LOCAL ROLE erp_runtime');
    await fn();
    await db.exec('SET CONSTRAINTS ALL IMMEDIATE');
  }finally{await db.exec('ROLLBACK');}
}
const count=async table=>Number((await db.query(`SELECT count(*) AS n FROM erp.${table}`)).rows[0].n);
try{
  await restoreCatalog();
  for(const file of ['01-integridade-historicos.sql','02-periodos-fechados.sql','03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql'])await db.exec(readFileSync('scripts/erp/sql/'+file,'utf8'));
  for(const file of ['20260909033000_drop_erp_financial_views.sql','20260909040000_harden_erp_service_integrity.sql'])await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
  const before=await catalog(db);
  await db.exec(migration);
  const after=await catalog(db);
  await check('Estrutura, escritas, indices, triggers e views preservados',async()=>{
    for(const group of ['columns','constraints','indexes','triggers','grants','rls','views'])assert.deepEqual(after[group],before[group],group);
    assert.deepEqual(after.policies.filter(p=>p.cmd!=='SELECT'||p.schemaname!=='erp'),before.policies.filter(p=>p.cmd!=='SELECT'||p.schemaname!=='erp'));
    assert.equal(after.policies.filter(p=>p.schemaname==='erp'&&p.cmd==='SELECT').length,82);
    assert(!after.policies.some(p=>p.schemaname==='erp'&&p.qual==='shared.is_tenant_member(tenant_id)'));
    const changed=after.functions.filter(f=>!before.functions.some(b=>b.schema===f.schema&&b.name===f.name&&b.definition===f.definition));
    assert.deepEqual(changed.map(f=>f.schema+'.'+f.name).sort(),['erp.fiscal_issuer_for_operations','shared.can_read_erp_module','shared.has_erp_capability','shared.is_tenant_member']);
  });
  await db.exec(`
    INSERT INTO shared.tenants(id,name,slug) VALUES(1,'Empresa A','a'),(2,'Empresa B','b');
    INSERT INTO shared.erp_permission_profiles(id,nome) VALUES('isolado','Isolado');
    INSERT INTO shared.users(id,email,full_name) VALUES(1,'owner@example.invalid','Owner'),(2,'reader@example.invalid','Reader');
    INSERT INTO shared.tenant_memberships(tenant_id,user_id,role,status,erp_profile_id) VALUES(1,1,'owner','active','isolado'),(2,1,'owner','active','isolado'),(1,2,'member','active','isolado');
    INSERT INTO erp.entidades(id,tenant_id,nome,eh_cliente,eh_fornecedor) VALUES(101,1,'Cliente A',true,true),(201,2,'Cliente B',true,true);
    INSERT INTO erp.produtos(id,tenant_id,nome,sku) VALUES(101,1,'Produto A','A'),(201,2,'Produto B','B');
    INSERT INTO erp.contas_financeiras(id,tenant_id,nome) VALUES(101,1,'Banco A'),(201,2,'Banco B');
    BEGIN;
    INSERT INTO erp.contas_receber(id,tenant_id,cliente_id,descricao,valor_total) VALUES(101,1,101,'Titulo A',100),(201,2,201,'Titulo B',100);
    INSERT INTO erp.contas_receber_parcelas(id,tenant_id,conta_receber_id,numero_parcela,data_vencimento,valor) VALUES(101,1,101,1,'2026-10-10',100),(201,2,201,1,'2026-10-10',100);
    INSERT INTO erp.vendas(id,tenant_id,cliente_id,numero) VALUES(101,1,101,'A'),(201,2,201,'B');
    INSERT INTO erp.compras(id,tenant_id,fornecedor_id,numero) VALUES(101,1,101,'A'),(201,2,201,'B');
    INSERT INTO erp.locais_estoque(id,tenant_id,nome,codigo) VALUES(101,1,'Local A','A'),(201,2,'Local B','B');
    INSERT INTO erp.saldos_estoque(tenant_id,produto_id,local_estoque_id,quantidade_fisica) VALUES(1,101,101,7),(2,201,201,9);
    INSERT INTO erp.configuracoes_fiscais(id,tenant_id,cnpj,razao_social,token_secret_ref) VALUES(101,1,'12345678000199','Empresa A','secret-a'),(201,2,'98765432000199','Empresa B','secret-b');
    INSERT INTO erp.notas_fiscais(id,tenant_id,direcao,ref_focus,entidade_id) VALUES(101,1,'saida','saida-a',101),(102,1,'entrada',NULL,101),(201,2,'saida','saida-b',201);
    INSERT INTO erp.notas_fiscais_totais(tenant_id,nota_fiscal_id) VALUES(1,101),(1,102),(2,201);
    INSERT INTO erp.arquivos(id,tenant_id,bucket,caminho,nome) VALUES(101,1,'docs','sales.pdf','Venda'),(102,1,'docs','finance.pdf','Financeiro'),(103,1,'docs','unlinked.pdf','Sem vinculo'),(201,2,'docs','b.pdf','B');
    INSERT INTO erp.vendas_arquivos(tenant_id,venda_id,arquivo_id,finalidade) VALUES(1,101,101,'Documento');
    INSERT INTO erp.contas_receber_arquivos(tenant_id,conta_receber_id,arquivo_id,finalidade) VALUES(1,101,102,'Documento');
    INSERT INTO erp.execucoes_automacao(tenant_id,tipo,chave_idempotencia) VALUES(1,'contratos','contratos'),(1,'titulos_vencidos','financeiro'),(1,'estoque_minimo','estoque');
    COMMIT;
    REVOKE USAGE ON SCHEMA shared FROM erp_runtime;
  `);
  // ERP_RLS_CONTEXT=1: repete a matriz com as políticas reescritas pela migração 20261008100000 (nomenclatura
  // antiga desta fixture), provando que a permissão calculada uma vez por consulta dá o mesmo resultado.
  if(process.env.ERP_RLS_CONTEXT==='1')await db.exec(readFileSync('supabase/migrations/20261008100000_erp_rls_contexto.sql','utf8').replaceAll('empresa_id','tenant_id'));
  if(process.env.ERP_RLS_CONTEXT==='1'){const n=Number((await db.query("SELECT count(*) n FROM pg_policy p JOIN pg_class c ON c.oid=p.polrelid WHERE c.relnamespace='erp'::regnamespace AND (pg_get_expr(p.polqual,p.polrelid) LIKE '%erp_empresa_contexto%' OR pg_get_expr(p.polwithcheck,p.polrelid) LIKE '%erp_empresa_contexto%')")).rows[0].n);assert(n>200,'políticas reescritas: '+n);console.error('politicas_reescritas='+n);}
  const cases=[
    [null,[]],['erp.cadastros.visualizar',['reference']],['erp.cadastros.gerenciar',['reference']],
    ['erp.vendas.visualizar',['reference','sales']],['erp.vendas.gerenciar',['reference','sales']],
    ['erp.compras.visualizar',['reference','purchases']],['erp.compras.gerenciar',['reference','purchases']],
    ['erp.financeiro.visualizar',['reference','finance']],['erp.financeiro.gerenciar',['reference','finance']],
    ['erp.financeiro.baixar',['reference','finance']],['erp.financeiro.estornar',['reference','finance']],
    ['erp.estoque.visualizar',['reference','stock']],['erp.estoque.movimentar',['reference','stock']],['erp.estoque.ajustar',['reference','stock']],
    ['erp.configuracoes.gerenciar',['reference','config']],['erp.relatorios.visualizar',[]],
  ];
  for(const [capability,allowed] of cases){
    await db.exec("DELETE FROM shared.erp_profile_permissions WHERE profile_id='isolado'");
    if(capability)await db.query("INSERT INTO shared.erp_profile_permissions(profile_id,capability) VALUES('isolado',$1)",[capability]);
    await check('Perfil isolado: '+(capability||'sem permissoes'),()=>runtime(2,async()=>{
      for(const [table,area] of [['entidades','reference'],['produtos','reference'],['vendas','sales'],['compras','purchases'],['contas_receber','finance'],['contas_financeiras','finance'],['contas_receber_parcelas','finance'],['saldos_estoque','stock'],['configuracoes_fiscais','config']])assert.equal(await count(table),allowed.includes(area)?1:0,table);
      const notes=(await db.query('SELECT id FROM erp.notas_fiscais ORDER BY id')).rows.map(r=>Number(r.id));
      assert.deepEqual(notes,allowed.includes('config')?[101,102]:allowed.includes('sales')?[101]:allowed.includes('purchases')?[102]:[]);
      assert.equal(await count('notas_fiscais_totais'),notes.length);
      const files=(await db.query('SELECT id FROM erp.arquivos ORDER BY id')).rows.map(r=>Number(r.id));
      assert.deepEqual(files,allowed.includes('config')?[101,102,103]:allowed.includes('sales')?[101]:allowed.includes('finance')?[102]:[]);
      assert.equal(await count('execucoes_automacao'),allowed.includes('config')?3:allowed.some(x=>['sales','finance','stock'].includes(x))?1:0);
      const issuer=(await db.query('SELECT * FROM erp.fiscal_issuer_for_operations($1)',[1])).rows;
      assert.equal(issuer.length,allowed.some(x=>['sales','purchases','config'].includes(x))?1:0);
      if(issuer.length)assert.deepEqual(Object.keys(issuer[0]).sort(),['cnpj','endereco_codigo_municipio','id','inscricao_estadual','tenant_id']);
      assert.equal((await db.query('SELECT * FROM erp.fiscal_issuer_for_operations($1)',[2])).rows.length,0);
    }));
  }
  const tables=after.rls.filter(t=>t.schema==='erp'&&t.relkind==='r').map(t=>t.relname);
  await check('Todas as 82 tabelas consultaveis com owner e contexto restrito',()=>runtime(1,async()=>{
    for(const table of tables){const rows=(await db.query(`SELECT DISTINCT tenant_id FROM erp.${table}`)).rows;assert(rows.every(r=>Number(r.tenant_id)===1),table);}
  }));
  for(const status of ['suspended','disabled']){
    await db.query('UPDATE shared.tenants SET status=$1 WHERE id=1',[status]);
    await check('Empresa '+status+' bloqueia 82 tabelas e dados fiscais',()=>runtime(1,async()=>{
      for(const table of tables)assert.equal(await count(table),0,table);
      assert.equal((await db.query('SELECT * FROM erp.fiscal_issuer_for_operations($1)',[1])).rows.length,0);
    }));
    await check('Empresa '+status+' bloqueia escrita de owner',async()=>{
      await assert.rejects(runtime(1,()=>db.exec("INSERT INTO erp.entidades(tenant_id,nome,eh_cliente) VALUES(1,'Bloqueado',true)")),e=>e.code==='42501');
    });
  }
  await db.exec("UPDATE shared.tenants SET status='active' WHERE id=1");
  await check('Owner ativo escreve com validacoes diferidas sob erp_runtime',()=>runtime(1,()=>db.exec("INSERT INTO erp.entidades(tenant_id,nome,eh_cliente) VALUES(1,'Permitido',true)")));
  await check('Financeiro gerenciar sem visualizar mantem pagamento e historico',async()=>{
    await db.exec("DELETE FROM shared.erp_profile_permissions WHERE profile_id='isolado'; INSERT INTO shared.erp_profile_permissions(profile_id,capability) VALUES('isolado','erp.financeiro.gerenciar')");
    await runtime(2,async()=>{
      await db.exec("INSERT INTO erp.pagamentos(tenant_id,tipo,conta_receber_parcela_id,conta_financeira_id,data_pagamento,valor,valor_liquido,chave_idempotencia) VALUES(1,'receber',101,101,'2026-10-03',10,10,'isolado')");
      assert.equal(await count('pagamentos'),1);assert((await count('contas_receber_eventos'))>0);
    });
  });
  await check('Financeiro gerenciar sem visualizar rejeita total inconsistente',async()=>{
    await assert.rejects(runtime(2,()=>db.exec('UPDATE erp.contas_receber SET valor_total=999 WHERE tenant_id=1 AND id=101')),e=>e.code==='P0001');
  });
  await check('Financeiro gerenciar sem visualizar respeita periodo fechado',async()=>{
    await db.exec("INSERT INTO erp.fechamentos_periodos(tenant_id,modulo,periodo_inicio,periodo_fim) VALUES(1,'financeiro','2026-10-01','2026-10-31')");
    await assert.rejects(runtime(2,()=>db.exec("INSERT INTO erp.pagamentos(tenant_id,tipo,conta_receber_parcela_id,conta_financeira_id,data_pagamento,valor,valor_liquido,chave_idempotencia) VALUES(1,'receber',101,101,'2026-10-03',10,10,'fechado')")),e=>e.code==='23514');
  });
  await check('Vinculo suspenso bloqueia mesmo com empresa ativa',async()=>{
    await db.exec("UPDATE shared.tenant_memberships SET status='suspended' WHERE user_id=1 AND tenant_id=1");
    await runtime(1,async()=>assert.equal(await count('entidades'),0));
    await db.exec("UPDATE shared.tenant_memberships SET status='active' WHERE user_id=1 AND tenant_id=1");
  });
  await check('Modulo desconhecido negado inclusive para owner',async()=>{
    await db.exec('BEGIN');try{
      await db.exec("SELECT set_config('app.erp_user_id','1',true),set_config('app.erp_tenant_id','1',true)");
      assert.equal((await db.query("SELECT shared.can_read_erp_module(1,'desconhecido') allowed")).rows[0].allowed,false);
    }finally{await db.exec('ROLLBACK');}
  });
  await check('Novas funcoes privadas sem EXECUTE anonimo ou autenticado',async()=>{
    const rows=(await db.query(`SELECT p.proname,p.prosecdef,p.proconfig,
      has_function_privilege('anon',p.oid,'EXECUTE') AS anon_execute,
      has_function_privilege('authenticated',p.oid,'EXECUTE') AS authenticated_execute
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
      WHERE (n.nspname='shared' AND p.proname='can_read_erp_module') OR (n.nspname='erp' AND p.proname='fiscal_issuer_for_operations')`)).rows;
    assert.equal(rows.length,2);assert(rows.every(r=>r.prosecdef&&!r.anon_execute&&!r.authenticated_execute&&r.proconfig.includes('search_path=pg_catalog')));
  });
  const result={status:'passed',localOnly:true,checks:checks.length,names:checks,digest:createHash('sha256').update(migration).digest('hex')};
  mkdirSync('.cache/erp-audit/read-access',{recursive:true});
  writeFileSync('.cache/erp-audit/read-access/before-access-local.json',JSON.stringify(before,null,2)+'\n');
  writeFileSync('.cache/erp-audit/read-access/after-access-local.json',JSON.stringify(after,null,2)+'\n');
  writeFileSync('.cache/erp-audit/read-access/access-matrix.json',JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result));
}catch(error){console.error(JSON.stringify({status:'failed',passed:checks.length,last:checks.at(-1),code:error.code,message:error.message}));process.exitCode=1;}
finally{await db.close();}
