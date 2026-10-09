import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {config} from 'dotenv'
import {connection} from './evolution-db.mjs'
import {runWithErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {closePool,runWithErpTransactionClient,withTransaction} from '../../src/lib/postgres'
import {financialTitle} from '../../src/products/erp/server/erpReadQueries'
import {createManualFinancialTitle} from '../../src/products/erp/server/erpCrudRepository'
import {proposalSchema} from '../../src/products/mcpcore/actions/contracts'
import {executeOperation} from '../../src/products/mcpcore/actions/operations'
import {outputs} from '../../src/products/mcpcore/tools/outputs'
import {loadPluginPrincipal} from '../../src/products/mcpcore/auth/resolvePrincipal'
import {executionDependencies} from '../../src/products/mcpcore/application/executeTool'
import {closePluginDatabase} from '../../src/products/mcpcore/shared/database'
import {getPluginConfig} from '../../src/products/chatgptplugin/shared/config'
import {handlePluginRequest} from '../../src/products/chatgptplugin/mcp/handleRequest'

// Escritas em uma única transação revertida. HTTP MCP local usa identidade resolvida
// explicitamente para testar o SDK/contrato com Supabase real, sem testar o token OAuth.
config({path:'.env.local',quiet:true})
const option=(name:string)=>Number(process.argv.find(arg=>arg.startsWith(`--${name}=`))?.split('=')[1])
const company=option('company'),user=option('user')
assert(Number.isSafeInteger(company)&&company>0,'Informe --company=<empresa>')
assert(Number.isSafeInteger(user)&&user>0,'Informe --user=<usuario>')
const marker='TESTE TIPO LANCAMENTO '+randomUUID(),rollback=new Error('TITLE_TYPE_SMOKE_ROLLBACK')
const checks:string[]=[],db=connection()
let created=0
async function main(){try{
 await db.connect()
 const identity=(await db.query('SELECT clerk_user_id FROM shared.usuarios WHERE id=$1 AND status=$2',[user,'active'])).rows[0]
 assert(identity?.clerk_user_id)
 const principal=await loadPluginPrincipal(identity.clerk_user_id,'financial-title-type-regression',['erp:read','erp:write'])
 assert(principal.companies.some(c=>c.id===company&&c.capabilities.includes('erp.financeiro.gerenciar')))
 try{
  await runWithErpDatabaseContext({tenantId:company,userId:user},()=>withTransaction(client=>runWithErpTransactionClient(client,async()=>{
   for(const side of ['pagar','receber'] as const){
    const party=side==='pagar'?'fornecedor':'cliente',categoryType=side==='pagar'?'despesa':'receita'
    const partyRow=(await client.query(`SELECT id FROM erp.entidades WHERE empresa_id=$1 AND eh_${party} AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1`,[company])).rows[0]
    const category=(await client.query(`SELECT id FROM erp.categorias c WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL AND tipo=$2 AND NOT EXISTS(SELECT 1 FROM erp.categorias f WHERE f.empresa_id=$1 AND f.categoria_pai_id=c.id AND f.ativo AND f.excluido_em IS NULL) ORDER BY id LIMIT 1`,[company,categoryType])).rows[0]
    assert(partyRow&&category,'Referências financeiras ativas obrigatórias')
    for(const type of ['previsao','efetivo'] as const){
     const values={ [party+'_id']:Number(partyRow.id),categoria_id:Number(category.id),descricao:marker,valor_total:20,data_competencia:'2026-10-09',data_emissao:'2026-10-09',parcelas:[{data_vencimento:'2026-10-16',valor:20}],tipo_lancamento:type }
     const id=Number(await createManualFinancialTitle(client,company,user,side,values,randomUUID()));created++
     const detail=await financialTitle(company,side,id)
     assert.equal(detail.record.tipo_lancamento,type);assert.equal(Number(detail.record.valor_total),20);assert.equal(detail.installments.length,1)
     assert.equal(outputs.financialTitle.parse(detail).record.tipo_lancamento,type)
     assert.equal((await financialTitle(company,side,id,client)).record.tipo_lancamento,type)
     checks.push(`${side}: detalhe e contrato retornam ${type}`)
     if(type==='previsao'){
      await executeOperation(company,user,proposalSchema.parse({tipo:'efetivar_conta_'+side,dados:{registro_id:id}}),randomUUID())
      const effective=await financialTitle(company,side,id)
      assert.equal(effective.record.tipo_lancamento,'efetivo');assert.equal(outputs.financialTitle.parse(effective).record.tipo_lancamento,'efetivo')
      checks.push(`${side}: leitura depois da efetivação retorna efetivo`)
     }
    }
   }
   throw rollback
  })))
 }catch(error){if(error!==rollback)throw error}
 for(const side of ['pagar','receber'] as const){
  assert.equal((await db.query(`SELECT count(*)::int quantity FROM erp.contas_${side} WHERE empresa_id=$1 AND descricao=$2`,[company,marker])).rows[0].quantity,0)
  const record=(await db.query(`SELECT id,tipo_lancamento FROM erp.contas_${side} WHERE empresa_id=$1 AND excluido_em IS NULL ORDER BY id LIMIT 1`,[company])).rows[0];assert(record)
  const settings=getPluginConfig()
  const response=await handlePluginRequest(new Request(settings.resource,{method:'POST',headers:{'content-type':'application/json',accept:'application/json, text/event-stream',authorization:'Bearer local-test-fixture'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'obter_titulo_financeiro',arguments:{empresa_id:company,tipo:side,conta_id:Number(record.id)}}})}),{config:()=>settings,resolve:async()=>principal,limit:async()=>{},execution:executionDependencies})
  assert.equal(response.status,200);const rpc=await response.json();assert(!rpc.error&&!rpc.result.isError,JSON.stringify(rpc.error||rpc.result?.content))
  const data=rpc.result.structuredContent.data
  assert.equal(data.record.tipo_lancamento,record.tipo_lancamento);assert.equal(outputs.financialTitle.parse(data).record.tipo_lancamento,record.tipo_lancamento)
  checks.push(`${side}: tools/call SDK devolve tipo igual ao Supabase`)
 }
 assert.equal(outputs.financialTitle.safeParse({record:{id:'1'},installments:[],history:[]}).success,false)
 assert.equal(outputs.financialTitle.safeParse({record:{tipo_lancamento:'invalido'}}).success,false)
 checks.push('Contrato recusa tipo ausente ou inválido')
 console.log(JSON.stringify({status:'passed',realDatabase:true,mcpHttpTransport:'local_auth_fixture',oauthTokenVerified:false,checks:checks.length,testTitlesRolledBack:created,remainingTestTitles:0,details:checks},null,2))
}finally{await Promise.allSettled([db.end(),closePool(),closePluginDatabase()])}}
void main().catch(error=>{console.error(error instanceof Error?error.message:'Falha nos detalhes financeiros');process.exitCode=1})
