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

const TENANT_ID = 1
const APRIL_COUNT = 18
const MAY_COUNT = 27

function createRng(seed = 20260418) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)]
}

function toMonthDate(year, month, day) {
  return `${year}-${pad2(month)}-${pad2(day)}`
}

function toTimestamp(dateIso, hour, minute, second) {
  return `${dateIso} ${pad2(hour)}:${pad2(minute)}:${pad2(second)}`
}

function shiftDate(dateIso, rng, minDays, maxDays) {
  const d = new Date(`${dateIso}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + randomInt(rng, minDays, maxDays))
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

function varyTotal(row, rng, month) {
  const current = Number(row.valor_total || 0)
  const factor =
    month === 4
      ? 0.78 + rng() * 0.30
      : 0.95 + rng() * 0.45
  return Math.max(50, round2(current * factor))
}

function buildNumeroOc(month, index) {
  const prefix = month === 4 ? 'APR' : 'MAY'
  return `OC-2026-${prefix}-${String(index).padStart(4, '0')}`
}

function buildCloneFromSource(source, rng, month, index) {
  const maxDay = month === 4 ? 30 : 31
  const dateIso = toMonthDate(2026, month, randomInt(rng, 1, maxDay))
  const hour = randomInt(rng, 8, 18)
  const minute = randomInt(rng, 0, 59)
  const second = randomInt(rng, 0, 59)
  const ts = toTimestamp(dateIso, hour, minute, second)
  const total = varyTotal(source, rng, month)

  return {
    tenant_id: Number(source.tenant_id),
    fornecedor_id: source.fornecedor_id,
    filial_id: source.filial_id,
    centro_custo_id: source.centro_custo_id,
    projeto_id: source.projeto_id,
    categoria_financeira_id: source.categoria_financeira_id,
    numero_oc: buildNumeroOc(month, index),
    data_pedido: dateIso,
    data_entrega_prevista: shiftDate(dateIso, rng, 2, 12),
    status: source.status,
    valor_total: total,
    observacoes: source.observacoes,
    criado_por: source.criado_por,
    criado_em: ts,
    atualizado_em: ts,
    categoria_despesa_id: source.categoria_despesa_id,
    data_documento: dateIso,
    data_lancamento: dateIso,
    data_vencimento: shiftDate(dateIso, rng, 10, 24),
    departamento_id: source.departamento_id,
  }
}

async function insertMany(client, rows) {
  if (!rows.length) return

  const columns = [
    'tenant_id',
    'fornecedor_id',
    'filial_id',
    'centro_custo_id',
    'projeto_id',
    'categoria_financeira_id',
    'numero_oc',
    'data_pedido',
    'data_entrega_prevista',
    'status',
    'valor_total',
    'observacoes',
    'criado_por',
    'criado_em',
    'atualizado_em',
    'categoria_despesa_id',
    'data_documento',
    'data_lancamento',
    'data_vencimento',
    'departamento_id',
  ]

  const chunkSize = 200
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const valuesSql = []
    const params = []

    for (let r = 0; r < chunk.length; r += 1) {
      const base = r * columns.length
      valuesSql.push(`(${columns.map((_, c) => `$${base + c + 1}`).join(',')})`)
      for (const col of columns) params.push(chunk[r][col] ?? null)
    }

    await client.query(
      `insert into compras.compras (${columns.join(',')}) values ${valuesSql.join(',')}`,
      params,
    )
  }
}

async function main() {
  const rng = createRng()
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  try {
    await client.query('begin')

    const source = await client.query(
      `
        select
          tenant_id,
          fornecedor_id,
          filial_id,
          centro_custo_id,
          projeto_id,
          categoria_financeira_id,
          status,
          valor_total,
          observacoes,
          criado_por,
          categoria_despesa_id,
          departamento_id
        from compras.compras
        where tenant_id = $1
          and data_pedido::date between date '2026-02-01' and date '2026-03-31'
        order by data_pedido, id
      `,
      [TENANT_ID],
    )

    if (source.rowCount < 10) {
      throw new Error('base insuficiente de fevereiro/marco para clonar compras')
    }

    const existing = await client.query(
      `
        select
          to_char(date_trunc('month', data_pedido), 'YYYY-MM') as month,
          count(*)::int as total
        from compras.compras
        where tenant_id = $1
          and data_pedido::date between date '2026-04-01' and date '2026-05-31'
        group by 1
        order by 1
      `,
      [TENANT_ID],
    )

    const existingMap = new Map(existing.rows.map((r) => [r.month, Number(r.total)]))
    const aprilMissing = Math.max(0, APRIL_COUNT - (existingMap.get('2026-04') || 0))
    const mayMissing = Math.max(0, MAY_COUNT - (existingMap.get('2026-05') || 0))

    const rows = []
    for (let i = 0; i < aprilMissing; i += 1) rows.push(buildCloneFromSource(pick(rng, source.rows), rng, 4, i + 1))
    for (let i = 0; i < mayMissing; i += 1) rows.push(buildCloneFromSource(pick(rng, source.rows), rng, 5, i + 1))

    await insertMany(client, rows)

    const summary = await client.query(
      `
        select
          to_char(date_trunc('month', data_pedido), 'YYYY-MM') as month,
          count(*)::int as total,
          round(avg(valor_total)::numeric, 2) as avg_ticket,
          round(sum(valor_total)::numeric, 2) as gross_total
        from compras.compras
        where tenant_id = $1
          and data_pedido::date between date '2026-02-01' and date '2026-05-31'
        group by 1
        order by 1
      `,
      [TENANT_ID],
    )

    await client.query('commit')
    console.log(JSON.stringify({
      inserted: rows.length,
      april_inserted: aprilMissing,
      may_inserted: mayMissing,
      summary: summary.rows,
    }, null, 2))
  } catch (err) {
    await client.query('rollback')
    throw err
  } finally {
    await client.end()
  }
}

main().catch((err) => {
  console.error(err.stack || err.message || String(err))
  process.exit(1)
})
