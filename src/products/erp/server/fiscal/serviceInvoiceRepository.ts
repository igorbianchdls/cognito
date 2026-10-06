import {createHash} from 'node:crypto'
import {withTransaction,runQuery,type SQLClient} from '@/lib/postgres'
import {getErpDatabaseContext} from '@/lib/erpDatabaseContext'
import {ErpDomainError} from '../../shared/erpErrors'
import {canonicalRequest} from '../../shared/commercialContracts'
import {serviceInvoiceInputSchema,serviceInvoiceTotals,invoiceKeySchema,serviceInvoiceActionSchema,SIMULATION_NOTICE,
 type ServiceInvoiceInput,type ServiceInvoiceAction} from '../../shared/serviceInvoiceContracts'
import {renderServiceInvoicePdf} from './serviceInvoicePdf'
import {serviceInvoiceSimulator} from './serviceInvoiceSimulator'

type Row=Record<string,unknown>
const PROVIDER='simulador_local'
const markers={demo:true,simulado:true,sem_validade_fiscal:true,aviso:SIMULATION_NOTICE}
const fingerprint=(value:unknown)=>createHash('sha256').update(canonicalRequest(value)).digest('hex')
function context(company:number,actor?:number){
 const ctx=getErpDatabaseContext()
 if(!ctx||ctx.tenantId!==company||(actor!==undefined&&(ctx.userId!==actor||ctx.readOnly)))throw new ErpDomainError('FORBIDDEN','Contexto fiscal autenticado inválido.',403)
}
async function query(client:SQLClient,sql:string,params:unknown[]){return (await client.query(getErpDatabaseContext()?.readOnly?sql.replace(/ FOR SHARE\b/g,''):sql,params)).rows}
async function noteRow(client:SQLClient,company:number,id:number,includeArchived=false){
 const rows=await query(client,`SELECT * FROM erp.notas_fiscais WHERE empresa_id=$1 AND id=$2 AND tipo='nfse' AND direcao='saida'
 AND modo_operacao='simulacao' ${includeArchived?'':'AND excluido_em IS NULL'} FOR UPDATE`,[company,id])
 if(!rows[0])throw new ErpDomainError('NOT_FOUND','Nota de serviço simulada não encontrada.',404)
 return rows[0]
}
function publicRecord(row:Row):Row & {id:string}{
 const keys=['id','numero','status','versao','data_competencia','venda_id','entidade_id','modelo_emissao','codigo_municipio_prestacao','valor_total','emitida_em','autorizada_em','cancelada_em','erro_codigo','erro_mensagem','simulacao_cenario','modo_operacao','destinatario_snapshot','emitente_snapshot']
 const record=Object.fromEntries(keys.map(key=>[key,row[key]]))
 return {...record,id:String(row.id),cliente_id:Number(row.entidade_id),modo_operacao:'simulacao',aviso:SIMULATION_NOTICE,
  cliente:String((row.destinatario_snapshot as Row)?.nome||''),observacoes:String((row.metadata as Row)?.observacoes||''),
  pdf_url:`/api/erp/notas-servico/${row.id}/pdf`}
}
async function history(client:SQLClient,company:number,actor:number,id:number,event:string,previous:unknown,next:unknown,payload:Row={}){
 await client.query(`INSERT INTO erp.notas_fiscais_eventos(empresa_id,nota_fiscal_id,provedor,evento,status_anterior,status_novo,payload,metadata,criado_por,atualizado_por,processado_em)
 VALUES($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$9,now())`,[company,id,PROVIDER,'simulacao_'+event,previous,next,JSON.stringify({...markers,...payload}),JSON.stringify(markers),actor])
}
async function pdf(client:SQLClient,company:number,actor:number,row:Row){
 const items=await query(client,'SELECT * FROM erp.notas_fiscais_itens WHERE empresa_id=$1 AND nota_fiscal_id=$2 AND excluido_em IS NULL ORDER BY numero_item,id',[company,row.id])
 const totals=(await query(client,'SELECT * FROM erp.notas_fiscais_totais WHERE empresa_id=$1 AND nota_fiscal_id=$2',[company,row.id]))[0]
 const content=renderServiceInvoicePdf({numero:row.numero,status:row.status,data_competencia:row.data_competencia instanceof Date?row.data_competencia.toISOString():row.data_competencia,
  emitente_snapshot:row.emitente_snapshot,destinatario_snapshot:row.destinatario_snapshot,valor_total:row.valor_total,items,totals:totals||{},observacoes:(row.metadata as Row)?.observacoes})
 await client.query(`INSERT INTO erp.notas_fiscais_pdfs(empresa_id,nota_fiscal_id,versao,conteudo,hash_sha256,nome,criado_por)
 VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(empresa_id,nota_fiscal_id,versao) DO NOTHING`,[company,row.id,row.versao,content,createHash('sha256').update(content).digest('hex'),String(row.numero)+'-v'+row.versao+'.pdf',actor])
}
async function recordOperation(client:SQLClient,company:number,actor:number,row:Row,action:string,key:string,payload:Row){
 await client.query(`INSERT INTO erp.notas_fiscais_tentativas(empresa_id,nota_fiscal_id,acao,chave_idempotencia,request_hash,provedor,ambiente,referencia_externa,payload_enviado,status,resposta_provedor,concluida_em,criado_por,atualizado_por)
 VALUES($1,$2,$3,$4,$5,$6,'homologacao',$7,$8::jsonb,'concluida',$9::jsonb,now(),$10,$10)`,
 [company,row.id,action,key,fingerprint(payload),PROVIDER,row.referencia_externa,JSON.stringify({...payload,...markers}),JSON.stringify({...markers,status:row.status}),actor])
}
async function replay(client:SQLClient,company:number,actor:number,row:Row,action:string,key:string,payload:Row){
 const rows=await query(client,`SELECT request_hash,criado_por FROM erp.notas_fiscais_tentativas WHERE empresa_id=$1 AND nota_fiscal_id=$2 AND acao=$3 AND chave_idempotencia=$4 AND numero_tentativa=1`,[company,row.id,action,key])
 if(!rows[0])return false
 if(rows[0].request_hash!==fingerprint(payload)||Number(rows[0].criado_por)!==actor)throw new ErpDomainError('IDEMPOTENCY_CONFLICT','A chave de operação já foi utilizada com outros dados.',409)
 return true
}
function version(row:Row,expected:number){if(Number(row.versao)!==expected)throw new ErpDomainError('STALE_VERSION','A nota mudou. Consulte os dados atuais antes de confirmar.',409)}
async function references(client:SQLClient,company:number,input:ServiceInvoiceInput){
 const data=serviceInvoiceInputSchema.parse(input)
 const customer=(await query(client,'SELECT id,nome,documento,cidade,uf FROM erp.entidades WHERE empresa_id=$1 AND id=$2 AND eh_cliente AND ativo AND excluido_em IS NULL FOR SHARE',[company,data.cliente_id]))[0]
 if(!customer)throw new ErpDomainError('VALIDATION_ERROR','Escolha um cliente ativo desta empresa.')
 const ids=[...new Set(data.itens.map(i=>i.item_id))]
 const services=await query(client,'SELECT id,nome,codigo,codigo_servico_municipal FROM erp.servicos WHERE empresa_id=$1 AND id=ANY($2::bigint[]) AND ativo AND excluido_em IS NULL FOR SHARE',[company,ids])
 if(services.length!==ids.length)throw new ErpDomainError('VALIDATION_ERROR','Escolha serviços ativos desta empresa.')
 let commercial:Row[]=[]
 if(data.venda_id){
  const sale=(await query(client,"SELECT id,cliente_id,status,tipo_documento FROM erp.vendas WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL FOR SHARE",[company,data.venda_id]))[0]
  if(!sale||Number(sale.cliente_id)!==data.cliente_id||sale.tipo_documento!=='venda'||sale.status==='cancelada')throw new ErpDomainError('VALIDATION_ERROR','A venda deve pertencer a esse cliente e estar disponível.')
  commercial=await query(client,'SELECT id,servico_id,quantidade FROM erp.vendas_itens WHERE empresa_id=$1 AND venda_id=$2 AND servico_id IS NOT NULL AND excluido_em IS NULL FOR SHARE',[company,data.venda_id])
  for(const id of ids){const requested=data.itens.filter(i=>i.item_id===id).reduce((sum,i)=>sum+i.quantidade,0),available=commercial.filter(i=>Number(i.servico_id)===id).reduce((sum,i)=>sum+Number(i.quantidade),0)
   if(requested>available+0.00001)throw new ErpDomainError('VALIDATION_ERROR','Os serviços e quantidades devem corresponder à venda vinculada.')}
 }
 return {data,customer,services,commercial}
}
async function children(client:SQLClient,company:number,actor:number,row:Row,refs:Awaited<ReturnType<typeof references>>){
 const {data,services,commercial}=refs,totals=serviceInvoiceTotals(data)
 let previousIss=0
 for(const [index,item] of totals.items.entries()){
  const service=services.find(s=>Number(s.id)===item.item_id)!,source=commercial.find(i=>Number(i.servico_id)===item.item_id)
  const aggregateIss=serviceInvoiceTotals({...data,itens:data.itens.slice(0,index+1)}).valor_iss
  const itemIss=Math.round((aggregateIss-previousIss)*100)/100;previousIss=aggregateIss
  await client.query(`INSERT INTO erp.notas_fiscais_itens(empresa_id,nota_fiscal_id,tipo_item,servico_id,venda_item_id,numero_item,codigo_item,unidade,descricao,quantidade,valor_unitario,valor_total,desconto,base_iss,valor_iss,aliquota_iss,codigo_servico_municipal,payload_item,tributos,metadata,criado_por,atualizado_por)
  VALUES($1,$2,'servico',$3,$4,$5,$6,'UN',$7,$8,$9,$10,$11,$10,$12,$13,$14,$15::jsonb,$15::jsonb,$15::jsonb,$16,$16)`,
  [company,row.id,item.item_id,source?.id||null,index+1,service.codigo,item.descricao,item.quantidade,item.valor_unitario,item.total,item.desconto,itemIss,data.aliquota_iss,service.codigo_servico_municipal,JSON.stringify(markers),actor])
 }
 await client.query(`INSERT INTO erp.notas_fiscais_totais(empresa_id,nota_fiscal_id,base_iss,valor_iss,iss_retido,retencao_iss,valor_liquido,metadata,criado_por,atualizado_por)
 VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$9)`,[company,row.id,totals.base_iss,totals.valor_iss,data.iss_retido,totals.retencao_iss,totals.valor_liquido,JSON.stringify(markers),actor])
}
export async function createServiceInvoice(company:number,actor:number,input:ServiceInvoiceInput,key:string){
 context(company,actor);invoiceKeySchema.parse(key);const data=serviceInvoiceInputSchema.parse(input),total=serviceInvoiceTotals(data)
 return withTransaction(async client=>{
  const external='sim-nfse-'+fingerprint({company,key})
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[external])
  const existing=(await query(client,'SELECT * FROM erp.notas_fiscais WHERE empresa_id=$1 AND referencia_externa=$2 FOR UPDATE',[company,external]))[0]
  if(existing){if(!await replay(client,company,actor,existing,'criar',key,data))throw new ErpDomainError('IDEMPOTENCY_CONFLICT','Referência de operação já existente.',409);return {record:publicRecord(existing),reused:true}}
  const refs=await references(client,company,data)
  const created=(await query(client,`INSERT INTO erp.notas_fiscais(empresa_id,entidade_id,venda_id,tipo,direcao,status,numero,serie,referencia_externa,provedor,ambiente,modelo_emissao,data_competencia,codigo_municipio_emissao,codigo_municipio_prestacao,numero_dps,serie_dps,numero_rps,serie_rps,valor_servicos,valor_total,emitente_snapshot,destinatario_snapshot,integracao_snapshot,metadata,criado_por,atualizado_por)
  VALUES($1,$2,$3,'nfse','saida','rascunho',$4,'DEMO',$5,$6,'homologacao',$7,$8,'2304400',$9,$10,'1',$10,'DEMO',$11,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,$16,$16) RETURNING *`,
  [company,data.cliente_id,data.venda_id||null,'DEMO-'+external.slice(-12).toUpperCase(),external,PROVIDER,data.modelo_emissao,data.data_competencia,data.codigo_municipio_prestacao,external.slice(-12),total.total,
   JSON.stringify({nome:'Empresa '+company+' - demonstração',cnpj:'00000000000000',...markers}),JSON.stringify({...refs.customer,...markers}),JSON.stringify({...markers,sem_envio_externo:true}),JSON.stringify({...markers,observacoes:data.observacoes}),actor]))[0]
  await children(client,company,actor,created,refs);await history(client,company,actor,Number(created.id),'criada',null,'rascunho')
  await recordOperation(client,company,actor,created,'criar',key,data);await pdf(client,company,actor,created)
  return {record:publicRecord(created),reused:false}
 })
}
export async function editServiceInvoice(company:number,actor:number,id:number,input:ServiceInvoiceInput,key:string,expected:number){
 context(company,actor);invoiceKeySchema.parse(key);const data=serviceInvoiceInputSchema.parse(input),payload={dados:data,versao:expected}
 return withTransaction(async client=>{
  const row=await noteRow(client,company,id,true)
  if(await replay(client,company,actor,row,'editar',key,payload))return {record:publicRecord(row),reused:true}
  version(row,expected)
  if(row.status!=='rascunho'||row.excluido_em)throw new ErpDomainError('INVALID_STATE','Somente rascunhos disponíveis podem ser editados.',409)
  const refs=await references(client,company,data),total=serviceInvoiceTotals(data)
  await client.query('DELETE FROM erp.notas_fiscais_itens WHERE empresa_id=$1 AND nota_fiscal_id=$2',[company,id]);await client.query('DELETE FROM erp.notas_fiscais_totais WHERE empresa_id=$1 AND nota_fiscal_id=$2',[company,id])
  const updated=(await query(client,`UPDATE erp.notas_fiscais SET entidade_id=$3,venda_id=$4,data_competencia=$5,codigo_municipio_prestacao=$6,modelo_emissao=$7,valor_servicos=$8,valor_total=$8,destinatario_snapshot=$9::jsonb,metadata=$10::jsonb,versao=versao+1,atualizado_por=$11 WHERE empresa_id=$1 AND id=$2 RETURNING *`,
  [company,id,data.cliente_id,data.venda_id||null,data.data_competencia,data.codigo_municipio_prestacao,data.modelo_emissao,total.total,JSON.stringify({...refs.customer,...markers}),JSON.stringify({...markers,observacoes:data.observacoes}),actor]))[0]
  await children(client,company,actor,updated,refs);await history(client,company,actor,id,'editada','rascunho','rascunho')
  await recordOperation(client,company,actor,updated,'editar',key,payload);await pdf(client,company,actor,updated)
  return {record:publicRecord(updated),reused:false}
 })
}
export async function validateServiceInvoice(company:number,id:number){
 const detail=await getServiceInvoice(company,id),issues:{code:string;message:string}[]=[]
 if(Number(detail.record.valor_total)<=0)issues.push({code:'TOTAL_INVALIDO',message:'O total da nota deve ser maior que zero.'})
 const data=serviceInvoiceInputSchema.parse(detail.input)
 await withTransaction(client=>references(client,company,data))
 return {ready:issues.length===0,issues,modo_operacao:'simulacao',aviso:SIMULATION_NOTICE,totals:detail.totals}
}
export async function actOnServiceInvoice(company:number,actor:number,id:number,input:ServiceInvoiceAction){
 context(company,actor);const data=serviceInvoiceActionSchema.parse(input)
 return withTransaction(async client=>{
  let row=await noteRow(client,company,id,true)
  if(await replay(client,company,actor,row,data.acao,data.chave_operacao,data))return {record:publicRecord(row),reused:true}
  version(row,data.versao)
  if(row.excluido_em)throw new ErpDomainError('INVALID_STATE','O rascunho foi excluído.',409)
  if(data.acao==='excluir'){
   if(row.status!=='rascunho')throw new ErpDomainError('INVALID_STATE','Só rascunhos podem ser excluídos. Para notas emitidas, use cancelamento.',409)
   if(!data.motivo)throw new ErpDomainError('VALIDATION_ERROR','Informe o motivo da exclusão.')
   await client.query('UPDATE erp.notas_fiscais SET excluido_em=now(),versao=versao+1,atualizado_por=$3 WHERE empresa_id=$1 AND id=$2',[company,id,actor])
  }else{
   let result
   if(data.acao==='emitir'){
    if(!['rascunho','falha'].includes(String(row.status)))throw new ErpDomainError('INVALID_STATE','A nota já foi enviada ou finalizada.',409)
    const detail=await getServiceInvoice(company,id)
    await references(client,company,serviceInvoiceInputSchema.parse(detail.input))
    if(Number(row.valor_total)<=0)throw new ErpDomainError('VALIDATION_ERROR','O total da nota deve ser maior que zero.')
    result=serviceInvoiceSimulator.emit(data.cenario)
    // The attempt trigger requires a prepared state; only the local simulator reaches it.
    await client.query("UPDATE erp.notas_fiscais SET status='aguardando_retorno',simulacao_cenario=$3 WHERE empresa_id=$1 AND id=$2",[company,id,data.cenario])
   }else if(data.acao==='consultar'){
    if(row.status!=='aguardando_retorno')throw new ErpDomainError('INVALID_STATE','A nota não está aguardando resultado. Use a consulta de detalhes.',409)
    result=serviceInvoiceSimulator.consult()
   }else{
    if(row.status!=='emitida')throw new ErpDomainError('INVALID_STATE','Só notas simuladas emitidas podem ser canceladas.',409)
    if(!data.motivo)throw new ErpDomainError('VALIDATION_ERROR','Informe o motivo do cancelamento.')
    result=serviceInvoiceSimulator.cancel()
   }
   const before=row.status
   await recordOperation(client,company,actor,{...row,status:result.status},data.acao,data.chave_operacao,data)
   const returned={...markers,status:result.status,codigo:result.codigo,mensagem:result.mensagem,motivo:data.motivo||null}
   await client.query(`INSERT INTO erp.notas_fiscais_retornos(empresa_id,nota_fiscal_id,provedor,ambiente,referencia_externa,evento_externo_id,chave_deduplicacao,payload,status,tentativas_processamento,processado_em)
    VALUES($1,$2,$3,'homologacao',$4,$5,$6,$7::jsonb,'processado',1,now())`,[company,id,PROVIDER,row.referencia_externa,'local-'+data.acao+'-'+fingerprint(data.chave_operacao),fingerprint({id,data}),JSON.stringify(returned)])
   row=(await query(client,`UPDATE erp.notas_fiscais SET status=$3,resposta_provedor=$4::jsonb,erro_codigo=$5,erro_mensagem=$6,
    emitida_em=CASE WHEN $3='emitida' THEN COALESCE(emitida_em,now()) ELSE emitida_em END,
    autorizada_em=CASE WHEN $3='emitida' THEN COALESCE(autorizada_em,now()) ELSE autorizada_em END,
    cancelada_em=CASE WHEN $3='cancelada' THEN now() ELSE cancelada_em END,versao=versao+1,atualizado_por=$7
    WHERE empresa_id=$1 AND id=$2 RETURNING *`,[company,id,result.status,JSON.stringify(returned),result.status==='falha'||result.codigo==='SIMULADO_TIMEOUT'?result.codigo:null,result.status==='falha'||result.codigo==='SIMULADO_TIMEOUT'?result.mensagem:null,actor]))[0]
   await history(client,company,actor,id,data.acao,before,result.status,returned);await pdf(client,company,actor,row)
   return {record:publicRecord(row),reused:false}
  }
  row=await noteRow(client,company,id,true);await recordOperation(client,company,actor,row,data.acao,data.chave_operacao,data)
  await history(client,company,actor,id,'excluida','rascunho','rascunho',{motivo:data.motivo})
  return {record:publicRecord(row),reused:false}
 })
}
export async function listServiceInvoices(company:number,input:{busca?:string;status?:string;inicio?:string;fim?:string;pagina?:number;por_pagina?:number}={}){
 context(company);const page=input.pagina||1,size=input.por_pagina||20
 const rows=await runQuery<Row>(`SELECT n.*,count(*) OVER()::int __total FROM erp.notas_fiscais n
  WHERE empresa_id=$1 AND tipo='nfse' AND direcao='saida' AND modo_operacao='simulacao' AND excluido_em IS NULL
  AND ($2::text IS NULL OR numero ILIKE '%'||$2||'%' OR destinatario_snapshot->>'nome' ILIKE '%'||$2||'%')
  AND ($3::text IS NULL OR status=$3) AND ($4::date IS NULL OR data_competencia>=$4) AND ($5::date IS NULL OR data_competencia<=$5)
  ORDER BY criado_em DESC,id DESC LIMIT $6 OFFSET $7`,[company,input.busca||null,input.status||null,input.inicio||null,input.fim||null,size,(page-1)*size])
 return {records:rows.map(publicRecord),total:Number(rows[0]?.__total||0),page,pageSize:size,hasMore:page*size<Number(rows[0]?.__total||0),modo_operacao:'simulacao',aviso:SIMULATION_NOTICE}
}
export async function getServiceInvoice(company:number,id:number){
 context(company)
 const rows=await runQuery<Row>(`SELECT * FROM erp.notas_fiscais WHERE empresa_id=$1 AND id=$2 AND modo_operacao='simulacao' AND tipo='nfse' AND direcao='saida' AND excluido_em IS NULL`,[company,id])
 if(!rows[0])throw new ErpDomainError('NOT_FOUND','Nota de serviço simulada não encontrada.',404)
 const row=rows[0]
 const items=await runQuery<Row>('SELECT id::text,servico_id::text,descricao,quantidade,valor_unitario,valor_total,desconto,aliquota_iss FROM erp.notas_fiscais_itens WHERE empresa_id=$1 AND nota_fiscal_id=$2 AND excluido_em IS NULL ORDER BY numero_item,id',[company,id])
 const totals=(await runQuery<Row>('SELECT base_iss,valor_iss,retencao_iss,iss_retido,valor_liquido FROM erp.notas_fiscais_totais WHERE empresa_id=$1 AND nota_fiscal_id=$2',[company,id]))[0]||{}
 const events=await runQuery<Row>('SELECT evento,status_anterior,status_novo,criado_em FROM erp.notas_fiscais_eventos WHERE empresa_id=$1 AND nota_fiscal_id=$2 ORDER BY id DESC LIMIT 100',[company,id])
 return {record:publicRecord(row),items,totals,events,input:{cliente_id:Number(row.entidade_id),venda_id:row.venda_id?Number(row.venda_id):undefined,data_competencia:row.data_competencia instanceof Date?row.data_competencia.toISOString().slice(0,10):String(row.data_competencia),codigo_municipio_prestacao:row.codigo_municipio_prestacao,modelo_emissao:row.modelo_emissao,aliquota_iss:Number(items[0]?.aliquota_iss||0),iss_retido:Boolean(totals.iss_retido),observacoes:String((row.metadata as Row)?.observacoes||''),itens:items.map(i=>({tipo:'servico',item_id:Number(i.servico_id),descricao:i.descricao,quantidade:Number(i.quantidade),valor_unitario:Number(i.valor_unitario),desconto:Number(i.desconto)}))}}
}
export async function getServiceInvoicePdf(company:number,id:number,requestedVersion?:number){
 await getServiceInvoice(company,id)
 const rows=await runQuery<Row>(`SELECT nome,conteudo,hash_sha256,versao FROM erp.notas_fiscais_pdfs WHERE empresa_id=$1 AND nota_fiscal_id=$2 AND ($3::integer IS NULL OR versao=$3) ORDER BY versao DESC LIMIT 1`,[company,id,requestedVersion||null])
 if(!rows[0])throw new ErpDomainError('NOT_FOUND','PDF ainda não disponível para esta nota demonstrativa.',404)
 return {name:String(rows[0].nome),bytes:rows[0].conteudo as Buffer,hash:String(rows[0].hash_sha256),version:Number(rows[0].versao)}
}
export async function generateServiceInvoicePdf(company:number,actor:number,id:number){
 context(company,actor)
 return withTransaction(async client=>{const row=await noteRow(client,company,id);await pdf(client,company,actor,row);return {pdf_url:`/api/erp/notas-servico/${id}/pdf`,modo_operacao:'simulacao'}})
}
