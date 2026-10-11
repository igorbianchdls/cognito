import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import vm from 'node:vm';import ts from 'typescript';import {connection} from './evolution-db.mjs';
mkdirSync('.cache/erp-audit',{recursive:true});
function load(path,deps={}){const js=ts.transpileModule(readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const m={exports:{}};vm.runInThisContext('(function(require,module,exports){'+js+'\n})',{filename:path})(n=>deps[n]||{},m,m.exports);return m.exports}
const errors=load('src/products/erp/shared/erpErrors.ts'),db=connection(),checks=[];
try{await db.connect();await db.query('BEGIN');
 const tables=['entidades','entidades_contatos','entidades_enderecos','categorias','categorias_cadastro','contas_receber','contas_receber_parcelas','pagamentos','adiantamentos_aplicacoes','renegociacoes','renegociacoes_parcelas','vendas','tabelas_preco','tabelas_preco_itens','devolucoes'];
 for(const table of tables)await db.query(`CREATE TEMP TABLE ${table} AS SELECT * FROM erp.${table} WITH NO DATA`);
 const fn=(await db.query("SELECT pg_get_functiondef('erp.composicao_parcela(bigint,text,bigint)'::regprocedure) sql")).rows[0].sql;
 await db.query(fn.replaceAll('erp.','pg_temp.'));
 await db.query(`INSERT INTO pg_temp.entidades(id,empresa_id,nome,limite_credito,bloqueio_comercial,eh_cliente,ativo) SELECT n,2,CASE WHEN n=251 THEN 'UniqueLast' ELSE 'Same name' END,1000,false,true,true FROM generate_series(1,251)n;
 INSERT INTO pg_temp.contas_receber(id,empresa_id,cliente_id,status) VALUES(1,2,1,'parcial');
 INSERT INTO pg_temp.contas_receber_parcelas(id,empresa_id,conta_receber_id,valor,valor_pago,status) VALUES(1,2,1,1000,0,'parcial');
 INSERT INTO pg_temp.adiantamentos_aplicacoes(id,empresa_id,conta_receber_parcela_id,valor) VALUES(1,2,1,600)`);
 let allowed=false,overrides=0;
 const client={query:async(sql,p)=>{
  if(sql.startsWith('SELECT shared.has_erp_capability'))return{rows:[{ok:allowed}]};
  if(sql.startsWith('UPDATE erp.vendas')){overrides++;return{rows:[]}};
  return db.query(sql.replaceAll('erp.','pg_temp.'),p);
 }};
 const rules=load('src/products/erp/server/erpCommercialRules.ts',{'@/products/erp/shared/erpErrors':errors,'../shared/erpErrors':errors});
 const request={tenantId:2,actorId:3,saleId:2,customerId:1,saleTotal:100};
 await rules.assertCustomerCredit(client,request);checks.push('Credit applied: 1000 minus 600 plus new sale 100 = 500, accepted');
 await db.query('INSERT INTO pg_temp.adiantamentos_aplicacoes(id,empresa_id,conta_receber_parcela_id,valor,reversao_de_id) VALUES(2,2,1,600,1)');
 await assert.rejects(rules.assertCustomerCredit(client,request),e=>e.code==='CREDIT_LIMIT_EXCEEDED');checks.push('Reversed advance restores outstanding and blocks excess');
 await assert.rejects(rules.assertCustomerCredit(client,{...request,override:{motivo:'Approved exception'}}),e=>e.code==='ACCESS_DENIED');
 allowed=true;await rules.assertCustomerCredit(client,{...request,override:{motivo:'Approved exception'}});assert.equal(overrides,1);checks.push('Credit override requires financial permission and records reason');
 const pg={runQuery:async(sql,p)=>(await client.query(sql,p)).rows,runWithErpReadSnapshot:fn=>fn()};
 const repository=load('src/products/erp/server/erpRepository.ts',{'@/lib/postgres':pg,'@/products/erp/shared/erpErrors':errors});
 const importer=load('src/products/erp/server/erpImportRepository.ts',{'@/lib/postgres':pg,'@/products/erp/server/erpRepository':repository});
 const exported=await importer.exportErpRecords(2,'clientes');assert.equal(exported.length,251);assert.equal(new Set(exported.map(r=>r.id)).size,251);checks.push('Actual export/list SQL returns all 251 customers with tied names');
 await db.query(`INSERT INTO pg_temp.tabelas_preco(id,empresa_id,nome,padrao,ativo) SELECT n,2,CASE WHEN n=101 THEN 'UniqueLast' ELSE 'Same name' END,false,true FROM generate_series(1,101)n`);
 const commercial=load('src/products/erp/server/erpCommercialRepository.ts',{'@/lib/postgres':pg});
 const first=await commercial.listPriceTables(2,{pageSize:50}),last=await commercial.listPriceTables(2,{pageSize:50,page:3}),filtered=await commercial.listPriceTables(2,{pageSize:50,query:'UniqueLast'});
 assert.equal(first.total,101);assert.equal(first.records.length,50);assert.equal(last.records.length,1);assert.equal(filtered.records[0].id,'101');checks.push('Price lists: 101 results over three pages; server search finds last record');
 await db.query(`INSERT INTO pg_temp.vendas(id,empresa_id,numero) VALUES(1,2,'VEN-TEST');
 INSERT INTO pg_temp.devolucoes(id,empresa_id,venda_id,cliente_id,numero,data_devolucao,valor_credito) SELECT n,2,1,1,CASE WHEN n=101 THEN 'UniqueLast' ELSE 'DEV-'||n END,CURRENT_DATE,10 FROM generate_series(1,101)n`);
 const returns=load('src/products/erp/server/erpReturnsRepository.ts',{'@/lib/postgres':pg});
 const found=new Set();for(let page=1;page<=3;page++){const r=await returns.listSaleReturns(2,{pageSize:50,page,comCredito:true});assert.equal(r.hasMore,page<3);r.records.forEach(row=>found.add(row.id))};assert.equal(found.size,101);
 const selected=await returns.listSaleReturns(2,{query:'UniqueLast'});assert.equal(selected.records.length,1);assert.equal(selected.records[0].id,'101');checks.push('Returns: all 101 over three pages; available-credit filter and server search work');
 await db.query('ROLLBACK');const report={status:'passed',generatedAt:new Date().toISOString(),checks,productionRecordsModified:false};writeFileSync('.cache/erp-audit/credit-pagination-regression.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
}catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{await db.end()}

