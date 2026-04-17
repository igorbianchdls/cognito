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
const TARGETS = {
  contas_receber: {
    '2026-04': 96,
    '2026-05': 136,
  },
  contas_pagar: {
    '2026-02': 60,
    '2026-03': 60,
    '2026-04': 60,
    '2026-05': 60,
  },
}

function createRng(seed = 20260419) {
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

function pickFromMonth(rng, buckets, month) {
  const list = buckets.get(month) || []
  return pick(rng, list.length ? list : Array.from(buckets.values()).flat())
}

function dateIso(month, day) {
  const [y, m] = month.split('-').map(Number)
  return `${y}-${pad2(m)}-${pad2(day)}`
}

function monthMaxDay(month) {
  if (month === '2026-02') return 28
  if (month === '2026-04') return 30
  return 31
}

function timestampFor(date, rng) {
  return `${date} ${pad2(randomInt(rng, 8, 18))}:${pad2(randomInt(rng, 0, 59))}:${pad2(randomInt(rng, 0, 59))}`
}

function shiftDate(dateIsoValue, rng, minDays, maxDays) {
  const d = new Date(`${dateIsoValue}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + randomInt(rng, minDays, maxDays))
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

function factorForMonth(rng, month, kind) {
  if (kind === 'receber') {
    if (month === '2026-04') return 0.82 + rng() * 0.26
    if (month === '2026-05') return 0.94 + rng() * 0.34
    return 0.9 + rng() * 0.18
  }
  if (month === '2026-04') return 0.8 + rng() * 0.28
  if (month === '2026-05') return 0.95 + rng() * 0.4
  return 0.92 + rng() * 0.2
}

function buildReceberDoc(month, index) {
  const tag = month.slice(5, 7)
  return `CR-2026-${tag}-${String(index).padStart(5, '0')}`
}

function buildPagarDoc(month, index) {
  const tag = month.slice(5, 7)
  return `CP-2026-${tag}-${String(index).padStart(5, '0')}`
}

function cloneContaReceber(source, rng, month, index) {
  const day = randomInt(rng, 1, monthMaxDay(month))
  const date = dateIso(month, day)
  const ts = timestampFor(date, rng)
  const factor = factorForMonth(rng, month, 'receber')
  const bruto = Math.max(10, round2(Number(source.valor_bruto || source.valor_liquido || 0) * factor))
  const desconto = Math.max(0, round2(Number(source.valor_desconto || 0) * (0.7 + rng() * 0.8)))
  const impostos = Math.max(0, round2(Number(source.valor_impostos || 0) * (0.85 + rng() * 0.4)))
  const liquido = Math.max(1, round2(bruto - desconto + impostos))

  return {
    tenant_id: Number(source.tenant_id),
    numero_documento: buildReceberDoc(month, index),
    serie_documento: source.serie_documento,
    tipo_documento: source.tipo_documento,
    moeda: source.moeda,
    cliente_id: source.cliente_id,
    nome_cliente_snapshot: source.nome_cliente_snapshot,
    data_documento: date,
    data_lancamento: date,
    data_vencimento: shiftDate(date, rng, 7, 21),
    valor_bruto: bruto,
    valor_desconto: desconto,
    valor_impostos: impostos,
    valor_liquido: liquido,
    status: source.status,
    categoria_financeira_id: source.categoria_financeira_id,
    centro_custo_id: source.centro_custo_id,
    departamento_id: source.departamento_id,
    projeto_id: source.projeto_id,
    filial_id: source.filial_id,
    unidade_negocio_id: source.unidade_negocio_id,
    observacao: source.observacao,
    lancamento_contabil_id: source.lancamento_contabil_id,
    criado_em: ts,
    atualizado_em: ts,
    criado_por: source.criado_por,
    centro_lucro_id: source.centro_lucro_id,
    categoria_receita_id: source.categoria_receita_id,
  }
}

function cloneContaPagar(source, rng, month, index) {
  const day = randomInt(rng, 1, monthMaxDay(month))
  const date = dateIso(month, day)
  const ts = timestampFor(date, rng)
  const factor = factorForMonth(rng, month, 'pagar')
  const bruto = Math.max(20, round2(Number(source.valor_bruto || source.valor_liquido || 0) * factor))
  const desconto = Math.max(0, round2(Number(source.valor_desconto || 0) * (0.7 + rng() * 0.8)))
  const impostos = Math.max(0, round2(Number(source.valor_impostos || 0) * (0.85 + rng() * 0.4)))
  const liquido = Math.max(1, round2(bruto - desconto + impostos))

  return {
    tenant_id: Number(source.tenant_id),
    numero_documento: buildPagarDoc(month, index),
    serie_documento: source.serie_documento,
    tipo_documento: source.tipo_documento,
    moeda: source.moeda,
    fornecedor_id: source.fornecedor_id,
    nome_fornecedor_snapshot: source.nome_fornecedor_snapshot,
    data_documento: date,
    data_lancamento: date,
    data_vencimento: shiftDate(date, rng, 10, 24),
    valor_bruto: bruto,
    valor_desconto: desconto,
    valor_impostos: impostos,
    valor_liquido: liquido,
    status: source.status,
    categoria_financeira_id: source.categoria_financeira_id,
    centro_custo_id: source.centro_custo_id,
    departamento_id: source.departamento_id,
    projeto_id: source.projeto_id,
    filial_id: source.filial_id,
    unidade_negocio_id: source.unidade_negocio_id,
    observacao: source.observacao,
    criado_em: ts,
    atualizado_em: ts,
    criado_por: source.criado_por,
    categoria_despesa_id: source.categoria_despesa_id,
    lancamento_contabil_id: source.lancamento_contabil_id,
    conta_financeira_id: source.conta_financeira_id,
  }
}

async function insertMany(client, table, columns, rows) {
  if (!rows.length) return
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
      `insert into ${table} (${columns.join(',')}) values ${valuesSql.join(',')}`,
      params,
    )
  }
}

function bucketByMonth(rows) {
  const map = new Map()
  for (const row of rows) {
    const month = String(row.month)
    if (!map.has(month)) map.set(month, [])
    map.get(month).push(row)
  }
  return map
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

    const receberSource = await client.query(`
      select
        to_char(date_trunc('month', data_lancamento), 'YYYY-MM') as month,
        tenant_id,
        serie_documento,
        tipo_documento,
        moeda,
        cliente_id,
        nome_cliente_snapshot,
        valor_bruto,
        valor_desconto,
        valor_impostos,
        valor_liquido,
        status,
        categoria_financeira_id,
        centro_custo_id,
        departamento_id,
        projeto_id,
        filial_id,
        unidade_negocio_id,
        observacao,
        lancamento_contabil_id,
        criado_por,
        centro_lucro_id,
        categoria_receita_id
      from financeiro.contas_receber
      where tenant_id = $1
        and data_lancamento::date between date '2026-02-01' and date '2026-03-31'
      order by data_lancamento, id
    `, [TENANT_ID])

    const pagarSource = await client.query(`
      select
        to_char(date_trunc('month', data_lancamento), 'YYYY-MM') as month,
        tenant_id,
        serie_documento,
        tipo_documento,
        moeda,
        fornecedor_id,
        nome_fornecedor_snapshot,
        valor_bruto,
        valor_desconto,
        valor_impostos,
        valor_liquido,
        status,
        categoria_financeira_id,
        centro_custo_id,
        departamento_id,
        projeto_id,
        filial_id,
        unidade_negocio_id,
        observacao,
        criado_por,
        categoria_despesa_id,
        lancamento_contabil_id,
        conta_financeira_id
      from financeiro.contas_pagar
      where tenant_id = $1
        and data_lancamento::date between date '2026-02-01' and date '2026-03-31'
      order by data_lancamento, id
    `, [TENANT_ID])

    if (receberSource.rowCount < 50) throw new Error('base insuficiente em contas_receber')
    if (pagarSource.rowCount < 10) throw new Error('base insuficiente em contas_pagar')

    const receberCurrent = await client.query(`
      select to_char(date_trunc('month', data_lancamento), 'YYYY-MM') as month, count(*)::int as total
      from financeiro.contas_receber
      where tenant_id = $1
        and data_lancamento::date between date '2026-02-01' and date '2026-05-31'
      group by 1
      order by 1
    `, [TENANT_ID])

    const pagarCurrent = await client.query(`
      select to_char(date_trunc('month', data_lancamento), 'YYYY-MM') as month, count(*)::int as total
      from financeiro.contas_pagar
      where tenant_id = $1
        and data_lancamento::date between date '2026-02-01' and date '2026-05-31'
      group by 1
      order by 1
    `, [TENANT_ID])

    const receberMap = new Map(receberCurrent.rows.map((r) => [r.month, Number(r.total)]))
    const pagarMap = new Map(pagarCurrent.rows.map((r) => [r.month, Number(r.total)]))
    const receberBuckets = bucketByMonth(receberSource.rows)
    const pagarBuckets = bucketByMonth(pagarSource.rows)

    const receberRows = []
    let receberIndex = 1
    for (const month of Object.keys(TARGETS.contas_receber)) {
      const missing = Math.max(0, TARGETS.contas_receber[month] - (receberMap.get(month) || 0))
      for (let i = 0; i < missing; i += 1) {
        receberRows.push(cloneContaReceber(pick(rng, receberSource.rows), rng, month, receberIndex++))
      }
    }

    const pagarRows = []
    let pagarIndex = 1
    for (const month of Object.keys(TARGETS.contas_pagar)) {
      const missing = Math.max(0, TARGETS.contas_pagar[month] - (pagarMap.get(month) || 0))
      for (let i = 0; i < missing; i += 1) {
        pagarRows.push(cloneContaPagar(pickFromMonth(rng, pagarBuckets, month), rng, month, pagarIndex++))
      }
    }

    await insertMany(client, 'financeiro.contas_receber', [
      'tenant_id',
      'numero_documento',
      'serie_documento',
      'tipo_documento',
      'moeda',
      'cliente_id',
      'nome_cliente_snapshot',
      'data_documento',
      'data_lancamento',
      'data_vencimento',
      'valor_bruto',
      'valor_desconto',
      'valor_impostos',
      'valor_liquido',
      'status',
      'categoria_financeira_id',
      'centro_custo_id',
      'departamento_id',
      'projeto_id',
      'filial_id',
      'unidade_negocio_id',
      'observacao',
      'lancamento_contabil_id',
      'criado_em',
      'atualizado_em',
      'criado_por',
      'centro_lucro_id',
      'categoria_receita_id',
    ], receberRows)

    await insertMany(client, 'financeiro.contas_pagar', [
      'tenant_id',
      'numero_documento',
      'serie_documento',
      'tipo_documento',
      'moeda',
      'fornecedor_id',
      'nome_fornecedor_snapshot',
      'data_documento',
      'data_lancamento',
      'data_vencimento',
      'valor_bruto',
      'valor_desconto',
      'valor_impostos',
      'valor_liquido',
      'status',
      'categoria_financeira_id',
      'centro_custo_id',
      'departamento_id',
      'projeto_id',
      'filial_id',
      'unidade_negocio_id',
      'observacao',
      'criado_em',
      'atualizado_em',
      'criado_por',
      'categoria_despesa_id',
      'lancamento_contabil_id',
      'conta_financeira_id',
    ], pagarRows)

    const summaryReceber = await client.query(`
      select
        to_char(date_trunc('month', data_lancamento), 'YYYY-MM') as month,
        count(*)::int as total,
        round(avg(valor_liquido)::numeric, 2) as avg_ticket,
        round(sum(valor_liquido)::numeric, 2) as gross_total
      from financeiro.contas_receber
      where tenant_id = $1
        and data_lancamento::date between date '2026-02-01' and date '2026-05-31'
      group by 1
      order by 1
    `, [TENANT_ID])

    const summaryPagar = await client.query(`
      select
        to_char(date_trunc('month', data_lancamento), 'YYYY-MM') as month,
        count(*)::int as total,
        round(avg(valor_liquido)::numeric, 2) as avg_ticket,
        round(sum(valor_liquido)::numeric, 2) as gross_total
      from financeiro.contas_pagar
      where tenant_id = $1
        and data_lancamento::date between date '2026-02-01' and date '2026-05-31'
      group by 1
      order by 1
    `, [TENANT_ID])

    await client.query('commit')
    console.log(JSON.stringify({
      inserted_contas_receber: receberRows.length,
      inserted_contas_pagar: pagarRows.length,
      contas_receber: summaryReceber.rows,
      contas_pagar: summaryPagar.rows,
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
