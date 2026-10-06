import assert from 'node:assert/strict'
import {readFileSync,writeFileSync} from 'node:fs'
import {config} from 'dotenv'
import {connection} from './evolution-db.mjs'
import {runWithErpDatabaseContext} from '../../src/lib/erpDatabaseContext'
import {closePool} from '../../src/lib/postgres'
import {listErpEntityPage,listErpCategoryOptions,getErpEntitySummary} from '../../src/products/erp/server/erpRepository'
import {loadPluginPrincipal} from '../../src/products/chatgptplugin/auth/resolvePrincipal'
import {executeTool} from '../../src/products/chatgptplugin/application/executeTool'
import {closePluginDatabase} from '../../src/products/chatgptplugin/shared/database'
config({path:'.env.local',quiet:true})
const db=connection(),proof=JSON.parse(readFileSync('.cache/entity-categories/application.json','utf8'))
assert.equal(proof.status,'passed')
async function main(){
try{
 await db.connect();const identity=(await db.query('SELECT clerk_user_id FROM shared.usuarios WHERE id=3')).rows[0]
 const principal=await loadPluginPrincipal(identity.clerk_user_id,'entity-category-read-check',['erp:read'])
 const checks:string[]=[]
 await runWithErpDatabaseContext({tenantId:2,userId:3,readOnly:true},async()=>{
  for(const [module,type,total,categories] of [['clientes','cliente',30,9],['fornecedores','fornecedor',15,8]] as const){
   const page=await listErpEntityPage({tenantId:2,entityId:module,page:1,pageSize:100})
   assert.equal(page.total,total);assert(page.records.every(r=>r.categoria));assert.equal(new Set(page.records.map(r=>r.categoria)).size,categories)
   assert.equal((await listErpCategoryOptions(2,type)).length,categories)
   const summary=await getErpEntitySummary(2,module);assert.equal(summary.metrics.find(m=>m.label==='Categorias')!.value,String(categories))
   const detail=await executeTool(principal,'obter_cadastro',{empresa_id:2,tipo:module,registro_id:Number(page.records[0].id)},{resource:'https://cognito-seven.vercel.app/api/mcp',metadataUrl:'https://cognito-seven.vercel.app/.well-known/oauth-protected-resource/api/mcp',toolTimeoutMs:15000})
   assert(!detail.isError);assert.equal((detail.structuredContent!.data as any).record.categoria,page.records[0].categoria)
   checks.push(module+': lista, opções, indicadores e detalhe MCP')
  }
  const categories=await listErpEntityPage({tenantId:2,entityId:'categorias',page:1,pageSize:100})
  const entityCategories=categories.records.filter(r=>r.tipo==='cliente'||r.tipo==='fornecedor')
  assert.equal(entityCategories.length,17);assert.equal(entityCategories.reduce((n,r)=>n+Number(r.itens),0),45);assert(entityCategories.every(r=>Number(r.itens)>0));checks.push('17 categorias com 45 cadastros vinculados')
  for(const type of ['receita','despesa','produto','servico'])assert(!(await listErpCategoryOptions(2,type)).some(r=>r.tipo==='cliente'||r.tipo==='fornecedor'))
  checks.push('Opções financeiras e de produtos/serviços preservadas')
 })
 const report={status:'passed',realDatabase:true,oauthVerified:false,checks};writeFileSync('.cache/entity-categories/repository-smoke.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
}finally{await Promise.allSettled([db.end(),closePool(),closePluginDatabase()])}
}
void main().catch(error=>{console.error(error.message);process.exitCode=1})
