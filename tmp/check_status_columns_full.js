require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

async function main() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000, query_timeout: 20000, statement_timeout: 20000 })
  await c.connect()
  const pairs = [
    ['vendas','pedidos'],
    ['compras','compras'],
    ['financeiro','contas_pagar'],
    ['financeiro','contas_receber'],
  ]
  const cols = await c.query(`
    select table_schema, table_name, column_name, data_type, udt_name, is_nullable, column_default
    from information_schema.columns
    where (table_schema, table_name) in (('vendas','pedidos'),('compras','compras'),('financeiro','contas_pagar'),('financeiro','contas_receber'))
      and column_name='status'
    order by table_schema, table_name
  `)
  const checks = await c.query(`
    select n.nspname as table_schema, r.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
    from pg_constraint con
    join pg_class r on r.oid = con.conrelid
    join pg_namespace n on n.oid = r.relnamespace
    where (n.nspname, r.relname) in (('vendas','pedidos'),('compras','compras'),('financeiro','contas_pagar'),('financeiro','contas_receber'))
      and con.contype='c'
    order by 1,2,3
  `)
  const out = { columns: cols.rows, checks: checks.rows, sample: {} }
  for (const [schema, table] of pairs) {
    out.sample[`${schema}.${table}`] = (await c.query(`select lower(trim(coalesce(status,''))) as status, count(*)::int as count from ${schema}.${table} group by 1 order by count desc, status asc`)).rows
  }
  console.log(JSON.stringify(out, null, 2))
  await c.end()
}
main().catch(e => { console.error('ERR', e.message); process.exit(1) })
