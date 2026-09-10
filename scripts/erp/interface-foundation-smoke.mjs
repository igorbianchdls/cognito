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
    const module = { exports: {} }; cache.set(file, module)
    const source = readFileSync(file, 'utf8')
    const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText
    const run = vm.runInThisContext('(function(require,module,exports){' + compiled + '\n})', { filename: file })
    run(dep => load(dep, file), module, module.exports)
    return module.exports
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
    INSERT INTO erp.contas_receber(id,tenant_id,cliente_id,descricao,valor_total) VALUES(101,1,101,'Titulo ficticio',1000);
    INSERT INTO erp.contas_receber_parcelas(id,tenant_id,conta_receber_id,data_vencimento,valor) VALUES(101,1,101,'2026-03-01',1000);
    INSERT INTO erp.contas_pagar(id,tenant_id,fornecedor_id,descricao,valor_total) VALUES(101,1,101,'Titulo ficticio',1000);
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
    await assert.rejects(()=>repo.settleReceivableInstallment({...input,idempotencyKey:'excesso',values:{...input.values,valor:500}}),e=>e.code==='23514')
    assert.equal(Number(await scalar('SELECT count(*) FROM erp.pagamentos')),1)
    assert.equal(Number(await scalar('SELECT valor_pago FROM erp.contas_receber_parcelas WHERE id=101')),100)
  })
  await test('baixa a pagar tambem compara requisicao',async()=>{
    const pay={...input,idempotencyKey:'pagar-1'}
    const a=await repo.settlePayableInstallment(pay),b=await repo.settlePayableInstallment(pay)
    assert.equal(a.payment.id,b.payment.id)
    await assert.rejects(()=>repo.settlePayableInstallment({...pay,values:{...pay.values,juros:10}}),e=>e.code==='IDEMPOTENCY_CONFLICT')
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
  mkdirSync('docs/erp-interface',{recursive:true});writeFileSync('docs/erp-interface/etapa-3-testes.json',JSON.stringify(result,null,2)+'\n')
  console.log(JSON.stringify({status:result.status,checks:result.checks,realDatabaseAccess:false}))
}
try{await main()}catch(e){console.error({checks:checks.length,last:checks.at(-1),code:e.code,message:e.message,stack:e.stack});process.exitCode=1}finally{await db.close()}

