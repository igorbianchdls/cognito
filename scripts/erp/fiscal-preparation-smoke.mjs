import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { connection, project } from './evolution-db.mjs'

const file='20261006010000_prepare_erp_fiscal_integration.sql'
const sql=readFileSync('supabase/migrations/'+file,'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,'')
const digest=createHash('sha256').update(sql).digest('hex')
const db=connection(), checks=[]
const tables=['configuracoes_fiscais','notas_fiscais','notas_fiscais_itens','notas_fiscais_totais','notas_fiscais_eventos']
const newTables=['notas_fiscais_tentativas','notas_fiscais_retornos','notas_fiscais_arquivos']
const hash='a'.repeat(64)
let currentCase='setup'
async function reject(name, statement, params=[], codes=['23514']) {
  currentCase=name
  await db.query('SAVEPOINT invalid_case')
  try { await assert.rejects(()=>db.query(statement,params),error=>codes.includes(error.code));checks.push({name,status:'passed'}) }
  finally { await db.query('ROLLBACK TO SAVEPOINT invalid_case');await db.query('RELEASE SAVEPOINT invalid_case') }
}
async function pass(name, statement, params=[]) {currentCase=name;const result=await db.query(statement,params);checks.push({name,status:'passed'});return result}
async function main(){
  await db.connect()
  try {
    await db.query('BEGIN')
    await db.query("SET LOCAL lock_timeout='3s'")
    const before={project,tables:[]}
    for(const table of tables){
      const rows=(await db.query('SELECT * FROM erp.'+table)).rows
      assert.equal(rows.length,0,'Fiscal records appeared; refresh migration/backfill plan before applying')
      before.tables.push({name:table,rows})
    }
    const sale=(await db.query('SELECT id,cliente_id FROM erp.vendas WHERE empresa_id=2 AND excluido_em IS NULL ORDER BY id LIMIT 1')).rows[0]
    const purchase=(await db.query('SELECT id,fornecedor_id FROM erp.compras WHERE empresa_id=2 AND excluido_em IS NULL ORDER BY id LIMIT 1')).rows[0]
    assert(sale && purchase)
    await db.query(sql)
    await db.query('SET LOCAL ROLE erp_runtime')
    await db.query("SELECT set_config('app.erp_tenant_id','2',true),set_config('app.erp_user_id','3',true)")
    await pass('Homologation configuration',`INSERT INTO erp.configuracoes_fiscais(id,empresa_id,cnpj,razao_social,provedor,ambiente) VALUES(-601,2,'12345678000199','Fiscal fixture','api_exemplo','homologacao')`)
    await pass('Same issuer in production',`INSERT INTO erp.configuracoes_fiscais(id,empresa_id,cnpj,razao_social,provedor,ambiente) VALUES(-602,2,'12345678000199','Fiscal fixture','api_exemplo','producao')`)
    await reject('Only one default per environment',`INSERT INTO erp.configuracoes_fiscais(id,empresa_id,cnpj,razao_social,provedor,ambiente) VALUES(-603,2,'12345678000199','Fiscal fixture','outro_provedor','producao')`,[],['23505'])
    assert.equal(String((await pass('Projection selects homologation',`SELECT * FROM erp.fiscal_issuer_for_operations(2,'homologacao')`)).rows[0].id),'-601')
    assert.equal(String((await pass('Legacy projection selects production',`SELECT * FROM erp.fiscal_issuer_for_operations(2)`)).rows[0].id),'-602')
    await reject('Invalid provider',`UPDATE erp.configuracoes_fiscais SET provedor='https://unsafe' WHERE empresa_id=2 AND id=-601`)
    await pass('Draft before integration',`INSERT INTO erp.notas_fiscais(id,empresa_id,entidade_id,venda_id,referencia_externa,valor_total) VALUES(-611,2,$1,$2,'demo-ref',100)`,[sale.cliente_id,sale.id])
    await reject('Cannot send incomplete draft',`UPDATE erp.notas_fiscais SET status='pronta_envio' WHERE empresa_id=2 AND id=-611`)
    await pass('Provider snapshot and readiness',`UPDATE erp.notas_fiscais SET configuracao_fiscal_id=-601,provedor='api_exemplo',ambiente='homologacao',modelo_emissao='nfe',emitente_snapshot='{"cnpj":"12345678000199"}',destinatario_snapshot='{"nome":"Cliente fixture"}',status='pronta_envio' WHERE empresa_id=2 AND id=-611`)
    await reject('Wrong environment',`UPDATE erp.notas_fiscais SET ambiente='producao' WHERE empresa_id=2 AND id=-611`)
    await reject('Duplicate external document',`INSERT INTO erp.notas_fiscais(id,empresa_id,entidade_id,referencia_externa,provedor,ambiente) VALUES(-612,2,$1,'demo-ref','api_exemplo','homologacao')`,[sale.cliente_id],['23505'])
    await pass('Partial/complementary invoice on same sale',`INSERT INTO erp.notas_fiscais(id,empresa_id,entidade_id,venda_id,referencia_externa,finalidade) VALUES(-612,2,$1,$2,'partial-ref','complementar')`,[sale.cliente_id,sale.id])
    await reject('One commercial origin',`UPDATE erp.notas_fiscais SET compra_id=$1 WHERE empresa_id=2 AND id=-612`,[purchase.id])
    const otherEntity=(await db.query('SELECT id FROM erp.entidades WHERE empresa_id=2 AND id<>$1 LIMIT 1',[sale.cliente_id])).rows[0]
    if(otherEntity)await reject('Commercial counterparty must match',`UPDATE erp.notas_fiscais SET entidade_id=$1 WHERE empresa_id=2 AND id=-612`,[otherEntity.id])
    const otherItem=(await db.query('SELECT id,produto_id,servico_id FROM erp.vendas_itens WHERE empresa_id=2 AND venda_id<>$1 AND excluido_em IS NULL LIMIT 1',[sale.id])).rows[0]
    if(otherItem)await reject('Commercial item belongs to another document',`INSERT INTO erp.notas_fiscais_itens(id,empresa_id,nota_fiscal_id,descricao,venda_item_id,produto_id,servico_id,tipo_item) VALUES(-624,2,-612,'Wrong origin',$1,$2,$3,$4)`,[otherItem.id,otherItem.produto_id,otherItem.servico_id,otherItem.servico_id?'servico':'produto'])
    await pass('Initial fiscal item',`INSERT INTO erp.notas_fiscais_itens(id,empresa_id,nota_fiscal_id,descricao,numero_item,quantidade,valor_unitario,valor_total) VALUES(-621,2,-611,'Fixture item',1,1,100,100)`)
    await reject('Duplicate item number',`INSERT INTO erp.notas_fiscais_itens(id,empresa_id,nota_fiscal_id,descricao,numero_item) VALUES(-622,2,-611,'Duplicate',1)`,[],['23505'])
    await pass('Service totals and retentions',`INSERT INTO erp.notas_fiscais_totais(id,empresa_id,nota_fiscal_id,base_iss,valor_iss,iss_retido,retencao_iss,valor_liquido,valor_cbs) VALUES(-631,2,-611,100,5,true,5,95,0)`)
    await reject('Negative service tax',`UPDATE erp.notas_fiscais_totais SET valor_iss=-1 WHERE empresa_id=2 AND id=-631`)
    await pass('Durable emission attempt',`INSERT INTO erp.notas_fiscais_tentativas(id,empresa_id,nota_fiscal_id,acao,chave_idempotencia,request_hash,provedor,ambiente,referencia_externa,payload_enviado) VALUES(-641,2,-611,'emitir','operation-1',$1,'api_exemplo','homologacao','demo-ref','{"value":100}')`,[hash])
    await reject('Duplicate attempt',`INSERT INTO erp.notas_fiscais_tentativas(id,empresa_id,nota_fiscal_id,acao,chave_idempotencia,request_hash,provedor,ambiente,referencia_externa,payload_enviado) VALUES(-642,2,-611,'emitir','operation-1',$1,'api_exemplo','homologacao','demo-ref','{}')`,[hash],['23505'])
    await reject('Same operation with changed request',`INSERT INTO erp.notas_fiscais_tentativas(id,empresa_id,nota_fiscal_id,acao,chave_idempotencia,numero_tentativa,request_hash,provedor,ambiente,referencia_externa,payload_enviado) VALUES(-642,2,-611,'emitir','operation-1',2,$1,'api_exemplo','homologacao','demo-ref','{}')`,['b'.repeat(64)])
    await pass('New retry preserves operation identity',`INSERT INTO erp.notas_fiscais_tentativas(id,empresa_id,nota_fiscal_id,acao,chave_idempotencia,numero_tentativa,request_hash,provedor,ambiente,referencia_externa,payload_enviado) VALUES(-642,2,-611,'emitir','operation-1',2,$1,'api_exemplo','homologacao','demo-ref','{"value":100}')`,[hash])
    await pass('Unknown result can be reconciled later',`UPDATE erp.notas_fiscais_tentativas SET status='resultado_desconhecido',erro_codigo='TIMEOUT' WHERE empresa_id=2 AND id=-641`)
    await reject('Sent payload immutable',`UPDATE erp.notas_fiscais_tentativas SET payload_enviado='{"value":200}' WHERE empresa_id=2 AND id=-641`)
    await pass('Receive provider notification',`INSERT INTO erp.notas_fiscais_retornos(id,empresa_id,nota_fiscal_id,provedor,ambiente,referencia_externa,evento_externo_id,chave_deduplicacao,payload) VALUES(-651,2,-611,'api_exemplo','homologacao','demo-ref','event-1',$1,'{"status":"autorizado"}')`,[hash])
    await reject('Notification replay rejected',`INSERT INTO erp.notas_fiscais_retornos(id,empresa_id,provedor,ambiente,referencia_externa,chave_deduplicacao,payload) VALUES(-652,2,'api_exemplo','homologacao','demo-ref',$1,'{}')`,[hash],['23505'])
    await reject('External event replay rejected',`INSERT INTO erp.notas_fiscais_retornos(id,empresa_id,provedor,ambiente,referencia_externa,evento_externo_id,chave_deduplicacao,payload) VALUES(-652,2,'api_exemplo','homologacao','demo-ref','event-1',$1,'{}')`,['b'.repeat(64)],['23505'])
    await pass('Process inbox without changing audit',`UPDATE erp.notas_fiscais_retornos SET status='processado',tentativas_processamento=1,processado_em=now() WHERE empresa_id=2 AND id=-651`)
    await reject('Notification payload immutable',`UPDATE erp.notas_fiscais_retornos SET payload='{}' WHERE empresa_id=2 AND id=-651`)
    await reject('Incorrect note reference',`INSERT INTO erp.notas_fiscais_retornos(id,empresa_id,nota_fiscal_id,provedor,ambiente,referencia_externa,chave_deduplicacao,payload) VALUES(-652,2,-611,'api_exemplo','homologacao','wrong-ref',$1,'{}')`,['b'.repeat(64)])
    await pass('Unmatched notification retained for reconciliation',`INSERT INTO erp.notas_fiscais_retornos(id,empresa_id,provedor,ambiente,referencia_externa,chave_deduplicacao,payload) VALUES(-652,2,'api_exemplo','homologacao','not-found-yet',$1,'{}')`,['b'.repeat(64)])
    await pass('Immutable audit linked to inbox',`INSERT INTO erp.notas_fiscais_eventos(id,empresa_id,nota_fiscal_id,provedor,evento,retorno_id,processado_em) VALUES(-661,2,-611,'api_exemplo','autorizada',-651,now())`)
    await reject('Audit cannot be rewritten',`UPDATE erp.notas_fiscais_eventos SET evento='alterado' WHERE empresa_id=2 AND id=-661`,[],['P0001'])
    await reject('Audit must match originating note',`INSERT INTO erp.notas_fiscais_eventos(id,empresa_id,nota_fiscal_id,provedor,evento,retorno_id) VALUES(-662,2,-612,'api_exemplo','autorizada',-651)`)
    await pass('Authorized document closes atomically',`UPDATE erp.notas_fiscais SET status='emitida',numero='100',serie='1',protocolo='test-only' WHERE empresa_id=2 AND id=-611`)
    await db.query('SET CONSTRAINTS ALL IMMEDIATE')
    assert((await pass('Content frozen after finalization',`SELECT conteudo_bloqueado_em FROM erp.notas_fiscais WHERE empresa_id=2 AND id=-611`)).rows[0].conteudo_bloqueado_em)
    await reject('Authorized header immutable',`UPDATE erp.notas_fiscais SET valor_total=200 WHERE empresa_id=2 AND id=-611`)
    await reject('Authorized items immutable',`UPDATE erp.notas_fiscais_itens SET valor_total=200 WHERE empresa_id=2 AND id=-621`)
    await reject('Authorized totals immutable',`UPDATE erp.notas_fiscais_totais SET valor_iss=10 WHERE empresa_id=2 AND id=-631`)
    await reject('No additional item after authorization',`INSERT INTO erp.notas_fiscais_itens(id,empresa_id,nota_fiscal_id,descricao) VALUES(-622,2,-611,'Late item')`)
    await reject('Authorized note cannot be deleted',`DELETE FROM erp.notas_fiscais WHERE empresa_id=2 AND id=-611`)
    await pass('Cancellation updates status without rewriting document',`UPDATE erp.notas_fiscais SET status='cancelada',cancelada_em=now() WHERE empresa_id=2 AND id=-611`)
    await reject('Cancellation is terminal',`UPDATE erp.notas_fiscais SET status='emitida' WHERE empresa_id=2 AND id=-611`)
    await db.query('SET CONSTRAINTS ALL DEFERRED')
    await pass('Legacy atomic incoming XML import',`INSERT INTO erp.notas_fiscais(id,empresa_id,entidade_id,compra_id,direcao,status,valor_produtos,valor_total,payload_enviado) VALUES(-613,2,$1,$2,'entrada','emitida',20,20,'{"xml":"original-test-only"}')`,[purchase.fornecedor_id,purchase.id])
    await pass('Incoming XML children in same transaction',`INSERT INTO erp.notas_fiscais_itens(id,empresa_id,nota_fiscal_id,descricao,quantidade,valor_unitario,valor_total) VALUES(-623,2,-613,'Imported',1,20,20)`)
    await db.query('SET CONSTRAINTS ALL IMMEDIATE')
    await reject('Incoming note protected after transaction',`DELETE FROM erp.notas_fiscais_itens WHERE empresa_id=2 AND id=-623`)
    await pass('Fiscal file registry',`INSERT INTO erp.arquivos(id,empresa_id,bucket,caminho,nome,hash_sha256) VALUES(-671,2,'fiscal','2/test.xml','test.xml',$1)`,[hash])
    await pass('Attach preserved original to authorized invoice',`INSERT INTO erp.notas_fiscais_arquivos(id,empresa_id,nota_fiscal_id,arquivo_id,finalidade) VALUES(-681,2,-611,-671,'xml_autorizado')`)
    assert.equal((await pass('Fiscal attachment removal denied by RLS',`DELETE FROM erp.notas_fiscais_arquivos WHERE empresa_id=2 AND id=-681 RETURNING id`)).rows.length,0)
    await db.query('RESET ROLE')
    await reject('Fiscal attachment protected even with table privileges',`DELETE FROM erp.notas_fiscais_arquivos WHERE empresa_id=2 AND id=-681`,[],['P0001'])
    await db.query('SET LOCAL ROLE erp_runtime')
    await reject('Original location immutable',`UPDATE erp.arquivos SET caminho='replacement.xml' WHERE empresa_id=2 AND id=-671`)
    await reject('Original cannot be hidden by soft deletion',`UPDATE erp.arquivos SET excluido_em=now() WHERE empresa_id=2 AND id=-671`)
    await pass('National service draft',`INSERT INTO erp.notas_fiscais(id,empresa_id,entidade_id,referencia_externa,tipo,modelo_emissao,provedor,ambiente,configuracao_fiscal_id,emitente_snapshot,destinatario_snapshot) VALUES(-615,2,$1,'national-service','nfse','nfse_nacional','api_exemplo','homologacao',-601,'{"cnpj":"12345678000199"}','{"nome":"Cliente fixture"}')`,[sale.cliente_id])
    await reject('National service requires DPS identity',`UPDATE erp.notas_fiscais SET status='pronta_envio' WHERE empresa_id=2 AND id=-615`)
    await pass('National service has structured competence and DPS fields',`UPDATE erp.notas_fiscais SET numero_dps='1',serie_dps='1',data_competencia='2026-10-06',codigo_municipio_emissao='2304400',codigo_municipio_prestacao='2304400',status='pronta_envio' WHERE empresa_id=2 AND id=-615`)
    await db.query('RESET ROLE')
    await db.query(`INSERT INTO shared.usuarios(id,email,full_name,status) VALUES(86000006,'fiscal.fixture.sales@example.invalid','Fiscal sales fixture','active')`)
    await db.query(`INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role,status,perfil_acesso_id) VALUES(2,86000006,'member','active','vendas')`)
    await db.query('SET LOCAL ROLE erp_runtime')
    await db.query("SELECT set_config('app.erp_user_id','86000006',true)")
    assert.equal((await pass('Sales profile cannot inspect secret configuration',`SELECT count(*)::int n FROM erp.configuracoes_fiscais WHERE empresa_id=2`)).rows[0].n,0)
    assert.equal((await pass('Sales profile can read issuer projection',`SELECT * FROM erp.fiscal_issuer_for_operations(2,'homologacao')`)).rows.length,1)
    await pass('Sales profile prepares its outgoing document',`INSERT INTO erp.notas_fiscais(id,empresa_id,entidade_id,venda_id,configuracao_fiscal_id,referencia_externa,provedor,ambiente,modelo_emissao,emitente_snapshot,destinatario_snapshot,status) VALUES(-616,2,$1,$2,-601,'sales-role-ref','api_exemplo','homologacao','nfe','{"cnpj":"12345678000199"}','{"nome":"Fixture"}','pronta_envio')`,[sale.cliente_id,sale.id])
    await pass('Sales profile writes document totals',`INSERT INTO erp.notas_fiscais_totais(id,empresa_id,nota_fiscal_id) VALUES(-632,2,-616)`)
    await pass('Sales profile requests a fiscal operation',`INSERT INTO erp.notas_fiscais_tentativas(id,empresa_id,nota_fiscal_id,acao,chave_idempotencia,request_hash,provedor,ambiente,referencia_externa,payload_enviado) VALUES(-643,2,-616,'emitir','sales-op',$1,'api_exemplo','homologacao','sales-role-ref','{}')`,[hash])
    assert.equal((await pass('Sales profile reads its fiscal file without secret access',`SELECT id FROM erp.arquivos WHERE empresa_id=2 AND id=-671`)).rows.length,1)
    await reject('Sales profile cannot create purchase fiscal documents',`INSERT INTO erp.notas_fiscais(id,empresa_id,entidade_id,direcao) VALUES(-617,2,$1,'entrada')`,[purchase.fornecedor_id],['42501'])
    await db.query("SELECT set_config('app.erp_user_id','3',true)")
    await db.query("SELECT set_config('app.erp_tenant_id','999999999',true)")
    for(const table of [...tables,...newTables])assert.equal((await db.query('SELECT count(*)::int AS n FROM erp.'+table)).rows[0].n,0)
    checks.push({name:'Eight fiscal tables isolated without membership',status:'passed'})
    await reject('Unauthorized inbox insert',`INSERT INTO erp.notas_fiscais_retornos(id,empresa_id,provedor,ambiente,referencia_externa,chave_deduplicacao,payload) VALUES(-699,2,'api_exemplo','homologacao','ref',$1,'{}')`,[hash],['42501'])
    await db.query('ROLLBACK')
    for(const table of tables)assert.equal((await db.query('SELECT count(*)::int AS n FROM erp.'+table)).rows[0].n,0)
    assert.equal((await db.query("SELECT to_regclass('erp.notas_fiscais_retornos') AS relation")).rows[0].relation,null)
    mkdirSync('.cache/fiscal-preparation',{recursive:true})
    writeFileSync('.cache/fiscal-preparation/before.json',JSON.stringify(before,null,2))
    const report={status:'passed',date:new Date().toISOString(),project,migration:file,digest,independentExternalApi:false,rolledBack:true,noPersistentTestRecords:true,checks}
    writeFileSync('.cache/fiscal-preparation/smoke.json',JSON.stringify(report,null,2))
    console.log(JSON.stringify({status:report.status,digest,checks:checks.length,rolledBack:true}))
  } finally {await db.query('ROLLBACK').catch(()=>{});await db.end()}
}
main().catch(error=>{console.error(JSON.stringify({case:currentCase,code:error.code,message:error.message}));process.exitCode=1})
