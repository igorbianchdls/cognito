import assert from 'node:assert/strict'
import {config} from 'dotenv'
import {writeFile} from 'node:fs/promises'
import {sourceLoader} from '../../../scripts/erp/accounting-test-runtime.mjs'
config({path:'.env.local',quiet:true})
const load=sourceLoader(),pg=load('@/lib/postgres'),ctx=load('@/lib/erpDatabaseContext'),results=[]
const owner={tenantId:2,userId:3,timeZone:'America/Sao_Paulo',readOnly:true,statementTimeoutMs:15000}
const scenario=async(name,fn)=>{try{results.push({name,passed:true,evidence:await fn()});console.log('PASS '+name)}catch(e){results.push({name,passed:false,error:{code:e.code,message:e.message}});console.log('FAIL '+name+' '+e.message)}}
try{
await scenario('Administrador autenticado lê financeiro sob contexto restrito',()=>ctx.runWithErpDatabaseContext(owner,async()=>{const rows=await pg.runQuery('SELECT count(*) AS n FROM erp.contas_receber WHERE empresa_id=$1',[2]);assert.ok(Number(rows[0].n)>0);return {authorizedRead:true}}))
await scenario('Consulta de outra empresa é bloqueada antes de acessar banco',()=>ctx.runWithErpDatabaseContext(owner,async()=>{await assert.rejects(()=>pg.runQuery('SELECT count(*) FROM erp.contas_receber WHERE empresa_id=$1',[999999999]),/tenant diferente/);return {crossScopeBlocked:true}}))
await scenario('RLS não expõe linhas de outras empresas mesmo em consulta ampla',()=>ctx.runWithErpDatabaseContext(owner,async()=>{const rows=await pg.runQuery('SELECT count(*) AS n FROM erp.contas_receber WHERE empresa_id<>$1',[2]);assert.equal(Number(rows[0].n),0);return {otherCompanyRows:0}}))
await scenario('Identidade sem vínculo não lê financeiro',()=>ctx.runWithErpDatabaseContext({...owner,userId:2147483647},async()=>{const rows=await pg.runQuery('SELECT count(*) AS n FROM erp.contas_receber WHERE empresa_id=$1',[2]);assert.equal(Number(rows[0].n),0);return {visibleRows:0}}))
await scenario('Contexto somente leitura recusa escrita mesmo sem linhas afetadas',()=>ctx.runWithErpDatabaseContext(owner,async()=>{await assert.rejects(()=>pg.runQuery('UPDATE erp.contas_receber SET descricao=descricao WHERE empresa_id=$1 AND id=0',[2]),e=>e.code==='25006');return {writeBlocked:true}}))
await scenario('Consulta ERP sem contexto autenticado é recusada',async()=>{await assert.rejects(()=>pg.runQuery('SELECT count(*) FROM erp.contas_receber WHERE empresa_id=$1',[2]),/sem contexto autenticado/);return {unauthenticatedBlocked:true}})
}finally{await pg.closePool();await writeFile('docs/avaliacao-erp/20261014-auditoria/financeiro-isolamento.json',JSON.stringify({at:new Date().toISOString(),noBusinessMutations:true,results},null,2));if(results.some(x=>!x.passed))process.exitCode=1}
