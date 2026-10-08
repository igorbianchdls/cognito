/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS local test harness. */
// Local diagnostic only: fictitious data, no environment credentials or remote connection.
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const vm = require('node:vm');
const ts = require('typescript');
const assert = require('node:assert/strict');
const root = process.cwd();
const results = [];
const today = new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Fortaleza'}).format(new Date());

(async () => {
  const { db, restoreCatalog } = await import(pathToFileURL(path.join(root, 'scripts/erp/evolution-fixture.mjs')).href);
  try {
    await restoreCatalog();
    const {applySharedMigration}=await import('../shared/schema-contract.mjs');
    // Apply the existing migrations to align the local fixture with current access rules.
    for (const f of ['01-integridade-historicos.sql','02-periodos-fechados.sql','03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql']) {
      await db.exec(fs.readFileSync(path.join(root, 'scripts/erp/sql', f), 'utf8'));
    }
    for (const f of ['20260909033000_drop_erp_financial_views.sql','20260909040000_harden_erp_service_integrity.sql','20261003170000_harden_erp_read_access.sql']) {
      await db.exec(fs.readFileSync(path.join(root, 'supabase/migrations', f), 'utf8'));
    }
    await db.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261005020000_harden_erp_stock_operations.sql'), 'utf8'));
    await db.exec(fs.readFileSync(path.join(root, 'supabase/migrations/20261005021000_anchor_contract_cycles.sql'), 'utf8'));
    await applySharedMigration(db);
    const {applyRecentMigrations}=await import('./phase0-migrations.mjs');
    await applyRecentMigrations(db);
    const client = { query: (sql, params) => db.query(sql, params), release() {} };
    let transactionSequence=0;
    const pg = { runQuery: async (sql, params) => (await db.query(sql, params)).rows,
      runWithErpTransactionClient:async(_client,fn)=>fn(),
      withTransaction:async fn=>{const savepoint='repository_'+(++transactionSequence);await db.exec('SAVEPOINT '+savepoint);try{const result=await fn(client);await db.exec('RELEASE SAVEPOINT '+savepoint);return result}catch(error){await db.exec('ROLLBACK TO SAVEPOINT '+savepoint);await db.exec('RELEASE SAVEPOINT '+savepoint);throw error}} };
    const modules = new Map();
    function load(file) {
      file = path.resolve(root, file);
      if (modules.has(file)) return modules.get(file).exports;
      const record = { exports: {} }; modules.set(file, record);
      const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020 } }).outputText;
      vm.runInThisContext('(function(require,module,exports){' + code + '\n})', { filename:file })(name => {
        if (name === '@/lib/postgres') return pg;
        if (name === '@/products/erp/server/erpApi') return load('src/products/erp/shared/erpErrors.ts');
        if (name === '@/products/erp/shared/erpErrors') return load('src/products/erp/shared/erpErrors.ts');
        if (name === '@/products/erp/server/erpPeriodRepository') return load('src/products/erp/server/erpPeriodRepository.ts');
        if (name.startsWith('@/')) return load('src/' + name.slice(2) + '.ts');
        if (name.startsWith('.')) return load(path.resolve(path.dirname(file), name + '.ts'));
        return require(name);
      }, record, record.exports);
      return record.exports;
    }
    const stock = load('src/products/erp/server/erpStockRepository.ts');
    await db.exec(`
      INSERT INTO shared.empresas(id,name,slug) VALUES(1,'Local audit','local-audit');
      INSERT INTO shared.usuarios(id,email,full_name) VALUES(1,'owner@example.invalid','Owner'),(2,'adjuster@example.invalid','Adjuster');
      INSERT INTO shared.perfis_acesso(id,nome) VALUES('stock-audit','Stock audit');
      INSERT INTO shared.permissoes_perfil(perfil_acesso_id,capability) VALUES('stock-audit','erp.estoque.visualizar'),('stock-audit','erp.estoque.ajustar');
      INSERT INTO shared.usuarios_empresas(empresa_id,usuario_id,role,status,perfil_acesso_id) VALUES(1,1,'owner','active','stock-audit'),(1,2,'member','active','stock-audit');
      INSERT INTO erp.entidades(id,empresa_id,nome,eh_cliente) VALUES(101,1,'Local client',true);
      INSERT INTO erp.produtos(id,empresa_id,nome,unidade_medida,controla_estoque,permite_estoque_negativo) VALUES(101,1,'Local product','UN',true,false),(102,1,'Other product','UN',true,false);
      INSERT INTO erp.locais_estoque(id,empresa_id,nome,codigo,padrao) VALUES(101,1,'Origin','ORIGIN',true),(102,1,'Destination','DEST',false);
      INSERT INTO erp.vendas(id,empresa_id,cliente_id,numero,data_venda,subtotal,total,local_estoque_id) VALUES(301,1,101,'LOCAL-SALE','2026-10-01',160,160,101);
      INSERT INTO erp.vendas_itens(id,empresa_id,venda_id,produto_id,descricao,quantidade,valor_unitario,total) VALUES(401,1,301,101,'Local product',8,20,160);
      INSERT INTO erp.vendas_recebimentos_previstos(empresa_id,venda_id,numero_parcela,data_vencimento,valor) VALUES(1,301,1,'2026-10-01',160);
      SELECT setval(pg_get_serial_sequence('erp.vendas','id'),(SELECT max(id) FROM erp.vendas),true);
      SELECT setval(pg_get_serial_sequence('erp.vendas_itens','id'),(SELECT max(id) FROM erp.vendas_itens),true);
    `);
    await db.exec('BEGIN');
    await stock.applyStockMovement(client, { tenantId:1,actorId:1,produtoId:101,localEstoqueId:101,quantidade:10,custoUnitario:20,tipo:'entrada',origemTipo:'manual',chaveIdempotencia:'local-opening' });
    await db.exec('COMMIT');
    async function scenario(name, fn) {
      await db.exec('BEGIN');
      try { const evidence = await fn(); await db.exec('SET CONSTRAINTS ALL IMMEDIATE'); results.push({name,evidence}); }
      finally { await db.exec('ROLLBACK'); }
    }
    await scenario('Transfer preserves inventory value', async () => {
      const before = Number((await db.query('SELECT sum(quantidade_fisica*custo_medio) AS value FROM erp.saldos_estoque')).rows[0].value);
      await stock.createStockOperation({tenantId:1,actorId:1,resource:'transferencias',idempotencyKey:'local-transfer',values:{local_origem_id:101,local_destino_id:102,produto_id:101,quantidade:5,data:today}});
      const after = Number((await db.query('SELECT sum(quantidade_fisica*custo_medio) AS value FROM erp.saldos_estoque')).rows[0].value);
      assert.equal(before,200);assert.equal(after,200);
      return {before,after,destination:(await db.query('SELECT quantidade_fisica,custo_medio FROM erp.saldos_estoque WHERE local_estoque_id=102')).rows[0]};
    });
    await scenario('Manual output protects reserved stock', async () => {
      await stock.reserveStockForSale(client,{tenantId:1,actorId:1,saleId:301});
      await assert.rejects(stock.createStockOperation({tenantId:1,actorId:1,resource:'movimentacoes',idempotencyKey:'local-output',values:{local_estoque_id:101,produto_id:101,tipo:'saida',quantidade:5}}), /Saldo insuficiente/);
      const r=(await db.query('SELECT quantidade_fisica,quantidade_reservada,quantidade_fisica-quantidade_reservada AS available FROM erp.saldos_estoque WHERE local_estoque_id=101')).rows[0];
      assert.equal(Number(r.available),2);return r;
    });
    await scenario('Inactive product permits release of historical reservation', async () => {
      await stock.reserveStockForSale(client,{tenantId:1,actorId:1,saleId:301});
      await db.query('UPDATE erp.produtos SET ativo=false WHERE empresa_id=1 AND id=101');
      await stock.releaseStockForSale(client,{tenantId:1,actorId:1,saleId:301});
      const r=(await db.query('SELECT quantidade_reservada FROM erp.saldos_estoque WHERE local_estoque_id=101')).rows[0];
      assert.equal(Number(r.quantidade_reservada),0);return r;
    });
    await scenario('Simple receipt reversal restores original valuation', async () => {
      const value=async()=>Number((await db.query('SELECT sum(quantidade_fisica*custo_medio) AS value FROM erp.saldos_estoque')).rows[0].value);
      const before=await value();
      await stock.applyStockMovement(client,{tenantId:1,actorId:1,produtoId:101,localEstoqueId:101,quantidade:10,custoUnitario:40,tipo:'entrada',origemTipo:'compra',origemId:501,chaveIdempotencia:'receipt-probe'});
      await stock.reverseStockForPurchase(client,{tenantId:1,actorId:1,purchaseId:501});
      const after=await value();assert.equal(before,200);assert.equal(after,200);return {before,after,receiptQuantity:10,receiptUnitCost:40};
    });
    await scenario('Repeated inventory returns the same document', async () => {
      const input={tenantId:1,actorId:1,resource:'inventarios',idempotencyKey:'same-inventory',values:{local_estoque_id:101,produto_id:101,quantidade_contada:10,data:today}};
      const a=await stock.createStockOperation(input),b=await stock.createStockOperation(input);
      assert.equal(a.id,b.id);return {first:a.id,second:b.id};
    });
    await scenario('Inventory shares operational date and rejects historical counts', async () => {
      const input={tenantId:1,actorId:1,resource:'inventarios',idempotencyKey:'dated-inventory',values:{local_estoque_id:101,produto_id:101,quantidade_contada:11,data:today}};
      await assert.rejects(stock.createStockOperation({...input, values:{...input.values,data:'2026-02-03'}}), /dia atual/);
      const inventory=await stock.createStockOperation(input);
      const r=(await db.query("SELECT i.data_inventario::text,m.data_operacional::text AS movement_date FROM erp.inventarios i JOIN erp.movimentacoes_estoque m ON m.empresa_id=i.empresa_id AND m.origem_id=i.id AND m.origem_tipo='inventario' WHERE i.id=$1",[inventory.id])).rows[0];
      assert.equal(r.data_inventario,r.movement_date);return r;
    });
    await scenario('Adjust-only permission updates inventory', async () => {
      await db.exec('SAVEPOINT permission_probe');
      await db.exec('SET LOCAL ROLE erp_runtime');
      await db.query("SELECT set_config('app.erp_tenant_id','1',true),set_config('app.erp_user_id','2',true)");
      const r=await stock.createStockOperation({tenantId:1,actorId:2,resource:'inventarios',idempotencyKey:'adjust-only',values:{local_estoque_id:101,produto_id:101,quantidade_contada:11,data:today}});
      await db.exec('SET CONSTRAINTS ALL IMMEDIATE');
      await db.exec('ROLLBACK TO SAVEPOINT permission_probe');
      assert.ok(r.id);return r;
    });
    await scenario('Nested and cyclic kits are rejected', async () => {
      const make=(product,component,key)=>stock.createStockOperation({tenantId:1,actorId:1,resource:'kits',idempotencyKey:key,values:{produto_id:product,produto_componente_id:component,quantidade:1}});
      await make(101,102,'kit-a');await assert.rejects(make(102,101,'kit-b'), /aninhados/);
      const n=Number((await db.query('SELECT count(*) AS n FROM erp.kits_produtos_itens')).rows[0].n);assert.equal(n,1);return {edges:n};
    });
    await scenario('Movement key reused with different data is rejected', async () => {
      const input={tenantId:1,actorId:1,resource:'movimentacoes',idempotencyKey:'same-movement',values:{local_estoque_id:101,produto_id:101,tipo:'entrada',quantidade:1,custo_unitario:20}};
      const a=await stock.createStockOperation(input);
      await assert.rejects(stock.createStockOperation({...input,values:{...input.values,quantidade:7}}), e=>e.code==='IDEMPOTENCY_CONFLICT');return {first:a.id,conflictRejected:true};
    });
    await scenario('Transfer into valued destination uses weighted cost and supports replay',async()=>{
      await stock.applyStockMovement(client,{tenantId:1,actorId:1,produtoId:101,localEstoqueId:102,quantidade:5,custoUnitario:40,tipo:'entrada',origemTipo:'manual',chaveIdempotencia:'destination-opening'});
      const input={tenantId:1,actorId:1,resource:'transferencias',idempotencyKey:'weighted-transfer',values:{local_origem_id:101,local_destino_id:102,produto_id:101,quantidade:5}};
      const a=await stock.createStockOperation(input),b=await stock.createStockOperation(input);assert.equal(a.id,b.id);
      const r=(await db.query('SELECT quantidade_fisica,custo_medio FROM erp.saldos_estoque WHERE local_estoque_id=102')).rows[0];assert.equal(Number(r.quantidade_fisica),10);assert.equal(Number(r.custo_medio),30);return r;
    });
    await scenario('Own sale consumes its reservation atomically',async()=>{
      await db.query("UPDATE erp.vendas SET status='confirmada' WHERE empresa_id=1 AND id=301");
      await stock.reserveStockForSale(client,{tenantId:1,actorId:1,saleId:301});
      await stock.attendStockForSale({tenantId:1,actorId:1,saleId:301});
      const r=(await db.query('SELECT quantidade_fisica,quantidade_reservada FROM erp.saldos_estoque WHERE local_estoque_id=101')).rows[0];assert.equal(Number(r.quantidade_fisica),2);assert.equal(Number(r.quantidade_reservada),0);return r;
    });
    await scenario('Release after partial fulfillment only releases remaining reservation',async()=>{
      await stock.reserveStockForSale(client,{tenantId:1,actorId:1,saleId:301});
      await db.query('UPDATE erp.saldos_estoque SET quantidade_reservada=5 WHERE empresa_id=1 AND produto_id=101 AND local_estoque_id=101');
      await db.query('UPDATE erp.reservas_estoque SET quantidade_atendida=3 WHERE empresa_id=1 AND venda_id=301');
      await stock.applyStockMovement(client,{tenantId:1,actorId:1,produtoId:101,localEstoqueId:101,quantidade:-3,tipo:'saida',origemTipo:'venda',origemId:301,chaveIdempotencia:'partial-output'});
      await stock.releaseStockForSale(client,{tenantId:1,actorId:1,saleId:301});
      const r=(await db.query('SELECT quantidade_fisica,quantidade_reservada FROM erp.saldos_estoque WHERE local_estoque_id=101')).rows[0];assert.equal(Number(r.quantidade_fisica),7);assert.equal(Number(r.quantidade_reservada),0);return r;
    });
    await scenario('Unit conversion preserves purchase value',async()=>{
      await stock.createStockOperation({tenantId:1,actorId:1,resource:'conversoes-unidades',idempotencyKey:'conversion',values:{produto_id:101,unidade_origem:'CX',unidade_destino:'UN',fator:12}});
      await stock.createStockOperation({tenantId:1,actorId:1,resource:'movimentacoes',idempotencyKey:'converted-entry',values:{produto_id:101,local_estoque_id:101,unidade:'CX',quantidade:2,custo_unitario:240,tipo:'entrada'}});
      const r=(await db.query('SELECT quantidade_fisica,custo_medio FROM erp.saldos_estoque WHERE local_estoque_id=101')).rows[0];assert.equal(Number(r.quantidade_fisica),34);assert.equal(Number(r.custo_medio),20);return r;
    });
    await scenario('Multi-item count and changed snapshot guard',async()=>{
      await stock.applyStockMovement(client,{tenantId:1,actorId:1,produtoId:102,localEstoqueId:101,quantidade:4,custoUnitario:2,tipo:'entrada',origemTipo:'manual',chaveIdempotencia:'other-opening'});
      const items=[{produto_id:101,quantidade_contada:11,quantidade_sistema:10},{produto_id:102,quantidade_contada:3,quantidade_sistema:4}];
      const r=await stock.createStockOperation({tenantId:1,actorId:1,resource:'inventarios',idempotencyKey:'multi-count',values:{local_estoque_id:101,itens:items}});
      assert.equal(Number((await db.query('SELECT count(*) AS n FROM erp.inventarios_itens WHERE inventario_id=$1',[r.id])).rows[0].n),2);
      await db.exec('SAVEPOINT stale_count');await assert.rejects(stock.createStockOperation({tenantId:1,actorId:1,resource:'inventarios',idempotencyKey:'stale-count',values:{local_estoque_id:101,itens:items}}),e=>e.code==='STOCK_COUNT_CONFLICT');await db.exec('ROLLBACK TO SAVEPOINT stale_count');return {items:2,staleRejected:true};
    });
    await scenario('Deferred database guard rejects an unbacked balance',async()=>{
      await db.exec('SAVEPOINT bad_balance');await db.query('UPDATE erp.saldos_estoque SET quantidade_fisica=99 WHERE empresa_id=1 AND produto_id=101');
      await assert.rejects(db.exec('SET CONSTRAINTS ALL IMMEDIATE'),e=>e.code==='23514');await db.exec('ROLLBACK TO SAVEPOINT bad_balance');return {rejected:true};
    });
    await scenario('Adjust-only actor cannot insert ordinary output',async()=>{
      await db.exec('SAVEPOINT unauthorized_output');await db.exec('SET LOCAL ROLE erp_runtime');await db.query("SELECT set_config('app.erp_tenant_id','1',true),set_config('app.erp_user_id','2',true)");
      await assert.rejects(stock.createStockOperation({tenantId:1,actorId:2,resource:'movimentacoes',idempotencyKey:'unauthorized-output',values:{local_estoque_id:101,produto_id:101,quantidade:1,tipo:'saida'}}),e=>e.code==='42501');await db.exec('ROLLBACK TO SAVEPOINT unauthorized_output');return {rejected:true};
    });
    await scenario('Contract calendar retains anchor day in app and database',async()=>{
      const {nextCommercialCycle}=load('src/products/erp/shared/commercialContracts.ts');
      let current='2026-01-31';const months=[];for(let i=0;i<4;i++){const next=nextCommercialCycle(current,'mensal','2026-01-31');const sql=(await db.query("SELECT erp.proximo_ciclo_contrato($1,'mensal','2026-01-31')::text AS next",[current])).rows[0].next;assert.equal(next,sql);months.push(next);current=next}assert.deepEqual(months,['2026-02-28','2026-03-31','2026-04-30','2026-05-31']);return {months};
    });
    await scenario('Empty stock page retains total count',async()=>{
      const result=await stock.listStockOperation(1,'posicao-estoque',{page:100});assert.equal(result.records.length,0);assert.equal(result.total,1);return {total:result.total,page:result.page};
    });
    await scenario('Count snapshot validates products and location',async()=>{
      const records=await stock.readStockCountSnapshot(1,101,[101,102]);assert.equal(records.length,2);assert.equal(Number(records.find(r=>r.produto_id==='101').quantidade_sistema),10);assert.equal(Number(records.find(r=>r.produto_id==='102').quantidade_sistema),0);
      await assert.rejects(stock.readStockCountSnapshot(1,101,[101,999]),e=>e.code==='VALIDATION_ERROR');return {products:2,missingProductRejected:true};
    });
    await scenario('Closed stock period rejects new movement',async()=>{
      const period=load('src/products/erp/server/erpPeriodRepository.ts');const closed=await period.closeErpPeriod({tenantId:1,actorId:1,modulo:'estoque',periodo_inicio:today,periodo_fim:today,motivo:'Local regression'});
      await assert.rejects(stock.applyStockMovement(client,{tenantId:1,actorId:1,produtoId:101,localEstoqueId:101,quantidade:1,custoUnitario:20,tipo:'entrada',origemTipo:'manual',chaveIdempotencia:'closed-output'}),e=>e.code==='PERIOD_CLOSED');
      await period.reopenErpPeriod({tenantId:1,actorId:1,id:Number(closed.id)});return {closedAndReopened:true};
    });
    await scenario('Stock balance cannot change its product link',async()=>{
      await db.exec('SAVEPOINT changed_link');await assert.rejects(db.query('UPDATE erp.saldos_estoque SET produto_id=102 WHERE empresa_id=1 AND produto_id=101'),e=>e.code==='23514');await db.exec('ROLLBACK TO SAVEPOINT changed_link');return {rejected:true};
    });
    await scenario('Contract backlog is generated once and resumes after pause',async()=>{
      const contracts=load('src/products/erp/server/erpSalesContracts.ts');
      const created=await contracts.createSalesContract(client,{tenantId:1,actorId:1,idempotencyKey:'contract-backlog',values:{cliente_id:101,descricao:'Local recurring service',data_inicio:'2026-01-31',periodicidade:'mensal',dia_vencimento:15,produto_id:101,quantidade:1,valor_unitario:20}});
      const first=await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-05-31'});assert.equal(first.total,5);assert.equal(first.skipped.length,0);assert.equal(first.remaining,0);
      const repeated=await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-05-31'});assert.equal(repeated.total,0);
      await db.query("UPDATE erp.contratos_vendas SET status='pausado' WHERE empresa_id=1 AND id=$1",[created.id]);assert.equal((await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-06-30'})).total,0);
      await db.query("UPDATE erp.contratos_vendas SET status='ativo' WHERE empresa_id=1 AND id=$1",[created.id]);assert.equal((await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-06-30'})).total,1);
      return {backlogCycles:5,repeated:0,resumedCycles:1};
    });
    await scenario('Contract cycle limit resumes without duplicate generations',async()=>{
      const contracts=load('src/products/erp/server/erpSalesContracts.ts');
      await contracts.createSalesContract(client,{tenantId:1,actorId:1,idempotencyKey:'contract-cycle-limit',values:{cliente_id:101,descricao:'Long overdue contract',data_inicio:'2024-01-31',periodicidade:'mensal',dia_vencimento:15,produto_id:101,quantidade:1,valor_unitario:20}});
      const first=await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-12-31'});assert.equal(first.total,24);assert.equal(first.remaining,1);
      const second=await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-12-31'});assert.equal(second.total,12);assert.equal(second.remaining,0);
      assert.equal((await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-12-31'})).total,0);
      return {firstBatch:24,secondBatch:12,repeated:0};
    });
    await scenario('Contract global batch limit leaves a resumable backlog',async()=>{
      const contracts=load('src/products/erp/server/erpSalesContracts.ts');
      for(let index=0;index<9;index++)await contracts.createSalesContract(client,{tenantId:1,actorId:1,idempotencyKey:'contract-global-limit-'+index,values:{cliente_id:101,descricao:'Batch contract '+index,data_inicio:'2024-01-31',periodicidade:'mensal',dia_vencimento:15,produto_id:101,quantidade:1,valor_unitario:20}});
      const batches=[];for(let index=0;index<3;index++){const batch=await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-12-31'});assert.equal(batch.skipped.length,0);assert(batch.total<=200);batches.push(batch.total);if(index===0)assert.equal(batch.total,200);if(index===2)assert.equal(batch.remaining,0)}
      assert.equal(batches.reduce((sum,value)=>sum+value,0),324);
      const count=(await db.query('SELECT count(*)::int AS n,count(DISTINCT (contrato_id,periodo_inicio))::int AS distinct_n FROM erp.contratos_vendas_geracoes WHERE empresa_id=1')).rows[0];assert.equal(count.n,324);assert.equal(count.distinct_n,324);
      return {batches,uniqueCycles:324};
    });
    await scenario('Contract revision preserves prior cycles and uses new conditions afterwards',async()=>{
      const contracts=load('src/products/erp/server/erpSalesContracts.ts');
      const created=await contracts.createSalesContract(client,{tenantId:1,actorId:1,idempotencyKey:'contract-revision',values:{cliente_id:101,descricao:'Revised contract',data_inicio:'2026-01-31',periodicidade:'mensal',dia_vencimento:15,produto_id:101,quantidade:1,valor_unitario:20}});
      assert.equal((await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-02-28'})).total,2);
      const header=(await db.query('SELECT versao FROM erp.contratos_vendas WHERE empresa_id=1 AND id=$1',[created.id])).rows[0];
      const items=(await db.query('SELECT id::text FROM erp.contratos_vendas_itens WHERE empresa_id=1 AND contrato_id=$1',[created.id])).rows;
      await contracts.reviseSalesContract({tenantId:1,actorId:1,id:Number(created.id),expectedVersion:Number(header.versao),inicio:'2026-03-31',motivo:'New agreed conditions',itens:items.map(item=>({id:item.id,quantidade:2,valor_unitario:30}))});
      assert.equal((await contracts.generateContractSales({tenantId:1,actorId:1,until:'2026-04-30'})).total,2);
      const sales=(await db.query('SELECT v.total FROM erp.contratos_vendas_geracoes g JOIN erp.vendas v ON v.empresa_id=g.empresa_id AND v.id=g.venda_id WHERE g.empresa_id=1 AND g.contrato_id=$1 ORDER BY g.periodo_inicio',[created.id])).rows;
      assert.deepEqual(sales.map(row=>Number(row.total)),[20,20,60,60]);return {cycleTotals:[20,20,60,60]};
    });
    await scenario('Expired automation is reclaimed and completed only once',async()=>{
      const {runRecoverableErpAutomation}=load('src/products/erp/server/erpAutomationRunner.ts');
      await db.query("INSERT INTO erp.execucoes_automacao(empresa_id,tipo,competencia,status,tentativas,chave_idempotencia,iniciado_em,criado_por) VALUES(1,'estoque_minimo',$1,'processando',1,$2,now()-interval '20 minutes',1)",[today,'estoque_minimo:'+today]);
      let calls=0;const input={tenantId:1,actorId:1,tipo:'estoque_minimo',competencia:today};
      const first=await runRecoverableErpAutomation(input,async()=>{calls++;return {total:1}}),again=await runRecoverableErpAutomation(input,async()=>{calls++;return {total:2}});
      assert.equal(first.status,'concluida');assert.equal(again.id,first.id);assert.equal(calls,1);assert.equal(Number((await db.query('SELECT tentativas FROM erp.execucoes_automacao WHERE empresa_id=1 AND id=$1',[first.id])).rows[0].tentativas),2);return {attempts:2,workCalls:1};
    });
    await scenario('Active automation lease does not execute a second worker',async()=>{
      const {runRecoverableErpAutomation}=load('src/products/erp/server/erpAutomationRunner.ts');
      await db.query("INSERT INTO erp.execucoes_automacao(empresa_id,tipo,competencia,status,tentativas,chave_idempotencia,iniciado_em,criado_por) VALUES(1,'estoque_minimo',$1,'processando',1,$2,now(),1)",[today,'estoque_minimo:'+today]);
      const result=await runRecoverableErpAutomation({tenantId:1,actorId:1,tipo:'estoque_minimo',competencia:today},async()=>{throw new Error('Unexpected second worker')});assert.equal(result.status,'processando');return {workCalls:0};
    });
    await scenario('Automation failure rolls back business changes and supports retry',async()=>{
      const {runRecoverableErpAutomation}=load('src/products/erp/server/erpAutomationRunner.ts');
      const input={tenantId:1,actorId:1,tipo:'estoque_minimo',competencia:today};const before=(await db.query('SELECT preco_venda FROM erp.produtos WHERE empresa_id=1 AND id=101')).rows[0].preco_venda;
      await assert.rejects(runRecoverableErpAutomation(input,async()=>{await db.query('UPDATE erp.produtos SET preco_venda=999 WHERE empresa_id=1 AND id=101');throw new Error('Local work failure')}),/Local work failure/);
      assert.equal((await db.query('SELECT preco_venda FROM erp.produtos WHERE empresa_id=1 AND id=101')).rows[0].preco_venda,before);assert.equal((await db.query('SELECT status FROM erp.execucoes_automacao WHERE empresa_id=1')).rows[0].status,'falha');
      const retried=await runRecoverableErpAutomation(input,async()=>({total:1}));assert.equal(retried.status,'concluida');return {businessRolledBack:true,retryCompleted:true};
    });
    await scenario('Partial contract batches remain recoverable under the same daily key',async()=>{
      const {runRecoverableErpAutomation}=load('src/products/erp/server/erpAutomationRunner.ts');
      const input={tenantId:1,actorId:1,tipo:'contratos',competencia:today};
      const partial=await runRecoverableErpAutomation(input,async()=>({total:24,remaining:1,skipped:[]}));assert.equal(partial.status,'falha');
      const complete=await runRecoverableErpAutomation(input,async()=>({total:1,remaining:0,skipped:[]}));assert.equal(complete.status,'concluida');assert.equal(complete.id,partial.id);return {sameExecution:true,recovered:true};
    });
    const {createHash}=require('node:crypto');
    const digests=Object.fromEntries(['20261005020000_harden_erp_stock_operations.sql','20261005021000_anchor_contract_cycles.sql'].map(file=>[file,createHash('sha256').update(fs.readFileSync(path.join(root,'supabase/migrations',file))).digest('hex')]));
    const report={generatedAt:new Date().toISOString(),localOnly:true,realDatabaseAccess:false,sqlAndRepositoryReal:true,independentConcurrentConnections:false,digests,scenarios:results};
    fs.mkdirSync('.cache/erp-audit',{recursive:true});
    fs.writeFileSync('.cache/erp-audit/stock-regression.json',JSON.stringify({...report,status:'passed'},null,2));
    console.log(JSON.stringify(report,null,2));
  } finally { await db.close(); }
})().catch(e=>{console.error(JSON.stringify({failed:true,code:e.code,message:e.message,completed:results}));process.exitCode=1;});
