import assert from 'node:assert/strict'
import {createHash,randomUUID} from 'node:crypto'
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs'
import dotenv from 'dotenv'
import {runInNewContext} from 'node:vm'
import {connection} from './evolution-db.mjs'
import {runWithErpDatabaseContext,getErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {runWithErpTransactionClient,closePool,assertErpTenantScopedQuery,type SQLClient} from '../../src/lib/postgres'
import {fiscalPdfPath,uploadFiscalPdf,readFiscalPdf,fiscalStorageConfiguration} from '../../src/products/erp/server/fiscal/fiscalPdfStorage'
import {createServiceInvoice,editServiceInvoice,actOnServiceInvoice,getServiceInvoice,getServiceInvoicePdf} from '../../src/products/erp/server/fiscal/serviceInvoiceRepository'
import {serviceInvoiceInputSchema} from '../../src/products/erp/shared/serviceInvoiceContracts'

dotenv.config({path:'.env.local',quiet:true})
const company=Number(process.argv.find(a=>a.startsWith('--company='))?.split('=')[1]),user=Number(process.argv.find(a=>a.startsWith('--user='))?.split('=')[1])
assert(company>0&&user>0,'Informe --company=<empresa> --user=<usuario>')
const db=connection(),checks:string[]=[],objects=new Map<string,Buffer>(),originalFetch=globalThis.fetch
const saved={url:process.env.ERP_FISCAL_SUPABASE_URL,key:process.env.ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY}
process.env.ERP_FISCAL_SUPABASE_URL='https://mtadnxqoqxzbdksktwdr.supabase.co'
process.env.ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY='sb_secret_fiscal_test_fixture'
let nextFailure:'before'|'after'|undefined,requests=0
globalThis.fetch=async(input,init)=>{
 const url=new URL(String(input));if(url.hostname!=='mtadnxqoqxzbdksktwdr.supabase.co'||!url.pathname.startsWith('/storage/v1/object/'))throw new Error('External request refused by test fixture')
 requests++;const headers=new Headers(init?.headers);assert.equal(headers.get('Authorization'),'Bearer sb_secret_fiscal_test_fixture')
 const path=url.pathname.replace(/^\/storage\/v1\/object\/(?:authenticated\/)?/,'')
 if(init?.method==='POST'){
  assert.equal(headers.get('x-upsert'),'false');if(nextFailure==='before'){nextFailure=undefined;throw new Error('Upload unavailable')}
  if(objects.has(path))return Response.json({error:'exists'},{status:400})
  objects.set(path,Buffer.from(init.body as Uint8Array));if(nextFailure==='after'){nextFailure=undefined;throw new Error('Response lost after upload')}
  return Response.json({Key:path})
 }
 const bytes=objects.get(path);return bytes?new Response(new Uint8Array(bytes),{headers:{'Content-Type':'application/pdf','Content-Length':String(bytes.length)}}):new Response(null,{status:404})
}
const hash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex')
const sample=Buffer.from('%PDF-1.4\n'+ 'Storage fixture '.repeat(12)+'\n%%EOF')
const file={empresaId:company,notaId:9999999,versao:1,layoutVersao:2,hash:hash(sample),tamanho:sample.length,caminho:fiscalPdfPath(company,9999999,1,2,hash(sample))}
const fingerprint=async()=> (await db.query("SELECT md5(coalesce(string_agg(to_jsonb(n)::text,'|' ORDER BY id),'')) hash FROM erp.notas_fiscais n")).rows[0].hash
async function rejected(fn:()=>Promise<unknown>){await db.query('SAVEPOINT denied_fiscal');try{await assert.rejects(fn)}finally{await db.query('ROLLBACK TO SAVEPOINT denied_fiscal');await db.query('RELEASE SAVEPOINT denied_fiscal')}}
async function main(){try{
 const migrationSource=readFileSync('scripts/erp/fiscal-pdf-storage.mjs','utf8'),backupSource=migrationSource.slice(migrationSource.indexOf('function originalBackup('),migrationSource.indexOf('const sql=name=>'))
 const backupFiles=new Map<string,string>(),backupVm={Buffer,assert,Date,Map,project:'mtadnxqoqxzbdksktwdr',folder:'fixture',sha:hash,
  existsSync:(name:string)=>backupFiles.has(name),readFileSync:(name:string)=>{assert(backupFiles.has(name));return backupFiles.get(name)},writeFileSync:(name:string,value:string)=>backupFiles.set(name,value),renameSync:(source:string,dest:string)=>{backupFiles.set(dest,backupFiles.get(source)!);backupFiles.delete(source)}}
 const backup=runInNewContext(backupSource+'\noriginalBackup',backupVm) as (rows:Record<string,unknown>[],extend?:boolean)=>unknown
 const original={id:1,empresa_id:company,nota_fiscal_id:9999999,versao:1,layout_versao:2,nome:'DEMO-backup.pdf',hash_sha256:hash(sample),conteudo:sample},later={...original,id:2,versao:2},newStorage={...original,id:3,conteudo:null}
 backup([original],true);assert.throws(()=>backup([original,later]));backup([original,later,newStorage],true);backup([original,later,newStorage]);assert.equal(JSON.parse(backupFiles.get('fixture/backup-originals.json')!).pdfs.length,2)
 const validBackup=backupFiles.get('fixture/backup-originals.json')!;backupFiles.set('fixture/backup-originals.json',validBackup.replace(sample.toString('base64'),Buffer.from('corrupted').toString('base64')));assert.throws(()=>backup([original,later]));backupFiles.set('fixture/backup-originals.json',validBackup)
 checks.push('Backup preserva originais, inclui novas versões na retomada e impede finalizar com cópia ausente ou corrompida')
 const beforeCalls=requests
 assert.throws(()=>fiscalStorageConfiguration({base:'https://ovdvpfxwfvqzseekwqqp.supabase.co'}));assert.throws(()=>fiscalStorageConfiguration({base:'http://mtadnxqoqxzbdksktwdr.supabase.co'}));
 assert.throws(()=>fiscalStorageConfiguration({key:'eyJ.'+Buffer.from(JSON.stringify({ref:'ovdvpfxwfvqzseekwqqp',role:'service_role'})).toString('base64url')+'.x'}));assert.equal(requests,beforeCalls);checks.push('Projeto incorreto, HTTP e credencial de outro projeto bloqueados antes da rede')
 await assert.rejects(()=>uploadFiscalPdf({...file,caminho:'../../fora.pdf'},sample));await assert.rejects(()=>uploadFiscalPdf(file,Buffer.from('invalid')));checks.push('Caminhos adulterados e conteúdo inválido recusados')
 await uploadFiscalPdf(file,sample);assert.deepEqual(await readFiscalPdf(file),sample);await uploadFiscalPdf(file,sample);assert.equal(objects.size,1);checks.push('Upload, download e repetição preservam conteúdo sem sobrescrita')
 const second={...file,notaId:9999998,caminho:fiscalPdfPath(company,9999998,1,2,file.hash)};nextFailure='after';await uploadFiscalPdf(second,sample);checks.push('Timeout após gravação recuperado por conferência do arquivo completo')
 nextFailure='before';await assert.rejects(()=>uploadFiscalPdf({...file,notaId:9999997,caminho:fiscalPdfPath(company,9999997,1,2,file.hash)},sample));checks.push('Falha antes da gravação não declara PDF disponível')
 objects.set('erp-fiscal/'+file.caminho,Buffer.from(sample.toString().replace('fixture','corrupt')));await assert.rejects(()=>readFiscalPdf(file));objects.set('erp-fiscal/'+file.caminho,sample);checks.push('Arquivo corrompido bloqueado por tamanho e SHA-256')
 await db.connect();const originalNotes=await fingerprint(),originalPdfs=(await db.query('SELECT id,nome,hash_sha256,versao,layout_versao FROM erp.notas_fiscais_pdfs ORDER BY id')).rows
 await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='5s'")
 if(!(await db.query("SELECT 1 FROM information_schema.columns WHERE table_schema='erp' AND table_name='notas_fiscais_pdfs' AND column_name='arquivo_id'")).rows.length)
  await db.query(readFileSync('supabase/migrations/20261010110000_fiscal_pdf_storage_prepare.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''))
 const client:SQLClient={release:()=>{},query:async(statement,params)=>{assertErpTenantScopedQuery(statement,params);const ctx=getErpDatabaseContext();if(ctx){await db.query('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_empresa_id',$1,true),set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(ctx.tenantId),String(ctx.userId)])}return await db.query(statement,params) as never}}
 await runWithErpDatabaseContext({tenantId:company,userId:user},()=>runWithErpTransactionClient(client,async()=>{
  const sourceId=Number((await client.query("SELECT id FROM erp.notas_fiscais WHERE empresa_id=$1 AND tipo='nfse' AND modo_operacao='simulacao' AND excluido_em IS NULL ORDER BY id LIMIT 1",[company])).rows[0]?.id);assert(sourceId)
  const source=await getServiceInvoice(company,sourceId),before=await getServiceInvoicePdf(company,sourceId);assert.equal(hash(before.bytes),before.hash);checks.push('Leitor compatível com PDFs antigos ainda armazenados no banco')
  const data=serviceInvoiceInputSchema.parse({...source.input,venda_id:undefined,data_competencia:'2026-10-10',observacoes:'Teste de Storage fiscal: reversão integral'})
  const key=randomUUID(),created=await createServiceInvoice(company,user,data,key),id=Number(created.record.id)
  let pdf=await getServiceInvoicePdf(company,id);assert.equal(pdf.version,1);assert.equal(hash(pdf.bytes),pdf.hash)
  const metadata=(await client.query('SELECT to_jsonb(p) AS pdf FROM erp.notas_fiscais_pdfs p WHERE empresa_id=$1 AND nota_fiscal_id=$2',[company,id])).rows[0].pdf as Record<string,unknown>
  assert(metadata.arquivo_id);assert.equal(metadata.conteudo??null,null);checks.push('Novo PDF salvo no Storage e somente metadados registrados no banco real')
  const size=objects.size;assert.equal((await createServiceInvoice(company,user,data,key)).reused,true);assert.equal(objects.size,size);checks.push('Repetição da criação não duplica arquivos nem versões')
  const originalFile=pdf;await editServiceInvoice(company,user,id,{...data,observacoes:'Descrição atualizada'},randomUUID(),1);pdf=await getServiceInvoicePdf(company,id);assert.equal(pdf.version,2);assert.equal((await getServiceInvoicePdf(company,id,1)).hash,originalFile.hash);checks.push('Edição cria versão nova e preserva PDF anterior')
  await actOnServiceInvoice(company,user,id,{acao:'emitir',cenario:'sucesso',chave_operacao:randomUUID(),versao:2});assert.equal((await getServiceInvoicePdf(company,id)).version,3)
  await actOnServiceInvoice(company,user,id,{acao:'cancelar',chave_operacao:randomUUID(),versao:3,codigo_motivo:'9',motivo:'Encerramento do teste de armazenamento fiscal'});assert.equal((await getServiceInvoicePdf(company,id)).version,4);checks.push('Emissão simulada e cancelamento guardam versões independentes')
  await rejected(()=>client.query('UPDATE erp.notas_fiscais_pdfs SET hash_sha256=$3 WHERE empresa_id=$1 AND nota_fiscal_id=$2',[company,id,'a'.repeat(64)]));
  await rejected(()=>client.query('UPDATE erp.arquivos SET caminho=$3 WHERE empresa_id=$1 AND id=$2',[company,Number(metadata.arquivo_id),'fora.pdf']));checks.push('Versões e referência do arquivo permanecem imutáveis')
  await assert.rejects(()=>getServiceInvoicePdf(company+100000,id));await rejected(()=>db.query('SELECT erp.registrar_pdf_armazenado($1,$2,4,2,$3,$4,200,$5)',[company+100000,id,file.caminho,'DEMO-erro.pdf',file.hash]));checks.push('Leitura e registro fora da empresa recusados na aplicação e no banco')
  await db.query('SAVEPOINT failed_upload');nextFailure='before';await assert.rejects(()=>createServiceInvoice(company,user,data,randomUUID()));await db.query('ROLLBACK TO SAVEPOINT failed_upload');checks.push('Upload indisponível não confirma criação de nota ou metadados incompletos')
  assert.equal((await getServiceInvoicePdf(company,sourceId)).hash,before.hash)
  await db.query('RESET ROLE');await db.query('SAVEPOINT remove_binary_column')
  await rejected(()=>db.query(readFileSync('supabase/migrations/20261010110100_fiscal_pdf_storage_finalize.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')))
  checks.push('Remoção de bytes bloqueada enquanto houver qualquer PDF não migrado')
  await db.query('ALTER TABLE erp.notas_fiscais_pdfs DISABLE TRIGGER pdf_fiscal_imutavel')
  const legacy=(await db.query('SELECT * FROM erp.notas_fiscais_pdfs WHERE arquivo_id IS NULL ORDER BY id')).rows
  for(const row of legacy){const bytes=row.conteudo as Buffer,path=fiscalPdfPath(Number(row.empresa_id),Number(row.nota_fiscal_id),Number(row.versao),Number(row.layout_versao),String(row.hash_sha256))
   await uploadFiscalPdf({empresaId:Number(row.empresa_id),notaId:Number(row.nota_fiscal_id),versao:Number(row.versao),layoutVersao:Number(row.layout_versao),caminho:path,tamanho:bytes.length,hash:String(row.hash_sha256)},bytes)
   const archive=(await db.query("INSERT INTO erp.arquivos(empresa_id,bucket,caminho,nome,mime_type,tamanho_bytes,hash_sha256) VALUES($1,'erp-fiscal',$2,$3,'application/pdf',$4,$5) RETURNING id",[row.empresa_id,path,row.nome,bytes.length,row.hash_sha256])).rows[0].id
   await db.query("INSERT INTO erp.notas_fiscais_arquivos(empresa_id,nota_fiscal_id,arquivo_id,finalidade) VALUES($1,$2,$3,'documento_auxiliar')",[row.empresa_id,row.nota_fiscal_id,archive])
   await db.query('UPDATE erp.notas_fiscais_pdfs SET arquivo_id=$2 WHERE id=$1',[row.id,archive])
  }
  await db.query('ALTER TABLE erp.notas_fiscais_pdfs ENABLE TRIGGER pdf_fiscal_imutavel')
  await db.query(readFileSync('supabase/migrations/20261010110100_fiscal_pdf_storage_finalize.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''))
  assert.equal((await getServiceInvoicePdf(company,sourceId)).hash,before.hash);assert.equal((await getServiceInvoicePdf(company,id)).source,'storage')
  const afterDrop=await createServiceInvoice(company,user,data,randomUUID());assert.equal((await getServiceInvoicePdf(company,Number(afterDrop.record.id))).source,'storage')
  checks.push('Após remover conteudo, notas antigas e novas continuam disponíveis pelo leitor real')
  await db.query('RESET ROLE');await db.query('ROLLBACK TO SAVEPOINT remove_binary_column')
 }))
 await db.query('RESET ROLE');await db.query('ROLLBACK');assert.equal(await fingerprint(),originalNotes);assert.deepEqual((await db.query('SELECT id,nome,hash_sha256,versao,layout_versao FROM erp.notas_fiscais_pdfs ORDER BY id')).rows,originalPdfs)
 const report={status:'passed',realDatabase:true,realStorage:false,externalStorageRequests:0,rolledBack:true,originalPdfsPreserved:true,checks,storageFixtureRequests:requests};mkdirSync('.cache/fiscal-pdf-storage',{recursive:true});writeFileSync('.cache/fiscal-pdf-storage/smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
}catch(error){await db.query('ROLLBACK').catch(()=>{});throw error}finally{globalThis.fetch=originalFetch;for(const [key,value] of [['ERP_FISCAL_SUPABASE_URL',saved.url],['ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY',saved.key]])if(value===undefined)delete process.env[key!];else process.env[key!]=value;await Promise.allSettled([db.end(),closePool()])}}
main().catch(error=>{console.error(error instanceof Error?error.message:'Falha no teste');process.exitCode=1})
