import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {writeFileSync,readFileSync,mkdirSync} from 'node:fs'
import {config} from 'dotenv'
import {connection} from './evolution-db.mjs'
import {installFiscalStorageFixture} from './fiscal-storage-fixture.mjs'
import {runWithErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {runWithErpTransactionClient,assertErpTenantScopedQuery,closePool,type SQLClient} from '../../src/lib/postgres'
import {getServiceInvoice,createServiceInvoice,editServiceInvoice,actOnServiceInvoice,getServiceInvoicePdf,getServiceInvoiceXml} from '../../src/products/erp/server/fiscal/serviceInvoiceRepository'
import {serviceInvoiceInputSchema} from '../../src/products/erp/shared/serviceInvoiceContracts'
import {createSaleRecord} from '../../src/products/erp/server/erpRepository'
import {archiveCommercialDocument,commercialDocumentPdf} from '../../src/products/erp/server/documents/commercialDocumentRepository'
import {listAttachments,attachmentDownload} from '../../src/products/erp/server/erpAttachments'
import {erpToday} from '../../src/products/erp/server/erpBusinessDate'
import {createServiceOrder} from '../../src/products/erp/server/erpProfessionalRepository'
import {serviceOrderCreateSchema} from '../../src/products/erp/shared/professionalContracts'
import {signErpDocumentFile} from '../../src/products/erp/server/erpStorage'
config({path:'.env.local',quiet:true})
const report:any={checks:[],rolledBack:false,originalRowsUnchanged:false},db=connection(),company=2,user=3
const fixture=installFiscalStorageFixture({buckets:['erp-fiscal','erp-comercial']})
let tables:string[]=[]
async function fingerprint(){await db.query('RESET ROLE');const rows=[];for(const table of tables)rows.push([table,(await db.query(`SELECT count(*)::int n,md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY to_jsonb(t)::text),'')) hash FROM erp."${table}" t`)).rows[0]]);return createHash('sha256').update(JSON.stringify(rows)).digest('hex')}
async function main(){try{
 await db.connect();tables=(await db.query("SELECT tablename FROM pg_tables WHERE schemaname='erp' ORDER BY tablename")).rows.map((r:{tablename:string})=>r.tablename);const before=await fingerprint();await db.query('BEGIN');
 await db.query(readFileSync('supabase/migrations/20261010130000_documentos_anexos_orcamento.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''));
 await db.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_empresa_id',$1,true),set_config('app.erp_user_id',$2,true),set_config('app.erp_time_zone','America/Fortaleza',true)",['2','3']);
 const client:SQLClient={release(){},async query(sql,params){assertErpTenantScopedQuery(sql,params);await db.query(/\berp\.[a-z_][a-z0-9_]*/i.test(sql)?'SET LOCAL ROLE erp_runtime':'RESET ROLE');return db.query(sql,params) as never}};
 await runWithErpDatabaseContext({tenantId:company,userId:user,timeZone:'America/Fortaleza'},()=>runWithErpTransactionClient(client,async()=>{
  const source=(await client.query("SELECT id FROM erp.notas_fiscais WHERE empresa_id=$1 AND status='emitida' AND tipo='nfse' AND modo_operacao='simulacao' AND excluido_em IS NULL ORDER BY id LIMIT 1",[company])).rows[0];assert(source);
  const input=serviceInvoiceInputSchema.parse({...((await getServiceInvoice(company,Number(source.id))).input),venda_id:undefined,data_competencia:erpToday(),observacoes:'Revisao temporaria com rollback'});
  const created=await createServiceInvoice(company,user,input,randomUUID()),id=Number(created.record.id);
  const oldName=String((created.record.destinatario_snapshot as any).nome),newName='CLIENTE_REVISAO_ATUAL';
  await client.query('UPDATE erp.entidades SET nome=$3 WHERE empresa_id=$1 AND id=$2',[company,input.cliente_id,newName]);
  await actOnServiceInvoice(company,user,id,{acao:'emitir',cenario:'sucesso',chave_operacao:randomUUID(),versao:1});
  const row=(await client.query('SELECT destinatario_snapshot,integracao_snapshot FROM erp.notas_fiscais WHERE empresa_id=$1 AND id=$2',[company,id])).rows[0] as any;
  const pdf=await getServiceInvoicePdf(company,id),xml=await getServiceInvoiceXml(company,id);
  assert.equal(row.destinatario_snapshot.nome,oldName);assert.equal(row.integracao_snapshot.dps.infDPS.toma.xNome,oldName);
  assert(pdf.bytes.includes(Buffer.from(oldName,'latin1')));assert(!pdf.bytes.includes(Buffer.from(newName)));assert(!JSON.stringify(xml).includes(newName));
  report.checks.push({name:'NFS-e preserva o tomador revisado no PDF e XML',status:'passed'});
  const next=Number((await createServiceInvoice(company,user,input,randomUUID())).record.id),draft=await getServiceInvoicePdf(company,next);
  const editedName='CLIENTE_ATUALIZADO_EDITADO';await client.query('UPDATE erp.entidades SET nome=$3 WHERE empresa_id=$1 AND id=$2',[company,input.cliente_id,editedName]);
  await editServiceInvoice(company,user,next,input,randomUUID(),1);
  await actOnServiceInvoice(company,user,next,{acao:'emitir',cenario:'demora',chave_operacao:randomUUID(),versao:2});
  await client.query('UPDATE erp.entidades SET nome=$3 WHERE empresa_id=$1 AND id=$2',[company,input.cliente_id,'ALTERACAO_POSTERIOR_A_EMISSAO']);
  await actOnServiceInvoice(company,user,next,{acao:'consultar',chave_operacao:randomUUID(),versao:3});
  const editedPdf=await getServiceInvoicePdf(company,next),editedXml=await getServiceInvoiceXml(company,next);
  assert(editedPdf.bytes.includes(Buffer.from(editedName)));assert(JSON.stringify(editedXml).includes(editedName));
  assert((await getServiceInvoicePdf(company,next,1)).bytes.equals(draft.bytes));
  report.checks.push({name:'Edicao atualiza o tomador; retorno posterior e revisao original permanecem consistentes',status:'passed'});
  const values={cliente_id:input.cliente_id,tipo_documento:'orcamento',data_venda:erpToday(),itens:[{tipo:'servico',item_id:input.itens[0].item_id,descricao:'Revisao temporaria',quantidade:1,valor_unitario:100,desconto:0}],parcelas:[{data_vencimento:erpToday(),valor:100}]};
  const q=Number((await createSaleRecord(client,{tenantId:company,actorId:user,entityId:'pedidos',values,idempotencyKey:randomUUID()})).id);
  await archiveCommercialDocument(company,user,'orcamento',q,1);
  const list=await listAttachments(company,'venda',q);assert.equal(list.length,1);
  const download=await attachmentDownload(company,Number(list[0].id));assert(download.url.includes('/erp-comercial/'));assert(download.url.includes('token=fixture'));
  const accessible=(await client.query('SELECT * FROM erp.anexo_acessivel(empresa_id=>$1,p_arquivo_id=>$2,p_escrita=>false)',[company,list[0].id])).rows;
  const dedicated=await commercialDocumentPdf(company,'orcamento',q,{revision:1});
  assert.equal(accessible.length,1);assert.equal(dedicated.bytes.subarray(0,5).toString(),'%PDF-');
  await assert.rejects(()=>client.query('SELECT * FROM erp.anexo_acessivel(empresa_id=>$1,p_arquivo_id=>$2,p_escrita=>false)',[company+99999,list[0].id]),/tenant diferente/);
  report.checks.push({name:'Proposta arquivada baixa pelos anexos e rota propria; empresa diferente bloqueada',status:'passed'});
  const order=Number((await createServiceOrder({tenantId:company,actorId:user,values:serviceOrderCreateSchema.parse({cliente_id:input.cliente_id,data_inicio:erpToday(),itens:values.itens}),idempotencyKey:randomUUID()})).id);
  await archiveCommercialDocument(company,user,'ordem_servico',order,1);const orderFiles=await listAttachments(company,'ordem_servico',order);assert.equal(orderFiles.length,1);
  assert((await attachmentDownload(company,Number(orderFiles[0].id))).url.includes('/erp-comercial/'));
  await assert.rejects(()=>signErpDocumentFile({bucket:'erp-comercial',caminho:'2/test.pdf',nome:'test.pdf'},{base:'https://aaaaaaaaaaaaaaaaaaaa.supabase.co'}),(e:unknown)=>(e as {code:string}).code==='STORAGE_UNAVAILABLE');
  report.checks.push({name:'OS usa o Storage comercial; configuracao de outro projeto recusada',status:'passed'});
 }));
 await db.query('RESET ROLE');await db.query('ROLLBACK');report.rolledBack=true;report.originalRowsUnchanged=(await fingerprint())===before;assert(report.originalRowsUnchanged);report.storage=fixture.report();
 mkdirSync('.cache/commercial-documents',{recursive:true});writeFileSync('.cache/commercial-documents/consistency-fixes.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}finally{fixture.restore();await db.query('ROLLBACK').catch(()=>{});await Promise.allSettled([db.end(),closePool()])}}
main().catch(e=>{console.error(e instanceof Error?e.message:String(e));process.exitCode=1})
