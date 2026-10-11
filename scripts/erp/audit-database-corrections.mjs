import assert from 'node:assert/strict'
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {connection} from './evolution-db.mjs'
import {catalog} from './evolution-catalog.mjs'
const file='20261011150000_erp_audit_corrections.sql', version=file.slice(0,14)
const sql=readFileSync('supabase/migrations/'+file,'utf8').replace(/^BEGIN;\s*$/m,'').replace(/COMMIT;\s*$/,'')
const digest=createHash('sha256').update(sql).digest('hex')
const apply=process.argv.includes('--apply'), db=connection(), checks=[]
assert(process.argv.slice(2).every(v=>v==='--apply'||v==='--check'))
mkdirSync('.cache/erp-audit/corrections',{recursive:true})
async function rejected(query) {
 await db.query('SAVEPOINT rejection')
 try {await db.query(query);assert.fail('Expected protected mutation to fail')}catch(e){assert.equal(e.code,'23514')}
 finally {await db.query('ROLLBACK TO rejection');await db.query('RELEASE rejection')}
}
try {
 await db.connect(); await db.query('BEGIN');await db.query("SET LOCAL lock_timeout='10s'")
 await db.query('SELECT pg_advisory_xact_lock(20261011,150000)')
 const existing=(await db.query('SELECT * FROM supabase_migrations.schema_migrations WHERE version=$1',[version])).rows[0]
 if(existing){assert.deepEqual(existing.statements,[sql]);console.log(JSON.stringify({status:'already_applied',version}));await db.query('ROLLBACK')}
 else {
  const before=await catalog(db)
  writeFileSync('.cache/erp-audit/corrections/schema-before.json',JSON.stringify(before,null,2))
  if(apply){
   const proof=JSON.parse(readFileSync('.cache/erp-audit/corrections/database-check.json','utf8'))
   assert.equal(proof.status,'passed');assert.equal(proof.digest,digest)
   assert(Date.now()-Date.parse(proof.generatedAt)<3600000,'Repeat database checks after one hour')
   assert.equal(JSON.parse(readFileSync('.cache/erp-audit/corrections-regression.json','utf8')).status,'passed')
   await db.query(sql)
   await db.query('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) VALUES($1,$2,$3)',[version,file.slice(15,-4),[sql]])
   const after=await catalog(db)
   assert.deepEqual(after.rls,before.rls);assert.deepEqual(after.policies,before.policies);assert.deepEqual(after.grants,before.grants)
   await db.query('COMMIT')
   writeFileSync('.cache/erp-audit/corrections/applied.json',JSON.stringify({status:'applied',version,digest,generatedAt:new Date().toISOString(),rlsUnchanged:true},null,2))
   console.log(JSON.stringify({status:'applied',version,digest,rlsUnchanged:true}))
  } else {
   await db.query(sql)
   for(const table of ['contas_pagar','contas_pagar_parcelas','devolucoes','comissoes_pagamentos','pagamentos'])
    await db.query(`CREATE TEMP TABLE ${table} AS SELECT * FROM erp.${table} WITH NO DATA`)
   await db.query(`INSERT INTO pg_temp.contas_pagar(id,empresa_id,status,valor_total) VALUES(55,2,'aberto',100),(56,2,'aberto',100),(57,2,'aberto',100);
    INSERT INTO pg_temp.contas_pagar_parcelas(id,empresa_id,conta_pagar_id,status,valor,valor_pago) VALUES(77,2,55,'aberto',100,0);
    INSERT INTO pg_temp.devolucoes(id,empresa_id,conta_pagar_id) VALUES(1,2,55);
    INSERT INTO pg_temp.comissoes_pagamentos(id,empresa_id,conta_pagar_id) VALUES(1,2,57)`)
   const fn=(await db.query("SELECT pg_get_functiondef('erp.proteger_conta_comercial()'::regprocedure) sql")).rows[0].sql
   await db.query(fn.replaceAll('erp.proteger_conta_comercial','pg_temp.proteger_conta_comercial').replaceAll('erp.comissoes_pagamentos','pg_temp.comissoes_pagamentos').replaceAll('erp.devolucoes','pg_temp.devolucoes'))
   await db.query(`CREATE TRIGGER protect BEFORE UPDATE OR DELETE ON pg_temp.contas_pagar FOR EACH ROW EXECUTE FUNCTION pg_temp.proteger_conta_comercial();
    CREATE TRIGGER protect BEFORE INSERT OR UPDATE OR DELETE ON pg_temp.contas_pagar_parcelas FOR EACH ROW EXECUTE FUNCTION pg_temp.proteger_conta_comercial()`)
   for(const id of [55,57])for(const query of [`DELETE FROM pg_temp.contas_pagar WHERE id=${id}`,`UPDATE pg_temp.contas_pagar SET status='cancelado' WHERE id=${id}`,`UPDATE pg_temp.contas_pagar SET valor_total=50 WHERE id=${id}`])await rejected(query)
   await rejected('UPDATE pg_temp.contas_pagar_parcelas SET valor=50 WHERE id=77')
   await rejected('DELETE FROM pg_temp.contas_pagar_parcelas WHERE id=77')
   await rejected("INSERT INTO pg_temp.contas_pagar_parcelas(id,empresa_id,conta_pagar_id) VALUES(78,2,55)")
   await db.query("UPDATE pg_temp.contas_pagar_parcelas SET conta_financeira_id=1,metodo_pagamento_id=1 WHERE id=77")
   await db.query("UPDATE pg_temp.contas_pagar_parcelas SET valor_pago=100,status='pago',data_pagamento=CURRENT_DATE WHERE id=77")
   await db.query("UPDATE pg_temp.contas_pagar SET status='pago' WHERE id=55")
   await db.query("UPDATE pg_temp.contas_pagar_parcelas SET valor_pago=0,status='aberto',data_pagamento=NULL WHERE id=77")
   await db.query("UPDATE pg_temp.contas_pagar SET status='aberto' WHERE id=55")
   await db.query('DELETE FROM pg_temp.contas_pagar WHERE id=56')
   checks.push('Both linked title types protected; installment mutation protected; payment, reversal and ordinary titles allowed')
   await db.query(`CREATE TRIGGER signature BEFORE UPDATE ON pg_temp.pagamentos FOR EACH ROW EXECUTE FUNCTION erp.preservar_assinatura_comercial();INSERT INTO pg_temp.pagamentos(id,request_hash) VALUES(1,repeat('a',64))`)
   await rejected("UPDATE pg_temp.pagamentos SET request_hash=repeat('b',64) WHERE id=1")
   await db.query('UPDATE pg_temp.pagamentos SET estornado_em=now() WHERE id=1')
   checks.push('Request signature immutable; payment reversal allowed')
   const year=(await db.query('SELECT greatest(2097,coalesce(max(ano),0)+1)::int ano FROM erp.numeracoes')).rows[0].ano
   await db.query("INSERT INTO erp.numeracoes(empresa_id,tipo,ano,proximo) VALUES(2,'venda',$1,9999)",[year])
   const numbers=[]
   for(let i=0;i<3;i++)numbers.push((await db.query("SELECT erp.proximo_numero(2,'venda',$1::date) numero",[`${year}-01-01`])).rows[0].numero)
   assert.deepEqual(numbers,[9999,10000,10001].map(n=>`VEN-${year}-${n}`));checks.push({numbering:numbers})
   await db.query('ROLLBACK')
   const report={status:'passed',digest,generatedAt:new Date().toISOString(),checks,allTestWritesRolledBack:true}
   writeFileSync('.cache/erp-audit/corrections/database-check.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
  }
 }
} catch(e){await db.query('ROLLBACK').catch(()=>{});throw e} finally {await db.end()}
