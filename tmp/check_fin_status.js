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
  const out = {}
  out.tables = (
    await c.query(
      "select table_schema, table_name from information_schema.tables where table_schema='financeiro' and table_name in ('contas_pagar','contas_receber','lancamentos_financeiros') order by table_name"
    )
  ).rows

  for (const t of ['contas_pagar', 'contas_receber']) {
    try {
      out[t] = (
        await c.query(
          `select lower(trim(coalesce(status,''))) as status, count(*)::int as count from financeiro.${t} group by 1 order by count desc, status asc`
        )
      ).rows
    } catch (e) {
      out[t] = { error: e.message }
    }
  }

  console.log(JSON.stringify(out, null, 2))
  await c.end()
}

main().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
