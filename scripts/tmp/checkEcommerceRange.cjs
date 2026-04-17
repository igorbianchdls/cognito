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

async function run() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  const pedidos = await client.query(`
    select
      to_char(date_trunc('month', p.data_pedido), 'YYYY-MM') as month,
      count(*)::int as total,
      round(sum(p.valor_total)::numeric, 2) as gross_total
    from ecommerce.pedidos p
    where p.data_pedido::date between date '2026-02-01' and date '2026-05-31'
    group by 1
    order by 1
  `)

  console.log(JSON.stringify({
    pedidos: pedidos.rows,
  }, null, 2))

  await client.end()
}

run().catch((err) => {
  console.error(err.stack || err.message || String(err))
  process.exit(1)
})
