import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import {db,restoreCatalog,assert} from './evolution-fixture.mjs';
const migration=readFileSync('supabase/migrations/20260909033000_drop_erp_financial_views.sql','utf8');
let checks=0,queries=0;
class DomainError extends Error{constructor(code,message,status){super(message);this.code=code;this.status=status;}}
function repository(file){
 const source=readFileSync(file,'utf8');
 assert(!/erp\.vw_(aging_receber|aging_pagar|dre_gerencial|fluxo_caixa_diario)/.test(source));
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});
 assert.equal((compiled.diagnostics||[]).filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
 const exports={};
 vm.runInNewContext(compiled.outputText,{exports,module:{exports},require:id=>{
  if(id==='@/lib/postgres')return {runQuery:async()=>{queries++;return [];},withTransaction:()=>{throw Error('Unexpected transaction');}};
  if(id==='@/products/erp/server/erpApi')return {ErpDomainError:DomainError};
  return {};
 }});
 return exports;
}
try{
 await restoreCatalog();
 for(const f of ['01-integridade-historicos.sql','02-periodos-fechados.sql','03-cadastros-documentos-contratos.sql','04-adiantamentos-renegociacoes.sql'])await db.exec(readFileSync('scripts/erp/sql/'+f,'utf8'));
 const tablesBefore=(await db.query("SELECT tablename FROM pg_tables WHERE schemaname='erp' ORDER BY tablename")).rows;
 const stockBefore=(await db.query("SELECT viewname,definition FROM pg_views WHERE schemaname='erp' AND viewname IN ('vw_posicao_estoque','vw_giro_estoque') ORDER BY viewname")).rows;
 await db.exec('CREATE VIEW erp.test_dependencia AS SELECT * FROM erp.vw_aging_receber');
 await assert.rejects(db.exec(migration),e=>e.code==='2BP01');await db.exec('ROLLBACK');checks++;
 assert.equal((await db.query("SELECT count(*)::int n FROM pg_views WHERE schemaname='erp' AND viewname LIKE 'vw_%'")).rows[0].n,6);checks++;
 await db.exec('DROP VIEW erp.test_dependencia');await db.exec(migration);
 assert.deepEqual((await db.query("SELECT tablename FROM pg_tables WHERE schemaname='erp' ORDER BY tablename")).rows,tablesBefore);checks++;
 assert.deepEqual((await db.query("SELECT viewname,definition FROM pg_views WHERE schemaname='erp' ORDER BY viewname")).rows,stockBefore);checks++;
 await db.exec(migration);checks++;
 const management=repository('src/products/erp/server/erpManagementRepository.ts');
 for(const resource of ['fluxo-de-caixa','dre','aging-receber','aging-pagar']){
  await assert.rejects(management.listManagementOperation(1,resource),e=>e.status===410&&e.code==='REPORT_RETIRED');checks++;
 }
 const professional=repository('src/products/erp/server/erpProfessionalRepository.ts');
 for(const report of ['dre-competencia','fluxo-diario','fluxo-mensal']){
  await assert.rejects(professional.listProfessionalReport({tenantId:1,report}),e=>e.status===410&&e.code==='REPORT_RETIRED');checks++;
 }
 assert.equal(queries,0);checks++;
 await professional.listProfessionalReport({tenantId:1,report:'vendas-clientes'});assert.equal(queries,1);checks++;
 console.log(JSON.stringify({status:'passed',checks,tables:tablesBefore.length,views:stockBefore.length,businessFixtures:false}));
}catch(e){console.error({checks,message:e.message,code:e.code});process.exitCode=1;}finally{await db.close();}

