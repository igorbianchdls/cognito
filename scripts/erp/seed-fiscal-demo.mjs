import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {mkdirSync,writeFileSync} from 'node:fs'
import {connection,project} from './evolution-db.mjs'

const DATASET='fiscal-demo-20261006', COMPANY=2, ACTOR=3, PROVIDER='simulador_local'
const apply=process.argv.includes('--apply')
assert(process.argv.slice(2).every(x=>['--check','--apply','--project='+project].includes(x)))
if(apply)assert(process.argv.includes('--project='+project),'Explicit verified project required')
const hash=x=>createHash('sha256').update(JSON.stringify(x)).digest('hex')
const cents=x=>Math.round(Number(x||0)*100)
const money=x=>(x/100).toFixed(2)
const day=x=>x instanceof Date?x.toISOString().slice(0,10):String(x).slice(0,10)
const stamp=(date,hour=9)=>`${date}T${String(hour).padStart(2,'0')}:00:00-03:00`
const metadata={demo:true,simulado:true,sem_validade_fiscal:true,dataset:DATASET,reference:'2026-10-06'}
const label='SIMULAÇÃO — SEM VALIDADE FISCAL'
const db=connection();let committed=false,current='initialization'
const core=['entidades','produtos','servicos','vendas','vendas_itens','compras','compras_itens','contas_pagar','contas_receber','contas_pagar_parcelas','contas_receber_parcelas','pagamentos','movimentacoes_estoque','saldos_estoque','arquivos']
const created=[]
async function insert(table,data){
 const keys=Object.keys(data),values=Object.values(data).map(x=>x!==null&&typeof x==='object'?JSON.stringify(x):x)
 const result=await db.query(`INSERT INTO erp.${table} (${keys.join(',')}) VALUES (${keys.map((_,i)=>'$'+(i+1)).join(',')}) RETURNING id::text`,values)
 return result.rows[0].id
}
async function fingerprints(){
 const result={}
 for(const table of core){const rows=(await db.query(`SELECT row_to_json(t) value FROM erp.${table} t`)).rows.map(x=>JSON.stringify(x.value)).sort();result[table]={count:rows.length,digest:hash(rows)}}
 return result
}
async function event(noteId,name,previous,next,at,links={}){
 return insert('notas_fiscais_eventos',{empresa_id:COMPANY,nota_fiscal_id:noteId,provedor:PROVIDER,
  evento:'simulacao_'+name,status_anterior:previous,status_novo:next,payload:{...metadata,aviso:label},
  recebido_em:at,processado_em:at,criado_por:ACTOR,atualizado_por:ACTOR,metadata,...links})
}
async function transition(noteId,previous,next,at){
 await db.query('UPDATE erp.notas_fiscais SET status=$3 WHERE empresa_id=$1 AND id=$2',[COMPANY,noteId,next])
 await event(noteId,next,previous,next,at)
}
async function verify(){
 const rows=(await db.query(`SELECT n.id::text,n.numero,n.direcao,n.tipo,n.status,n.valor_total,n.venda_id::text,n.compra_id::text,n.conteudo_bloqueado_em,
  (SELECT count(*)::int FROM erp.notas_fiscais_itens i WHERE i.empresa_id=n.empresa_id AND i.nota_fiscal_id=n.id) item_count,
  (SELECT sum(i.valor_total) FROM erp.notas_fiscais_itens i WHERE i.empresa_id=n.empresa_id AND i.nota_fiscal_id=n.id) item_sum,
  t.desconto,t.frete,t.valor_seguro,t.outras_despesas,t.valor_iss,t.retencao_iss,t.valor_liquido
  FROM erp.notas_fiscais n JOIN erp.notas_fiscais_totais t ON t.empresa_id=n.empresa_id AND t.nota_fiscal_id=n.id
  WHERE n.empresa_id=$1 AND n.metadata->>'dataset'=$2 ORDER BY n.numero`,[COMPANY,DATASET])).rows
 assert.equal(rows.length,12)
 const statuses={},types={},directions={}
 for(const n of rows){assert(n.numero.startsWith('DEMO-'));assert(n.item_count>0)
  assert.equal(cents(n.valor_total),cents(n.item_sum)-cents(n.desconto)+cents(n.frete)+cents(n.valor_seguro)+cents(n.outras_despesas))
  assert.equal(cents(n.valor_liquido),cents(n.valor_total)-cents(n.retencao_iss))
  assert.equal(Boolean(n.conteudo_bloqueado_em),['emitida','cancelada'].includes(n.status))
  statuses[n.status]=(statuses[n.status]||0)+1;types[n.tipo]=(types[n.tipo]||0)+1;directions[n.direcao]=(directions[n.direcao]||0)+1
 }
 assert.deepEqual(statuses,{rascunho:3,aguardando_retorno:2,emitida:3,cancelada:2,falha:2})
 assert.equal(types.nfe,6);assert.equal(types.nfse,6);assert.deepEqual(directions,{saida:8,entrada:4})
 const config=(await db.query(`SELECT ativo,padrao,token_secret_ref,ambiente,provedor FROM erp.configuracoes_fiscais WHERE empresa_id=$1 AND metadata->>'dataset'=$2`,[COMPANY,DATASET])).rows
 assert.equal(config.length,1);assert.equal(config[0].ativo,false);assert.equal(config[0].padrao,false);assert.equal(config[0].token_secret_ref,null)
 assert.equal(config[0].ambiente,'homologacao');assert.equal(config[0].provedor,PROVIDER)
 assert.equal((await db.query("SELECT count(*)::int n FROM erp.fiscal_issuer_for_operations($1,'homologacao')",[COMPANY])).rows[0].n,0)
 const attempts=(await db.query(`SELECT t.status,t.proxima_tentativa_em,t.payload_enviado FROM erp.notas_fiscais_tentativas t JOIN erp.notas_fiscais n ON n.empresa_id=t.empresa_id AND n.id=t.nota_fiscal_id WHERE n.empresa_id=$1 AND n.metadata->>'dataset'=$2`,[COMPANY,DATASET])).rows
 assert.equal(attempts.length,7);assert(attempts.every(x=>x.status==='concluida'&&x.proxima_tentativa_em===null&&x.payload_enviado.simulado===true))
 const returns=(await db.query(`SELECT r.status,r.payload FROM erp.notas_fiscais_retornos r JOIN erp.notas_fiscais n ON n.empresa_id=r.empresa_id AND n.id=r.nota_fiscal_id WHERE n.empresa_id=$1 AND n.metadata->>'dataset'=$2`,[COMPANY,DATASET])).rows
 assert.equal(returns.length,9);assert(returns.every(x=>x.status==='processado'&&x.payload.simulado===true))
 assert.equal((await db.query(`SELECT count(*)::int n FROM erp.notas_fiscais WHERE empresa_id=$1 AND metadata->>'dataset'=$2 AND (ambiente<>'homologacao' OR provedor<>$3 OR chave_acesso IS NOT NULL OR xml_url IS NOT NULL OR pdf_url IS NOT NULL OR danfe_url IS NOT NULL)`,[COMPANY,DATASET,PROVIDER])).rows[0].n,0)
 await db.query("SELECT set_config('app.erp_tenant_id','999999999',true)")
 assert.equal((await db.query(`SELECT count(*)::int n FROM erp.notas_fiscais WHERE empresa_id=$1 AND metadata->>'dataset'=$2`,[COMPANY,DATASET])).rows[0].n,0)
 await db.query("SELECT set_config('app.erp_tenant_id',$1,true)",[String(COMPANY)])
 const events=(await db.query(`SELECT count(*)::int n FROM erp.notas_fiscais_eventos WHERE empresa_id=$1 AND metadata->>'dataset'=$2`,[COMPANY,DATASET])).rows[0].n
 return {notes:12,items:rows.reduce((s,n)=>s+n.item_count,0),totals:12,events,attempts:attempts.length,returns:returns.length,statuses,types,directions,documents:rows.map(({item_sum,...row})=>({...row,conteudo_bloqueado_em:Boolean(row.conteudo_bloqueado_em)}))}
}
try{
 await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ');await db.query("SET LOCAL lock_timeout='5s'")
 assert.equal((await db.query('SELECT pg_try_advisory_xact_lock(73009,20261006) ok')).rows[0].ok,true)
 assert.equal((await db.query("SELECT count(*)::int n FROM supabase_migrations.schema_migrations WHERE version='20261006010000'")).rows[0].n,1)
 const owner=(await db.query(`SELECT u.id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=$1 AND e.id=$2 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'`,[ACTOR,COMPANY])).rows
 assert.equal(owner.length,1,'Expected active company owner')
 const before=await fingerprints()
 await db.query('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)",[String(COMPANY),String(ACTOR)])
 const existing=(await db.query("SELECT count(*)::int n FROM erp.notas_fiscais WHERE empresa_id=$1 AND metadata->>'dataset'=$2",[COMPANY,DATASET])).rows[0].n
 if(existing){await db.query('SET CONSTRAINTS ALL IMMEDIATE');const summary=await verify();await db.query('ROLLBACK');console.log(JSON.stringify({status:'already_created_and_verified',dataset:DATASET,...summary}));}
 else{
  current='select matching origins'
  const sales=(await db.query(`SELECT v.* FROM erp.vendas v WHERE empresa_id=$1 AND excluido_em IS NULL AND tipo_documento='venda' AND status IN ('rascunho','confirmada') AND data_venda BETWEEN DATE '2026-09-01' AND DATE '2026-10-06' AND NOT EXISTS(SELECT 1 FROM erp.notas_fiscais n WHERE n.empresa_id=v.empresa_id AND n.venda_id=v.id AND n.excluido_em IS NULL) ORDER BY data_venda DESC,id DESC`,[COMPANY])).rows
  const purchases=(await db.query(`SELECT c.* FROM erp.compras c WHERE empresa_id=$1 AND excluido_em IS NULL AND tipo_movimento='compra' AND data_compra BETWEEN DATE '2026-09-01' AND DATE '2026-10-06' AND NOT EXISTS(SELECT 1 FROM erp.notas_fiscais n WHERE n.empresa_id=c.empresa_id AND n.compra_id=c.id AND n.excluido_em IS NULL) ORDER BY data_compra DESC,id DESC`,[COMPANY])).rows
  const saleItems=(await db.query('SELECT * FROM erp.vendas_itens WHERE empresa_id=$1 AND excluido_em IS NULL',[COMPANY])).rows
  const purchaseItems=(await db.query('SELECT * FROM erp.compras_itens WHERE empresa_id=$1 AND excluido_em IS NULL',[COMPANY])).rows
  const entities=new Map((await db.query('SELECT id,nome,documento,cidade,uf FROM erp.entidades WHERE empresa_id=$1 AND excluido_em IS NULL',[COMPANY])).rows.map(x=>[String(x.id),x]))
  const services=new Map((await db.query('SELECT id,codigo,codigo_servico_municipal FROM erp.servicos WHERE empresa_id=$1 AND excluido_em IS NULL',[COMPANY])).rows.map(x=>[String(x.id),x]))
  const products=new Map((await db.query('SELECT id,codigo,unidade_medida AS unidade FROM erp.produtos WHERE empresa_id=$1 AND excluido_em IS NULL',[COMPANY])).rows.map(x=>[String(x.id),x]))
  const grouped=(origins,items,foreign)=>origins.map(origin=>({origin,items:items.filter(i=>String(i[foreign])===String(origin.id))})).filter(x=>x.items.length>0)
  const saleGroups=grouped(sales,saleItems,'venda_id'),purchaseGroups=grouped(purchases,purchaseItems,'compra_id')
  const select=(groups,service,statuses,incoming)=>{
   const candidates=groups.filter(g=>g.items.every(i=>service?!!i.servico_id:!!i.produto_id))
   assert(candidates.length>=statuses.length,'Not enough homogeneous commercial documents')
   return statuses.map((status,i)=>({...candidates[i],status,incoming,service}))
  }
  const cases=[...select(saleGroups,false,['rascunho','aguardando_retorno','emitida','cancelada'],false),
   ...select(saleGroups,true,['rascunho','aguardando_retorno','falha','emitida'],false),
   ...select(purchaseGroups,false,['emitida','cancelada'],true),...select(purchaseGroups,true,['rascunho','falha'],true)]
  const localIssuer={nome:'[SIMULAÇÃO] Creatto Tecnologia',cnpj:'00000000000000',municipio:'Fortaleza',uf:'CE',...metadata,aviso:label}
  const configId=await insert('configuracoes_fiscais',{empresa_id:COMPANY,cnpj:localIssuer.cnpj,razao_social:localIssuer.nome,provedor:PROVIDER,ambiente:'homologacao',ativo:false,padrao:false,token_secret_ref:null,endereco_codigo_municipio:'2304400',endereco_municipio:'Fortaleza',endereco_uf:'CE',metadata,criado_por:ACTOR,atualizado_por:ACTOR})
  for(let index=0;index<cases.length;index++){
   const scenario=cases[index],{origin,items,service,incoming,status}=scenario
   const number='DEMO-'+String(index+1).padStart(4,'0'),reference=DATASET+'-'+String(index+1).padStart(2,'0')
   current=number
   const date=day(incoming?origin.data_compra:origin.data_venda),at=stamp(date),authorizedAt=stamp(date,10),cancelAt=stamp(date,11)
   const counterpart=entities.get(String(incoming?origin.fornecedor_id:origin.cliente_id));assert(counterpart)
   const counterpartSnapshot={...counterpart,...metadata,aviso:label}
   const subtotal=items.reduce((sum,i)=>sum+cents(i.total),0)
   assert.equal(subtotal,cents(origin.subtotal),'Item totals mismatch commercial subtotal')
   const discount=cents(origin.desconto),freight=cents(origin.frete),total=cents(origin.total)
   assert.equal(total,subtotal-discount+freight,'Commercial total has unexpected components')
   const iss=service?Math.round((subtotal-discount)*0.05):0
   const retained=service&&index===7?iss:0
   const model=service?(index%2?'nfse_nacional':'nfse_municipal'):'nfe'
   const simulation={...metadata,aviso:label,origem_numero:origin.numero,envio_externo:false}
   const final=status==='emitida'||status==='cancelada'
   const noteId=await insert('notas_fiscais',{empresa_id:COMPANY,entidade_id:counterpart.id,
    venda_id:incoming?null:origin.id,compra_id:incoming?origin.id:null,configuracao_fiscal_id:configId,
    tipo:service?'nfse':'nfe',direcao:incoming?'entrada':'saida',finalidade:'normal',natureza_operacao:label+' — '+(service?'Prestação de serviços':'Comercialização de mercadorias'),
    referencia_externa:reference,provedor:PROVIDER,ambiente:'homologacao',modelo_emissao:model,status:'rascunho',numero:number,serie:'DEMO',
    valor_produtos:money(service?0:subtotal),valor_servicos:money(service?subtotal:0),valor_total:money(total),
    payload_enviado:simulation,resposta_provedor:{...simulation,status_simulado:status},metadata,
    emitente_snapshot:incoming?counterpartSnapshot:localIssuer,destinatario_snapshot:incoming?localIssuer:counterpartSnapshot,
    integracao_snapshot:{...simulation,provedor:PROVIDER,ambiente:'homologacao',configuracao_ativa:false},
    data_competencia:service?date:null,numero_rps:model==='nfse_municipal'?number:null,serie_rps:model==='nfse_municipal'?'DEMO':null,
    numero_dps:model==='nfse_nacional'?String(index+1):null,serie_dps:model==='nfse_nacional'?'1':null,
    codigo_municipio_emissao:service?'2304400':null,codigo_municipio_prestacao:service?'2304400':null,
    protocolo:final?'SIMULADO-'+number:null,emitida_em:final?at:null,autorizada_em:final?authorizedAt:null,cancelada_em:status==='cancelada'?cancelAt:null,
    erro_codigo:status==='falha'?'SIMULADO_DADOS_INCOMPLETOS':null,erro_mensagem:status==='falha'?label+' — exemplo de rejeição por cadastro incompleto.':null,
    criado_em:at,criado_por:ACTOR,atualizado_por:ACTOR})
   for(let j=0;j<items.length;j++){
    const item=items[j],catalog=service?services.get(String(item.servico_id)):products.get(String(item.produto_id))
    assert(catalog)
    await insert('notas_fiscais_itens',{empresa_id:COMPANY,nota_fiscal_id:noteId,
     venda_item_id:incoming?null:item.id,compra_item_id:incoming?item.id:null,produto_id:item.produto_id,servico_id:item.servico_id,
     tipo_item:service?'servico':'produto',descricao:'[SIMULAÇÃO] '+item.descricao,numero_item:j+1,codigo_item:catalog.codigo,unidade:catalog.unidade||'UN',
     quantidade:item.quantidade,valor_unitario:item.valor_unitario,valor_total:money(cents(item.total)),
     desconto:money(cents(item.valor_desconto)),codigo_servico_municipal:service?catalog.codigo_servico_municipal:null,
     aliquota_iss:service?'5.0000':null,base_iss:service?money(cents(item.total)-(items.length===1?discount:0)):null,valor_iss:service?money(iss):null,
     tributos:service?{...simulation,aliquota_iss_exemplo:5}:{...simulation,calculo_tributario_nao_realizado:true},payload_item:simulation,metadata,criado_por:ACTOR,atualizado_por:ACTOR})
   }
   await insert('notas_fiscais_totais',{empresa_id:COMPANY,nota_fiscal_id:noteId,desconto:money(discount),frete:money(freight),
    base_iss:service?money(subtotal-discount):null,valor_iss:service?money(iss):null,iss_retido:service?retained>0:null,
    retencao_iss:service?money(retained):null,valor_liquido:money(total-retained),metadata,criado_por:ACTOR,atualizado_por:ACTOR})
   await event(noteId,'criada',null,'rascunho',at)
   let attemptId=null
   if(status!=='rascunho'){
    if(!incoming){
     await transition(noteId,'rascunho','aguardando_retorno',at)
     const request={...simulation,acao:'emitir',referencia_externa:reference,valor_total:money(total)}
     attemptId=await insert('notas_fiscais_tentativas',{empresa_id:COMPANY,nota_fiscal_id:noteId,acao:'emitir',chave_idempotencia:reference+'-emitir',request_hash:hash(request),provedor:PROVIDER,ambiente:'homologacao',referencia_externa:reference,payload_enviado:request,status:'concluida',resposta_provedor:{...simulation,resultado_simulado:status},concluida_em:at,criado_por:ACTOR,atualizado_por:ACTOR})
    }
    const response={...simulation,status_simulado:status,recebido_de_api:false}
    const returnId=await insert('notas_fiscais_retornos',{empresa_id:COMPANY,nota_fiscal_id:noteId,provedor:PROVIDER,ambiente:'homologacao',referencia_externa:reference,evento_externo_id:reference+'-retorno',chave_deduplicacao:hash({reference,status}),payload:response,status:'processado',tentativas_processamento:1,recebido_em:at,processado_em:at})
    await event(noteId,'retorno_local',incoming?'rascunho':'aguardando_retorno',status,at,{retorno_id:returnId,tentativa_id:attemptId})
    let previous=incoming?'rascunho':'aguardando_retorno'
    if(status==='cancelada'){
     await transition(noteId,previous,'emitida',authorizedAt);previous='emitida'
     if(!incoming){const request={...simulation,acao:'cancelar',motivo:'Cancelamento demonstrativo sem envio externo'}
      const cancelId=await insert('notas_fiscais_tentativas',{empresa_id:COMPANY,nota_fiscal_id:noteId,acao:'cancelar',chave_idempotencia:reference+'-cancelar',request_hash:hash(request),provedor:PROVIDER,ambiente:'homologacao',referencia_externa:reference,payload_enviado:request,status:'concluida',resposta_provedor:simulation,concluida_em:cancelAt,criado_por:ACTOR,atualizado_por:ACTOR})
      await event(noteId,'pedido_cancelamento_local','emitida','cancelada',cancelAt,{tentativa_id:cancelId})}
    }
    if(status!==previous)await transition(noteId,previous,status,status==='cancelada'?cancelAt:authorizedAt)
   }
   created.push({id:noteId,numero:number,status,origem:origin.numero})
   console.log(JSON.stringify({prepared:number,status}))
  }
  current='validate and preserve business records';await db.query('SET CONSTRAINTS ALL IMMEDIATE')
  const summary=await verify()
  await db.query('RESET ROLE');assert.deepEqual(await fingerprints(),before,'Existing commercial/financial/stock records changed')
  mkdirSync('.cache/fiscal-demo',{recursive:true})
  const report={status:apply?'created_and_verified':'dry_run_passed',date:new Date().toISOString(),project,companyId:COMPANY,actorId:ACTOR,dataset:DATASET,configId,
   noExternalApi:true,noFiscalCredentials:true,configurationInactive:true,businessRecordsPreserved:true,...summary}
  if(apply){await db.query('COMMIT');committed=true}else await db.query('ROLLBACK')
  writeFileSync('.cache/fiscal-demo/'+(apply?'application':'dry-run')+'.json',JSON.stringify({...report,committed},null,2))
  console.log(JSON.stringify({...report,documents:undefined,committed}))
 }
}catch(error){if(!committed)await db.query('ROLLBACK').catch(()=>{});console.error(JSON.stringify({status:committed?'committed_requires_attention':'rolled_back',case:current,code:error.code,message:error.message}));process.exitCode=1}
finally{await db.end()}
