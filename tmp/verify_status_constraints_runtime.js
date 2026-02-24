require('dotenv').config({ path: '.env.local' })
const { Client } = require('pg')

const CASES = [
  {
    key: 'vendas.pedidos',
    table: 'vendas.pedidos',
    idSql: "select id from vendas.pedidos order by id desc limit 1",
    validStatus: 'aprovado',
    invalidStatus: 'status_invalido_teste',
  },
  {
    key: 'compras.compras',
    table: 'compras.compras',
    idSql: "select id from compras.compras order by id desc limit 1",
    validStatus: 'em_analise',
    invalidStatus: 'status_invalido_teste',
  },
  {
    key: 'financeiro.contas_pagar',
    table: 'financeiro.contas_pagar',
    idSql: "select id from financeiro.contas_pagar order by id desc limit 1",
    validStatus: 'pago',
    invalidStatus: 'status_invalido_teste',
  },
  {
    key: 'financeiro.contas_receber',
    table: 'financeiro.contas_receber',
    idSql: "select id from financeiro.contas_receber order by id desc limit 1",
    validStatus: 'recebido',
    invalidStatus: 'status_invalido_teste',
  },
]

async function main() {
  const c = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 20000,
    statement_timeout: 20000,
  })
  await c.connect()
  const out = []

  for (const t of CASES) {
    const row = (await c.query(t.idSql)).rows[0]
    if (!row?.id) {
      out.push({ table: t.key, ok: false, error: 'sem registros para testar' })
      continue
    }
    const id = Number(row.id)

    await c.query('BEGIN')
    try {
      // invalid must fail
      let invalidBlocked = false
      let invalidCode = null
      try {
        await c.query(`UPDATE ${t.table} SET status = $1 WHERE id = $2`, [t.invalidStatus, id])
      } catch (e) {
        invalidBlocked = true
        invalidCode = e.code || null
      }

      // transaction is aborted after error in postgres; rollback and retry valid in a new tx
      await c.query('ROLLBACK')
      await c.query('BEGIN')

      let validAccepted = false
      let persistedValue = null
      try {
        await c.query(`UPDATE ${t.table} SET status = $1 WHERE id = $2`, [t.validStatus, id])
        const chk = await c.query(`SELECT status FROM ${t.table} WHERE id = $1`, [id])
        persistedValue = chk.rows[0]?.status ?? null
        validAccepted = true
      } catch (e) {
        validAccepted = false
        persistedValue = `ERR:${e.code || e.message}`
      }

      await c.query('ROLLBACK')

      out.push({
        table: t.key,
        id,
        invalid_status_blocked: invalidBlocked,
        invalid_error_code: invalidCode,
        valid_status_accepted: validAccepted,
        valid_status_tested: t.validStatus,
        db_value_seen_in_tx: persistedValue,
        ok: invalidBlocked && validAccepted,
      })
    } catch (e) {
      try { await c.query('ROLLBACK') } catch {}
      out.push({ table: t.key, id, ok: false, error: e.message })
    }
  }

  console.log(JSON.stringify({ ok: out.every(x => x.ok), results: out }, null, 2))
  await c.end()
}

main().catch((e) => {
  console.error('ERR', e.message)
  process.exit(1)
})
