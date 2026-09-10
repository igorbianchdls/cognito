import {db,restoreCatalog,assert} from './evolution-fixture.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const checks=[];
const evolutionFiles=['03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql'];
const evolutionSql=evolutionFiles.map(f=>readFileSync('scripts/erp/sql/'+f,'utf8'));
const scalar=async sql=>Object.values((await db.query(sql)).rows[0])[0];
async function test(name,sql,code,verify){
 await db.exec('BEGIN');
 try{
  if(code) await assert.rejects(async()=>{await db.exec(sql);await db.exec('SET CONSTRAINTS ALL IMMEDIATE');},e=>{assert.equal(e.code,code,e.message);return true;});
  else {await db.exec(sql);await db.exec('SET CONSTRAINTS ALL IMMEDIATE');if(verify) await verify();}
  checks.push(name);
 }finally{await db.exec('ROLLBACK');}
}
const advance=(id=100,value=1000,side='receber')=>`INSERT INTO erp.adiantamentos(id,tenant_id,entidade_id,lado,tipo,conta_financeira_id,data_movimento,valor,motivo,chave_idempotencia) VALUES(${id},1,101,'${side}','constituicao',101,'2026-02-01',${value},'Antecipacao','a-${id}');`;
const application=(id=100,value=600,side='receber',parcela=101)=>`INSERT INTO erp.adiantamentos_aplicacoes(id,tenant_id,adiantamento_id,conta_${side}_parcela_id,valor,data_aplicacao,motivo,chave_idempotencia) VALUES(${id},1,100,${parcela},${value},'2026-02-02','Aplicar','ap-${id}');`;
const payment=(id=100,value=100,side='receber',parcela=101)=>`INSERT INTO erp.pagamentos(id,tenant_id,tipo,conta_${side}_parcela_id,conta_financeira_id,data_pagamento,valor,valor_liquido,chave_idempotencia) VALUES(${id},1,'${side}',${parcela},101,'2026-02-02',${value},${value},'p-${id}');`;
const agreement=(side='receber',value=1000)=>`
 INSERT INTO erp.renegociacoes(id,tenant_id,entidade_id,lado,numero,data_acordo,motivo,condicoes,chave_idempotencia) VALUES(100,1,101,'${side}','R-100','2026-02-03','Novo prazo','Duas parcelas','r-100');
 INSERT INTO erp.renegociacoes_parcelas(tenant_id,renegociacao_id,papel,conta_${side}_parcela_id,valor,ordem) VALUES(1,100,'origem',101,${value},1);
 INSERT INTO erp.contas_${side}(id,tenant_id,${side==='receber'?'cliente':'fornecedor'}_id,descricao,data_emissao,valor_total,renegociacao_origem_id) VALUES(300,1,101,'Acordo','2026-02-03',${value},100);
 INSERT INTO erp.contas_${side}_parcelas(id,tenant_id,conta_${side}_id,numero_parcela,data_vencimento,valor) VALUES(301,1,300,1,'2026-03-01',${value/2}),(302,1,300,2,'2026-04-01',${value/2});
 INSERT INTO erp.renegociacoes_parcelas(tenant_id,renegociacao_id,papel,conta_${side}_parcela_id,valor,ordem) VALUES(1,100,'destino',301,${value/2},1),(1,100,'destino',302,${value/2},2);
 UPDATE erp.renegociacoes SET status='efetivada',efetivada_em=now() WHERE id=100;
`;
try{
 await restoreCatalog();
 for(const f of ['01-integridade-historicos.sql','02-periodos-fechados.sql']) await db.exec(readFileSync('scripts/erp/sql/'+f,'utf8'));
 await db.exec(`
 INSERT INTO shared.erp_permission_profiles(id,nome) VALUES('consulta','Consulta');
 INSERT INTO shared.tenants(id,name,slug) VALUES(1,'Teste A','a'),(2,'Teste B','b');
 INSERT INTO shared.users(id,email,full_name) VALUES(1,'owner@example.invalid','Owner'),(2,'reader@example.invalid','Reader');
 INSERT INTO shared.tenant_memberships(tenant_id,user_id,role,status) VALUES(1,1,'owner','active'),(1,2,'viewer','active'),(2,1,'owner','active');
 INSERT INTO erp.entidades(id,tenant_id,nome,eh_cliente,eh_fornecedor,email,logradouro,cidade) VALUES(101,1,'Cliente A',true,true,'a@example.invalid','Rua A','Cidade A'),(102,1,'Cliente C',true,true,NULL,NULL,NULL),(201,2,'Cliente B',true,true,NULL,NULL,NULL);
 INSERT INTO erp.contas_financeiras(id,tenant_id,nome) VALUES(101,1,'Banco A'),(102,1,'Banco B'),(201,2,'Banco C');
 INSERT INTO erp.servicos(id,tenant_id,nome) VALUES(101,1,'Servico');
 INSERT INTO erp.contratos_vendas(id,tenant_id,cliente_id,numero,descricao,data_inicio) VALUES(101,1,101,'C-101','Mensal','2026-01-01');
 INSERT INTO erp.contratos_vendas_itens(id,tenant_id,contrato_id,servico_id,descricao,quantidade,valor_unitario,total) VALUES(101,1,101,101,'Servico',1,100,100);
 `);
 for(const sql of evolutionSql) await db.exec(sql);
 await db.exec('BEGIN');
 for(const side of ['receber','pagar']){
  await db.exec(`INSERT INTO erp.contas_${side}(id,tenant_id,${side==='receber'?'cliente':'fornecedor'}_id,descricao,data_emissao,valor_total) VALUES(101,1,101,'Titulo A','2026-01-01',1000),(102,1,102,'Titulo C','2026-01-01',1000);
   INSERT INTO erp.contas_${side}_parcelas(id,tenant_id,conta_${side}_id,numero_parcela,data_vencimento,valor) VALUES(101,1,101,1,'2026-03-01',1000),(102,1,102,1,'2026-03-01',1000);`);
 }
 await db.exec(`INSERT INTO erp.vendas(id,tenant_id,cliente_id,numero,data_venda) VALUES(101,1,101,'V-101','2026-02-01');
 INSERT INTO erp.ordens_servico(id,tenant_id,cliente_id,numero) VALUES(101,1,101,'OS-101');
 INSERT INTO erp.arquivos(id,tenant_id,bucket,caminho,nome) VALUES(101,1,'docs','a.pdf','A'),(201,2,'docs','b.pdf','B');
 INSERT INTO erp.conciliacoes_bancarias(id,tenant_id,conta_financeira_id) VALUES(101,1,101);
 INSERT INTO erp.transacoes_bancarias(id,tenant_id,conta_financeira_id,data_transacao,tipo,valor,descricao) VALUES(101,1,101,'2026-02-02','credito',1000,'Entrada'),(102,1,101,'2026-02-02','debito',1000,'Saida');
 COMMIT;`);
 assert.equal(Number(await scalar("SELECT count(*) FROM pg_tables WHERE schemaname='erp'")),82);checks.push('82 tabelas');
 assert.equal(Number(await scalar("SELECT count(*) FROM pg_views WHERE schemaname='erp'")),6);checks.push('6 views preservadas');
 assert.equal(Number(await scalar('SELECT count(*) FROM erp.entidades_contatos')),1);checks.push('contato real migrado');
 assert.equal(Number(await scalar('SELECT count(*) FROM erp.entidades_enderecos')),1);checks.push('endereco real migrado');
 assert.equal(Number(await scalar('SELECT count(*) FROM erp.contratos_vendas_itens WHERE contrato_versao_id IS NOT NULL')),1);checks.push('itens existentes versionados');
 await test('contato multifinalidade',`INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,email,finalidades,principais) VALUES(1,101,'Financeiro','f@example.invalid',ARRAY['financeiro','comercial'],ARRAY['financeiro']);`);
 await test('principal duplicado',`INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,email,principais) VALUES(1,101,'Um','f@example.invalid',ARRAY['comercial']),(1,101,'Dois','d@example.invalid',ARRAY['comercial']);`,'23514');
 await test('finalidade repetida',`INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,email,finalidades) VALUES(1,101,'Um','f@example.invalid',ARRAY['comercial','comercial']);`,'23514');
 await test('contato entre empresas',`INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,email) VALUES(1,201,'Um','f@example.invalid');`,'23503');
 await test('runtime autorizado',`SET LOCAL ROLE erp_runtime; SELECT set_config('app.erp_tenant_id','1',true),set_config('app.erp_user_id','1',true); INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,email) VALUES(1,101,'Um','f@example.invalid');`);
 await test('leitor sem escrita',`SET LOCAL ROLE erp_runtime; SELECT set_config('app.erp_tenant_id','1',true),set_config('app.erp_user_id','2',true); INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,email) VALUES(1,101,'Um','f@example.invalid');`,'42501');
 await test('authenticated sem acesso direto',`SET LOCAL ROLE authenticated; SELECT * FROM erp.adiantamentos;`,'42501');
 await test('snapshot preservado',`UPDATE erp.vendas SET cliente_snapshot='{}' WHERE id=101;`,'23514');
 for(const [table,column] of [['vendas_arquivos','venda_id'],['contratos_vendas_arquivos','contrato_id'],['ordens_servico_arquivos','ordem_servico_id'],['contas_receber_arquivos','conta_receber_id']]){
  const insert=`INSERT INTO erp.${table}(tenant_id,${column},arquivo_id,finalidade) VALUES(1,101,101,'Comprovante');`;
  await test(table+' vinculo',insert);
  await test(table+' duplicado',insert+insert,'23505');
  await test(table+' preservado',insert+`DELETE FROM erp.${table} WHERE arquivo_id=101;`,'P0001');
 }
 await test('arquivo referenciado imutavel',`INSERT INTO erp.vendas_arquivos(tenant_id,venda_id,arquivo_id,finalidade) VALUES(1,101,101,'Comprovante'); UPDATE erp.arquivos SET caminho='outro.pdf' WHERE id=101;`,'23514');
 await test('evento automatico e imutavel',`UPDATE erp.contas_receber SET descricao='Alterado' WHERE id=101; UPDATE erp.contas_receber_eventos SET evento='forjado' WHERE conta_receber_id=101;`,'P0001');
 await test('evento parcela de outro titulo',`INSERT INTO erp.contas_receber_eventos(tenant_id,conta_receber_id,conta_receber_parcela_id,evento) VALUES(1,101,102,'forjado');`,'23514');
 const activate=`UPDATE erp.contratos_vendas_versoes SET status='efetivada',efetivada_em=now() WHERE contrato_id=101; UPDATE erp.contratos_vendas SET status='ativo' WHERE id=101;`;
 await test('efetivar contrato com itens',activate);
 await test('itens de versao efetivada protegidos',activate+`UPDATE erp.contratos_vendas_itens SET descricao='Outro' WHERE id=101;`,'23514');
 await test('versao sem itens nao efetiva',`INSERT INTO erp.contratos_vendas_versoes(tenant_id,contrato_id,numero,vigencia_inicio,periodicidade,dia_vencimento,motivo,cliente_snapshot,status,efetivada_em) VALUES(1,101,2,'2026-03-01','mensal',1,'Revisao','{}','efetivada',now());`,'23514');
 const cycle=activate+`INSERT INTO erp.contratos_vendas_geracoes(id,tenant_id,contrato_id,contrato_versao_id,competencia,periodo_inicio,periodo_fim,chave_idempotencia,status) SELECT 100,1,101,id,'2026-02-01','2026-02-01','2026-02-28','ciclo','processando' FROM erp.contratos_vendas_versoes WHERE contrato_id=101;`;
 await test('ciclo e tentativa',cycle+`INSERT INTO erp.contratos_vendas_geracoes_tentativas(tenant_id,geracao_id,numero,execucao_id) VALUES(1,100,1,'exec');`);
 await test('duas tentativas ativas rejeitadas',cycle+`INSERT INTO erp.contratos_vendas_geracoes_tentativas(tenant_id,geracao_id,numero,execucao_id) VALUES(1,100,1,'exec'),(1,100,2,'exec2');`,'23505');
 for(const side of ['receber','pagar']){
  await test(side+' pagamento parcial',payment(100,100,side),null,async()=>assert.equal(Number(await scalar(`SELECT valor_pago FROM erp.contas_${side}_parcelas WHERE id=101`)),100));
  await test(side+' credito nao gera caixa',advance(100,1000,side)+application(100,600,side),null,async()=>{
   assert.equal(Number(await scalar('SELECT count(*) FROM erp.pagamentos')),0);
   assert.equal(Number(await scalar(`SELECT saldo FROM erp.composicao_parcela(1,'${side}',101)`)),400);
  });
  await test(side+' excesso no credito',advance(100,500,side)+application(100,600,side),'23514');
  await test(side+' excesso na parcela',advance(100,2000,side)+application(100,1001,side),'23514');
  await test(side+' entidade incorreta',advance(100,1000,side)+application(100,600,side,102),'23514');
  await test(side+' renegociacao integral',agreement(side),null,async()=>assert.equal(await scalar(`SELECT status FROM erp.contas_${side}_parcelas WHERE id=101`),'renegociado'));
  await test(side+' renegociacao preserva pagamento anterior',payment(100,100,side)+agreement(side,900));
  await test(side+' pagar origem renegociada rejeitado',agreement(side)+payment(100,10,side),'23514');
  await test(side+' pagar parcela resultante',agreement(side)+payment(100,100,side,301));
 }
 await test('devolucao parcial',advance()+application()+`INSERT INTO erp.adiantamentos(tenant_id,entidade_id,lado,tipo,adiantamento_id,conta_financeira_id,data_movimento,valor,motivo,chave_idempotencia) VALUES(1,101,'receber','devolucao',100,101,'2026-02-03',100,'Devolver','d');`);
 await test('devolucao excede saldo',advance()+application()+`INSERT INTO erp.adiantamentos(tenant_id,entidade_id,lado,tipo,adiantamento_id,conta_financeira_id,data_movimento,valor,motivo,chave_idempotencia) VALUES(1,101,'receber','devolucao',100,101,'2026-02-03',401,'Devolver','d');`,'23514');
 await test('credito imutavel',advance()+`UPDATE erp.adiantamentos SET valor=2000 WHERE id=100;`,'23514');
 await test('reversao de aplicacao',advance()+application()+`INSERT INTO erp.adiantamentos_aplicacoes(tenant_id,adiantamento_id,conta_receber_parcela_id,valor,data_aplicacao,reversao_de_id,motivo,chave_idempotencia) VALUES(1,100,101,600,'2026-02-03',100,'Reverter','reversao');`);
 await test('estorno exige contramovimento',payment()+`UPDATE erp.pagamentos SET estornado_em=now() WHERE id=100;`,'23514');
 await test('estorno integral',payment()+`UPDATE erp.pagamentos SET estornado_em=now() WHERE id=100; INSERT INTO erp.pagamentos(tenant_id,tipo,conta_receber_parcela_id,conta_financeira_id,data_pagamento,valor,valor_liquido,estorno_de_pagamento_id,motivo_estorno,origem) VALUES(1,'receber',101,101,'2026-02-03',100,100,100,'Correcao','estorno');`);
 const reconcile=`INSERT INTO erp.conciliacoes_bancarias_itens(tenant_id,conciliacao_id,transacao_bancaria_id,pagamento_id,valor_conciliado) VALUES(1,101,101,100,400),(1,101,101,101,600);`;
 await test('um extrato para dois pagamentos',payment(100,400)+payment(101,600)+reconcile);
 await test('conciliacao excede pagamento',payment(100,100)+`INSERT INTO erp.conciliacoes_bancarias_itens(tenant_id,conciliacao_id,transacao_bancaria_id,pagamento_id,valor_conciliado) VALUES(1,101,101,100,101);`,'23514');
 await test('conciliacao sentido incorreto',payment()+`INSERT INTO erp.conciliacoes_bancarias_itens(tenant_id,conciliacao_id,transacao_bancaria_id,pagamento_id,valor_conciliado) VALUES(1,101,102,100,100);`,'23514');
 await test('conciliacao de adiantamento',advance()+`INSERT INTO erp.conciliacoes_bancarias_itens(tenant_id,conciliacao_id,transacao_bancaria_id,adiantamento_id,valor_conciliado) VALUES(1,101,101,100,1000);`);
 await test('adiantamento em periodo fechado',`INSERT INTO erp.fechamentos_periodos(tenant_id,modulo,periodo_inicio,periodo_fim) VALUES(1,'financeiro','2026-02-01','2026-02-28');`+advance(),'23514');
 await test('aplicacao em periodo fechado',advance()+`INSERT INTO erp.fechamentos_periodos(tenant_id,modulo,periodo_inicio,periodo_fim) VALUES(1,'financeiro','2026-02-02','2026-02-28');`+application(),'23514');
 const operation={tenant_id:1,entidade_id:101,lado:'receber',tipo:'constituicao',conta_financeira_id:101,data_movimento:'2026-02-01',valor:1000,motivo:'Antecipacao',chave_idempotencia:'repetivel'};
 const callOperation=o=>`SELECT erp.registrar_operacao_idempotente('adiantamentos','${JSON.stringify(o)}'::jsonb);`;
 const runtime=`SET LOCAL ROLE erp_runtime; SELECT set_config('app.erp_tenant_id','1',true),set_config('app.erp_user_id','1',true);`;
 await test('idempotencia retorna mesmo registro',runtime+callOperation(operation)+callOperation(operation),null,async()=>assert.equal(Number(await scalar('SELECT count(*) FROM erp.adiantamentos')),1));
 await test('idempotencia rejeita conteudo diferente',runtime+callOperation(operation)+callOperation({...operation,valor:999}),'23514');
 await test('idempotencia rejeita outra empresa',runtime+callOperation({...operation,tenant_id:2,entidade_id:201,conta_financeira_id:201}),'42501');
 await test('saldo de titulo acompanha credito',advance()+application(100,1000),null,async()=>assert.equal(await scalar('SELECT status FROM erp.contas_receber WHERE id=101'),'pago'));
 await test('total de titulo confere parcelas',`UPDATE erp.contas_receber SET valor_total=999 WHERE id=101;`,'P0001');
 await test('pagamento runtime e eventos atomicos',runtime+payment(),null,async()=>assert.equal(Number(await scalar('SELECT count(*) FROM erp.contas_receber_eventos WHERE pagamento_id=100')),1));
 await test('reversao de acordo sem dependencias',agreement()+`UPDATE erp.contas_receber_parcelas SET status='cancelado' WHERE id IN(301,302); UPDATE erp.contas_receber SET status='cancelado' WHERE id=300; UPDATE erp.renegociacoes SET status='revertida',revertida_em=now(),motivo_reversao='Correcao' WHERE id=100;`);
 await test('reversao com destino pago rejeitada',agreement()+payment(100,100,'receber',301)+`UPDATE erp.renegociacoes SET status='revertida',revertida_em=now(),motivo_reversao='Correcao' WHERE id=100;`,'23514');
 await test('conciliar pagamento em dois extratos',payment(100,1000)+`INSERT INTO erp.transacoes_bancarias(id,tenant_id,conta_financeira_id,data_transacao,tipo,valor,descricao) VALUES(103,1,101,'2026-02-02','credito',500,'Outra entrada'); INSERT INTO erp.conciliacoes_bancarias_itens(tenant_id,conciliacao_id,transacao_bancaria_id,pagamento_id,valor_conciliado) VALUES(1,101,101,100,500),(1,101,103,100,500);`);
 await test('marcadores de conciliacao derivados',payment(100,400)+payment(101,600)+reconcile,null,async()=>{assert.equal(await scalar('SELECT conciliado FROM erp.pagamentos WHERE id=100'),true);assert.equal(await scalar('SELECT status FROM erp.transacoes_bancarias WHERE id=101'),'conciliada');});
 await test('finalizar tentativa preserva resultado',cycle+`INSERT INTO erp.contratos_vendas_geracoes_tentativas(id,tenant_id,geracao_id,numero,execucao_id) VALUES(100,1,100,1,'exec'); UPDATE erp.contratos_vendas_geracoes SET status='concluida',venda_id=101,processado_em=now() WHERE id=100; UPDATE erp.contratos_vendas_geracoes_tentativas SET status='sucesso',fim=now() WHERE id=100; UPDATE erp.contratos_vendas_geracoes_tentativas SET erro='Editar sucesso' WHERE id=100;`,'23514');
 await test('vigencias sobrepostas rejeitadas',activate+`INSERT INTO erp.contratos_vendas_versoes(id,tenant_id,contrato_id,numero,vigencia_inicio,periodicidade,dia_vencimento,motivo,cliente_snapshot) VALUES(200,1,101,2,'2026-03-01','mensal',1,'Revisao','{}'); INSERT INTO erp.contratos_vendas_itens(tenant_id,contrato_id,contrato_versao_id,item_logico,servico_id,descricao,valor_unitario,total) VALUES(1,101,200,'servico',101,'Servico',100,100); UPDATE erp.contratos_vendas_versoes SET status='efetivada',efetivada_em=now() WHERE id=200;`,'23514');
 await test('dois ciclos semanais na mesma competencia',`UPDATE erp.contratos_vendas_versoes SET periodicidade='semanal' WHERE contrato_id=101;`+activate+`INSERT INTO erp.contratos_vendas_geracoes(tenant_id,contrato_id,contrato_versao_id,competencia,periodo_inicio,periodo_fim,chave_idempotencia) SELECT 1,101,id,'2026-02-01','2026-02-01','2026-02-07','semana1' FROM erp.contratos_vendas_versoes WHERE contrato_id=101; INSERT INTO erp.contratos_vendas_geracoes(tenant_id,contrato_id,contrato_versao_id,competencia,periodo_inicio,periodo_fim,chave_idempotencia) SELECT 1,101,id,'2026-02-01','2026-02-08','2026-02-14','semana2' FROM erp.contratos_vendas_versoes WHERE contrato_id=101;`);
 await test('contato novo reflete no cadastro sem mudar documento antigo',`UPDATE erp.entidades_contatos SET email='novo@example.invalid' WHERE entidade_id=101;`,null,async()=>{assert.equal(await scalar('SELECT email FROM erp.entidades WHERE id=101'),'novo@example.invalid');assert.equal(await scalar("SELECT cliente_snapshot->>'email' FROM erp.vendas WHERE id=101"),'a@example.invalid');});
 const body=evolutionSql.map(sql=>sql.replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,'')).join('\n');
 const result={status:'passed',passed:checks.length,digest:createHash('sha256').update(body).digest('hex'),checks};console.log(JSON.stringify(result,null,2));
 writeFileSync('docs/avaliacao-erp/testes-novas-tabelas.json',JSON.stringify(result,null,2));
}catch(e){console.error(JSON.stringify({passed:checks.length,last:checks.at(-1),code:e.code,message:e.message,where:e.where},null,2));process.exitCode=1;}finally{await db.close();}
