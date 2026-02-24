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

  const cols = await c.query(`
    select table_schema, table_name, column_name, data_type, udt_schema, udt_name, is_nullable
    from information_schema.columns
    where table_schema = 'financeiro'
      and table_name in ('contas_pagar','contas_receber')
      and column_name = 'status'
    order by table_name
  `)

  const out = { columns: cols.rows }

  const udtNames = [...new Set(cols.rows.map(r => r.udt_name).filter(Boolean))]
  if (udtNames.length) {
    const enums = await c.query(`
      select n.nspname as type_schema, t.typname as type_name, e.enumsortorder, e.enumlabel
      from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      join pg_enum e on e.enumtypid = t.oid
      where t.typname = any($1::text[])
      order by t.typname, e.enumsortorder
    `, [udtNames])
    out.enum_values = enums.rows
  }

  const checks = await c.query(`
    select rel.relname as table_name, con.conname as constraint_name, pg_get_constraintdef(con.oid) as definition
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'financeiro'
      and rel.relname in ('contas_pagar','contas_receber')
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%status%'
    order by rel.relname, con.conname
  `)
  out.check_constraints = checks.rows

  const samples = {}
  for (const t of ['contas_pagar', 'contas_receber']) {
    samples[t] = (await c.query(`
      select lower(trim(coalesce(status,''))) as status, count(*)::int as count
      from financeiro.${t}
      group by 1
      order by count desc, status asc
    `)).rows
  }
  out.sample_statuses = samples

  console.log(JSON.stringify(out, null, 2))
  await c.end()
}

main().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
