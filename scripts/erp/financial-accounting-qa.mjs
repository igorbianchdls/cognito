import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {sourceLoader} from './accounting-test-runtime.mjs'
import {config} from 'dotenv'
import {connection} from './evolution-db.mjs'
config({path:'.env.local',quiet:true});mkdirSync('.cache/accounting',{recursive:true})
const load=sourceLoader(),pg=load('@/lib/postgres'),ctx=load('@/lib/erpDatabaseContext'),dre=load('@/products/erp/server/erpDreReport'),db=connection(),checks=[]
const from='2026-10-01',to='2026-10-14',day=v=>v instanceof Date?v.toISOString().slice(0,10):String(v).slice(0,10),within=v=>v&&day(v)>=from&&day(v)<=to
const round=v=>Math.sign(v)*Math.round((Math.abs(v)+1e-9)*100)/100,near=(a,b)=>assert(Math.abs(a-b)<0.021,`${a} != ${b}`)
try{
 await db.connect();await db.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')

 const records={};for(const table of ['contas_pagar','contas_receber','pagamentos','contas_pagar_parcelas','contas_receber_parcelas','categorias','rateios_financeiros','devolucoes','renegociacoes','documentos_estoque'])records[table]=(await db.query('SELECT * FROM erp.'+table+' WHERE empresa_id=2')).rows
 const moves=(await db.query("SELECT *,to_char((ocorrido_em AT TIME ZONE 'America/Fortaleza')::date,'YYYY-MM-DD') occurrence_date FROM erp.movimentacoes_estoque WHERE empresa_id=2")).rows
 const categories=new Map(records.categorias.map(c=>[String(c.id),c])),expenses=new Map(records.contas_pagar.map(c=>[String(c.id),c])),income=new Map(records.contas_receber.map(c=>[String(c.id),c]))
 const exclude=category=>categories.get(String(category))?.fora_dre===true
 const allocations=(id,side)=>records.rateios_financeiros.filter(r=>!r.excluido_em&&String(r['conta_'+side+'_id'])===String(id)).sort((a,b)=>Number(a.id)-Number(b.id))
 let expectedAccrual=0,expectedCash=0,excludedInventory=0
 const refunds=new Set(records.devolucoes.filter(d=>d.tratamento==='reembolso').map(d=>String(d.conta_pagar_id)))
 for(const [side,titles,sign] of [['receber',records.contas_receber,1],['pagar',records.contas_pagar,-1]])for(const title of titles){
  if(title.excluido_em||title.status==='cancelado'||title.renegociacao_origem_id||title.tipo_lancamento==='previsao'||!within(title.data_competencia)||(side==='pagar'&&refunds.has(String(title.id))))continue
  const parts=allocations(title.id,side),lines=parts.length?parts:[{categoria_id:title.categoria_id,valor:title.valor_total}]
  for(const r of lines)if(!exclude(r.categoria_id))expectedAccrual+=sign*Number(r.valor);else excludedInventory+=Number(r.valor)
 }
 for(const r of records.renegociacoes)if(r.status==='efetivada'&&within(r.data_acordo)&&!exclude(r.categoria_ajuste_id))expectedAccrual+=(r.lado==='receber'?1:-1)*(Number(r.encargos)-Number(r.desconto))
 for(const r of records.devolucoes)if(within(r.data_devolucao))expectedAccrual-=Number(r.valor_total)
 const stockDocs=new Map(records.documentos_estoque.map(d=>[String(d.id),d]))
 let cmv=0;for(const m of moves)if(within(m.data_operacional||m.occurrence_date)&&(['venda','cancelamento_venda'].includes(m.origem_tipo)||stockDocs.get(String(m.documento_estoque_id))?.venda_id)){const cost=round(Number(m.quantidade)*Number(m.custo_unitario));cmv+=cost;expectedAccrual+=cost}
 for(const p of records.pagamentos){
  if(p.excluido_em||!within(p.data_pagamento))continue
  const side=p.tipo==='receber'?'receber':'pagar',parcel=records['contas_'+side+'_parcelas'].find(r=>String(r.id)===String(p['conta_'+side+'_parcela_id'])),title=(side==='receber'?income:expenses).get(String(parcel?.['conta_'+side+'_id']));if(!title)continue
  const parts=allocations(title.id,side),lines=parts.length?parts:[{categoria_id:title.categoria_id,valor:title.valor_total}];let allocated=0
  for(let i=0;i<lines.length;i++){const value=i===lines.length-1?Number(p.valor_liquido)-allocated:round(Number(p.valor_liquido)*Number(lines[i].valor)/Number(title.valor_total));allocated+=value;if(!exclude(lines[i].categoria_id))expectedCash+=value*(side==='receber'?1:-1)*(p.estorno_de_pagamento_id?-1:1)}
 }
 await db.query("SELECT set_config('app.erp_empresa_id','2',true),set_config('app.erp_tenant_id','2',true),set_config('app.erp_user_id','3',true),set_config('app.erp_time_zone','America/Fortaleza',true)")
 const client={release(){},async query(sql,p){pg.assertErpTenantScopedQuery(sql,p);await db.query(/\berp\.[a-z_][a-z0-9_]*/i.test(sql)?'SET LOCAL ROLE erp_runtime':'RESET ROLE');return db.query(sql,p)}}
 await ctx.runWithErpDatabaseContext({tenantId:2,userId:3,timeZone:'America/Fortaleza'},()=>pg.runWithErpTransactionClient(client,async()=>{
  const a=await dre.dreReport(2,{inicio:from,fim:to,visao:'competencia'}),b=await dre.dreReport(2,{inicio:from,fim:to,visao:'caixa'})
  near(a.subtotais.lucro_liquido,round(expectedAccrual));near(b.subtotais.lucro_liquido,round(expectedCash));near(a.grupos.find(g=>g.codigo===3).categorias.find(c=>c.nome.startsWith('CMV')).total,round(cmv));assert(excludedInventory>0)
  checks.push({independentRawData:{competencia:round(expectedAccrual),caixa:round(expectedCash),cmv:round(cmv),inventoryExcluded:round(excludedInventory)}})
  const portal=load('@/products/portaldocontador/server/queries'),session={tenantId:2,capabilities:['erp.financeiro.visualizar','erp.relatorios.visualizar']}
  for(const [report,expected] of [['dre-competencia',expectedAccrual],['dre-caixa',expectedCash]]){
   const q=load('@/products/portaldocontador/shared/contracts').portalQuerySchema.parse({from,to,report,pageSize:100})
   const result=await portal.portalReports(session,q),last=result.records.find(r=>String(r.linha).includes('Lucro líquido'));near(Number(last.valor),round(expected))
   const tool=load('@/products/mcpcore/tools/catalog').tools.find(t=>t.name==='consultar_relatorio'),input=tool.schema.parse({empresa_id:2,tipo:report,inicio:from,fim:to,por_pagina:50})
   const resultTool=await tool.execute(load('@/products/erp/server/erpReadService').erpReadService,2,input)
   near(resultTool.records.reduce((s,r)=>s+Number(r.valor),0),round(expected))
  }
  checks.push('Actual Portal report functions and consultar_relatorio tool implementations match both independent totals')
 }))
 await db.query('ROLLBACK');const report={status:'passed',generatedAt:new Date().toISOString(),checks,rolledBack:true,externalFiscalApi:false};writeFileSync('.cache/accounting/reconciliation.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))
}catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{await db.end();await pg.closePool()}


