require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 20000,
    statement_timeout: 20000,
  })
  await c.connect()

  const targets = [
    ['vendas', 'pedidos'],
    ['compras', 'compras'],
  ]

  const cols = await c.query(`
    select table_schema, table_name, column_name, data_type, udt_schema, udt_name, is_nullable
    from information_schema.columns
    where (table_schema, table_name) in (('vendas','pedidos'),('compras','compras'))
      and column_name = 'status'
    order by table_schema, table_name
  `)

  const checks = await c.query(`
    select nsp.nspname as table_schema, rel.relname as table_name, con.conname as constraint_name, pg_get_constraintdef(con.oid) as definition
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where (nsp.nspname, rel.relname) in (('vendas','pedidos'),('compras','compras'))
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
    order by nsp.nspname, rel.relname, con.conname
  `)

  const out = { columns: cols.rows, check_constraints: checks.rows, sample_statuses: {} }

  for (const [schema, table] of targets) {
    const key = `${schema}.${table}`
    try {
      out.sample_statuses[key] = (
        await c.query(`
          select lower(trim(coalesce(status,''))) as status, count(*)::int as count
          from ${schema}.${table}
          group by 1
          order by count desc, status asc
        `)
      ).rows
    } catch (e) {
      out.sample_statuses[key] = { error: e.message }
    }
  }

  console.log(JSON.stringify(out, null, 2))
  await c.end()
}

main().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
