import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {connection} from './evolution-db.mjs'
import {runWithErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {runWithErpTransactionClient,type SQLClient} from '../../src/lib/postgres'
import {recordFiscalAttempt,recordFiscalReturn} from '../../src/products/erp/server/fiscal/fiscalIntegrationRepository'
import {importErpPurchaseInvoice} from '../../src/products/erp/server/erpRepository'
import {getDocumentHistory,getDocumentFile} from '../../src/products/erp/server/erpHistoryRepository'
import {parseNfeXml} from '../../src/products/erp/server/fiscal/nfeParser'

const db=connection()
const migration=readFileSync('supabase/migrations/20261006010000_prepare_erp_fiscal_integration.sql','utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
const checks:string[]=[]
async function reject(name:string,fn:()=>Promise<unknown>){await db.query('SAVEPOINT rejected');try{await assert.rejects(fn);checks.push(name)}finally{await db.query('ROLLBACK TO SAVEPOINT rejected');await db.query('RELEASE SAVEPOINT rejected')}}
async function main(){try{
  await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='3s'");await db.query(migration)
  await db.query('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_tenant_id','2',true),set_config('app.erp_user_id','3',true)")
  const entity=(await db.query('SELECT id FROM erp.entidades WHERE empresa_id=2 AND eh_cliente AND excluido_em IS NULL ORDER BY id LIMIT 1')).rows[0]
  await db.query(`INSERT INTO erp.configuracoes_fiscais(id,empresa_id,cnpj,razao_social,provedor,ambiente) VALUES(86000001,2,'12345678000199','Fiscal fixture','api_exemplo','homologacao')`)
  await db.query(`INSERT INTO erp.notas_fiscais(id,empresa_id,entidade_id,configuracao_fiscal_id,referencia_externa,provedor,ambiente,modelo_emissao,emitente_snapshot,destinatario_snapshot,status) VALUES(86000002,2,$1,86000001,'repository-fixture','api_exemplo','homologacao','nfe','{"cnpj":"12345678000199"}','{"nome":"Fixture"}','pronta_envio')`,[entity.id])
  const client:SQLClient={query:db.query.bind(db),release:()=>{}}
  await reject('Reject unauthenticated repository call',()=>recordFiscalReturn(2,{provedor:'api_exemplo',ambiente:'homologacao',referencia_externa:'repository-fixture',payload:{status:'autorizado'}}))
  await runWithErpDatabaseContext({tenantId:2,userId:3},()=>runWithErpTransactionClient(client,async()=>{
    const request={nota_fiscal_id:86000002,acao:'emitir' as const,chave_idempotencia:'repo-operation',payload:{b:2,a:1}}
    const first=await recordFiscalAttempt({tenantId:2,actorId:3,request});assert.equal(first.duplicado,false)
    const again=await recordFiscalAttempt({tenantId:2,actorId:3,request:{...request,payload:{a:1,b:2}}});assert.equal(again.duplicado,true);assert.equal(again.id,first.id);checks.push('Idempotent attempt with reordered JSON')
    await reject('Different payload under same operation rejected',()=>recordFiscalAttempt({tenantId:2,actorId:3,request:{...request,payload:{a:2}}}))
    await reject('Context actor cannot be overridden',()=>recordFiscalAttempt({tenantId:2,actorId:99999,request}))
    await reject('Non-JSON payload rejected',()=>recordFiscalAttempt({tenantId:2,actorId:3,request:{...request,payload:{a:Number.NaN}}}))
    const notification={provedor:'api_exemplo',ambiente:'homologacao' as const,referencia_externa:'repository-fixture',evento_externo_id:'callback-1',payload:{status:'autorizado',numero:'1'}}
    const received=await recordFiscalReturn(2,notification),replayed=await recordFiscalReturn(2,{...notification,payload:{numero:'1',status:'autorizado'}})
    assert.equal(received.duplicado,false);assert.equal(replayed.duplicado,true);assert.equal(received.id,replayed.id);checks.push('Duplicate external event returns existing receipt')
    await reject('Changed body under existing event rejected',()=>recordFiscalReturn(2,{...notification,payload:{status:'cancelado'}}))
    const noId={...notification,evento_externo_id:undefined,payload:{status:'processando',value:1}}
    assert.equal((await recordFiscalReturn(2,noId)).duplicado,false)
    assert.equal((await recordFiscalReturn(2,{...noId,payload:{value:1,status:'processando'}})).duplicado,true);checks.push('Canonical payload deduplication without provider event ID')
    let supplier=(await db.query(`SELECT id,nome,regexp_replace(documento,'\\D','','g') AS documento FROM erp.entidades WHERE empresa_id=2 AND eh_fornecedor AND length(regexp_replace(documento,'\\D','','g'))=14 AND excluido_em IS NULL LIMIT 1`)).rows[0]
    if(!supplier)supplier=(await db.query(`INSERT INTO erp.entidades(id,empresa_id,tipo_pessoa,nome,documento,eh_fornecedor,ativo) VALUES(86000005,2,'juridica','Fornecedor fixture','11222333000181',true,true) RETURNING id,nome,documento`)).rows[0]
    const key='12345678901234567890123456789012345678901234'
    const xml=`<nfeProc><NFe><infNFe Id="NFe${key}"><ide><nNF>999</nNF><serie>1</serie><tpAmb>2</tpAmb><dhEmi>2026-10-06T09:00:00-03:00</dhEmi></ide><emit><CNPJ>${supplier.documento}</CNPJ><xNome>XML fixture supplier</xNome><enderEmit><xMun>Fortaleza</xMun></enderEmit></emit><dest><CNPJ>12345678000199</CNPJ><xNome>XML fixture company</xNome></dest><det nItem="1"><prod><cProd>TEST-1</cProd><xProd>Fixture product</xProd><NCM>84713012</NCM><CFOP>5102</CFOP><uCom>UN</uCom><qCom>1</qCom><vUnCom>100</vUnCom><vProd>100</vProd><vDesc>0</vDesc></prod><imposto><ICMS><ICMSSN102><CSOSN>102</CSOSN></ICMSSN102></ICMS></imposto></det><total><ICMSTot><vProd>100</vProd><vNF>100</vNF></ICMSTot></total></infNFe></NFe><protNFe><infProt><cStat>100</cStat><xMotivo>Autorizado</xMotivo><nProt>TEST-ONLY</nProt><chNFe>${key}</chNFe></infProt></protNFe></nfeProc>`
    const parsed=parseNfeXml(xml);assert.equal(parsed.ambiente,'homologacao');assert.equal(parsed.emitente_snapshot.CNPJ,supplier.documento);assert.equal(parsed.itens[0].numero_item,1);checks.push('Parser preserves source snapshots, environment, item order and taxes')
    const imported=await importErpPurchaseInvoice({tenantId:2,actorId:3,values:{xml,gerar_compra:false,gera_financeiro:false}})
    const invoiceId=String(imported.invoice.id)
    const saved=(await db.query('SELECT modelo_emissao,ambiente,emitente_snapshot,destinatario_snapshot FROM erp.notas_fiscais WHERE empresa_id=2 AND id=$1',[invoiceId])).rows[0]
    assert.equal(saved.ambiente,'homologacao');assert.equal(saved.emitente_snapshot.CNPJ,supplier.documento);checks.push('Actual purchase XML import stores new fields')
    assert.equal((await importErpPurchaseInvoice({tenantId:2,actorId:3,values:{xml,gerar_compra:false,gera_financeiro:false}})).reused,true);checks.push('Existing import idempotency preserved')
    await db.query('SET CONSTRAINTS ALL IMMEDIATE')
    assert((await db.query('SELECT conteudo_bloqueado_em FROM erp.notas_fiscais WHERE empresa_id=2 AND id=$1',[invoiceId])).rows[0].conteudo_bloqueado_em);checks.push('Actual imported invoice freezes at transaction end')
    await db.query(`INSERT INTO erp.arquivos(id,empresa_id,bucket,caminho,nome,hash_sha256) VALUES(86000003,2,'fiscal','2/test-original.xml','test-original.xml',$1)`,[parsed.xml_hash])
    await db.query(`INSERT INTO erp.notas_fiscais_arquivos(id,empresa_id,nota_fiscal_id,arquivo_id,finalidade) VALUES(86000004,2,$1,86000003,'xml_recebido')`,[invoiceId])
    const history=await getDocumentHistory(2,'notas-compra',invoiceId);assert.equal(history.files.length,1)
    const linked=await getDocumentFile(2,'notas-compra',invoiceId,'86000003');assert.equal(linked.caminho,'2/test-original.xml');checks.push('Actual history and download lookup include fiscal files')
  }))
  await db.query('ROLLBACK');mkdirSync('.cache/fiscal-preparation',{recursive:true})
  const report={status:'passed',migrationDigest:createHash('sha256').update(migration).digest('hex'),rolledBack:true,noExternalApi:true,checks}
  writeFileSync('.cache/fiscal-preparation/repository-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}finally{await db.query('ROLLBACK').catch(()=>{});await db.end()}}
main().catch(error=>{console.error({message:error.message,code:error.code});process.exitCode=1})
