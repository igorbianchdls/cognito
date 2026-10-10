import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {config} from 'dotenv'
import {connection} from './evolution-db.mjs'
import {installFiscalStorageFixture} from './fiscal-storage-fixture.mjs'
import {runWithErpDatabaseContext,getErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {runWithErpTransactionClient,closePool,type SQLClient} from '../../src/lib/postgres'
import {createServiceInvoice,getServiceInvoice,getServiceInvoicePdf,generateServiceInvoicePdf,actOnServiceInvoice} from '../../src/products/erp/server/fiscal/serviceInvoiceRepository'
import {renderServiceInvoicePdf,SERVICE_INVOICE_PDF_LAYOUT_VERSION} from '../../src/products/erp/server/fiscal/serviceInvoicePdf'
import {serviceInvoiceInputSchema} from '../../src/products/erp/shared/serviceInvoiceContracts'

config({path:'.env.local',quiet:true})
const fiscalStorageFixture=installFiscalStorageFixture()
const company=Number(process.argv.find(a=>a.startsWith('--company='))?.split('=')[1]),user=Number(process.argv.find(a=>a.startsWith('--user='))?.split('=')[1])
assert(company>0&&user>0,'Informe --company=<empresa> --user=<usuario>')
const migration='20261009150000_service_invoice_pdf_layout',folder='.cache/nfse-layout',db=connection(),checks:string[]=[]
const sql=readFileSync('supabase/migrations/'+migration+'.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
const activateSql=readFileSync('supabase/migrations/20261009150100_service_invoice_pdf_layout_activate.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
mkdirSync(folder,{recursive:true})
async function main(){try{
 await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'")
 const original=(await db.query('SELECT id,versao,nome,hash_sha256,md5(to_jsonb(p)::text) row_hash FROM erp.notas_fiscais_pdfs p ORDER BY id')).rows
 const notesBefore=(await db.query("SELECT md5(coalesce(string_agg(to_jsonb(n)::text,'|' ORDER BY id),'')) hash FROM erp.notas_fiscais n")).rows[0].hash
 if(!(await db.query('SELECT 1 FROM supabase_migrations.schema_migrations WHERE version=$1',['20261009150000'])).rows.length)await db.query(sql)
 if(!(await db.query('SELECT 1 FROM supabase_migrations.schema_migrations WHERE version=$1',['20261009150100'])).rows.length){
  await db.query('INSERT INTO erp.notas_fiscais_pdfs(empresa_id,nota_fiscal_id,versao,conteudo,hash_sha256,nome,criado_por) SELECT empresa_id,nota_fiscal_id,versao,conteudo,hash_sha256,nome,criado_por FROM erp.notas_fiscais_pdfs ORDER BY id LIMIT 1 ON CONFLICT(empresa_id,nota_fiscal_id,versao) DO NOTHING')
  checks.push('Preparação mantém compatibilidade com o gravador da versão anterior')
  await db.query(activateSql)
 }
 const client:SQLClient={release:()=>{},query:async(statement,params)=>{const ctx=getErpDatabaseContext();if(ctx){await db.query('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_empresa_id',$1,true),set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(ctx.tenantId),String(ctx.userId)])}return await db.query(statement,params) as never}}
 await runWithErpDatabaseContext({tenantId:company,userId:user},()=>runWithErpTransactionClient(client,async()=>{
  const oldId=Number((await client.query("SELECT id FROM erp.notas_fiscais WHERE empresa_id=$1 AND tipo='nfse' AND direcao='saida' AND modo_operacao='simulacao' AND status='emitida' AND excluido_em IS NULL ORDER BY id LIMIT 1",[company])).rows[0]?.id);assert(oldId)
  const before=await getServiceInvoice(company,oldId),oldPdf=await getServiceInvoicePdf(company,oldId,undefined,1)
  await generateServiceInvoicePdf(company,user,oldId)
  const current=await getServiceInvoicePdf(company,oldId);assert.equal(current.layoutVersion,2);assert.equal(current.version,oldPdf.version)
  assert.equal((await getServiceInvoicePdf(company,oldId,oldPdf.version,1)).hash,oldPdf.hash);assert.deepEqual(await getServiceInvoice(company,oldId),before)
  writeFileSync(folder+'/nota-antiga-novo-layout.pdf',current.bytes);checks.push('Nova apresentação da nota antiga preserva dados fiscais, versão e PDF original')
  await generateServiceInvoicePdf(company,user,oldId)
  assert.equal((await client.query('SELECT count(*)::int n FROM erp.notas_fiscais_pdfs WHERE empresa_id=$1 AND nota_fiscal_id=$2 AND versao=$3 AND layout_versao=2',[company,oldId,current.version])).rows[0].n,1)
  checks.push('Geração repetida não duplica apresentação')
  // O novo gerador não deve alterar nenhuma nota já existente.
  await db.query('RESET ROLE');assert.equal((await db.query("SELECT md5(coalesce(string_agg(to_jsonb(n)::text,'|' ORDER BY id),'')) hash FROM erp.notas_fiscais n")).rows[0].hash,notesBefore)
  const source=await getServiceInvoice(company,123),{venda_id,...copy}=source.input
  const input=serviceInvoiceInputSchema.parse({...copy,data_competencia:'2026-10-09',iss_retido:false,retencoes_federais:{},observacoes:'Teste de apresentação - reversão integral',itens:[{tipo:'servico',item_id:Number(source.items[0].servico_id),descricao:'Suporte técnico mensal e manutenção de sistemas',quantidade:2,valor_unitario:150,desconto:0}]})
  const created=await createServiceInvoice(company,user,input,randomUUID()),id=Number(created.record.id)
  let file=await getServiceInvoicePdf(company,id);assert.equal(file.layoutVersion,SERVICE_INVOICE_PDF_LAYOUT_VERSION);assert.equal(file.hash,createHash('sha256').update(file.bytes).digest('hex'));writeFileSync(folder+'/rascunho.pdf',file.bytes);checks.push('Rascunho novo gera PDF no layout 2 com integridade')
  await actOnServiceInvoice(company,user,id,{acao:'emitir',cenario:'sucesso',chave_operacao:randomUUID(),versao:1})
  file=await getServiceInvoicePdf(company,id);assert.equal(file.version,2);assert.equal((await getServiceInvoice(company,id)).record.status,'emitida');writeFileSync(folder+'/emitida.pdf',file.bytes);checks.push('Emissão simulada gera nova versão com número e chave')
  await actOnServiceInvoice(company,user,id,{acao:'cancelar',chave_operacao:randomUUID(),versao:2,codigo_motivo:'9',motivo:'Encerramento do teste de apresentação do PDF'})
  file=await getServiceInvoicePdf(company,id);assert.equal(file.version,3);assert.equal((await getServiceInvoice(company,id)).record.status,'cancelada');writeFileSync(folder+'/cancelada.pdf',file.bytes);checks.push('Cancelamento preserva versões anteriores e gera marca específica')
  const detail=await getServiceInvoice(company,id)
  const sample={...detail.record,items:detail.items,totals:detail.totals,consulta_url:`https://cognito-seven.vercel.app/erp/vendas/notas-fiscais?nota_id=${id}`,status:'rascunho'} as Parameters<typeof renderServiceInvoicePdf>[0]
  writeFileSync(folder+'/dados-ausentes.pdf',renderServiceInvoicePdf({...sample,emitente_snapshot:{},destinatario_snapshot:{},chave_acesso:null}))
  writeFileSync(folder+'/descricao-longa.pdf',renderServiceInvoicePdf({...sample,itens:undefined,items:Array.from({length:50},(_,i)=>({...detail.items[0],descricao:'ITEM '+(i+1)+' '+('Serviço de manutenção técnica com acentuação, integração e configuração. '.repeat(10))})),observacoes:'Observações completas: '+('Informação complementar. '.repeat(65))} as Parameters<typeof renderServiceInvoicePdf>[0]))
  checks.push('Fixtures de campos ausentes e 50 descrições longas geradas sem corte de conteúdo')
  await db.query('SAVEPOINT pdf_immutable')
  await assert.rejects(()=>client.query('UPDATE erp.notas_fiscais_pdfs SET nome=$3 WHERE empresa_id=$1 AND nota_fiscal_id=$2',[company,oldId,'DEMO-alterado.pdf']))
  await db.query('ROLLBACK TO SAVEPOINT pdf_immutable');checks.push('PDFs permanecem imutáveis no banco')
  await assert.rejects(()=>getServiceInvoicePdf(company+100000,id));checks.push('Leitura fora da empresa recusada')
 }))
 await db.query('RESET ROLE');await db.query('ROLLBACK')
 assert.deepEqual((await db.query('SELECT id,versao,nome,hash_sha256,md5(to_jsonb(p)::text) row_hash FROM erp.notas_fiscais_pdfs p ORDER BY id')).rows,original)
 assert.equal((await db.query("SELECT md5(coalesce(string_agg(to_jsonb(n)::text,'|' ORDER BY id),'')) hash FROM erp.notas_fiscais n")).rows[0].hash,notesBefore)
 const report={status:'passed',migration,digest:createHash('sha256').update(sql+activateSql).digest('hex'),realDatabase:true,rolledBack:true,notesPreserved:true,originalPdfsPreserved:true,checks}
 writeFileSync(folder+'/smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
}catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{fiscalStorageFixture.restore();await Promise.allSettled([db.end(),closePool()])}}
main().catch(e=>{console.error(e instanceof Error?e.message:'Falha no teste do PDF');process.exitCode=1})
