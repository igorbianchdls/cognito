require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

const SQLS = [
  "BEGIN",
  "UPDATE vendas.pedidos SET status = lower(trim(status)) WHERE status IS DISTINCT FROM lower(trim(status))",
  "UPDATE compras.compras SET status = lower(trim(status)) WHERE status IS DISTINCT FROM lower(trim(status))",
  "UPDATE financeiro.contas_pagar SET status = lower(trim(status)) WHERE status IS DISTINCT FROM lower(trim(status))",
  "UPDATE financeiro.contas_receber SET status = lower(trim(status)) WHERE status IS DISTINCT FROM lower(trim(status))",

  "ALTER TABLE vendas.pedidos ALTER COLUMN status SET DEFAULT 'pendente'",
  "ALTER TABLE compras.compras ALTER COLUMN status SET DEFAULT 'rascunho'",
  "ALTER TABLE financeiro.contas_pagar ALTER COLUMN status SET DEFAULT 'pendente'",
  "ALTER TABLE financeiro.contas_receber ALTER COLUMN status SET DEFAULT 'pendente'",

  "ALTER TABLE vendas.pedidos DROP CONSTRAINT IF EXISTS pedidos_status_chk",
  "ALTER TABLE compras.compras DROP CONSTRAINT IF EXISTS compras_status_chk",
  "ALTER TABLE financeiro.contas_pagar DROP CONSTRAINT IF EXISTS contas_pagar_status_chk",
  "ALTER TABLE financeiro.contas_receber DROP CONSTRAINT IF EXISTS contas_receber_status_chk",

  `ALTER TABLE vendas.pedidos ADD CONSTRAINT pedidos_status_chk CHECK (lower(btrim(status)) = ANY (ARRAY['pendente','aprovado','concluido','cancelado']::text[]))`,
  `ALTER TABLE compras.compras ADD CONSTRAINT compras_status_chk CHECK (lower(btrim(status)) = ANY (ARRAY['rascunho','em_analise','aprovado','recebimento_parcial','recebido','cancelado']::text[]))`,
  `ALTER TABLE financeiro.contas_pagar ADD CONSTRAINT contas_pagar_status_chk CHECK (lower(btrim(status)) = ANY (ARRAY['pendente','aberto','em_aberto','em aberto','vencido','pago','baixado','liquidado','cancelado','parcial']::text[]))`,
  `ALTER TABLE financeiro.contas_receber ADD CONSTRAINT contas_receber_status_chk CHECK (lower(btrim(status)) = ANY (ARRAY['pendente','aberto','em_aberto','em aberto','vencido','recebido','pago','baixado','liquidado','cancelado','parcial']::text[]))`,
  "COMMIT",
]

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
    statement_timeout: 30000,
  })
  await c.connect()
  try {
    for (const sql of SQLS) {
      await c.query(sql)
    }

    const verify = await c.query(`
      select n.nspname as table_schema, r.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as definition
      from pg_constraint con
      join pg_class r on r.oid = con.conrelid
      join pg_namespace n on n.oid = r.relnamespace
      where (n.nspname, r.relname) in (('vendas','pedidos'),('compras','compras'),('financeiro','contas_pagar'),('financeiro','contas_receber'))
        and con.conname in ('pedidos_status_chk','compras_status_chk','contas_pagar_status_chk','contas_receber_status_chk')
      order by 1,2,3
    `)

    const defaults = await c.query(`
      select table_schema, table_name, column_default
      from information_schema.columns
      where (table_schema, table_name) in (('vendas','pedidos'),('compras','compras'),('financeiro','contas_pagar'),('financeiro','contas_receber'))
        and column_name='status'
      order by table_schema, table_name
    `)

    console.log(JSON.stringify({ ok: true, constraints: verify.rows, defaults: defaults.rows }, null, 2))
  } catch (e) {
    try { await c.query('ROLLBACK') } catch {}
    console.error('ERR', e.message)
    process.exitCode = 1
  } finally {
    await c.end().catch(() => {})
  }
}

main().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
