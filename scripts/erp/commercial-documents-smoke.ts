import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {config} from 'dotenv'
import {connection} from './evolution-db.mjs'
import {installFiscalStorageFixture} from './fiscal-storage-fixture.mjs'
import {runWithErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {runWithErpTransactionClient,assertErpTenantScopedQuery,closePool,type SQLClient} from '../../src/lib/postgres'
import {createServiceOrder,getServiceOrder,serviceOrderPage,runServiceOrderAction,convertQuoteToSale,runQuoteAction} from '../../src/products/erp/server/erpProfessionalRepository'
import {createSaleRecord,updateErpSaleDraft} from '../../src/products/erp/server/erpRepository'
import {serviceOrderCreateSchema} from '../../src/products/erp/shared/professionalContracts'
import {erpToday} from '../../src/products/erp/server/erpBusinessDate'
import {commercialDocumentPdf,archiveCommercialDocument} from '../../src/products/erp/server/documents/commercialDocumentRepository'
import {createCommercialLink,verifyCommercialLink} from '../../src/products/erp/server/documents/commercialDocumentLinks'
import {proposalSchema,proposalPreview} from '../../src/products/mcpcore/actions/contracts'
import {operationSnapshot,executeOperation} from '../../src/products/mcpcore/actions/operations'
import {tools} from '../../src/products/mcpcore/tools/catalog'
import {erpReadService} from '../../src/products/erp/server/erpReadService'

// Real ERP, database roles, constraints and repositories. Everything rolls back.
// Only Storage is in memory; no production objects are uploaded by this suite.
config({path:'.env.local',quiet:true})
const storage=installFiscalStorageFixture({buckets:['erp-fiscal','erp-comercial']}),db=connection(),company=2,user=3;
const checks:{name:string;status:string;error?:string}[]=[],report={checks,realDatabase:true,rolledBack:false,originalRowsUnchanged:false,storage:{} as unknown};
let tableNames:string[]=[],serial=0;
async function fingerprint(){await db.query('RESET ROLE');const rows=[];for(const table of tableNames){const q=`SELECT count(*)::int n,md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY to_jsonb(t)::text),'')) hash FROM erp."${table}" t`;rows.push([table,(await db.query(q)).rows[0]])}return createHash('sha256').update(JSON.stringify(rows)).digest('hex')}
async function check(name:string,fn:()=>Promise<void>){await db.query('SAVEPOINT check_case');try{await fn();await db.query('SET CONSTRAINTS ALL IMMEDIATE');checks.push({name,status:'passed'});console.log('PASS '+name)}catch(e){checks.push({name,status:'failed',error:e instanceof Error?e.message:String(e)});console.log('FAIL '+name+': '+checks.at(-1)!.error)}finally{await db.query('ROLLBACK TO SAVEPOINT check_case');await db.query('RELEASE SAVEPOINT check_case')}}
async function rejected(fn:()=>Promise<unknown>,code?:string){const point='negative_'+(++serial);await db.query('SAVEPOINT '+point);try{await assert.rejects(fn,(e:unknown)=>!code||String((e as {code?:string}).code)===code)}finally{await db.query('ROLLBACK TO SAVEPOINT '+point);await db.query('RELEASE SAVEPOINT '+point)}}
async function main(){let before='';try{
 await db.connect();tableNames=(await db.query("SELECT tablename FROM pg_tables WHERE schemaname='erp' ORDER BY tablename")).rows.map(r=>r.tablename);before=await fingerprint();await db.query('BEGIN');
 if(!(await db.query("SELECT 1 FROM supabase_migrations.schema_migrations WHERE version='20261010120000'")).rows.length)await db.query(readFileSync('supabase/migrations/20261010120000_propostas_ordens_documentos.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''));
 await db.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_empresa_id',$1,true),set_config('app.erp_user_id',$2,true),set_config('app.erp_time_zone','America/Fortaleza',true)",[String(company),String(user)]);
 const client:SQLClient={release(){},async query(sql,params){assertErpTenantScopedQuery(sql,params);await db.query(/\berp\.[a-z_][a-z0-9_]*/i.test(sql)?'SET LOCAL ROLE erp_runtime':'RESET ROLE');return db.query(sql,params) as never}};
 await runWithErpDatabaseContext({tenantId:company,userId:user,timeZone:'America/Fortaleza'},()=>runWithErpTransactionClient(client,async()=>{
  const customer=Number((await client.query('SELECT id FROM erp.entidades WHERE empresa_id=$1 AND eh_cliente AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1',[company])).rows[0].id),service=Number((await client.query('SELECT id FROM erp.servicos WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1',[company])).rows[0].id);
  const today=erpToday(),shift=(n:number)=>new Date(new Date(today+'T12:00:00Z').getTime()+n*86400000).toISOString().slice(0,10),item={tipo:'servico' as const,item_id:service,descricao:'Manutenção preventiva e configuração do equipamento',quantidade:2,valor_unitario:100,desconto:0};
  const values=serviceOrderCreateSchema.parse({cliente_id:customer,data_inicio:today,previsao_entrega:shift(10),equipamento:'Notebook profissional',marca:'Dell',modelo:'Latitude',numero_serie:'DEMO-001',problema_informado:'Equipamento com lentidão durante o uso.',diagnostico:'Limpeza, revisão dos componentes e configuração do sistema.',observacoes_publicas:'Prazo estimado de dez dias. Garantia dos serviços: 90 dias.',observacoes_internas:'SEGREDO_INTERNO_NAO_PUBLICAR',desconto:25,itens:[item]});
  const order=async(extra={})=>createServiceOrder({tenantId:company,actorId:user,values:serviceOrderCreateSchema.parse({...values,...extra}),idempotencyKey:randomUUID()});
  const quoteValues={cliente_id:customer,tipo_documento:'orcamento',data_venda:today,validade_em:shift(15),previsao_entrega:shift(10),desconto:25,frete:10,observacoes:'Proposta válida por quinze dias. Garantia de 90 dias.',itens:[item],parcelas:[{data_vencimento:shift(10),valor:100},{data_vencimento:shift(30),valor:85}]};
  const quote=async(extra={})=>Number((await createSaleRecord(client,{tenantId:company,actorId:user,entityId:'pedidos',values:{...quoteValues,...extra},idempotencyKey:randomUUID()})).id);
  await check('OS: idempotência, edição e ciclo completo',async()=>{
   const key=randomUUID(),a=await createServiceOrder({tenantId:company,actorId:user,values,idempotencyKey:key}),id=Number(a.id);assert.equal(String((await createServiceOrder({tenantId:company,actorId:user,values,idempotencyKey:key})).id),String(a.id));
   await createServiceOrder({tenantId:company,actorId:user,orderId:id,expectedVersion:1,values:{...values,diagnostico:'Diagnóstico atualizado'}});
   for(const [action,expectedVersion] of [['aprovar',2],['iniciar',3],['concluir',4]] as const)await runServiceOrderAction({tenantId:company,actorId:user,orderId:id,action,expectedVersion});assert.equal((await getServiceOrder(company,id)).order.status,'concluida');
  });
  await check('OS com entrega: orçamento → venda única, incluindo repetição',async()=>{
   const id=Number((await order()).id),q=await runServiceOrderAction({tenantId:company,actorId:user,orderId:id,action:'gerar_orcamento',expectedVersion:1});
   const sale=await convertQuoteToSale({tenantId:company,actorId:user,quoteId:Number(q.id),expectedVersion:1}),o=(await getServiceOrder(company,id)).order;
   assert.equal(String(o.venda_id),sale.sale.id);const repeated=await runServiceOrderAction({tenantId:company,actorId:user,orderId:id,action:'gerar_venda',expectedVersion:Number(o.versao)});assert.equal(repeated.id,sale.sale.id);assert.equal(repeated.reused,true);
   const [r]=(await client.query('SELECT count(*)::int AS n FROM erp.vendas WHERE empresa_id=$1 AND venda_origem_id=$2',[company,q.id])).rows;assert.equal(r.n,1);
  });
  await check('Conversão iniciada pela OS usa o orçamento existente',async()=>{
   const id=Number((await order()).id),q=await runServiceOrderAction({tenantId:company,actorId:user,orderId:id,action:'gerar_orcamento',expectedVersion:1}),sale=await runServiceOrderAction({tenantId:company,actorId:user,orderId:id,action:'gerar_venda',expectedVersion:2});
   const [r]=(await client.query('SELECT venda_origem_id FROM erp.vendas WHERE empresa_id=$1 AND id=$2',[company,sale.id])).rows;assert.equal(String(r.venda_origem_id),q.id);
  });
  await check('Orçamento enviado/aprovado/recusado e autoria',async()=>{
   const id=await quote();assert.equal((await runQuoteAction({tenantId:company,actorId:user,quoteId:id,action:'enviar',expectedVersion:1})).situacao,'enviada');
   await runQuoteAction({tenantId:company,actorId:user,quoteId:id,action:'aprovar',expectedVersion:2});await runQuoteAction({tenantId:company,actorId:user,quoteId:id,action:'recusar',motivo:'Cliente optou por outra proposta',expectedVersion:3});
   await rejected(()=>convertQuoteToSale({tenantId:company,actorId:user,quoteId:id,expectedVersion:4}),'INVALID_STATE');const [r]=(await client.query('SELECT aprovada_em,aprovada_por,recusada_por,motivo_recusa FROM erp.vendas WHERE empresa_id=$1 AND id=$2',[company,id])).rows;assert(r.aprovada_em);assert.equal(Number(r.aprovada_por),user);assert.equal(Number(r.recusada_por),user);assert(r.motivo_recusa);
   const editable=await quote();await runQuoteAction({tenantId:company,actorId:user,quoteId:editable,action:'aprovar',expectedVersion:1});
   await updateErpSaleDraft({tenantId:company,actorId:user,id:editable,expectedVersion:2,values:{...quoteValues,observacoes:'Condições revisadas após aprovação'}});
   const [renewed]=(await client.query('SELECT situacao,aprovada_em,aprovada_por FROM erp.vendas WHERE empresa_id=$1 AND id=$2',[company,editable])).rows;
   assert.equal(renewed.situacao,'em_andamento');assert.equal(renewed.aprovada_em,null);assert.equal(renewed.aprovada_por,null);
   const [history]=(await client.query("SELECT dados FROM erp.vendas_eventos WHERE empresa_id=$1 AND venda_id=$2 AND evento='atualizada' ORDER BY id DESC LIMIT 1",[company,editable])).rows;
   const previousApproval=(history.dados as {aprovacao_anterior:{por:number;em:string}}).aprovacao_anterior;assert.equal(Number(previousApproval.por),user);assert(previousApproval.em);
  });
  await check('Orçamento vencido bloqueado até renovar validade',async()=>{
   const id=await quote({validade_em:shift(-1)});await rejected(()=>convertQuoteToSale({tenantId:company,actorId:user,quoteId:id,expectedVersion:1}),'QUOTE_EXPIRED');await rejected(()=>runQuoteAction({tenantId:company,actorId:user,quoteId:id,action:'aprovar',expectedVersion:1}),'QUOTE_EXPIRED');
   await updateErpSaleDraft({tenantId:company,actorId:user,id,expectedVersion:1,values:{...quoteValues,validade_em:shift(20)}});await convertQuoteToSale({tenantId:company,actorId:user,quoteId:id,expectedVersion:2});
  });
  await check('Conversões ignoram itens arquivados',async()=>{
   const id=Number((await order({desconto:0,itens:[{...item,quantidade:1},{...item,quantidade:1,descricao:'Item removido'}]})).id);
   await client.query('UPDATE erp.ordens_servico_itens SET excluido_em=now() WHERE empresa_id=$1 AND ordem_servico_id=$2 AND descricao=$3',[company,id,'Item removido']);await client.query('UPDATE erp.ordens_servico SET subtotal=100,total=100 WHERE empresa_id=$1 AND id=$2',[company,id]);
   const sale=await runServiceOrderAction({tenantId:company,actorId:user,orderId:id,action:'gerar_venda',expectedVersion:1});const [r]=(await client.query('SELECT count(*)::int AS n FROM erp.vendas_itens WHERE empresa_id=$1 AND venda_id=$2 AND excluido_em IS NULL',[company,sale.id])).rows;assert.equal(r.n,1);
  });
  await check('MCP: contrato comercial, totais e ferramentas novas',async()=>{
   const {tipo_documento:_type,...fields}=quoteValues;const p=proposalSchema.parse({tipo:'orcamento',dados:{...fields,data_vencimento:shift(10)}});assert.equal(proposalPreview(p).total,185);
   assert(['listar_ordens_servico','obter_ordem_servico','obter_documento_comercial'].every(name=>tools.some(t=>t.name===name)));
   const id=Number((await order()).id),action=proposalSchema.parse({tipo:'aprovar_ordem_servico',dados:{registro_id:id}});assert(await operationSnapshot(company,action,client));assert.equal(await executeOperation(company,user,action,randomUUID()),String(id));
  });
  await check('Paginação e isolamento da empresa',async()=>{
   const first=await serviceOrderPage({tenantId:company,page:1,pageSize:10}),second=await serviceOrderPage({tenantId:company,page:2,pageSize:10});assert(first.total>=24);assert(first.records.length<=10);assert(!second.records.some(r=>first.records.some(p=>p.id===r.id)));
   await rejected(()=>getServiceOrder(company+99999,1));await rejected(()=>commercialDocumentPdf(company,'orcamento',1));
  });
  await check('PDFs: conteúdo comercial, privacidade e links protegidos',async()=>{
   const q=await quote(),o=Number((await order()).id),pdf=await commercialDocumentPdf(company,'orcamento',q),os=await commercialDocumentPdf(company,'ordem_servico',o);
   assert(pdf.bytes.subarray(0,5).toString()==='%PDF-');assert(!os.bytes.includes(Buffer.from('SEGREDO_INTERNO_NAO_PUBLICAR')));assert(os.bytes.includes(Buffer.from('Latitude')));
   mkdirSync('output/pdf',{recursive:true});writeFileSync('output/pdf/proposta-teste.pdf',pdf.bytes);writeFileSync('output/pdf/ordem-servico-teste.pdf',os.bytes);
   const link=createCommercialLink({empresa:company,usuario:user,tipo:'orcamento',registro:q,versao:1},0);assert.equal(verifyCommercialLink(link.token,1).registro,q);assert.throws(()=>verifyCommercialLink(link.token,901000));assert.throws(()=>verifyCommercialLink(link.token.slice(0,-1)+'!'));
   await rejected(()=>commercialDocumentPdf(company,'orcamento',q,{expectedVersion:99}),'VERSION_CONFLICT');
  });
  await check('PDFs privados: revisão, repetição, original e metadados imutáveis',async()=>{
   const q=await quote(),saved=await archiveCommercialDocument(company,user,'orcamento',q,1),again=await archiveCommercialDocument(company,user,'orcamento',q,1);assert.equal(saved.revision,1);assert.equal(again.reused,true);assert.equal(again.id,saved.id);
   const old=await commercialDocumentPdf(company,'orcamento',q,{revision:1});await updateErpSaleDraft({tenantId:company,actorId:user,id:q,expectedVersion:1,values:{...quoteValues,observacoes:'Segunda revisão comercial'}});const second=await archiveCommercialDocument(company,user,'orcamento',q,2);assert.equal(second.revision,2);assert((await commercialDocumentPdf(company,'orcamento',q,{revision:1})).bytes.equals(old.bytes));
   assert.equal((await client.query('UPDATE erp.documentos_comerciais_pdfs SET revisao=99 WHERE empresa_id=$1 AND id=$2 RETURNING id',[company,saved.id])).rows.length,0);
   assert.equal((await client.query('DELETE FROM erp.documentos_comerciais_pdfs WHERE empresa_id=$1 AND id=$2 RETURNING id',[company,saved.id])).rows.length,0);
   await rejected(async()=>{await db.query('RESET ROLE');return db.query('UPDATE erp.documentos_comerciais_pdfs SET revisao=99 WHERE empresa_id=$1 AND id=$2',[company,saved.id])},'23514');
   await rejected(async()=>{await db.query('RESET ROLE');return db.query('DELETE FROM erp.documentos_comerciais_pdfs WHERE empresa_id=$1 AND id=$2',[company,saved.id])},'23514');
   const o=Number((await order()).id);assert.equal((await archiveCommercialDocument(company,user,'ordem_servico',o,1)).revision,1);
   const metadata=await erpReadService.commercialDocument(company,'orcamento',q,1);assert(metadata.record.arquivado);
  });
 }));
 await db.query('RESET ROLE');await db.query('ROLLBACK');report.rolledBack=true;report.originalRowsUnchanged=(await fingerprint())===before;assert(report.originalRowsUnchanged);
 report.storage=storage.report();mkdirSync('.cache/commercial-documents',{recursive:true});writeFileSync('.cache/commercial-documents/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({checks:checks.length,failed:checks.filter(c=>c.status==='failed').length,rolledBack:true,originalRowsUnchanged:true,storage:report.storage}));
 if(checks.some(c=>c.status==='failed'))process.exitCode=1;
}finally{storage.restore();await db.query('ROLLBACK').catch(()=>{});await Promise.allSettled([db.end(),closePool()])}}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1})
