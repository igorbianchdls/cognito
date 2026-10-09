import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {config} from 'dotenv'
import {connection} from './evolution-db.mjs'
import {runWithErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {closePool,runWithErpTransactionClient,withTransaction} from '../../src/lib/postgres'
import {createErpEntityWithClient,getErpEntityRecord,updateErpEntityRecord} from '../../src/products/erp/server/erpRepository'
import {proposalSchema,proposalValues} from '../../src/products/mcpcore/actions/contracts'
import {executeOperation} from '../../src/products/mcpcore/actions/operations'
import {loadPluginPrincipal} from '../../src/products/mcpcore/auth/resolvePrincipal'
import {closePluginDatabase} from '../../src/products/mcpcore/shared/database'

// Exige alvo explícito. Todas as escritas ficam numa transação revertida no final.
// Usa a persistência compartilhada do site/MCP; não testa OAuth nem o transporte HTTP.
config({path:'.env.local',quiet:true})
const option=(name:string)=>Number(process.argv.find(arg=>arg.startsWith(`--${name}=`))?.split('=')[1])
const company=option('company'),user=option('user')
assert(Number.isSafeInteger(company)&&company>0,'Informe --company=<empresa>')
assert(Number.isSafeInteger(user)&&user>0,'Informe --user=<usuario>')
const rollback=new Error('PERSON_TYPE_SMOKE_ROLLBACK'),marker=`TESTE TIPO PESSOA ${randomUUID()}`
const checks:string[]=[],created:string[]=[]
const db=connection()
async function main(){
 try{
  await db.connect()
  const identity=(await db.query('SELECT clerk_user_id FROM shared.usuarios WHERE id=$1 AND status=$2',[user,'active'])).rows[0]
  assert(identity?.clerk_user_id,'Usuário ativo obrigatório')
  const principal=await loadPluginPrincipal(identity.clerk_user_id,'person-type-regression',['erp:read','erp:write'])
  assert(principal.companies.some(c=>c.id===company&&c.capabilities.includes('erp.cadastros.gerenciar')),'Permissão de cadastro obrigatória')
  try{
   await runWithErpDatabaseContext({tenantId:company,userId:user},()=>withTransaction(client=>runWithErpTransactionClient(client,async()=>{
    async function stored(id:string,expected:string){
     const row=(await client.query('SELECT tipo_pessoa,nome,versao FROM erp.entidades WHERE empresa_id=$1 AND id=$2',[company,id])).rows[0]
     assert.equal(row?.tipo_pessoa,expected)
     return row
    }
    for(const [kind,module] of [['cliente','clientes'],['fornecedor','fornecedores'],['vendedor','vendedores']] as const){
     for(const type of ['fisica','juridica'] as const){
      const proposal=proposalSchema.parse({tipo:kind,dados:{nome:`${marker} ${kind} ${type}`,tipo:type}})
      const record=await createErpEntityWithClient(client,{tenantId:company,actorId:user,entityId:module,values:proposalValues(proposal)})
      const id=String(record.id);created.push(id);await stored(id,type);checks.push(`${kind}: criação MCP ${type}`)
      const opposite=type==='fisica'?'juridica':'fisica'
      await executeOperation(company,user,proposalSchema.parse({tipo:`editar_${kind}`,dados:{registro_id:Number(id),tipo:opposite}}),randomUUID())
      await stored(id,opposite);checks.push(`${kind}: edição MCP ${type} -> ${opposite}`)
      await executeOperation(company,user,proposalSchema.parse({tipo:`editar_${kind}`,dados:{registro_id:Number(id),nome:`${marker} RENOMEADO`}}),randomUUID())
      await stored(id,opposite);checks.push(`${kind}: editar nome preserva ${opposite}`)
     }
     for(const [input,expected] of [['PF','fisica'],['PJ','juridica'],[' fisica ','fisica'],['JURIDICA','juridica'],['Estrangeira','estrangeira'],[undefined,'juridica']] as const){
      const values={nome:`${marker} ${kind} site ${String(input)}`,tipo:input,status:'ativo'}
      const record=await createErpEntityWithClient(client,{tenantId:company,actorId:user,entityId:module,values})
      const id=String(record.id);created.push(id);await stored(id,expected)
      const current=await getErpEntityRecord({tenantId:company,entityId:module,id})
      await updateErpEntityRecord({tenantId:company,actorId:user,entityId:module,id,expectedVersion:Number(current.versao),values:{...current,tipo:input}})
      await stored(id,expected);checks.push(`${kind}: site criação/edição ${String(input)} -> ${expected}`)
     }
     const before=(await client.query('SELECT count(*)::int quantity FROM erp.entidades WHERE empresa_id=$1',[company])).rows[0].quantity
     await assert.rejects(()=>createErpEntityWithClient(client,{tenantId:company,actorId:user,entityId:module,values:{nome:marker,tipo:'tipo-invalido'}}),error=>error instanceof Error&&error.message.startsWith('Tipo de pessoa inválido'))
     const after=(await client.query('SELECT count(*)::int quantity FROM erp.entidades WHERE empresa_id=$1',[company])).rows[0].quantity
     assert.equal(after,before)
     const id=created[created.length-1],current=await getErpEntityRecord({tenantId:company,entityId:module,id})
     await assert.rejects(()=>updateErpEntityRecord({tenantId:company,actorId:user,entityId:module,id,expectedVersion:Number(current.versao),values:{...current,tipo:'tipo-invalido'}}),error=>error instanceof Error&&error.message.startsWith('Tipo de pessoa inválido'))
     const unchanged=await stored(id,'juridica');assert.equal(Number(unchanged.versao),Number(current.versao))
     checks.push(`${kind}: tipo inválido recusado sem criar/alterar cadastro`)
    }
    throw rollback
   })))
  }catch(error){if(error!==rollback)throw error}
  const remaining=(await db.query('SELECT count(*)::int quantity FROM erp.entidades WHERE empresa_id=$1 AND nome LIKE $2',[company,marker+'%'])).rows[0].quantity
  assert.equal(remaining,0,'A transação de teste deve ser revertida')
  console.log(JSON.stringify({status:'passed',realDatabase:true,oauthTransportTested:false,company,user,checks:checks.length,testRecordsRolledBack:created.length,remainingRecords:remaining,details:checks},null,2))
 }finally{await Promise.allSettled([db.end(),closePool(),closePluginDatabase()])}
}
void main().catch(error=>{console.error(error instanceof Error?error.message:'Falha no teste de tipo de pessoa');process.exitCode=1})
