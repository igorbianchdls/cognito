import assert from 'node:assert/strict'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import { db, restoreCatalog } from './evolution-fixture.mjs'

const root = resolve('.')
const require = createRequire(import.meta.url)
const checks = []
async function test(name, fn) { await fn(); checks.push(name) }
function loader(stubs = {}) {
  const cache = new Map()
  function load(name, parent = resolve(root, 'entry.ts')) {
    if (Object.hasOwn(stubs, name)) return stubs[name]
    if (!name.startsWith('.') && !name.startsWith('@/') && !name.startsWith(root)) {
      if (name === 'next/server') return { NextResponse: { json: (body, init) => Response.json(body, init) } }
      return require(name)
    }
    let file = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(parent), name)
    if (!existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map(s => file + s).find(existsSync)
    assert(file, 'Modulo nao encontrado: ' + name)
    if (cache.has(file)) return cache.get(file).exports
    const moduleRecord = { exports: {} }; cache.set(file, moduleRecord)
    const source = readFileSync(file, 'utf8')
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
    const run = vm.runInThisContext('(function(require,module,exports){' + compiled + '\n})', { filename: file })
    run(dep => load(dep, file), moduleRecord, moduleRecord.exports)
    return moduleRecord.exports
  }
  return load
}
async function main() {
  const load = loader()
  const money = load('@/products/erp/shared/erpMoney')
  const errors = load('@/products/erp/shared/erpErrors')
  const transport = load('@/products/erp/shared/erpTransport')
  const { ErpMutation } = load('@/products/erp/frontend/services/erpMutation')
  const { parseErpResponse } = load('@/products/erp/frontend/services/erpProfessionalClient')
  const identity = load('@/products/erp/server/erpSettlementIdentity')
  await test('arredondamento decimal coincide com numeric', () => {
    assert.equal(money.decimalNumber('1.005'),1.01);assert.equal(money.decimalNumber('-1.005'),-1.01)
    assert.equal(money.sumMoney(['0.10','0.20']),0.3)
    assert.equal(money.lineTotal('1.5','2.01'),3.02)
    assert.equal(money.discountAmount('200','10','percentual'),20)
    assert.equal(money.paymentTotal(100,5,2,10,3,'receber'),94)
    assert.equal(money.paymentTotal(100,5,2,10,3,'pagar'),100)
  })
  await test('valores invalidos nao viram zero', () => {
    for(const x of [NaN,Infinity,true,{},'',null,'1.000,00','texto','-0.001']) assert.throws(()=>money.nonNegativeDecimal(x))
    assert.throws(()=>money.decimalNumber('99999999999999999'))
    assert.equal(money.nonNegativeDecimal('10,25'),10.25)
  })
  await test('envelopes datas versoes e campos controlados', () => {
    assert(transport.erpDateSchema.safeParse('2024-02-29').success)
    assert(!transport.erpDateSchema.safeParse('2026-02-29').success)
    assert(!transport.erpDateSchema.safeParse('2026-04-31').success)
    assert(!transport.erpUpdateEnvelopeSchema.safeParse({values:{},expectedVersion:0}).success)
    assert(!transport.erpCreateEnvelopeSchema.safeParse({values:{tenant_id:2}}).success)
    assert(!transport.erpCreateEnvelopeSchema.safeParse({values:{historico_estados:[]}}).success)
    assert(!transport.erpCreateEnvelopeSchema.safeParse({values:null}).success)
  })
  await test('erros preservam orientacao e ocultam detalhes internos', () => {
    assert.equal(errors.normalizeErpError({code:'40001'}).recovery,'same-operation')
    assert.equal(errors.normalizeErpError({code:'23514',message:'periodo fechado'}).code,'PERIOD_CLOSED')
    assert.equal(errors.normalizeErpError({code:'23505'}).status,409)
    assert.equal(errors.normalizeErpError({code:'42501'}).status,403)
    assert.equal(errors.normalizeErpError(new Error('CONFLITO_VERSAO: x')).recovery,'refresh')
    assert(!errors.normalizeErpError(new Error('SQL senha=segredo')).message.includes('segredo'))
  })
  await test('cliente preserva codigo detalhes e correlacao', async () => {
    await assert.rejects(()=>parseErpResponse(Response.json({error:{code:'VERSION_CONFLICT',message:'Atualize',details:{field:'versao'},correlationId:'abc',recovery:'refresh'}},{status:409})),
      e=>e.code==='VERSION_CONFLICT'&&e.correlationId==='abc'&&e.details.field==='versao'&&e.recovery==='refresh')
    await assert.rejects(()=>parseErpResponse(new Response('html',{status:200})),e=>e.recovery==='verify')
    await assert.rejects(()=>parseErpResponse(Response.json({error:'Legado'},{status:403})),/Legado/)
  })
  await test('clique simultaneo compartilha uma solicitacao', async () => {
    let sends=0,finish
    const mutation=new ErpMutation(async()=>{sends++;return new Promise(r=>{finish=r})},true)
    const a=mutation.submit('/api/erp/teste',{valor:100}),b=mutation.submit('/api/erp/teste',{valor:100})
    finish(Response.json({id:'1'}));assert.deepEqual(await a,await b);assert.equal(sends,1)
  })
  await test('repeticao apos perda de resposta conserva chave e corpo', async () => {
    const calls=[];let first=true
    const mutation=new ErpMutation(async(url,init)=>{calls.push(init);if(first){first=false;throw new Error('offline')}return Response.json({id:'1'})},true)
    await assert.rejects(()=>mutation.submit('/api/erp/teste',{valor:100}),e=>e.code==='NETWORK_ERROR')
    await assert.rejects(()=>mutation.submit('/api/erp/teste',{valor:200}),e=>e.code==='OPERATION_UNCERTAIN')
    assert.deepEqual(await mutation.submit('/api/erp/teste',{valor:100}),{id:'1'})
    assert.equal(calls.length,2);assert.equal(calls[0].headers['Idempotency-Key'],calls[1].headers['Idempotency-Key']);assert.equal(calls[0].body,calls[1].body)
  })
  await test('operacao sem suporte duravel nao repete resultado incerto', async()=>{
    let calls=0;const mutation=new ErpMutation(async()=>{calls++;throw new Error('offline')})
    await assert.rejects(()=>mutation.submit('/api/erp/clientes',{values:{nome:'Teste'}}))
    await assert.rejects(()=>mutation.submit('/api/erp/clientes',{values:{nome:'Teste'}}),e=>e.code==='OPERATION_UNCERTAIN')
    assert.equal(calls,1)
  })
  await test('solicitacao canonica compara valores e destino',()=>{
    const a=identity.settlementIdentity('receber',101,{valor:'10.00',data_pagamento:'2026-01-01'})
    const b=identity.settlementIdentity('receber','101',{valor:10,data_pagamento:'2026-01-01'})
    identity.assertSettlementReplay({settlementRequest:a},b)
    assert.throws(()=>identity.assertSettlementReplay({settlementRequest:a},{...b,amount:'11.00'}),e=>e.code==='IDEMPOTENCY_CONFLICT')
    assert.throws(()=>identity.assertSettlementReplay({},a))
    assert.throws(()=>identity.settlementIdentity('receber',101,{data_pagamento:'2026-02-30'}))
  })
  await test('permissoes negadas durante carregamento',()=>{
    const React=require('react'),{renderToStaticMarkup}=require('react-dom/server')
    const {useErpAccess}=load('@/products/erp/frontend/hooks/useErpAccess')
    function Probe(){return useErpAccess().can('erp.financeiro.baixar')?'permitido':'bloqueado'}
    assert.equal(renderToStaticMarkup(React.createElement(Probe)),'bloqueado')
  })
  // Cliente de conexao falso: garante rollback e escopo sem ler nenhuma configuracao real.
  await test('transacao aplica contexto no commit e reverte falha diferida', async()=>{
    const trace=[];let fail=false,context={tenantId:1,userId:1},releases=0
    const raw={query:async(sql)=>{trace.push(sql);if(sql==='COMMIT'&&fail)throw Object.assign(new Error('constraint'),{code:'23514'});return {rows:[]}},release:()=>{releases++}}
    class Pool{async connect(){return raw}async end(){}}
    const local=loader({'pg':{Pool},'@/lib/erpDatabaseContext':{getErpDatabaseContext:()=>context}})
    const pg=local('@/lib/postgres')
    const previous=process.env.SUPABASE_DB_URL;process.env.SUPABASE_DB_URL='postgresql://127.0.0.1/offline_fake'
    try{
      await pg.withTransaction(c=>c.query('SELECT id FROM erp.entidades WHERE tenant_id=$1',[1]))
      const commit=trace.indexOf('COMMIT');assert.equal(trace[commit-2],'SET LOCAL ROLE erp_runtime')
      trace.length=0;fail=true
      await assert.rejects(()=>pg.withTransaction(c=>c.query('SELECT id FROM erp.entidades WHERE tenant_id=$1',[1])))
      assert.equal(trace.at(-1),'ROLLBACK');assert.equal(releases,2)
      fail=false;trace.length=0
      await assert.rejects(()=>pg.withTransaction(async c=>{context={tenantId:2,userId:1};await c.query('SELECT 1')}))
      assert.equal(trace.at(-1),'ROLLBACK');assert.equal(releases,3)
    }finally{if(previous===undefined)delete process.env.SUPABASE_DB_URL;else process.env.SUPABASE_DB_URL=previous;await pg.closePool()}
  })
  await test('editor renderiza campos e finalidades de contatos e enderecos',async()=>{
    const React=require('react'), {renderToStaticMarkup}=require('react-dom/server')
    const ui=loader({'@/components/ui/button':{Button:props=>React.createElement('button',props)},'@/components/ui/input':{Input:props=>React.createElement('input',props)}})
    const {ErpRegistrationRelations}=ui('@/products/erp/frontend/components/ErpRegistrationRelations')
    const html=renderToStaticMarkup(React.createElement(ErpRegistrationRelations,{value:{contatos:[{nome:'Contato teste',email:'teste@example.invalid',telefone:'',cargo:'',whatsapp:false,finalidades:['comercial'],principais:[]}],enderecos:[]},onChange(){},disabled:false}))
    assert(html.includes('Contato teste'));assert(html.includes('Adicionar endereço'));assert(html.includes('Principal'));assert(html.includes('WhatsApp'))
  })
  await test('ciclos respeitam fim de mes ano bissexto e vencimento',()=>{
    const c=load('@/products/erp/shared/commercialContracts')
    assert.equal(c.nextCommercialCycle('2024-01-31','mensal'),'2024-02-29')
    assert.equal(c.nextCommercialCycle('2026-01-31','mensal'),'2026-02-28')
    assert.equal(c.nextCommercialCycle('2024-02-29','anual'),'2025-02-28')
    assert.equal(c.contractDueDate('2026-02-01','2026-02-28',{dia_vencimento:31,fim_mes:'ultimo_dia'}),'2026-02-28')
    assert.equal(c.contractDueDate('2026-02-01','2026-02-28',{regra_vencimento:'dias_apos_periodo',dias_apos_periodo:5}),'2026-03-05')
    assert(!c.contractSchema.safeParse({cliente_id:1,descricao:'Teste',servico_id:1,quantidade:1,valor_unitario:100,data_inicio:'2026-02-30',periodicidade:'mensal'}).success)
  })
  await restoreCatalog()
  for(const f of ['01-integridade-historicos.sql','02-periodos-fechados.sql','03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql'])await db.exec(readFileSync('scripts/erp/sql/'+f,'utf8'))
  for(const f of ['20260909033000_drop_erp_financial_views.sql','20260909040000_harden_erp_service_integrity.sql'])await db.exec(readFileSync('supabase/migrations/'+f,'utf8'))
  await db.exec(`BEGIN;
    INSERT INTO shared.erp_permission_profiles(id,nome) VALUES('consulta','Consulta');
    INSERT INTO shared.tenants(id,name,slug) VALUES(1,'Ficticio','ficticio');
    INSERT INTO shared.users(id,email,full_name) VALUES(1,'teste@example.invalid','Teste');
    INSERT INTO shared.tenant_memberships(tenant_id,user_id,role,status) VALUES(1,1,'owner','active');
    INSERT INTO erp.entidades(id,tenant_id,nome,eh_cliente,eh_fornecedor) VALUES(101,1,'Ficticio',true,true);
    INSERT INTO erp.contas_financeiras(id,tenant_id,nome) VALUES(101,1,'Conta ficticia');
    INSERT INTO erp.contas_receber(id,tenant_id,cliente_id,descricao,valor_total,data_competencia) VALUES(101,1,101,'Titulo ficticio',1000,'2026-02-01');
    INSERT INTO erp.contas_receber_parcelas(id,tenant_id,conta_receber_id,data_vencimento,valor) VALUES(101,1,101,'2026-03-01',1000);
    INSERT INTO erp.contas_pagar(id,tenant_id,fornecedor_id,descricao,valor_total,data_competencia) VALUES(101,1,101,'Titulo ficticio',1000,'2026-02-01');
    INSERT INTO erp.contas_pagar_parcelas(id,tenant_id,conta_pagar_id,data_vencimento,valor) VALUES(101,1,101,'2026-03-01',1000);
    COMMIT;`)
  const fakePostgres={
    withTransaction:async fn=>{await db.exec('BEGIN');try{await db.exec("SET LOCAL ROLE erp_runtime; SELECT set_config('app.erp_tenant_id','1',true),set_config('app.erp_user_id','1',true)");const result=await fn({query:(s,p)=>db.query(s,p),release(){}});await db.exec('COMMIT');return result}catch(e){await db.exec('ROLLBACK');throw e}},
    runQuery:async(s,p)=>(await db.query(s,p)).rows,
  }
  let permitted=true
  const integration=loader({'@/lib/postgres':fakePostgres,'@/products/erp/server/erpAccess':{resolveErpAccess:async()=>permitted?{tenantId:1,sharedUserId:1}:null}})
  const repo=integration('@/products/erp/server/erpRepository')
  const scalar=async sql=>Object.values((await db.query(sql)).rows[0])[0]
  await test('cadastro grava contatos e enderecos e preserva ids na edicao',async()=>{
    const values={nome:'Cliente de teste',tipo:'PJ',documento:'',contatos:[{nome:'Financeiro',email:'financeiro@example.invalid',finalidades:['financeiro'],principais:['financeiro']}],enderecos:[{identificacao:'Escritorio',logradouro:'Rua de teste',cidade:'Cidade ficticia',finalidades:['prestacao'],principais:['prestacao']}]}
    const created=await repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'clientes',values})
    let detail=await repo.getErpEntityRecord({tenantId:1,entityId:'clientes',id:created.id})
    const contacts=JSON.parse(detail.contatos_json),addresses=JSON.parse(detail.enderecos_json)
    assert.equal(contacts.length,1);assert.equal(addresses.length,1)
    const clean=rows=>rows.map(row=>Object.fromEntries(Object.entries(row).map(([k,v])=>[k,v===null?'':v])))
    const updated=await repo.updateErpEntityRecord({tenantId:1,actorId:1,entityId:'clientes',id:created.id,expectedVersion:Number(detail.versao),values:{...values,contatos:clean(contacts).map(c=>({...c,nome:'Financeiro atualizado'})),enderecos:clean(addresses)}})
    assert.equal(JSON.parse(updated.contatos_json)[0].id,contacts[0].id)
    assert.equal(JSON.parse(updated.contatos_json)[0].nome,'Financeiro atualizado')
    const found=await repo.listErpEntityPage({tenantId:1,entityId:'clientes',query:'financeiro@example.invalid'})
    assert(found.records.some(row=>String(row.id)===String(created.id) && row.email==='financeiro@example.invalid'))
    await assert.rejects(()=>repo.updateErpEntityRecord({tenantId:1,actorId:1,entityId:'clientes',id:created.id,expectedVersion:Number(detail.versao),values}),/CONFLITO_VERSAO/)
    await assert.rejects(()=>repo.updateErpEntityRecord({tenantId:1,actorId:1,entityId:'clientes',id:101,expectedVersion:1,values:{...values,contatos:clean(contacts)}}),/pertence/)
    detail=await repo.getErpEntityRecord({tenantId:1,entityId:'clientes',id:101});assert.equal(detail.nome,'Ficticio');assert.equal(Number(detail.versao),1)
    const removed=await repo.updateErpEntityRecord({tenantId:1,actorId:1,entityId:'clientes',id:created.id,expectedVersion:Number(updated.versao),values:{...values,contatos:[],enderecos:[]}})
    assert.equal(JSON.parse(removed.contatos_json).length,0)
    assert.equal(await scalar('SELECT count(*)::int FROM erp.entidades_contatos WHERE NOT ativo'),1)
  })
  await test('cadastro rejeita principais duplicados sem gravacao parcial',async()=>{
    const before=await scalar('SELECT count(*)::int FROM erp.entidades')
    await assert.rejects(()=>repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'clientes',values:{nome:'Invalido',contatos:[1,2].map(i=>({nome:'Contato '+i,email:'teste@example.invalid',finalidades:['comercial'],principais:['comercial']}))}}),/principal/)
    assert.equal(await scalar('SELECT count(*)::int FROM erp.entidades'),before)
  })
  await test('servicos usam categoria por id e rejeitam categoria incompatível',async()=>{
    await db.exec("INSERT INTO erp.categorias(id,tenant_id,nome,tipo) VALUES(901,1,'Consultoria','servico'),(902,1,'Despesas','despesa')")
    const created=await repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'servicos',values:{nome:'Consultoria teste',preco:'10.25',categoria_id:'901'}})
    const detail=await repo.getErpEntityRecord({tenantId:1,entityId:'servicos',id:created.id})
    assert.equal(detail.categoria_id,'901')
    await assert.rejects(()=>repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'servicos',values:{nome:'Invalido',preco:'10',categoria_id:'902'}}),/categoria ativa/)
    await assert.rejects(()=>repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'servicos',values:{nome:'Invalido',preco:'10',categoria_id:'999999'}}),/categoria ativa/)
  })
  await test('contrato cria versao efetivada e gera ciclo completo sem duplicar',async()=>{
    const management=integration('@/products/erp/server/erpManagementRepository')
    const svc=await repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'servicos',values:{nome:'Servico recorrente',preco:'100'}})
    const values={cliente_id:101,descricao:'Contrato teste',servico_id:svc.id,quantidade:1,valor_unitario:'100',data_inicio:'2026-01-31',periodicidade:'mensal',dia_vencimento:31}
    const request={tenantId:1,actorId:1,resource:'contratos',values,idempotencyKey:'contrato-teste'}
    const first=await management.createManagementOperation(request),again=await management.createManagementOperation(request)
    assert.equal(first.id,again.id)
    await assert.rejects(()=>management.createManagementOperation({...request,values:{...values,valor_unitario:'200'}}),/outro conteúdo/)
    const generated=await management.processDueSalesContracts({tenantId:1,actorId:1,until:'2026-01-31'})
    assert.equal(generated.total,1)
    const cycle=(await db.query('SELECT * FROM erp.contratos_vendas_geracoes WHERE contrato_id=$1',[first.id])).rows[0]
    assert.equal(new Date(cycle.periodo_fim).toISOString().slice(0,10),'2026-02-27');assert(cycle.contrato_versao_id)
    assert.equal((await management.processDueSalesContracts({tenantId:1,actorId:1,until:'2026-01-31'})).total,0)
    assert.equal(await scalar('SELECT count(*)::int FROM erp.contratos_vendas_geracoes_tentativas'),1)
    const contracts=integration('@/products/erp/server/erpSalesContracts'),detail=await contracts.getSalesContract(1,Number(first.id))
    const revision={tenantId:1,actorId:1,id:Number(first.id),expectedVersion:Number(detail.record.versao),inicio:'2026-02-28',motivo:'Reajuste teste',itens:detail.versions[0].itens.map(i=>({id:String(i.id),quantidade:1,valor_unitario:120}))}
    await contracts.reviseSalesContract(revision)
    await assert.rejects(()=>contracts.reviseSalesContract(revision),/alterado/)
    assert.equal((await contracts.getSalesContract(1,Number(first.id))).versions.length,2)
    assert.equal((await management.processDueSalesContracts({tenantId:1,actorId:1,until:'2026-02-28'})).total,1)
  })
  await test('OS usa valores exatos e compara conteudo na repeticao',async()=>{
    const professional=integration('@/products/erp/server/erpProfessionalRepository'),schemas=load('@/products/erp/shared/professionalContracts')
    const svc=await repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'servicos',values:{nome:'OS teste',preco:10}})
    const values=schemas.serviceOrderCreateSchema.parse({cliente_id:101,data_inicio:'2026-01-01',itens:[{tipo:'servico',item_id:svc.id,descricao:'Servico',quantidade:'1.5',valor_unitario:'2.01',desconto:0}]})
    const request={tenantId:1,actorId:1,values,idempotencyKey:'os-teste'}
    const first=await professional.createServiceOrder(request),again=await professional.createServiceOrder(request)
    assert.equal(first.id,again.id)
    await professional.createServiceOrder({tenantId:1,actorId:1,orderId:Number(first.id),expectedVersion:1,values:{...values,observacoes_publicas:'Editada'}})
    await assert.rejects(()=>professional.createServiceOrder({tenantId:1,actorId:1,orderId:Number(first.id),expectedVersion:1,values}),/alterada/)
    const converted=await professional.runServiceOrderAction({tenantId:1,actorId:1,orderId:Number(first.id),action:'gerar_venda',expectedVersion:2})
    assert(converted.id)
    await assert.rejects(()=>professional.createServiceOrder({...request,values:{...values,desconto:1}}),/outro conteúdo/)
    await assert.rejects(()=>professional.createServiceOrder({...request,idempotencyKey:'os-invalida',values:{...values,itens:[{...values.itens[0],desconto:100}]}}),/desconto/)
  })
  await test('venda edita rascunho e orcamento converte de forma atomica',async()=>{
    const svc=await repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'servicos',values:{nome:'Venda teste',preco:10}})
    const values={cliente_id:101,tipo_documento:'orcamento',tipo_desconto:'percentual',desconto:10,data_venda:'2026-01-01',itens:[{tipo:'servico',item_id:svc.id,descricao:'Servico',quantidade:2,valor_unitario:10,desconto:0}]}
    const request={tenantId:1,actorId:1,entityId:'pedidos',values,idempotencyKey:'venda-teste'}
    const created=await repo.createErpEntityRecord(request);assert.equal((await repo.createErpEntityRecord(request)).id,created.id)
    await assert.rejects(()=>repo.createErpEntityRecord({...request,values:{...values,desconto:1}}),/outro conteúdo/)
    await repo.updateErpSaleDraft({tenantId:1,actorId:1,id:created.id,expectedVersion:1,values:{...values,observacoes:'Editado'}})
    const professional=integration('@/products/erp/server/erpProfessionalRepository')
    const converted=await professional.convertQuoteToSale({tenantId:1,actorId:1,quoteId:Number(created.id),expectedVersion:2});assert(converted.sale.id)
    await assert.rejects(()=>repo.confirmErpSale({tenantId:1,actorId:1,saleId:converted.sale.id,expectedVersion:99}),/alterada/)
    await repo.confirmErpSale({tenantId:1,actorId:1,saleId:converted.sale.id,expectedVersion:1})
  })
  const input={tenantId:1,actorId:1,id:101,idempotencyKey:'pagamento-teste-1',values:{valor:'100.00',conta_financeira_id:101,data_pagamento:'2026-02-01'}}
  await test('baixa repetida retorna pagamento original no banco isolado',async()=>{
    const first=await repo.settleReceivableInstallment(input),again=await repo.settleReceivableInstallment({...input,values:{...input.values,valor:100}})
    assert.equal(first.payment.id,again.payment.id);assert.equal(Number(await scalar('SELECT count(*) FROM erp.pagamentos')),1)
  })
  await test('mesma chave com outro valor e rejeitada',async()=>{
    await assert.rejects(()=>repo.settleReceivableInstallment({...input,values:{...input.values,valor:200}}),e=>e.code==='IDEMPOTENCY_CONFLICT')
    assert.equal(Number(await scalar('SELECT count(*) FROM erp.pagamentos')),1)
  })
  await test('falha no commit desfaz pagamento e seus efeitos',async()=>{
    await db.exec(`INSERT INTO erp.adiantamentos(id,tenant_id,entidade_id,lado,tipo,conta_financeira_id,data_movimento,valor,motivo,chave_idempotencia) VALUES(101,1,101,'receber','constituicao',101,'2026-02-01',600,'Ficticio','a101'); INSERT INTO erp.adiantamentos_aplicacoes(tenant_id,adiantamento_id,conta_receber_parcela_id,valor,data_aplicacao,motivo,chave_idempotencia) VALUES(1,101,101,600,'2026-02-01','Ficticio','ap101');`)
    await assert.rejects(()=>repo.settleReceivableInstallment({...input,idempotencyKey:'excesso',values:{...input.values,valor:500}}),/Valor da baixa invalido/)
    assert.equal(Number(await scalar('SELECT count(*) FROM erp.pagamentos')),1)
    assert.equal(Number(await scalar('SELECT valor_pago FROM erp.contas_receber_parcelas WHERE id=101')),100)
  })
  await test('baixa a pagar tambem compara requisicao',async()=>{
    const pay={...input,idempotencyKey:'pagar-1'}
    const a=await repo.settlePayableInstallment(pay),b=await repo.settlePayableInstallment(pay)
    assert.equal(a.payment.id,b.payment.id)
    await assert.rejects(()=>repo.settlePayableInstallment({...pay,values:{...pay.values,juros:10}}),e=>e.code==='IDEMPOTENCY_CONFLICT')
  })
  const finance=integration('@/products/erp/server/erpFinanceRepository')
  await test('adiantamento aplica credito sem repetir caixa',async()=>{
    const advanceInput={tenantId:1,actorId:1,idempotencyKey:'adiantamento-etapa-4',values:{entidade_id:101,lado:'receber',tipo:'constituicao',conta_financeira_id:101,data_movimento:'2026-02-02',data_credito:'2026-02-02',valor:250,motivo:'Teste ficticio'}}
    const first=await finance.createAdvance(advanceInput),again=await finance.createAdvance(advanceInput)
    assert.equal(first.id,again.id)
    const applicationInput={tenantId:1,actorId:1,idempotencyKey:'aplicacao-etapa-4',values:{adiantamento_id:first.id,lado:'receber',parcela_id:101,data_aplicacao:'2026-02-02',valor:100,motivo:'Teste ficticio'}}
    const application=await finance.applyAdvance(applicationInput),repeated=await finance.applyAdvance(applicationInput)
    assert.equal(application.id,repeated.id)
    const composition=await finance.getInstallmentComposition(1,'receber',101)
    assert.equal(composition.principal_pago,100);assert.equal(composition.credito,700);assert.equal(composition.saldo,200)
  })
  await test('devolucao reduz saldo do adiantamento e preserva movimento',async()=>{
    const advance=(await finance.listAdvances(1,{lado:'receber',entidadeId:101})).find(row=>Number(row.valor)===250)
    await finance.createAdvance({tenantId:1,actorId:1,idempotencyKey:'devolucao-etapa-4',values:{entidade_id:101,lado:'receber',tipo:'devolucao',adiantamento_id:advance.id,conta_financeira_id:101,data_movimento:'2026-02-03',valor:50,motivo:'Teste ficticio'}})
    const updated=(await finance.listAdvances(1,{lado:'receber',entidadeId:101})).find(row=>String(row.id)===String(advance.id))
    assert.equal(Number(updated.saldo),100)
  })
  await test('renegociacao transfere saldo integral sem registrar pagamento',async()=>{
    const before=Number(await scalar('SELECT count(*) FROM erp.pagamentos'))
    const agreement=await finance.createRenegotiation({tenantId:1,actorId:1,idempotencyKey:'acordo-etapa-4',values:{entidade_id:101,lado:'receber',numero:'AC-FICTICIO-1',data_acordo:'2026-02-04',desconto:10,encargos:0,categoria_ajuste_id:902,motivo:'Teste ficticio',origens:[101],destinos:[{valor:190,data_vencimento:'2026-04-01'}]}})
    assert.equal(agreement.status,'efetivada');assert.equal(Number(await scalar('SELECT count(*) FROM erp.pagamentos')),before)
    const composition=await finance.getInstallmentComposition(1,'receber',101)
    assert.equal(composition.saldo,0);assert.equal(composition.renegociado,200)
  })
  await test('reversao de renegociacao restaura origem e cancela destino',async()=>{
    const agreement=await scalar("SELECT id FROM erp.renegociacoes WHERE numero='AC-FICTICIO-1'")
    const first=await finance.reverseRenegotiation({tenantId:1,actorId:1,agreementId:Number(agreement),values:{motivo:'Teste ficticio'}})
    const repeated=await finance.reverseRenegotiation({tenantId:1,actorId:1,agreementId:Number(agreement),values:{motivo:'Teste ficticio'}})
    assert.equal(first.status,'revertida');assert.equal(repeated.status,'revertida')
    const composition=await finance.getInstallmentComposition(1,'receber',101);assert.equal(composition.saldo,200)
    assert.equal(await scalar("SELECT status FROM erp.contas_receber WHERE renegociacao_origem_id="+Number(agreement)),'cancelado')
  })
  await test('previsao a pagar exige efetivacao explicita',async()=>{
    await db.exec("INSERT INTO erp.contas_pagar(id,tenant_id,fornecedor_id,descricao,data_competencia,valor_total,tipo_lancamento) VALUES(202,1,101,'Previsao ficticia','2026-02-05',50,'previsao'); INSERT INTO erp.contas_pagar_parcelas(id,tenant_id,conta_pagar_id,data_vencimento,valor) VALUES(202,1,202,'2026-03-05',50)")
    await assert.rejects(()=>repo.settlePayableInstallment({...input,id:202,idempotencyKey:'previsao-invalida',values:{...input.values,valor:50}}),/Efetive a previsao/)
    const effective=await finance.makePayableEffective({tenantId:1,actorId:1,payableId:202});assert.equal(effective.tipo_lancamento,'efetivo')
  })
  await test('rateio somente aceita distribuicao integral',async()=>{
    await assert.rejects(()=>finance.replaceFinancialAllocations({tenantId:1,actorId:1,financialSide:'pagar',titleId:202,values:{rateios:[{categoria_id:902,valor:49}]}}),/integralmente/)
    const result=await finance.replaceFinancialAllocations({tenantId:1,actorId:1,financialSide:'pagar',titleId:202,values:{rateios:[{categoria_id:902,valor:50}]}})
    assert.equal(result.total,50)
  })
  await test('conciliacao preserva identidade do pagamento e desfaz vinculos',async()=>{
    const management=integration('@/products/erp/server/erpManagementRepository')
    const professional=integration('@/products/erp/server/erpProfessionalRepository')
    const payment=(await db.query("SELECT id,origem FROM erp.pagamentos WHERE tipo='pagar' AND estorno_de_pagamento_id IS NULL LIMIT 1")).rows[0]
    const bank=await management.createManagementOperation({tenantId:1,actorId:1,resource:'conciliacao-bancaria',idempotencyKey:'extrato-etapa-4',values:{conta_financeira_id:101,data:'2026-02-01',tipo:'debito',valor:100,descricao:'Extrato ficticio'}})
    await management.createManagementOperation({tenantId:1,actorId:1,resource:'conciliar-transacao',idempotencyKey:'conciliar-etapa-4',values:{transacao_bancaria_id:bank.id,pagamento_id:payment.id,valor_conciliado:100}})
    let current=(await db.query('SELECT origem,conciliado FROM erp.pagamentos WHERE id=$1',[payment.id])).rows[0]
    assert.equal(current.origem,payment.origem);assert.equal(current.conciliado,true)
    await professional.undoBankReconciliation({tenantId:1,actorId:1,transactionId:Number(bank.id)})
    current=(await db.query('SELECT origem,conciliado FROM erp.pagamentos WHERE id=$1',[payment.id])).rows[0]
    assert.equal(current.origem,payment.origem);assert.equal(current.conciliado,false)
  })
  await test('transferencia e estorno repetidos nao duplicam dinheiro',async()=>{
    await db.exec("INSERT INTO erp.contas_financeiras(id,tenant_id,nome) VALUES(102,1,'Conta destino ficticia')")
    const management=integration('@/products/erp/server/erpManagementRepository')
    const transferInput={tenantId:1,actorId:1,resource:'transferencias-financeiras',idempotencyKey:'transferencia-etapa-4',values:{conta_origem_id:101,conta_destino_id:102,data:'2026-02-06',valor:25,descricao:'Teste ficticio'}}
    const transfer=await management.createManagementOperation(transferInput),repeated=await management.createManagementOperation(transferInput)
    assert.equal(transfer.id,repeated.id);assert.equal(Number(await scalar("SELECT count(*) FROM erp.transferencias_financeiras WHERE chave_idempotencia='transferencia-etapa-4'")),1)
    const payment=(await db.query("SELECT id FROM erp.pagamentos WHERE tipo='pagar' AND estorno_de_pagamento_id IS NULL LIMIT 1")).rows[0]
    const reversal=await repo.reverseErpPayment({tenantId:1,actorId:1,id:payment.id,idempotencyKey:'estorno-etapa-4',reason:'Teste ficticio'})
    const replay=await repo.reverseErpPayment({tenantId:1,actorId:1,id:payment.id,idempotencyKey:'estorno-etapa-4',reason:'Teste ficticio'})
    assert.equal(reversal.reversal.id,replay.reversal.id);assert.equal(Number(await scalar('SELECT count(*) FROM erp.pagamentos WHERE estorno_de_pagamento_id IS NOT NULL')),1)
  })
  await test('etapa 5: relatórios disponíveis executam sem views retiradas',async()=>{
    const professional=integration('@/products/erp/server/erpProfessionalRepository')
    for(const report of ['dre-caixa','posicao-financeira','vendas-clientes','vendas-vendedores','vendas-produtos','compras-fornecedores','compras-categorias','valor-estoque']){
      const rows=await professional.listProfessionalReport({tenantId:1,report,from:'2026-01-01',to:'2026-12-31'})
      assert(Array.isArray(rows),report)
    }
    const overview=await professional.getProfessionalOverview(1),basic=await repo.getErpOverview(1)
    assert.equal(Number(overview.saldo_receber),basic.saldoReceber)
    assert.equal(Number(overview.saldo_pagar),basic.saldoPagar)
    assert.equal(Number(overview.receber_vencido),basic.receberVencido)
    const catalog=load('@/products/erp/shared/reportCatalog')
    const nav=load('@/products/erp/shared/navigation').ERP_NAVIGATION
    assert(nav.every(s=>s.modules.every(m=>!catalog.isRetiredErpReport(m.id))))
    for(const report of catalog.ERP_RETIRED_REPORTS)await assert.rejects(()=>professional.listProfessionalReport({tenantId:1,report}),e=>e.status===410)
  })
  await test('etapa 5: importação parcial mantém contadores e repetição preserva destinos',async()=>{
    const imports=integration('@/products/erp/server/erpImportRepository')
    const request={tenantId:1,actorId:1,type:'servicos',fileName:'ficticio.csv',rows:[{nome:'Importado ficticio',preco:'12,50'},{nome:'',preco:'3'}]}
    const first=await imports.importErpRows(request)
    assert.equal(first.status,'parcial');assert.equal(Number(first.imported),1);assert.equal(Number(first.errors),1)
    const repeated=await imports.importErpRows(request);assert.equal(first.id,repeated.id)
    assert.equal(Number(await scalar("SELECT count(*) FROM erp.servicos WHERE nome='Importado ficticio'")),1)
    const detail=await imports.getImportDetails(1,first.id)
    assert.equal(detail.rows.length,2);assert.equal(detail.rows[0].numero_linha,2)
    await assert.rejects(()=>imports.getImportDetails(2,first.id),e=>e.status===404)
  })
  await test('etapa 5: histórico de documentos e anexos validam vínculo e empresa',async()=>{
    const history=integration('@/products/erp/server/erpHistoryRepository')
    for(const [kind,table] of [['vendas','vendas'],['compras','compras'],['contratos','contratos_vendas'],['ordens-servico','ordens_servico'],['contas-receber','contas_receber'],['contas-pagar','contas_pagar']]){
      const row=(await db.query(`SELECT id FROM erp.${table} WHERE tenant_id=1 AND excluido_em IS NULL LIMIT 1`)).rows[0]
      if(row){const result=await history.getDocumentHistory(1,kind,String(row.id));assert(Array.isArray(result.events));assert(Array.isArray(result.files));await assert.rejects(()=>history.getDocumentHistory(2,kind,String(row.id)),e=>e.status===404)}
    }
    await db.exec("INSERT INTO erp.arquivos(id,tenant_id,bucket,caminho,nome) VALUES(901,1,'ficticio','teste.txt','Anexo ficticio'); INSERT INTO erp.contas_receber_arquivos(tenant_id,conta_receber_id,arquivo_id,finalidade) VALUES(1,101,901,'comprovante')")
    assert.equal((await history.getDocumentFile(1,'contas-receber','101','901')).nome,'Anexo ficticio')
    await assert.rejects(()=>history.getDocumentFile(1,'contas-pagar','101','901'),e=>e.status===404)
    assert.equal((await history.getDocumentHistory(1,'contas-receber','101')).files.length,1)
    const billing=await history.getBillingHistory(1,'101');assert(Array.isArray(billing.notifications));assert(Array.isArray(billing.executions))
  })
  await test('etapa 5: rotinas preservam conclusão e histórico de tentativas',async()=>{
    const professional=integration('@/products/erp/server/erpProfessionalRepository')
    const input={tenantId:1,actorId:1,tipo:'estoque_minimo',competencia:'2026-09-10'}
    const first=await professional.runErpAutomation(input),again=await professional.runErpAutomation(input)
    assert.equal(first.id,again.id)
    assert.equal(Number(await scalar("SELECT tentativas FROM erp.execucoes_automacao WHERE tipo='estoque_minimo' AND competencia='2026-09-10'")),1)
    await db.exec("INSERT INTO erp.execucoes_automacao(tenant_id,tipo,competencia,status,tentativas,chave_idempotencia,iniciado_em,finalizado_em,erro) VALUES(1,'indicadores','2026-09-09','falha',1,'indicadores:2026-09-09',now(),now(),'Falha ficticia')")
    const retried=await professional.runErpAutomation({...input,tipo:'indicadores',competencia:'2026-09-09'})
    assert.equal(retried.status,'concluida')
    assert.equal(Number(await scalar("SELECT tentativas FROM erp.execucoes_automacao WHERE chave_idempotencia='indicadores:2026-09-09'")),2)
    const routines=integration('@/products/erp/server/erpRoutineRepository');assert(Array.isArray((await routines.listRecurrenceHistory(1)).financial))
  })
  await test('etapa 5: recorrência financeira respeita calendário término e repetição',async()=>{
    const model={fornecedor_id:101,descricao:'Recorrente ficticio',valor:10,categoria_id:902,data_competencia:'2026-01-31',data_vencimento:'2026-02-05'}
    await repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'contas-a-pagar',idempotencyKey:'recorrente-etapa-5',values:{...model,repetir:true,recorrencia:{frequencia:'mes',intervalo:1,termino_tipo:'data',termino_em:'2026-03-31'}}})
    const generated=await repo.processErpFinancialRecurrences({tenantId:1,actorId:1,throughDate:'2026-05-31'})
    assert.equal(generated.generated,2)
    assert.equal((await repo.processErpFinancialRecurrences({tenantId:1,actorId:1,throughDate:'2026-05-31'})).generated,0)
    const dates=(await db.query("SELECT data_competencia::text FROM erp.contas_pagar WHERE descricao='Recorrente ficticio' ORDER BY data_competencia")).rows.map(r=>r.data_competencia)
    assert.deepEqual(dates,['2026-01-31','2026-02-28','2026-03-31'])
  })
  await test('etapa 5: recebimento externo não liquida e tentativas ficam separadas',async()=>{
    const history=integration('@/products/erp/server/erpHistoryRepository')
    const before=(await finance.getInstallmentComposition(1,'receber',101)).saldo
    await db.exec("INSERT INTO erp.cobrancas(id,tenant_id,conta_receber_parcela_id,tipo,chave_idempotencia,status,valor,data_vencimento) VALUES(901,1,101,'pix','cobranca-ficticia-5','paga',100,'2026-03-01'); INSERT INTO erp.cobrancas_eventos(id,tenant_id,cobranca_id,evento_externo_id,evento) VALUES(901,1,901,'externo-ficticio-5','pagamento_informado'); INSERT INTO erp.execucoes_automacao(tenant_id,tipo,competencia,status,tentativas,chave_idempotencia,iniciado_em,finalizado_em,erro,evento_cobranca_id) VALUES(1,'cobrancas_eventos','2026-09-10','falha',1,'evento-ficticio-5',now(),now(),'Revisão fictícia necessária',901); INSERT INTO erp.cobrancas_notificacoes(tenant_id,cobranca_id,canal,destinatario,status,agendada_em) VALUES(1,901,'email','teste@example.invalid','agendada',now())")
    const detail=await history.getBillingHistory(1,'101')
    assert.equal(detail.charges[0].estado_externo,'paga');assert.equal(detail.events[0].processamento,'pendente');assert.equal(detail.executions[0].status,'falha');assert.equal(detail.notifications[0].status,'agendada');assert.equal(detail.notifications[0].enviada_em,null)
    assert.equal((await finance.getInstallmentComposition(1,'receber',101)).saldo,before)
    assert.equal((await history.getBillingHistory(2,'101')).charges.length,0)
  })
  await test('etapa 5: receita recorrente pausa retoma e preserva ocorrência',async()=>{
    const routines=integration('@/products/erp/server/erpRoutineRepository')
    await db.query("INSERT INTO erp.recorrencias_financeiras(id,tenant_id,tipo,frequencia,inicio_em,termino_tipo,proxima_competencia,metadata) VALUES(801,1,'receber','mes','2026-07-31','indeterminado','2026-07-31',$1::jsonb)",[JSON.stringify({modelo:{cliente_id:101,descricao:'Receita ficticia recorrente',valor:15,data_emissao:'2026-07-31',data_vencimento:'2026-08-05'}})])
    let row=(await db.query('SELECT atualizado_em FROM erp.recorrencias_financeiras WHERE id=801')).rows[0]
    await routines.changeFinancialRecurrence({tenantId:1,actorId:1,id:'801',action:'pausar',expectedUpdatedAt:new Date(row.atualizado_em).toISOString()})
    assert.equal((await repo.processErpFinancialRecurrences({tenantId:1,actorId:1,throughDate:'2026-08-31'})).generated,0)
    row=(await db.query('SELECT atualizado_em FROM erp.recorrencias_financeiras WHERE id=801')).rows[0]
    await routines.changeFinancialRecurrence({tenantId:1,actorId:1,id:'801',action:'retomar',expectedUpdatedAt:new Date(row.atualizado_em).toISOString()})
    assert.equal((await repo.processErpFinancialRecurrences({tenantId:1,actorId:1,throughDate:'2026-08-31'})).generated,2)
    assert.equal((await repo.processErpFinancialRecurrences({tenantId:1,actorId:1,throughDate:'2026-08-31'})).generated,0)
    assert.equal(Number(await scalar('SELECT count(*) FROM erp.contas_receber WHERE recorrencia_financeira_id=801')),2)
  })
  await test('etapa 5: compra recorrente gera previsão vinculada sem duplicação',async()=>{
    const routines=integration('@/products/erp/server/erpRoutineRepository')
    const svc=await scalar('SELECT id FROM erp.servicos LIMIT 1')
    const model=await repo.createErpEntityRecord({tenantId:1,actorId:1,entityId:'pedidos-compra',idempotencyKey:'modelo-compra-5',values:{fornecedor_id:101,numero:'MODELO-5',tipo_movimento:'pedido_recorrente',data_compra:'2026-06-01',data_vencimento:'2026-06-10',categoria_id:902,gera_financeiro:true,itens:[{servico_id:svc,descricao:'Serviço ficticio',quantidade:1,valor_unitario:20}]}})
    await db.query("INSERT INTO erp.compras_recorrencias(tenant_id,compra_modelo_id,frequencia,inicio_em,termino_tipo,quantidade_ocorrencias,proxima_competencia) VALUES(1,$1,'mes','2026-07-01','ocorrencias',2,'2026-07-01')",[model.id])
    const first=await routines.processPurchaseRecurrences({tenantId:1,actorId:1,throughDate:'2026-12-31'})
    assert.equal(first.total,2);assert.equal((await routines.processPurchaseRecurrences({tenantId:1,actorId:1,throughDate:'2026-12-31'})).total,0)
    for(const item of first.generated){const title=(await db.query('SELECT tipo_lancamento FROM erp.contas_pagar WHERE compra_id=$1',[item.purchaseId])).rows[0];assert.equal(title,undefined);assert.equal((await db.query('SELECT id FROM erp.compras_parcelas_previstas WHERE compra_id=$1',[item.purchaseId])).rows.length,1)}
  })
  await test('etapa 5: OFX repetido conserva importação e movimentos',async()=>{
    const bank=integration('@/products/erp/server/erpBankImportRepository')
    const input={tenantId:1,actorId:1,accountId:101,fileName:'ficticio.ofx',content:'<OFX><BANKTRANLIST><STMTTRN><DTPOSTED>20260901<TRNAMT>10.00<FITID>teste-5<MEMO>Ficticio</STMTTRN></BANKTRANLIST></OFX>'}
    const first=await bank.importErpBankStatement(input),again=await bank.importErpBankStatement(input)
    assert.equal(first.id,again.id);assert.equal(again.reused,true)
    const repeatedTransaction=await bank.importErpBankStatement({...input,content:input.content+'\n'})
    assert.equal(repeatedTransaction.imported,0);assert.equal(repeatedTransaction.ignored,1)
  })
  await test('etapa 5: consultas novas executam com o papel restrito da aplicação',async()=>{
    await db.exec("BEGIN; SET LOCAL ROLE erp_runtime; SELECT set_config('app.erp_tenant_id','1',true),set_config('app.erp_user_id','1',true)")
    try{
      const professional=integration('@/products/erp/server/erpProfessionalRepository'),history=integration('@/products/erp/server/erpHistoryRepository')
      await history.getDocumentHistory(1,'contas-receber','101');await history.getBillingHistory(1,'101')
      await professional.getProfessionalOverview(1)
      for(const report of ['dre-caixa','posicao-financeira','vendas-clientes','vendas-vendedores','vendas-produtos','compras-fornecedores','compras-categorias','valor-estoque'])await professional.listProfessionalReport({tenantId:1,report,from:'2026-01-01',to:'2026-12-31'})
      const management=integration('@/products/erp/server/erpManagementRepository')
      assert(Array.isArray((await management.listManagementOperation(1,'giro-estoque')).records))
      await integration('@/products/erp/server/erpRoutineRepository').listRecurrenceHistory(1)
    }finally{await db.exec('ROLLBACK')}
  })
  await test('etapa 5: estorno permanece no período da reversão e rateios preservam centavos',async()=>{
    await db.exec("INSERT INTO erp.categorias(id,tenant_id,nome,tipo) VALUES(903,1,'Categoria ficticia B','despesa'),(904,1,'Categoria ficticia C','despesa')")
    await finance.replaceFinancialAllocations({tenantId:1,actorId:1,financialSide:'pagar',titleId:101,values:{rateios:[{categoria_id:902,valor:333.33},{categoria_id:903,valor:333.33},{categoria_id:904,valor:333.34}]}})
    const professional=integration('@/products/erp/server/erpProfessionalRepository')
    const feb=await professional.listProfessionalReport({tenantId:1,report:'dre-caixa',from:'2026-02-01',to:'2026-02-28'})
    const paid=feb.filter(r=>r.tipo==='pagamento');assert.equal(paid.length,3);assert.equal(Math.round(paid.reduce((sum,r)=>sum+Number(r.valor),0)*100),-10000)
    const reversalDate=String(await scalar('SELECT data_pagamento::text FROM erp.pagamentos WHERE estorno_de_pagamento_id IS NOT NULL LIMIT 1'))
    const reversed=await professional.listProfessionalReport({tenantId:1,report:'dre-caixa',from:reversalDate,to:reversalDate})
    assert.equal(Math.round(reversed.filter(r=>r.tipo==='pagamento').reduce((sum,r)=>sum+Number(r.valor),0)*100),10000)
  })
  await test('etapa 5: apresentação preserva estados desconhecidos e navegação acessível',async()=>{
    const React=require('react'),{renderToStaticMarkup}=require('react-dom/server')
    const ui=loader({'next/link':{__esModule:true,default:props=>React.createElement('a',props)}})
    const {HistoryRows}=ui('@/products/erp/frontend/components/ErpHistoryPanel')
    const html=renderToStaticMarkup(React.createElement(HistoryRows,{title:'Tentativas',rows:[{id:'1',status:'novo_estado',historico_estados:[{status:'falha',em:'2026-09-10T12:00:00Z'}],venda_id:'123'}]}))
    assert(html.includes('Situação não reconhecida'));assert(html.includes('<summary'));assert(html.includes('/erp/documentos/vendas/123'));assert(!html.includes('<pre'))
    const sidebar=readFileSync('src/components/navigation/SidebarShadcn.tsx','utf8');assert(!sidebar.includes('"/erp/relatorios/dre"'))
  })
  await test('rota rejeita corpo invalido e ausencia de chave antes de gravar',async()=>{
    const route=integration('@/app/api/erp/contas-receber-parcelas/[id]/baixar/route')
    const context={params:Promise.resolve({id:'101'})}
    let response=await route.POST(new Request('http://local/api',{method:'POST',body:'{}'}),context)
    assert.equal(response.status,422);assert.equal((await response.json()).error.code,'INVALID_OPERATION_KEY')
    response=await route.POST(new Request('http://local/api',{method:'POST',headers:{'Idempotency-Key':'teste'},body:'{'}),context)
    assert.equal(response.status,422);assert.equal((await response.json()).error.code,'VALIDATION_ERROR')
    permitted=false
    response=await route.POST(new Request('http://local/api',{method:'POST',body:'{}'}),context)
    assert.equal(response.status,403);assert.equal((await response.json()).error.code,'ACCESS_DENIED')
  })
  const result={status:'passed',checks:checks.length,names:checks,realDatabaseAccess:false,date:new Date().toISOString()}
  mkdirSync('docs/erp-interface',{recursive:true});writeFileSync('docs/erp-interface/etapa-5-testes.json',JSON.stringify(result,null,2)+'\n')
  console.log(JSON.stringify({status:result.status,checks:result.checks,realDatabaseAccess:false}))
}
try{await main()}catch(e){console.error({checks:checks.length,last:checks.at(-1),code:e.code,message:e.message,stack:e.stack});process.exitCode=1}finally{await db.close()}
