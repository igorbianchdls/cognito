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
const APRIL_COUNT = 96
const MAY_COUNT = 136

function createRng(seed = 20260417) {
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

function shiftDueDate(dateIso, rng) {
  const day = Number(String(dateIso).slice(8, 10))
  const plus = randomInt(rng, 7, 21)
  const d = new Date(`${dateIso}T12:00:00Z`)
  d.setUTCDate(day + plus)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

function varyTotals(row, rng, month) {
  const subtotal = Number(row.subtotal || 0)
  const desconto = Number(row.desconto_total || 0)
  const factor =
    month === 4
      ? 0.82 + rng() * 0.26
      : 0.93 + rng() * 0.34

  const nextSubtotal = Math.max(10, round2(subtotal * factor))
  const discountRatio = subtotal > 0 ? desconto / subtotal : 0
  const nextDiscount = Math.min(nextSubtotal * 0.12, round2(nextSubtotal * discountRatio * (0.75 + rng() * 0.7)))
  const nextTotal = Math.max(1, round2(nextSubtotal - nextDiscount))

  return {
    subtotal: nextSubtotal,
    desconto_total: nextDiscount,
    valor_total: nextTotal,
  }
}

function buildCloneFromSource(source, rng, month) {
  const maxDay = month === 4 ? 30 : 31
  const dateIso = toMonthDate(2026, month, randomInt(rng, 1, maxDay))
  const hour = randomInt(rng, 8, 18)
  const minute = randomInt(rng, 0, 59)
  const second = randomInt(rng, 0, 59)
  const ts = toTimestamp(dateIso, hour, minute, second)
  const values = varyTotals(source, rng, month)

  return {
    tenant_id: Number(source.tenant_id),
    cliente_id: source.cliente_id,
    vendedor_id: source.vendedor_id,
    territorio_id: source.territorio_id,
    canal_venda_id: source.canal_venda_id,
    data_pedido: ts,
    status: source.status,
    subtotal: values.subtotal,
    desconto_total: values.desconto_total,
    valor_total: values.valor_total,
    criado_em: ts,
    atualizado_em: ts,
    cupom_id: source.cupom_id,
    centro_lucro_id: source.centro_lucro_id,
    campanha_venda_id: source.campanha_venda_id,
    filial_id: source.filial_id,
    unidade_negocio_id: source.unidade_negocio_id,
    sales_office_id: source.sales_office_id,
    observacoes: source.observacoes,
    descricao: source.descricao,
    categoria_receita_id: source.categoria_receita_id,
    data_documento: dateIso,
    data_lancamento: dateIso,
    data_vencimento: shiftDueDate(dateIso, rng),
    departamento_id: source.departamento_id,
  }
}

async function insertMany(client, rows) {
  if (!rows.length) return

  const columns = [
    'tenant_id',
    'cliente_id',
    'vendedor_id',
    'territorio_id',
    'canal_venda_id',
    'data_pedido',
    'status',
    'subtotal',
    'desconto_total',
    'valor_total',
    'criado_em',
    'atualizado_em',
    'cupom_id',
    'centro_lucro_id',
    'campanha_venda_id',
    'filial_id',
    'unidade_negocio_id',
    'sales_office_id',
    'observacoes',
    'descricao',
    'categoria_receita_id',
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
      `insert into vendas.pedidos (${columns.join(',')}) values ${valuesSql.join(',')}`,
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
          cliente_id,
          vendedor_id,
          territorio_id,
          canal_venda_id,
          status,
          subtotal,
          desconto_total,
          valor_total,
          cupom_id,
          centro_lucro_id,
          campanha_venda_id,
          filial_id,
          unidade_negocio_id,
          sales_office_id,
          observacoes,
          descricao,
          categoria_receita_id,
          departamento_id
        from vendas.pedidos
        where tenant_id = $1
          and data_pedido::date between date '2026-02-01' and date '2026-03-31'
        order by data_pedido, id
      `,
      [TENANT_ID],
    )

    if (source.rowCount < 50) {
      throw new Error('base insuficiente de fevereiro/marco para clonar vendas')
    }

    const existing = await client.query(
      `
        select
          to_char(date_trunc('month', data_pedido), 'YYYY-MM') as month,
          count(*)::int as total
        from vendas.pedidos
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
    for (let i = 0; i < aprilMissing; i += 1) rows.push(buildCloneFromSource(pick(rng, source.rows), rng, 4))
    for (let i = 0; i < mayMissing; i += 1) rows.push(buildCloneFromSource(pick(rng, source.rows), rng, 5))

    await insertMany(client, rows)

    const summary = await client.query(
      `
        select
          to_char(date_trunc('month', data_pedido), 'YYYY-MM') as month,
          count(*)::int as total,
          round(avg(valor_total)::numeric, 2) as avg_ticket,
          round(sum(valor_total)::numeric, 2) as gross_sales
        from vendas.pedidos
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
