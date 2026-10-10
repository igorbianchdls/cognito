import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {readFileSync,writeFileSync,mkdirSync,existsSync,renameSync} from 'node:fs'
import dotenv from 'dotenv'
import {connection,project} from './evolution-db.mjs'
import {fiscalStorageConfiguration,fiscalPdfPath,uploadFiscalPdf,readFiscalPdf,FISCAL_PDF_BUCKET,FISCAL_PDF_MAX_BYTES} from '../../src/products/erp/server/fiscal/fiscalPdfStorage.ts'
import {createServiceInvoiceLinkToken,SERVICE_INVOICE_PUBLIC_PATH,SERVICE_INVOICE_LINK_TTL_SECONDS} from '../../src/products/erp/server/fiscal/serviceInvoiceLinks.ts'

dotenv.config({path:'.env.local',quiet:true})
const mode=process.argv[2],folder='.cache/fiscal-pdf-storage',db=connection()
assert(['prepare','migrate','verify','live','finalize','orphans'].includes(mode),'Use prepare | migrate | verify | live | finalize | orphans')
mkdirSync(folder,{recursive:true})
const sha=bytes=>createHash('sha256').update(bytes).digest('hex')
function originalBackup(current,extend=false){
 const backupFile=folder+'/backup-originals.json',backup=existsSync(backupFile)?JSON.parse(readFileSync(backupFile)):{project,at:new Date().toISOString(),pdfs:[]};
 assert.equal(backup.project,project);assert(Array.isArray(backup.pdfs));const saved=new Map();
 for(const row of backup.pdfs){assert.equal(sha(Buffer.from(row.conteudo,'base64')),row.hash_sha256);assert(!saved.has(String(row.id)),'PDF duplicado no backup');saved.set(String(row.id),row);}
 let changed=!existsSync(backupFile);
 for(const row of current){if(!row.conteudo)continue;assert(Buffer.isBuffer(row.conteudo));const previous=saved.get(String(row.id));
  if(previous){for(const key of ['empresa_id','nota_fiscal_id','versao','layout_versao','nome','hash_sha256'])assert.equal(String(previous[key]),String(row[key]),'Backup incompatível: '+row.id);assert.deepEqual(Buffer.from(previous.conteudo,'base64'),row.conteudo);}
  else{assert(extend,'PDF original ausente no backup: '+row.id);assert.equal(sha(row.conteudo),row.hash_sha256);const entry={...row,conteudo:row.conteudo.toString('base64')};backup.pdfs.push(entry);saved.set(String(row.id),entry);changed=true;}
 }
 if(changed){assert(extend);const temporary=backupFile+'.tmp';writeFileSync(temporary,JSON.stringify(backup));const written=JSON.parse(readFileSync(temporary));assert.equal(written.pdfs.length,backup.pdfs.length);for(const row of written.pdfs)assert.equal(sha(Buffer.from(row.conteudo,'base64')),row.hash_sha256);renameSync(temporary,backupFile);}
 return backup;
}
const sql=name=>readFileSync('supabase/migrations/'+name+'.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
async function apply(version,name){
 if((await db.query('SELECT 1 FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows.length)return
 await db.query('BEGIN');try{await db.query("SET LOCAL lock_timeout='5s'");await db.query(sql(version+'_'+name));
 await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,name,[sql(version+'_'+name)]]);await db.query('COMMIT')
 }catch(error){await db.query('ROLLBACK');throw error}
}
async function bucket(){
 const cfg=fiscalStorageConfiguration(),headers={apikey:cfg.key,Authorization:'Bearer '+cfg.key,'Content-Type':'application/json'}
 const r=await fetch(`${cfg.origin}/storage/v1/bucket/${FISCAL_PDF_BUCKET}`,{headers,signal:AbortSignal.timeout(15000)})
 if(r.status===404||r.status===400){const create=await fetch(`${cfg.origin}/storage/v1/bucket`,{method:'POST',headers,body:JSON.stringify({id:FISCAL_PDF_BUCKET,name:FISCAL_PDF_BUCKET,public:false,file_size_limit:FISCAL_PDF_MAX_BYTES,allowed_mime_types:['application/pdf']}),signal:AbortSignal.timeout(15000)});assert(create.ok,'Não foi possível criar o bucket privado: HTTP '+create.status)}
 else{assert(r.ok,'Acesso ao Storage recusado: HTTP '+r.status);const b=await r.json();assert.equal(b.public,false,'O bucket fiscal deve ser privado');}
 const check=await fetch(`${cfg.origin}/storage/v1/bucket/${FISCAL_PDF_BUCKET}`,{headers,signal:AbortSignal.timeout(15000)});assert(check.ok);assert.equal((await check.json()).public,false)
}
async function rows(){return (await db.query(`SELECT p.*,a.bucket,a.caminho,a.tamanho_bytes,a.hash_sha256 AS arquivo_hash FROM erp.notas_fiscais_pdfs p LEFT JOIN erp.arquivos a ON a.empresa_id=p.empresa_id AND a.id=p.arquivo_id ORDER BY p.id`)).rows}
const file=row=>({empresaId:Number(row.empresa_id),notaId:Number(row.nota_fiscal_id),versao:row.versao,layoutVersao:row.layout_versao,caminho:row.caminho,tamanho:Number(row.tamanho_bytes),hash:row.hash_sha256})
async function verify(){
 await bucket();const current=await rows();for(const row of current){assert(row.arquivo_id&&row.bucket===FISCAL_PDF_BUCKET,'PDF não migrado: '+row.id);assert.equal(row.arquivo_hash,row.hash_sha256);const bytes=await readFiscalPdf(file(row));if(row.conteudo)assert.deepEqual(bytes,row.conteudo);}
 const report={status:'passed',project,pdfVersions:current.length,notes:new Set(current.map(p=>p.empresa_id+':'+p.nota_fiscal_id)).size,bytes:current.reduce((n,r)=>n+Number(r.tamanho_bytes),0),at:new Date().toISOString()};writeFileSync(folder+'/verification.json',JSON.stringify(report,null,2));return report
}
try{
 await db.connect()
 if(mode==='prepare'){await apply('20261010110000','fiscal_pdf_storage_prepare');console.log(JSON.stringify({status:'prepared',project,legacyReadsAndWritesCompatible:true}));}
 if(mode==='migrate'){
  await bucket();await apply('20261010110000','fiscal_pdf_storage_prepare');const original=await rows();originalBackup(original,true);
  for(const row of original){if(row.arquivo_id)continue;assert(Buffer.isBuffer(row.conteudo));assert.equal(sha(row.conteudo),row.hash_sha256);const caminho=fiscalPdfPath(Number(row.empresa_id),Number(row.nota_fiscal_id),row.versao,row.layout_versao,row.hash_sha256);
   await uploadFiscalPdf({...file(row),caminho,tamanho:row.conteudo.length},row.conteudo);
   await db.query('BEGIN');try{await db.query("SET LOCAL lock_timeout='5s'");await db.query('ALTER TABLE erp.notas_fiscais_pdfs DISABLE TRIGGER pdf_fiscal_imutavel');
    const locked=(await db.query('SELECT * FROM erp.notas_fiscais_pdfs WHERE id=$1 FOR UPDATE',[row.id])).rows[0];assert.equal(locked.hash_sha256,row.hash_sha256);assert.deepEqual(locked.conteudo,row.conteudo);
    const a=(await db.query(`INSERT INTO erp.arquivos(empresa_id,bucket,caminho,nome,mime_type,tamanho_bytes,hash_sha256,criado_em,atualizado_em,criado_por,atualizado_por,metadata)
    VALUES($1,'erp-fiscal',$2,$3,'application/pdf',$4,$5,$6,$6,$7,$7,$8::jsonb) ON CONFLICT(bucket,caminho) WHERE bucket='erp-fiscal' DO NOTHING RETURNING id`,[row.empresa_id,caminho,row.nome,row.conteudo.length,row.hash_sha256,row.criado_em,row.criado_por,JSON.stringify({documento:'nota_fiscal',nota_fiscal_id:Number(row.nota_fiscal_id),versao:row.versao,layout_versao:row.layout_versao,migrado:true})])).rows[0]||
    (await db.query("SELECT id FROM erp.arquivos WHERE bucket='erp-fiscal' AND caminho=$1 AND empresa_id=$2 AND hash_sha256=$3 AND tamanho_bytes=$4",[caminho,row.empresa_id,row.hash_sha256,row.conteudo.length])).rows[0];assert(a?.id);
    await db.query(`INSERT INTO erp.notas_fiscais_arquivos(empresa_id,nota_fiscal_id,arquivo_id,finalidade,descricao,criado_em,criado_por) VALUES($1,$2,$3,'documento_auxiliar','PDF original migrado para Storage privado',$4,$5) ON CONFLICT(empresa_id,nota_fiscal_id,arquivo_id) DO NOTHING`,[row.empresa_id,row.nota_fiscal_id,a.id,row.criado_em,row.criado_por]);
    await db.query('UPDATE erp.notas_fiscais_pdfs SET arquivo_id=$2 WHERE id=$1',[row.id,a.id]);await db.query('ALTER TABLE erp.notas_fiscais_pdfs ENABLE TRIGGER pdf_fiscal_imutavel');await db.query('COMMIT');
   }catch(error){await db.query('ROLLBACK');throw error}
  }
  console.log(JSON.stringify(await verify()));
 }
 if(mode==='verify')console.log(JSON.stringify(await verify()))
 if(mode==='live'){
  const company=Number(process.argv.find(a=>a.startsWith('--company='))?.split('=')[1]),user=Number(process.argv.find(a=>a.startsWith('--user='))?.split('=')[1]);assert(company>0&&user>0,'Informe --company=<empresa> --user=<usuario>');
  const response=await fetch('https://api.vercel.com/v13/deployments/cognito-seven.vercel.app?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua',{headers:{Authorization:'Bearer '+process.env.VERCEL_TOKEN},signal:AbortSignal.timeout(15000)});assert(response.ok);const meta=await response.json();assert.equal(meta.projectId,'prj_mXGm0J5InfGNAR2lO4cHGLCrgoex');assert.equal(meta.readyState,'READY');assert.equal(meta.meta?.fiscalPdfStorageVersion,'1');
  const pdfs=(await db.query(`SELECT DISTINCT ON(p.nota_fiscal_id) p.*,a.caminho,a.tamanho_bytes FROM erp.notas_fiscais_pdfs p JOIN erp.notas_fiscais n ON n.empresa_id=p.empresa_id AND n.id=p.nota_fiscal_id JOIN erp.arquivos a ON a.empresa_id=p.empresa_id AND a.id=p.arquivo_id WHERE p.empresa_id=$1 AND n.excluido_em IS NULL ORDER BY p.nota_fiscal_id,p.versao DESC,p.layout_versao DESC`,[company])).rows;assert(pdfs.length>0);
  for(const row of pdfs){const token=createServiceInvoiceLinkToken({empresa:company,usuario:user,nota:Number(row.nota_fiscal_id),tipo:'pdf'}).token;const result=await fetch('https://cognito-seven.vercel.app'+SERVICE_INVOICE_PUBLIC_PATH+token,{cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});assert.equal(result.status,200);assert.equal(result.headers.get('X-PDF-Storage'),'storage');assert.match(result.headers.get('Content-Type')||'',/application\/pdf/);assert.equal(sha(Buffer.from(await result.arrayBuffer())),row.hash_sha256);}
  const row=pdfs[0],token=createServiceInvoiceLinkToken({empresa:company,usuario:user,nota:Number(row.nota_fiscal_id),tipo:'pdf'},Date.now()-(SERVICE_INVOICE_LINK_TTL_SECONDS+10)*1000).token;
  const expired=await fetch('https://cognito-seven.vercel.app'+SERVICE_INVOICE_PUBLIC_PATH+token,{signal:AbortSignal.timeout(20000)});assert.equal(expired.status,404);
  const cfg=fiscalStorageConfiguration(),publicResult=await fetch(`${cfg.origin}/storage/v1/object/public/erp-fiscal/${row.caminho}`,{signal:AbortSignal.timeout(15000)});assert(!publicResult.ok,'PDF acessível sem autorização');
  const proof={status:'passed',deploymentId:meta.id,storageReads:true,notes:pdfs.length,expiredLinksBlocked:true,privateBucket:true,at:new Date().toISOString()};writeFileSync(folder+'/live-http.json',JSON.stringify(proof,null,2));console.log(JSON.stringify(proof));
 }
 if(mode==='finalize'){
  const deployment=process.argv.find(a=>a.startsWith('--deployment='))?.split('=')[1];assert(deployment,'Informe --deployment=<id da publicação verificada>');
  const proof=JSON.parse(readFileSync(folder+'/live-http.json'));assert.equal(proof.status,'passed');assert.equal(proof.deploymentId,deployment);assert.equal(proof.storageReads,true);
  assert(existsSync(folder+'/backup-originals.json'),'Backup original obrigatório');originalBackup(await rows());
  const live=await fetch('https://api.vercel.com/v13/deployments/cognito-seven.vercel.app?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua',{headers:{Authorization:'Bearer '+process.env.VERCEL_TOKEN},signal:AbortSignal.timeout(15000)});assert(live.ok);const meta=await live.json();assert.equal(meta.id,deployment);assert.equal(meta.projectId,'prj_mXGm0J5InfGNAR2lO4cHGLCrgoex');assert.equal(meta.readyState,'READY');assert.equal(meta.meta?.fiscalPdfStorageVersion,'1');
  await verify();await apply('20261010110100','fiscal_pdf_storage_finalize');console.log(JSON.stringify({status:'finalized',project,bytesRemovedFromDatabase:true,originalBackupPreserved:true}));
 }
 if(mode==='orphans'){
  const cfg=fiscalStorageConfiguration(),known=new Set((await db.query("SELECT caminho FROM erp.arquivos WHERE bucket='erp-fiscal'")).rows.map(r=>r.caminho)),orphans=[];
  async function list(prefix=''){for(let offset=0;;offset+=100){const r=await fetch(`${cfg.origin}/storage/v1/object/list/erp-fiscal`,{method:'POST',headers:{apikey:cfg.key,Authorization:'Bearer '+cfg.key,'Content-Type':'application/json'},body:JSON.stringify({prefix,limit:100,offset}),signal:AbortSignal.timeout(15000)});assert(r.ok);const objects=await r.json();for(const object of objects){const path=prefix?prefix+'/'+object.name:object.name;if(object.id){if(!known.has(path))orphans.push({path,createdAt:object.created_at});}else await list(path);}if(objects.length<100)break;}}
  await list();writeFileSync(folder+'/orphans.json',JSON.stringify({project,orphans,filesDeleted:0},null,2));console.log(JSON.stringify({orphans:orphans.length,filesDeleted:0}));
 }
}catch(error){console.error(error instanceof Error?error.message:'Falha no armazenamento fiscal');process.exitCode=1}finally{await db.end()}
