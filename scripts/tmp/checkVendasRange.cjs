const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { Client } = require('pg')

for (const f of [
  '.env.local',
  '.env',
  '.env.development.local',
  '.env.development',
  '.env.production.local',
  '.env.production',
]) {
  const p = path.join(process.cwd(), f)
  if (fs.existsSync(p)) dotenv.config({ path: p, override: false })
}

const dbUrl = (process.env.SUPABASE_DB_URL || '').trim()
if (!dbUrl) {
  console.error('missing SUPABASE_DB_URL')
  process.exit(1)
}

async function main() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  const range = await client.query(`
    select
      min(data_pedido::date) as min_date,
      max(data_pedido::date) as max_date,
      count(*)::int as total
    from vendas.pedidos
  `)

  const months = await client.query(`
    select
      to_char(date_trunc('month', data_pedido), 'YYYY-MM') as month,
      count(*)::int as total
    from vendas.pedidos
    where extract(year from data_pedido) = extract(year from current_date)
    group by 1
    order by 1
  `)

  console.log(JSON.stringify({ range: range.rows[0], months_current_year: months.rows }, null, 2))
  await client.end()
}

main().catch((err) => {
  console.error(err.stack || err.message || String(err))
  process.exit(1)
})
