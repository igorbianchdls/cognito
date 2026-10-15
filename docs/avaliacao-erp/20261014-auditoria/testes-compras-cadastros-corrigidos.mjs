import assert from 'node:assert/strict'
import {config} from 'dotenv'
import {writeFile,readFile} from 'node:fs/promises'
import {connection} from '../../../scripts/erp/evolution-db.mjs'
import {sourceLoader} from '../../../scripts/erp/accounting-test-runtime.mjs'
config({path:'.env.local',quiet:true})
const load=sourceLoader(),pg=load('@/lib/postgres'),ctx=load('@/lib/erpDatabaseContext'),repo=load('@/products/erp/server/erpRepository'),professional=load('@/products/erp/server/erpProfessionalRepository'),stock=load('@/products/erp/server/erpStockRepository'),imports=load('@/products/erp/server/erpImportRepository'),routines=load('@/products/erp/server/erpRoutineRepository')
const actor={tenantId:2,actorId:3},tag='QA-OTTO-COM-CAD-'+Date.now(),results=[],rollback=new Error('QA_ROLLBACK');let seq=0,lastQuery=''
const key=()=>tag+'-'+(++seq)
const raw=connection();await raw.connect();await raw.query('BEGIN');await raw.query(await readFile('supabase/migrations/20261015010000_fix_supplier_product_write_policies.sql','utf8'));await raw.query("SELECT set_config('app.erp_empresa_id','2',true),set_config('app.erp_tenant_id','2',true),set_config('app.erp_user_id','3',true)");await raw.query('SET LOCAL ROLE erp_runtime');
try{await ctx.runWithErpDatabaseContext({tenantId:2,userId:3,timeZone:'America/Sao_Paulo',statementTimeoutMs:30000},()=>(async fn=>fn(raw))(async client=>{
 const query=client.query.bind(client);client.query=(sql,args)=>{lastQuery=sql.slice(0,180);return query(sql,args)}
 await pg.runWithErpTransactionClient(client,async()=>{
 await client.query('SELECT id FROM erp.produtos WHERE empresa_id=$1 AND id=$2',[2,126]);
 const scenario=async(name,fn)=>{await client.query('SAVEPOINT qa_case');try{const evidence=await fn();await client.query('SET CONSTRAINTS ALL IMMEDIATE');await client.query('SET CONSTRAINTS ALL DEFERRED');results.push({name,passed:true,evidence});console.log('PASS '+name)}catch(e){results.push({name,passed:false,error:{code:e.code,message:e.message,lastQuery}});console.log('FAIL '+name+': '+e.message)}finally{await client.query('ROLLBACK TO SAVEPOINT qa_case');await client.query('RELEASE SAVEPOINT qa_case')}}
 const reject=async fn=>{await client.query('SAVEPOINT qa_reject');try{await assert.rejects(fn)}finally{await client.query('ROLLBACK TO SAVEPOINT qa_reject');await client.query('RELEASE SAVEPOINT qa_reject')}}
 const create=(entityId,values)=>repo.createErpEntityRecord({...actor,entityId,idempotencyKey:key(),values})
 const product=async()=>Number((await create('produtos',{nome:tag,sku:key(),unidade_medida:'UN',preco:100,controla_estoque:'sim',status:'ativo'})).id)
 const balance=async id=>{const r=(await client.query('SELECT quantidade_fisica,custo_medio,quantidade_reservada FROM erp.saldos_estoque WHERE empresa_id=$1 AND produto_id=$2 AND local_estoque_id=$3',[2,id,10])).rows[0];return {quantity:Number(r?.quantidade_fisica||0),cost:Number(r?.custo_medio||0),reserved:Number(r?.quantidade_reservada||0)}}
 const movement=(id,q,type)=>stock.createStockOperation({...actor,resource:'movimentacoes',idempotencyKey:key(),values:{produto_id:id,local_estoque_id:10,tipo:type,quantidade:q,custo_unitario:100,motivo:tag}})
 const purchase=async(ids,extra={})=>{const total=ids.length*100-Number(extra.desconto||0)+Number(extra.frete||0);return Number((await create('pedidos-compra',{fornecedor_id:295,numero:key(),tipo_compra:'produto',tipo_movimento:'compra',natureza_operacao_id:15,categoria_id:129,conta_financeira_id:21,metodo_pagamento_id:21,data_compra:'2026-10-14',data_competencia:'2026-10-14',gera_financeiro:true,itens:ids.map(id=>({produto_id:id,descricao:tag,quantidade:1,valor_unitario:100})),parcelas:[{numero_parcela:1,data_vencimento:'2026-10-14',valor:total,conta_financeira_id:21,metodo_pagamento_id:21}],...extra})).id)}
 for(const entityId of ['clientes','fornecedores','vendedores','produtos','servicos','categorias-cadastro','categorias'])await scenario('Cadastro '+entityId+': criar/editar/buscar/desativar/versão',async()=>{
  const values={nome:tag+' '+entityId,tipo:entityId==='categorias-cadastro'?'produto':entityId==='categorias'?'despesa':'PF',status:'ativo',sku:key(),codigo:key(),unidade_medida:'UN',preco:123.45,custo:50,...(entityId==='categorias'?{dre_grupo_id:'fora'}:{})}
  const created=await create(entityId,values),id=Number(created.id);const record=await repo.getErpEntityRecord({tenantId:2,entityId,id});assert.equal(record.nome,values.nome)
  const changed={...values,nome:values.nome+' editado'};await repo.updateErpEntityRecord({...actor,entityId,id,expectedVersion:Number(record.versao),values:changed})
  const edited=await repo.getErpEntityRecord({tenantId:2,entityId,id});assert.equal(edited.nome,changed.nome)
  await reject(()=>repo.updateErpEntityRecord({...actor,entityId,id,expectedVersion:Number(record.versao),values:values}))
  const page=await repo.listErpEntityPage({tenantId:2,entityId,query:changed.nome,page:1,pageSize:50});assert(page.records.some(r=>Number(r.id)===id))
  const inactive=await repo.deactivateErpEntityRecord({...actor,entityId,id,expectedVersion:Number(edited.versao)});assert(['inativo','pausado'].includes(inactive.status))
  return {id,created:true,edited:true,searched:true,staleVersionRejected:true,deactivated:true}
 })
 await scenario('Contatos de cliente: editar e-mail e telefone preservando documento',async()=>{const v={nome:tag,tipo:'PF',email:'qa-inicial@example.invalid',telefone:'85999990001',status:'ativo'};const c=await create('clientes',v);const r=await repo.getErpEntityRecord({tenantId:2,entityId:'clientes',id:c.id});await repo.updateErpEntityRecord({...actor,entityId:'clientes',id:c.id,expectedVersion:Number(r.versao),values:{...v,email:'qa-editado@example.invalid',telefone:'85999990002'}});const e=await repo.getErpEntityRecord({tenantId:2,entityId:'clientes',id:c.id});assert.equal(e.email,'qa-editado@example.invalid');assert.equal(e.telefone,'85999990002');return {email:e.email,telefone:e.telefone}})
 for(const type of ['clientes','fornecedores','produtos','servicos'])await scenario('CSV '+type+': parcial/reenvio/erros/listagem',async()=>{
  const rows=[{nome:tag+' CSV '+type,sku:key(),codigo:key(),preco:'123,45'}, {nome:'',sku:key(),codigo:key(),preco:'inválido'}]
  const a=await imports.importErpRows({...actor,type,fileName:tag+'.csv',rows});assert.equal(Number(a.imported),1);assert.equal(Number(a.errors),1);assert.equal(a.status,'parcial')
  const b=await imports.importErpRows({...actor,type,fileName:'reenvio.csv',rows});assert.equal(b.id,a.id);assert.equal(Number(b.imported),1)
  const detail=await imports.getImportDetails(2,String(a.id));assert.equal(detail.rows.length,2);assert.equal(detail.rows[1].status,'erro');assert.equal(Number(detail.rows[1].numero_linha),3)
  const listed=await repo.listErpEntityPage({tenantId:2,entityId:type,query:rows[0].nome,page:1,pageSize:100});assert.equal(listed.records.filter(x=>x.nome===rows[0].nome).length,1)
  return {importId:a.id,imported:a.imported,errors:a.errors,replayedId:b.id,errorLine:detail.rows[1].numero_linha}
 })
 await scenario('Categorias de cadastro: hierarquia e tipos incompatíveis',async()=>{const p=await create('categorias-cadastro',{nome:tag,tipo:'produto'});await create('categorias-cadastro',{nome:tag+' filha',tipo:'produto',categoria_pai_id:p.id});await reject(()=>create('categorias-cadastro',{nome:tag+' errada',tipo:'cliente',categoria_pai_id:p.id}));return {sameTypeChild:true,mismatchedTypeRejected:true}})
 await scenario('Compra: cancelar com estoque consumido não deixa efeito parcial',async()=>{
  const p=await product(),q=await product(),id=await purchase([p,q]);const d=await repo.getErpPurchaseDetails(2,id)
  await professional.receivePurchaseItems({...actor,purchaseId:id,idempotencyKey:key(),values:{items:d.items.map(i=>({item_id:Number(i.id),quantidade:1,local_estoque_id:10}))}})
  await movement(q,1,'saida');const before=[await balance(p),await balance(q)],title=(await client.query('SELECT id,status,valor_total FROM erp.contas_pagar WHERE empresa_id=$1 AND compra_id=$2',[2,id])).rows
  await reject(()=>repo.cancelErpPurchase({...actor,id}));assert.deepEqual([await balance(p),await balance(q)],before);assert.deepEqual((await client.query('SELECT id,status,valor_total FROM erp.contas_pagar WHERE empresa_id=$1 AND compra_id=$2',[2,id])).rows,title)
  await movement(q,1,'entrada');await repo.cancelErpPurchase({...actor,id});assert.equal((await balance(p)).quantity,0);assert.equal((await balance(q)).quantity,0);return {insufficientRejected:true,atomic:true,afterRestorationCancelled:true}
 })
 await scenario('Compra multi-itens: custo, frete/desconto, recebimento e reenvio',async()=>{
  const p=await product(),q=await product(),id=await purchase([p,q],{desconto:20,frete:40});const d=await repo.getErpPurchaseDetails(2,id);assert.equal(Number(d.purchase.total),220)
  const input={...actor,purchaseId:id,idempotencyKey:key(),values:{items:d.items.map(i=>({item_id:Number(i.id),quantidade:1,local_estoque_id:10}))}}
  await professional.receivePurchaseItems(input);await professional.receivePurchaseItems(input);assert.equal((await balance(p)).quantity,1);assert.equal((await balance(q)).quantity,1);assert.equal((await balance(p)).cost+(await balance(q)).cost,220)
  const titles=(await client.query('SELECT valor_total FROM erp.contas_pagar WHERE empresa_id=$1 AND compra_id=$2',[2,id])).rows;assert.equal(titles.length,1);assert.equal(Number(titles[0].valor_total),220);return {quantity:2,stockValue:220,payable:220,titles:1}
 })
 await scenario('NF-e inválida e não autorizada recusadas sem gravar',async()=>{const before=(await client.query('SELECT count(*)::int AS n FROM erp.notas_fiscais WHERE empresa_id=$1',[2])).rows[0].n;for(const xml of ['<invalido/>','<nfeProc><protNFe><infProt><cStat>110</cStat></infProt></protNFe></nfeProc>'])await reject(()=>repo.importErpPurchaseInvoice({...actor,values:{xml}}));assert.equal((await client.query('SELECT count(*)::int AS n FROM erp.notas_fiscais WHERE empresa_id=$1',[2])).rows[0].n,before);return {invalidRejected:true,unauthorizedRejected:true,noWrites:true}})
 await scenario('NF-e válida: duplicidade, vínculos e estoque/financeiro coerentes',async()=>{
  const issuer=(await client.query(`SELECT * FROM erp.fiscal_issuer_for_operations($1,$2) AS c(empresa_id,id,cnpj,inscricao_estadual,endereco_codigo_municipio) WHERE empresa_id=$1 LIMIT 1`,[2,'homologacao'])).rows[0];assert(issuer?.cnpj,'Sem emitente homologação configurado')
  const recipient=issuer.cnpj.replace(/\D/g,''),access='232610991013270001175500100000'.slice(0,28)+String(Date.now()).padStart(16,'0').slice(-16),code=key()
  const xml=`<nfeProc><NFe><infNFe Id="NFe${access}"><ide><nNF>990025</nNF><serie>1</serie><dhEmi>2026-10-14T12:00:00-03:00</dhEmi><tpAmb>2</tpAmb></ide><emit><CNPJ>99101327000117</CNPJ><xNome>QA-OTTO Fornecedor Cenário</xNome></emit><dest><CNPJ>${recipient}</CNPJ><xNome>QA-OTTO Destinatário</xNome></dest><det nItem="1"><prod><cProd>${code}</cProd><xProd>${tag}</xProd><uCom>UN</uCom><qCom>2</qCom><vUnCom>50.00</vUnCom><vProd>100.00</vProd><CFOP>5102</CFOP><NCM>84713012</NCM></prod></det><total><ICMSTot><vProd>100.00</vProd><vNF>100.00</vNF></ICMSTot></total></infNFe></NFe><protNFe><infProt><cStat>100</cStat><chNFe>${access}</chNFe><nProt>QA025</nProt></infProt></protNFe></nfeProc>`
  const a=await repo.importErpPurchaseInvoice({...actor,values:{xml,gerar_compra:true,gera_financeiro:true,natureza_operacao_id:15,categoria_id:129,local_estoque_id:10}});const b=await repo.importErpPurchaseInvoice({...actor,values:{xml}});assert.equal(b.reused,true);assert.equal(String(b.invoice.id),String(a.invoice.id))
  const d=await repo.getErpPurchaseDetails(2,Number(a.purchase.id));assert.equal(Number(d.purchase.total),100);assert.equal(Number(d.items[0].quantidade_recebida),2);assert.equal((await balance(Number((await client.query('SELECT produto_id FROM erp.compras_itens WHERE empresa_id=$1 AND compra_id=$2 ORDER BY id LIMIT 1',[2,a.purchase.id])).rows[0].produto_id))).quantity,2)
  const titles=(await client.query('SELECT valor_total FROM erp.contas_pagar WHERE empresa_id=$1 AND compra_id=$2',[2,a.purchase.id])).rows;assert.equal(titles.length,1);assert.equal(Number(titles[0].valor_total),100);return {invoice:a.invoice.id,reused:true,purchase:a.purchase.id,stock:2,payable:100}
 })
 })
 throw rollback
}))}catch(e){if(e!==rollback){console.error(e);results.push({name:'execução',passed:false,error:{message:e.message,lastQuery}})}}finally{await raw.query('ROLLBACK');await raw.end();await pg.closePool();await writeFile('docs/avaliacao-erp/20261014-auditoria/compras-cadastros-corrigidos.json',JSON.stringify({at:new Date().toISOString(),scope:'empresa2 usuário3; serviços reais e banco real; rollback',tag,results},null,2));console.log(JSON.stringify({groups:results.length,passed:results.filter(r=>r.passed).length,failed:results.filter(r=>!r.passed).length}));}
