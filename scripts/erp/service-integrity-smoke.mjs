import {db,restoreCatalog,assert} from './evolution-fixture.mjs';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog} from './evolution-catalog.mjs';
const checks=[];
const integritySql=readFileSync('supabase/migrations/20260909040000_harden_erp_service_integrity.sql','utf8');
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
 mkdirSync('docs/avaliacao-erp/melhorias-estruturais',{recursive:true});
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


 await db.exec(readFileSync('supabase/migrations/20260909033000_drop_erp_financial_views.sql','utf8'));
 writeFileSync('docs/avaliacao-erp/melhorias-estruturais/catalogo-antes-isolado.json',JSON.stringify(await catalog(db),null,2)+'\n');
 await db.exec(integritySql);
 const probes=[];
 async function probe(name,sql,observe){
  if(name.startsWith('view_')) return;
  const accepted=['geracao_com_venda_rascunho_valor_zero','cadastro_novo_legado_apagado_pela_normalizacao','cobranca_paga_sem_liquidacao','evento_cobranca_processamento_bloqueado','leitura_financeira_perfil_consulta','pagamento_com_desconto'];
  await db.exec('BEGIN');
  try{
   let error;
   try{await db.exec(sql);await db.exec('SET CONSTRAINTS ALL IMMEDIATE');}catch(e){error=e;}
   if(accepted.includes(name)){
    assert.equal(error,undefined,name+': '+error?.message);
    if(name==='cadastro_novo_legado_apagado_pela_normalizacao'){
     const e=(await db.query('SELECT email,telefone,celular FROM erp.entidades WHERE id=103')).rows[0];
     assert.deepEqual(e,{email:'comercial@example.invalid',telefone:'111',celular:'222'});
    }
    if(name==='leitura_financeira_perfil_consulta'){
     const r=(await db.query(observe)).rows[0];assert(Number(r.titulos)>0);assert(Number(r.eventos)>0);
    }
    if(name==='pagamento_com_desconto') {const r=(await db.query(observe)).rows[0];assert.equal(Number(r.valor_pago),1000);assert.equal(r.status,'pago');}
   }else{
    assert(error,name+' deveria ser rejeitado');assert(['23514','23505','P0001'].includes(error.code),name+': '+error.code+' '+error.message);
   }
   probes.push({name,result:'passed'});
  }finally{await db.exec('ROLLBACK');}
 }
 const activate="UPDATE erp.contratos_vendas_versoes SET status='efetivada',efetivada_em=now() WHERE contrato_id=101; UPDATE erp.contratos_vendas SET status='ativo' WHERE id=101;";
 await probe('contrato_ciclo_sem_fim',activate+`INSERT INTO erp.contratos_vendas_geracoes(tenant_id,contrato_id,contrato_versao_id,competencia,periodo_inicio,chave_idempotencia) SELECT 1,101,id,'2026-02-01','2026-02-01','sem-fim' FROM erp.contratos_vendas_versoes WHERE contrato_id=101;`,"SELECT periodo_inicio,periodo_fim FROM erp.contratos_vendas_geracoes");
 await probe('mesma_venda_em_dois_ciclos',activate+`INSERT INTO erp.contratos_vendas_geracoes(tenant_id,contrato_id,contrato_versao_id,competencia,periodo_inicio,periodo_fim,chave_idempotencia,status,venda_id) SELECT 1,101,id,'2026-02-01','2026-02-01','2026-02-28','fev','concluida',101 FROM erp.contratos_vendas_versoes WHERE contrato_id=101; INSERT INTO erp.contratos_vendas_geracoes(tenant_id,contrato_id,contrato_versao_id,competencia,periodo_inicio,periodo_fim,chave_idempotencia,status,venda_id) SELECT 1,101,id,'2026-03-01','2026-03-01','2026-03-31','mar','concluida',101 FROM erp.contratos_vendas_versoes WHERE contrato_id=101;`,"SELECT venda_id,count(*) ciclos FROM erp.contratos_vendas_geracoes GROUP BY venda_id");
 await probe('geracao_com_venda_rascunho_valor_zero',activate+`INSERT INTO erp.contratos_vendas_geracoes(tenant_id,contrato_id,contrato_versao_id,competencia,periodo_inicio,periodo_fim,chave_idempotencia,status,venda_id) SELECT 1,101,id,'2026-02-01','2026-02-01','2026-02-28','fev','concluida',101 FROM erp.contratos_vendas_versoes WHERE contrato_id=101;`,"SELECT g.status geracao,v.status venda,v.total FROM erp.contratos_vendas_geracoes g JOIN erp.vendas v ON v.id=g.venda_id");
 await probe('renegociacao_chave_mutavel',`INSERT INTO erp.renegociacoes(tenant_id,entidade_id,lado,numero,data_acordo,motivo,condicoes,chave_idempotencia) VALUES(1,101,'receber','R1','2026-02-01','Prazo','Condicoes','chave1'); UPDATE erp.renegociacoes SET chave_idempotencia='chave2' WHERE numero='R1'; INSERT INTO erp.renegociacoes(tenant_id,entidade_id,lado,numero,data_acordo,motivo,condicoes,chave_idempotencia) VALUES(1,101,'receber','R2','2026-02-01','Prazo','Condicoes','chave1');`,"SELECT numero,chave_idempotencia FROM erp.renegociacoes");
 await probe('transferencia_chave_mutavel',`INSERT INTO erp.transferencias_financeiras(id,tenant_id,conta_origem_id,conta_destino_id,data_transferencia,valor,chave_idempotencia) VALUES(100,1,101,102,'2026-02-01',100,'chave1'); UPDATE erp.transferencias_financeiras SET chave_idempotencia='chave2' WHERE id=100; INSERT INTO erp.transferencias_financeiras(tenant_id,conta_origem_id,conta_destino_id,data_transferencia,valor,chave_idempotencia) VALUES(1,101,102,'2026-02-01',100,'chave1');`,"SELECT count(*) n FROM erp.transferencias_financeiras");
 await probe('titulo_chave_mutavel',`UPDATE erp.contas_receber SET chave_idempotencia='chave1' WHERE id=101; UPDATE erp.contas_receber SET chave_idempotencia='chave2' WHERE id=101; UPDATE erp.contas_receber SET chave_idempotencia='chave1' WHERE id=102;`,"SELECT id,chave_idempotencia FROM erp.contas_receber");
 await probe('parcela_valores_incoerentes',`UPDATE erp.contas_receber_parcelas SET valor_bruto=9999,valor_liquido=1,juros=10000,desconto=5000 WHERE id=101;`,"SELECT valor,valor_bruto,valor_liquido,juros,desconto FROM erp.contas_receber_parcelas WHERE id=101");
 await probe('rateio_acima_titulo',`INSERT INTO erp.categorias(id,tenant_id,nome,tipo) VALUES(100,1,'Receita','receita'); INSERT INTO erp.rateios_financeiros(tenant_id,tipo,conta_receber_id,categoria_id,valor,percentual) VALUES(1,'receber',101,100,2000,10);`,"SELECT valor,percentual FROM erp.rateios_financeiros");
 await probe('os_cliente_diverge_venda',`UPDATE erp.ordens_servico SET cliente_id=102,venda_id=101 WHERE id=101;`);
 await probe('os_nova_cliente_diverge_venda',`INSERT INTO erp.ordens_servico(tenant_id,cliente_id,numero,venda_id) VALUES(1,102,'OS2',101);`);
 await probe('os_item_equacao_incorreta',`INSERT INTO erp.ordens_servico_itens(tenant_id,ordem_servico_id,servico_id,descricao,quantidade,valor_unitario,total) VALUES(1,101,101,'Servico',2,100,1);`,"SELECT quantidade,valor_unitario,total FROM erp.ordens_servico_itens");
 await probe('classificacao_altera_periodo_fechado',`INSERT INTO erp.categorias(id,tenant_id,nome,tipo) VALUES(100,1,'Receita','receita'); UPDATE erp.contas_receber SET categoria_id=100 WHERE id=101; INSERT INTO erp.fechamentos_periodos(tenant_id,modulo,periodo_inicio,periodo_fim) VALUES(1,'financeiro','2026-01-01','2026-01-31'); UPDATE erp.categorias SET tipo='despesa',nome='Despesa' WHERE id=100;`,"SELECT tipo,nome FROM erp.categorias");
 await probe('cadastro_novo_legado_apagado_pela_normalizacao',`INSERT INTO erp.entidades(id,tenant_id,nome,eh_cliente,email,telefone,celular) VALUES(103,1,'Novo cliente',true,'comercial@example.invalid','111','222'); INSERT INTO erp.entidades_contatos(tenant_id,entidade_id,nome,email,finalidades) VALUES(1,103,'Financeiro','financeiro@example.invalid',ARRAY['financeiro']);`,"SELECT email,telefone,celular FROM erp.entidades WHERE id=103");
 await probe('recorrencia_termino_sem_data',`INSERT INTO erp.recorrencias_financeiras(tenant_id,tipo,inicio_em,termino_tipo,termino_em) VALUES(1,'receber','2026-01-01','data',NULL);`,"SELECT tipo,termino_tipo,termino_em FROM erp.recorrencias_financeiras");
 await probe('cobranca_paga_sem_liquidacao',`INSERT INTO erp.cobrancas(tenant_id,conta_receber_parcela_id,tipo,chave_idempotencia,status,valor,data_vencimento) VALUES(1,101,'pix','c1','paga',1000,'2026-03-01');`,"SELECT c.status cobranca,p.status parcela,p.valor_pago FROM erp.cobrancas c JOIN erp.contas_receber_parcelas p ON p.id=c.conta_receber_parcela_id");
 await probe('evento_cobranca_processamento_bloqueado',`INSERT INTO erp.cobrancas(id,tenant_id,conta_receber_parcela_id,tipo,chave_idempotencia,valor,data_vencimento) VALUES(100,1,101,'pix','c1',1000,'2026-03-01'); INSERT INTO erp.cobrancas_eventos(tenant_id,cobranca_id,evento_externo_id,evento) VALUES(1,100,'evt1','recebido'); UPDATE erp.cobrancas_eventos SET processado_em=now() WHERE cobranca_id=100;`);
 await probe('leitura_financeira_perfil_consulta',`SET LOCAL ROLE erp_runtime; SELECT set_config('app.erp_tenant_id','1',true),set_config('app.erp_user_id','2',true);`,"SELECT (SELECT count(*) FROM erp.contas_receber) titulos,(SELECT count(*) FROM erp.contas_receber_eventos) eventos");
 await probe('pagamento_com_desconto',`INSERT INTO erp.pagamentos(tenant_id,tipo,conta_receber_parcela_id,conta_financeira_id,data_pagamento,valor,desconto,valor_liquido) VALUES(1,'receber',101,101,'2026-02-01',1000,100,900);`,"SELECT valor_pago,status FROM erp.contas_receber_parcelas WHERE id=101");
 await probe('arquivo_pagar_conteudo_mutavel',`INSERT INTO erp.contas_pagar_arquivos(tenant_id,conta_pagar_id,arquivo_id) VALUES(1,101,101); UPDATE erp.arquivos SET caminho='substituido.pdf' WHERE id=101;`,"SELECT caminho FROM erp.arquivos WHERE id=101");
 await probe('categoria_ciclo_hierarquico',`INSERT INTO erp.categorias(id,tenant_id,nome,tipo) VALUES(100,1,'A','receita'),(101,1,'B','receita'); UPDATE erp.categorias SET categoria_pai_id=101 WHERE id=100; UPDATE erp.categorias SET categoria_pai_id=100 WHERE id=101;`,"SELECT id,categoria_pai_id FROM erp.categorias");
 await probe('importacao_contadores_incoerentes',`INSERT INTO erp.importacoes_dados(tenant_id,tipo,nome_arquivo,hash_arquivo,status,total_linhas,total_importadas,total_erros) VALUES(1,'clientes','teste.csv','hash','concluida',1,100,50);`,"SELECT total_linhas,total_importadas,total_erros FROM erp.importacoes_dados");
 await probe('pagamento_liquida_previsao_pagar',`UPDATE erp.contas_pagar SET tipo_lancamento='previsao' WHERE id=101;`+payment(100,1000,'pagar'),"SELECT tipo_lancamento,status FROM erp.contas_pagar WHERE id=101");
 const sale=`INSERT INTO erp.vendas(id,tenant_id,cliente_id,numero,data_venda,status,subtotal,total) VALUES(103,1,101,'VENDA-103','2026-02-01','confirmada',100,100); INSERT INTO erp.vendas_itens(id,tenant_id,venda_id,servico_id,descricao,valor_unitario,total) VALUES(103,1,103,101,'Servico',100,100); INSERT INTO erp.vendas_recebimentos_previstos(tenant_id,venda_id,numero_parcela,data_vencimento,valor) VALUES(1,103,1,'2026-03-01',100); SET CONSTRAINTS ALL IMMEDIATE; SET CONSTRAINTS ALL DEFERRED;`;
 await probe('mover_item_deixa_venda_origem_inconsistente',sale+`UPDATE erp.vendas_itens SET venda_id=101 WHERE id=103; UPDATE erp.vendas SET status='confirmada',subtotal=100,total=100 WHERE id=101; INSERT INTO erp.vendas_recebimentos_previstos(tenant_id,venda_id,numero_parcela,data_vencimento,valor) VALUES(1,101,1,'2026-03-01',100);`,"SELECT v.id,v.subtotal,(SELECT coalesce(sum(i.total),0) FROM erp.vendas_itens i WHERE i.venda_id=v.id) soma_itens FROM erp.vendas v ORDER BY v.id");
 await probe('venda_item_equacao_incorreta',sale+`UPDATE erp.vendas_itens SET quantidade=100,valor_unitario=100,total=100 WHERE id=103;`,"SELECT quantidade,valor_unitario,total FROM erp.vendas_itens WHERE id=103");
 await probe('venda_percentual_tratado_como_valor',sale+`UPDATE erp.vendas_itens SET valor_unitario=200,total=200 WHERE id=103; UPDATE erp.vendas_recebimentos_previstos SET valor=190 WHERE venda_id=103; UPDATE erp.vendas SET subtotal=200,tipo_desconto='percentual',desconto=10,total=190 WHERE id=103;`,"SELECT subtotal,tipo_desconto,desconto,total FROM erp.vendas WHERE id=103");
 await probe('view_aging_ignora_credito',advance()+application(),"SELECT (SELECT saldo FROM erp.composicao_parcela(1,'receber',101)) saldo_correto,(SELECT saldo FROM erp.vw_aging_receber WHERE parcela_id=101) saldo_view");
 await probe('view_dre_duplica_renegociacao',agreement(),"SELECT sum(valor) receita_reportada FROM erp.vw_dre_gerencial WHERE tenant_id=1 AND tipo='receita'");
 await probe('view_caixa_ignora_adiantamento',advance(),"SELECT (SELECT sum(valor) FROM erp.adiantamentos) entrada_adiantamento,(SELECT coalesce(sum(entradas),0) FROM erp.vw_fluxo_caixa_diario) entrada_view");

 const extra=async(name,sql,code,verify)=>{await test(name,sql,code,verify);probes.push({name,result:'passed'});};
 await extra('desconto_percentual_correto',sale+`UPDATE erp.vendas_itens SET valor_unitario=200,total=200 WHERE id=103; UPDATE erp.vendas_recebimentos_previstos SET valor=180 WHERE venda_id=103; UPDATE erp.vendas SET subtotal=200,tipo_desconto='percentual',desconto=10,total=180 WHERE id=103;`,null,async()=>assert.equal(Number(await scalar('SELECT desconto_calculado FROM erp.vendas WHERE id=103')),20));
 await extra('rateio_integral_valido',`INSERT INTO erp.categorias(id,tenant_id,nome,tipo) VALUES(100,1,'Receita','receita'); INSERT INTO erp.rateios_financeiros(tenant_id,tipo,conta_receber_id,categoria_id,valor,percentual) VALUES(1,'receber',101,100,600,60),(1,'receber',101,100,400,40);`);
 await extra('parcela_nova_previsao_derivada',`INSERT INTO erp.contas_receber(id,tenant_id,cliente_id,descricao,valor_total) VALUES(500,1,101,'Teste',100); INSERT INTO erp.contas_receber_parcelas(tenant_id,conta_receber_id,data_vencimento,valor,juros,desconto) VALUES(1,500,'2026-03-01',100,10,5);`,null,async()=>assert.equal(Number(await scalar('SELECT valor_liquido FROM erp.contas_receber_parcelas WHERE conta_receber_id=500')),105));
 await extra('recorrencia_indeterminada_valida',`INSERT INTO erp.recorrencias_financeiras(tenant_id,inicio_em,termino_tipo) VALUES(1,'2026-01-01','indeterminado');`);
 await extra('previsao_efetivada_antes_pagamento',`UPDATE erp.contas_pagar SET tipo_lancamento='previsao' WHERE id=101; UPDATE erp.contas_pagar SET tipo_lancamento='efetivo',efetivado_em=now() WHERE id=101;`+payment(100,1000,'pagar'));
 await extra('contato_financeiro_nao_limpa_endereco_parcial',`INSERT INTO erp.entidades(id,tenant_id,nome,cidade,eh_cliente) VALUES(501,1,'Parcial','Fortaleza',true); INSERT INTO erp.entidades_enderecos(tenant_id,entidade_id,identificacao,cidade,finalidades) VALUES(1,501,'Cobranca','Recife',ARRAY['cobranca']);`,null,async()=>assert.equal(await scalar('SELECT cidade FROM erp.entidades WHERE id=501'),'Fortaleza'));
 await extra('chave_nao_apaga_registro',`INSERT INTO erp.renegociacoes(id,tenant_id,entidade_id,lado,numero,data_acordo,motivo,condicoes,chave_idempotencia) VALUES(500,1,101,'receber','R500','2026-02-01','Teste','Prazo','del500'); DELETE FROM erp.renegociacoes WHERE id=500;`,'23514');
 await extra('chave_nao_libera_exclusao_logica',`INSERT INTO erp.vendas(id,tenant_id,cliente_id,numero,chave_idempotencia) VALUES(500,1,101,'V500','v500'); UPDATE erp.vendas SET excluido_em=now() WHERE id=500; INSERT INTO erp.vendas(tenant_id,cliente_id,numero,chave_idempotencia) VALUES(1,101,'V501','v500');`,'23505');
 await extra('evento_envelope_nao_altera',`INSERT INTO erp.cobrancas(id,tenant_id,conta_receber_parcela_id,tipo,chave_idempotencia,valor,data_vencimento) VALUES(500,1,101,'pix','c500',1000,'2026-03-01'); INSERT INTO erp.cobrancas_eventos(tenant_id,cobranca_id,evento_externo_id,evento) VALUES(1,500,'evt500','recebido'); UPDATE erp.cobrancas_eventos SET payload='{"troca":true}' WHERE cobranca_id=500;`,'23514');
 await extra('importacao_vazia_valida',`INSERT INTO erp.importacoes_dados(tenant_id,tipo,nome_arquivo,hash_arquivo) VALUES(1,'clientes','vazio.csv','vazio');`);
 await extra('execucao_concluida_sem_datas_rejeitada',`INSERT INTO erp.execucoes_automacao(tenant_id,tipo,status,chave_idempotencia) VALUES(1,'contratos','concluida','e500');`,'23514');
 await extra('os_valida',`INSERT INTO erp.ordens_servico(id,tenant_id,cliente_id,numero,status,subtotal,total) VALUES(500,1,101,'OS500','aprovada',200,200); INSERT INTO erp.ordens_servico_itens(tenant_id,ordem_servico_id,servico_id,descricao,quantidade,valor_unitario,total) VALUES(1,500,101,'Servico',2,100,200);`);

 await extra('compra_item_valido',`INSERT INTO erp.compras(id,tenant_id,fornecedor_id,numero,tipo_compra) VALUES(500,1,101,'C500','servico'); INSERT INTO erp.compras_itens(tenant_id,compra_id,servico_id,descricao,quantidade,valor_unitario,total,valor_desconto,percentual_desconto) VALUES(1,500,101,'Servico',2,100,180,20,10);`);
 await extra('compra_item_invalido',`INSERT INTO erp.compras(id,tenant_id,fornecedor_id,numero,tipo_compra) VALUES(500,1,101,'C500','servico'); INSERT INTO erp.compras_itens(tenant_id,compra_id,servico_id,descricao,quantidade,valor_unitario,total) VALUES(1,500,101,'Servico',2,100,1);`,'23514');
 await extra('recorrencia_receber_com_origem',`INSERT INTO erp.recorrencias_financeiras(id,tenant_id,tipo,inicio_em,termino_tipo) VALUES(500,1,'receber','2026-01-31','indeterminado'); INSERT INTO erp.contas_receber(id,tenant_id,cliente_id,descricao,valor_total,data_competencia,recorrencia_financeira_id) VALUES(500,1,101,'Mensal',100,'2026-02-28',500); INSERT INTO erp.contas_receber_parcelas(tenant_id,conta_receber_id,data_vencimento,valor) VALUES(1,500,'2026-02-28',100);`);
 await extra('recorrencia_competencia_invalida',`INSERT INTO erp.recorrencias_financeiras(id,tenant_id,tipo,inicio_em,termino_tipo) VALUES(500,1,'receber','2026-01-31','indeterminado'); INSERT INTO erp.contas_receber(id,tenant_id,cliente_id,descricao,valor_total,data_competencia,recorrencia_financeira_id) VALUES(500,1,101,'Mensal',0,'2026-02-27',500);`,'23514');
 await extra('leitor_eventos_outra_empresa_invisivel',`SET LOCAL ROLE erp_runtime; SELECT set_config('app.erp_tenant_id','2',true),set_config('app.erp_user_id','2',true);`,null,async()=>assert.equal(Number(await scalar('SELECT count(*) FROM erp.contas_receber_eventos')),0));
 await extra('categoria_rotulo_editavel',`INSERT INTO erp.categorias(id,tenant_id,nome,tipo) VALUES(500,1,'Receita','receita'); UPDATE erp.contas_receber SET categoria_id=500 WHERE id=101; UPDATE erp.categorias SET nome='Honorarios' WHERE id=500;`);
 await extra('saldo_inicial_utilizado_preservado',payment()+`UPDATE erp.contas_financeiras SET saldo_inicial=100 WHERE id=101;`,'23514');
 await extra('evento_resultado_uma_vez',`INSERT INTO erp.cobrancas(id,tenant_id,conta_receber_parcela_id,tipo,chave_idempotencia,valor,data_vencimento) VALUES(500,1,101,'pix','c500',1000,'2026-03-01'); INSERT INTO erp.cobrancas_eventos(tenant_id,cobranca_id,evento_externo_id,evento) VALUES(1,500,'evt500','recebido'); UPDATE erp.cobrancas_eventos SET processado_em=now() WHERE cobranca_id=500; UPDATE erp.cobrancas_eventos SET erro_mensagem='reescrever' WHERE cobranca_id=500;`,'23514');
 await extra('execucao_fluxo_com_historico',`INSERT INTO erp.execucoes_automacao(id,tenant_id,tipo,chave_idempotencia) VALUES(500,1,'contratos','e500'); UPDATE erp.execucoes_automacao SET status='processando',iniciado_em=now(),tentativas=1 WHERE id=500; UPDATE erp.execucoes_automacao SET status='falha',finalizado_em=now(),erro='Indisponivel' WHERE id=500; UPDATE erp.execucoes_automacao SET status='processando',finalizado_em=NULL,tentativas=2 WHERE id=500; UPDATE erp.execucoes_automacao SET status='concluida',finalizado_em=now(),erro=NULL WHERE id=500;`,null,async()=>assert.equal(Number(await scalar('SELECT jsonb_array_length(historico_estados) FROM erp.execucoes_automacao WHERE id=500')),5));
 await extra('importacao_com_resultado_valida',`INSERT INTO erp.importacoes_dados(id,tenant_id,tipo,nome_arquivo,hash_arquivo,status,total_linhas,total_validas,total_importadas,concluido_em) VALUES(500,1,'clientes','a.csv','hash500','concluida',1,1,1,now()); INSERT INTO erp.importacoes_dados_linhas(tenant_id,importacao_id,numero_linha,dados_originais,status,registro_id,processado_em) VALUES(1,500,1,'{}','importada',101,now());`);
 await extra('importacao_resultado_inexistente',`INSERT INTO erp.importacoes_dados(id,tenant_id,tipo,nome_arquivo,hash_arquivo,status,total_linhas,total_validas,total_importadas,concluido_em) VALUES(500,1,'clientes','a.csv','hash500','concluida',1,1,1,now()); INSERT INTO erp.importacoes_dados_linhas(tenant_id,importacao_id,numero_linha,dados_originais,status,registro_id,processado_em) VALUES(1,500,1,'{}','importada',999999,now());`,'23514');
 await extra('snapshot_final_nao_reabre',sale+`UPDATE erp.vendas SET status='rascunho' WHERE id=103;`,'23514');
 await extra('notificacao_fluxo_valido',`INSERT INTO erp.cobrancas(id,tenant_id,conta_receber_parcela_id,tipo,chave_idempotencia,valor,data_vencimento) VALUES(500,1,101,'pix','c500',1000,'2026-03-01'); INSERT INTO erp.cobrancas_notificacoes(id,tenant_id,cobranca_id,canal,destinatario,agendada_em) VALUES(500,1,500,'email','teste@example.invalid',now()); UPDATE erp.cobrancas_notificacoes SET status='enviada',enviada_em=now() WHERE id=500; UPDATE erp.cobrancas_notificacoes SET status='entregue',entregue_em=now() WHERE id=500;`,null,async()=>assert.equal(Number(await scalar('SELECT jsonb_array_length(historico_estados) FROM erp.cobrancas_notificacoes WHERE id=500')),3));


 await extra('endereco_vazio_rejeitado',`INSERT INTO erp.entidades_enderecos(tenant_id,entidade_id,identificacao) VALUES(1,101,'Vazio');`,'23514');
 await extra('item_contrato_snapshot',`INSERT INTO erp.contratos_vendas_itens(tenant_id,contrato_id,contrato_versao_id,item_logico,servico_id,descricao,quantidade,valor_unitario,total,unidade) SELECT 1,101,id,'horas',101,'Servico',1,100,100,'hora' FROM erp.contratos_vendas_versoes WHERE contrato_id=101;`,null,async()=>assert.equal(await scalar("SELECT classificacao_snapshot->>'nome' FROM erp.contratos_vendas_itens WHERE item_logico='horas'"),'Servico'));
 await extra('compra_recorrente_valida',`INSERT INTO erp.compras(id,tenant_id,fornecedor_id,numero,tipo_compra) VALUES(500,1,101,'CM','servico'),(501,1,101,'CG','servico'); INSERT INTO erp.compras_recorrencias(id,tenant_id,compra_modelo_id,inicio_em,termino_tipo) VALUES(500,1,500,'2026-01-31','indeterminado'); INSERT INTO erp.compras_recorrencias_geracoes(tenant_id,recorrencia_id,compra_id,competencia) VALUES(1,500,501,'2026-02-28');`);
 await extra('compra_recorrente_fornecedor_incompativel',`INSERT INTO erp.compras(id,tenant_id,fornecedor_id,numero,tipo_compra) VALUES(500,1,101,'CM','servico'),(501,1,102,'CG','servico'); INSERT INTO erp.compras_recorrencias(id,tenant_id,compra_modelo_id,inicio_em,termino_tipo) VALUES(500,1,500,'2026-01-31','indeterminado'); INSERT INTO erp.compras_recorrencias_geracoes(tenant_id,recorrencia_id,compra_id,competencia) VALUES(1,500,501,'2026-02-28');`,'23514');
 await extra('execucao_evento_vinculada',`INSERT INTO erp.cobrancas(id,tenant_id,conta_receber_parcela_id,tipo,chave_idempotencia,valor,data_vencimento) VALUES(500,1,101,'pix','c500',1000,'2026-03-01'); INSERT INTO erp.cobrancas_eventos(id,tenant_id,cobranca_id,evento_externo_id,evento) VALUES(500,1,500,'evt500','recebido'); INSERT INTO erp.execucoes_automacao(tenant_id,tipo,chave_idempotencia,evento_cobranca_id) VALUES(1,'cobrancas_eventos','evento500',500);`);
 await extra('previsao_link_financeiro',sale+`INSERT INTO erp.contas_receber(id,tenant_id,cliente_id,venda_id,descricao,valor_total) VALUES(500,1,101,103,'Titulo',100); INSERT INTO erp.contas_receber_parcelas(tenant_id,conta_receber_id,data_vencimento,valor,recebimento_previsto_id) SELECT 1,500,'2026-03-01',100,id FROM erp.vendas_recebimentos_previstos WHERE venda_id=103;`);

 const result={date:new Date().toISOString(),engine:'PostgreSQL isolado/PGlite',status:'passed',checks:probes.length,probes};
 result.digest=createHash('sha256').update(integritySql).digest('hex');
 writeFileSync('docs/avaliacao-erp/melhorias-estruturais/catalogo-esperado.json',JSON.stringify(await catalog(db),null,2)+'\n');
 writeFileSync('docs/avaliacao-erp/melhorias-estruturais/provas.json',JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({status:'passed',checks:probes.length}));
}catch(e){console.error({code:e.code,message:e.message,where:e.where,position:e.position,internalPosition:e.internalPosition,internalQuery:e.internalQuery});process.exitCode=1;}finally{await db.close();}
