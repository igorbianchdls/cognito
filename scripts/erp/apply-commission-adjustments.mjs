import assert from 'node:assert/strict'
import { readFileSync,writeFileSync,mkdirSync } from 'node:fs'
import {createHash} from 'node:crypto'
import {connection} from './evolution-db.mjs'
const apply=process.argv.includes('--apply'),file='20261014120000_erp_ajustes_comissoes.sql',body=readFileSync('supabase/migrations/'+file,'utf8').replace(/^BEGIN;\s*/,'').replace(/COMMIT;\s*$/,''),digest=createHash('sha256').update(body).digest('hex')
const db=connection(),folder='.cache/fixes-five/'
mkdirSync(folder,{recursive:true})
const snapshot=async()=>{const rows=[];for(const table of ['comissoes_pagamentos','comissoes_pagamentos_itens'])rows.push((await db.query(`SELECT '${table}' AS tabela,count(*)::int AS linhas,md5(coalesce(string_agg((to_jsonb(r)-'valor_ajustado'-'ajustes')::text,'|' ORDER BY id),'')) AS hash FROM erp.${table} r`)).rows[0]);return rows}
try{
 await db.connect();await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='10s'");await db.query('SELECT pg_advisory_xact_lock(20261014,120000)')
 const prior=(await db.query('SELECT name,statements FROM supabase_migrations.schema_migrations WHERE version=$1',['20261014120000'])).rows[0]
 if(prior){assert.equal(prior.name,'erp_ajustes_comissoes');assert.deepEqual(prior.statements,[body]);await db.query('ROLLBACK');console.log(JSON.stringify({alreadyApplied:true,digest}))}
 else {
  if(apply){const checked=JSON.parse(readFileSync(folder+'migration-check.json','utf8'));assert.equal(checked.digest,digest);assert.equal(checked.checked,true);assert.ok(Date.now()-Date.parse(checked.at)<3600000)}
  const before=await snapshot();await db.query(body);const after=await snapshot();assert.deepEqual(after,before)
  for(const table of ['comissoes_pagamentos','comissoes_pagamentos_itens'])assert.equal(Number((await db.query(`SELECT count(*) AS n FROM erp.${table} WHERE valor_ajustado<>0`)).rows[0].n),0)
  if(apply){await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3::text[])',['20261014120000','erp_ajustes_comissoes',[body]]);await db.query('COMMIT')}else await db.query('ROLLBACK')
  const evidence={at:new Date().toISOString(),checked:true,applied:apply,digest,before,after,originalDataPreserved:true};writeFileSync(folder+(apply?'migration-applied.json':'migration-check.json'),JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence))
 }
}catch(e){await db.query('ROLLBACK').catch(()=>{});console.error({message:e.message,code:e.code});process.exitCode=1}finally{await db.end()}
