const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const { Client } = require('pg')

for (const file of ['.env.local', '.env', '.env.development.local', '.env.development', '.env.production.local', '.env.production']) {
  const envPath = path.join(process.cwd(), file)
  if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false })
}

const TENANT_ID = 1
const MONTHS = [
  { key: '2026-01', month: 1, days: 31, revenue: 450000, costs: 99000, net: 58500 },
  { key: '2026-02', month: 2, days: 28, revenue: 485000, costs: 106700, net: 67900 },
  { key: '2026-03', month: 3, days: 31, revenue: 520000, costs: 114400, net: 78000 },
  { key: '2026-04', month: 4, days: 30, revenue: 505000, costs: 121200, net: 60600 },
  { key: '2026-05', month: 5, days: 31, revenue: 575000, costs: 126500, net: 86250 },
  { key: '2026-06', month: 6, days: 30, revenue: 630000, costs: 138600, net: 100800 },
]

const PAYABLE_COUNTS = {
  custos: 5,
  admin: 6,
  funcionarios: 4,
  comerciais: 5,
  bancarias: 2,
  impostos: 3,
}

const dbUrl = (process.env.SUPABASE_DB_URL || '').trim()
if (!dbUrl) {
  console.error('missing SUPABASE_DB_URL')
  process.exit(1)
}

function createRng(seed = 20260601) {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 4294967296
  }
}

const rng = createRng()

function pad2(value) {
  return String(value).padStart(2, '0')
}

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function pick(list) {
  if (!list.length) throw new Error('cadastro mestre vazio')
  return list[Math.floor(rng() * list.length)]
}

function dateFor(month, index) {
  const day = ((index * 7 + Math.floor(rng() * 6)) % month.days) + 1
  return `2026-${pad2(month.month)}-${pad2(day)}`
}

function addDays(dateIso, days) {
  const date = new Date(`${dateIso}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`
}

function timestampFor(dateIso, hourSeed = 10) {
  const hour = Math.min(18, hourSeed + Math.floor(rng() * 4))
  return `${dateIso}T${pad2(hour)}:${pad2(Math.floor(rng() * 60))}:00-03:00`
}

function weightedSplit(total, count) {
  const weights = Array.from({ length: count }, () => 0.75 + rng() * 0.65)
  const weightTotal = weights.reduce((sum, value) => sum + value, 0)
  const values = weights.map((weight) => round2((total * weight) / weightTotal))
  const diff = round2(total - values.reduce((sum, value) => sum + value, 0))
  values[values.length - 1] = round2(values[values.length - 1] + diff)
  return values
}

function statusFor(month, paidStatus, openStatus) {
  if (month.month <= 4) return paidStatus
  if (month.month === 5) return rng() < 0.55 ? paidStatus : openStatus
  return openStatus
}

async function queryRows(client, sql, params = []) {
  const result = await client.query(sql, params)
  return result.rows
}

function byName(rows, names) {
  const lower = new Set(names.map((name) => name.toLowerCase()))
  return rows.filter((row) => lower.has(String(row.nome || '').toLowerCase()))
}

async function loadMasters(client) {
  const [
    clientes,
    fornecedores,
    categoriasReceita,
    categoriasDespesa,
    centrosLucro,
    centrosCusto,
    departamentos,
    filiais,
    unidades,
    contasFinanceiras,
    planos,
  ] = await Promise.all([
    queryRows(client, `SELECT id, nome_fantasia AS nome FROM entidades.clientes WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome_fantasia AS nome FROM entidades.fornecedores ORDER BY id`),
    queryRows(client, `SELECT id, nome, plano_conta_id FROM financeiro.categorias_receita WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome, plano_conta_id FROM financeiro.categorias_despesa WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome FROM empresa.centros_lucro WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome FROM empresa.centros_custo WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome FROM empresa.departamentos WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome, unidade_negocio_id FROM empresa.filiais WHERE COALESCE(ativo, true) = true ORDER BY id`),
    queryRows(client, `SELECT id, nome FROM empresa.unidades_negocio WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, nome_conta AS nome FROM financeiro.contas_financeiras WHERE tenant_id = $1 AND COALESCE(ativo, true) = true ORDER BY id`, [TENANT_ID]),
    queryRows(client, `SELECT id, codigo, nome FROM contabilidade.plano_contas ORDER BY codigo`),
  ])

  const required = { clientes, fornecedores, categoriasReceita, categoriasDespesa, centrosLucro, centrosCusto, departamentos, filiais, unidades, contasFinanceiras, planos }
  for (const [name, rows] of Object.entries(required)) {
    if (!rows.length) throw new Error(`cadastro mestre vazio: ${name}`)
  }

  const planByCode = Object.fromEntries(planos.map((row) => [row.codigo, row]))
  for (const code of ['1.1.1.02', '2.1.1', '2.1.2', '2.1.3', '4.1.3']) {
    if (!planByCode[code]) throw new Error(`plano de contas ausente: ${code}`)
  }

  return {
    clientes,
    fornecedores,
    categoriasReceita,
    categoriasDespesa,
    centrosLucro,
    centrosCusto,
    departamentos,
    filiais,
    unidades,
    contasFinanceiras,
    planByCode,
    categories: {
      custos: byName(categoriasDespesa, ['Custos Diretos de Projetos/Serviços']),
      admin: byName(categoriasDespesa, [
        'Software e Infraestrutura TI',
        'Despesas Administrativas',
        'Serviços Jurídicos',
        'Serviços Contábeis',
        'Telefonia e Internet',
        'Assinaturas SaaS',
        'Manutenção e Conservação',
      ]),
      funcionarios: byName(categoriasDespesa, ['Folha e Encargos']),
      comerciais: byName(categoriasDespesa, ['Marketing e Publicidade', 'Fretes e Logística']),
      bancarias: byName(categoriasDespesa, ['Tarifas e Serviços Bancários']),
      impostos: byName(categoriasDespesa, ['Impostos e Taxas']),
    },
  }
}

async function nextIds(client) {
  const rows = await queryRows(client, `
    SELECT 'contas_receber' AS name, COALESCE(MAX(id), 0)::bigint AS max_id FROM financeiro.contas_receber
    UNION ALL SELECT 'contas_pagar', COALESCE(MAX(id), 0)::bigint FROM financeiro.contas_pagar
    UNION ALL SELECT 'contas_receber_linhas', COALESCE(MAX(id), 0)::bigint FROM financeiro.contas_receber_linhas
    UNION ALL SELECT 'contas_pagar_linhas', COALESCE(MAX(id), 0)::bigint FROM financeiro.contas_pagar_linhas
    UNION ALL SELECT 'lancamentos_contabeis', COALESCE(MAX(id), 0)::bigint FROM contabilidade.lancamentos_contabeis
    UNION ALL SELECT 'lancamentos_contabeis_linhas', COALESCE(MAX(id), 0)::bigint FROM contabilidade.lancamentos_contabeis_linhas
  `)
  const counters = {}
  for (const row of rows) counters[row.name] = Number(row.max_id)
  return (name) => {
    counters[name] += 1
    return counters[name]
  }
}

async function insertRows(client, table, columns, rows) {
  if (!rows.length) return
  const chunkSize = 200
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize)
    const params = []
    const values = []
    for (let rowIndex = 0; rowIndex < chunk.length; rowIndex += 1) {
      const base = rowIndex * columns.length
      values.push(`(${columns.map((_, columnIndex) => `$${base + columnIndex + 1}`).join(', ')})`)
      for (const column of columns) params.push(chunk[rowIndex][column] ?? null)
    }
    await client.query(`INSERT INTO ${table} (${columns.join(', ')}) VALUES ${values.join(', ')}`, params)
  }
}

async function resetDemoData(client) {
  await client.query(`DELETE FROM financeiro.pagamentos_recebidos_linhas WHERE pagamento_id IN (SELECT id FROM financeiro.pagamentos_recebidos WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.pagamentos_efetuados_linhas WHERE pagamento_id IN (SELECT id FROM financeiro.pagamentos_efetuados WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.liquidacoes WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.pagamentos_recebidos WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.pagamentos_efetuados WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.contas_receber_linhas WHERE conta_receber_id IN (SELECT id FROM financeiro.contas_receber WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.contas_pagar_linhas WHERE conta_pagar_id IN (SELECT id FROM financeiro.contas_pagar WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.contas_receber WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM financeiro.contas_pagar WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`DELETE FROM contabilidade.lancamentos_contabeis_linhas WHERE lancamento_id IN (SELECT id FROM contabilidade.lancamentos_contabeis WHERE tenant_id = $1)`, [TENANT_ID])
  await client.query(`DELETE FROM contabilidade.lancamentos_contabeis WHERE tenant_id = $1`, [TENANT_ID])
}

function payableTotals(month) {
  const opex = round2(month.revenue - month.costs - month.net)
  const admin = round2(month.revenue * 0.16)
  const funcionarios = round2(month.revenue * 0.24)
  const comerciais = round2(month.revenue * 0.14)
  const bancarias = round2(month.revenue * 0.02)
  const impostos = round2(opex - admin - funcionarios - comerciais - bancarias)
  return {
    custos: month.costs,
    admin,
    funcionarios,
    comerciais,
    bancarias,
    impostos,
  }
}

function buildRows(masters, nextId) {
  const contasReceber = []
  const contasReceberLinhas = []
  const contasPagar = []
  const contasPagarLinhas = []
  const lancamentos = []
  const lancamentoLinhas = []

  for (const month of MONTHS) {
    const receitaValores = weightedSplit(month.revenue, 25)
    receitaValores.forEach((value, index) => {
      const date = dateFor(month, index + 1)
      const cliente = pick(masters.clientes)
      const categoria = pick(masters.categoriasReceita)
      const centroLucro = pick(masters.centrosLucro)
      const departamento = pick(masters.departamentos)
      const filial = pick(masters.filiais)
      const contaFinanceira = pick(masters.contasFinanceiras)
      const crId = nextId('contas_receber')
      const lcId = nextId('lancamentos_contabeis')
      const numero = `CR-DRE-${month.key}-${String(index + 1).padStart(3, '0')}`
      const createdAt = timestampFor(date)

      contasReceber.push({
        id: crId,
        tenant_id: TENANT_ID,
        numero_documento: numero,
        serie_documento: 'DRE26',
        tipo_documento: 'nota_fiscal',
        moeda: 'BRL',
        cliente_id: cliente.id,
        nome_cliente_snapshot: cliente.nome,
        data_documento: date,
        data_lancamento: date,
        data_vencimento: addDays(date, 14 + (index % 3) * 10),
        valor_bruto: value,
        valor_desconto: 0,
        valor_impostos: 0,
        valor_liquido: value,
        status: statusFor(month, 'recebido', 'pendente'),
        categoria_financeira_id: null,
        centro_custo_id: null,
        departamento_id: departamento.id,
        projeto_id: null,
        filial_id: filial.id,
        unidade_negocio_id: filial.unidade_negocio_id || pick(masters.unidades).id,
        observacao: 'Receita demo para DRE SaaS Jan-Jun/2026.',
        lancamento_contabil_id: lcId,
        criado_em: createdAt,
        atualizado_em: createdAt,
        criado_por: null,
        centro_lucro_id: centroLucro.id,
        categoria_receita_id: categoria.id,
        pedido_id: null,
      })
      contasReceberLinhas.push({
        id: nextId('contas_receber_linhas'),
        conta_receber_id: crId,
        tipo_linha: 'servico',
        produto_id: null,
        servico_id: null,
        descricao: categoria.nome,
        quantidade: 1,
        valor_unitario: value,
        valor_bruto: value,
        desconto: 0,
        impostos: 0,
        valor_liquido: value,
        categoria_financeira_id: null,
        centro_custo_id: null,
        departamento_id: departamento.id,
        projeto_id: null,
        unidade_negocio_id: filial.unidade_negocio_id || pick(masters.unidades).id,
        criado_em: createdAt,
      })
      lancamentos.push({
        id: lcId,
        data_lancamento: date,
        historico: `Receita de contrato SaaS - ${cliente.nome}`,
        cliente_id: cliente.id,
        fornecedor_id: null,
        criado_em: createdAt,
        atualizado_em: createdAt,
        conta_financeira_id: contaFinanceira.id,
        total_debitos: value,
        total_creditos: value,
        origem: 'conta_a_receber',
        tenant_id: TENANT_ID,
        lancamento_financeiro_id: null,
        origem_modulo: 'financeiro',
        origem_tabela: 'financeiro.contas_receber',
        origem_id: crId,
        origem_numero: numero,
      })
      lancamentoLinhas.push({
        id: nextId('lancamentos_contabeis_linhas'),
        lancamento_id: lcId,
        conta_id: masters.planByCode['1.1.1.02'].id,
        debito: value,
        credito: 0,
        historico: `Recebimento provisionado - ${numero}`,
        criado_em: createdAt,
        lancamento_contabil_id: lcId,
      })
      lancamentoLinhas.push({
        id: nextId('lancamentos_contabeis_linhas'),
        lancamento_id: lcId,
        conta_id: masters.planByCode['4.1.3'].id,
        debito: 0,
        credito: value,
        historico: `Receita reconhecida - ${numero}`,
        criado_em: createdAt,
        lancamento_contabil_id: lcId,
      })
    })

    const totals = payableTotals(month)
    for (const [kind, total] of Object.entries(totals)) {
      const count = PAYABLE_COUNTS[kind]
      const values = weightedSplit(total, count)
      values.forEach((value, index) => {
        const date = dateFor(month, 30 + index + Object.keys(totals).indexOf(kind) * 4)
        const fornecedor = pick(masters.fornecedores)
        const categoria = pick(masters.categories[kind])
        const centroCusto = pick(masters.centrosCusto)
        const departamento = pick(masters.departamentos)
        const filial = pick(masters.filiais)
        const contaFinanceira = pick(masters.contasFinanceiras)
        const cpId = nextId('contas_pagar')
        const lcId = nextId('lancamentos_contabeis')
        const numero = `CP-DRE-${month.key}-${kind}-${String(index + 1).padStart(2, '0')}`
        const createdAt = timestampFor(date)
        const debitAccountId = categoria.plano_conta_id
        const creditAccountId = kind === 'funcionarios'
          ? masters.planByCode['2.1.2'].id
          : kind === 'impostos'
            ? masters.planByCode['2.1.3'].id
            : masters.planByCode['2.1.1'].id

        contasPagar.push({
          id: cpId,
          tenant_id: TENANT_ID,
          numero_documento: numero,
          serie_documento: 'DRE26',
          tipo_documento: 'fatura',
          moeda: 'BRL',
          fornecedor_id: fornecedor.id,
          nome_fornecedor_snapshot: fornecedor.nome,
          data_documento: date,
          data_lancamento: date,
          data_vencimento: addDays(date, 10 + (index % 4) * 7),
          valor_bruto: value,
          valor_desconto: 0,
          valor_impostos: 0,
          valor_liquido: value,
          status: statusFor(month, 'pago', 'pendente'),
          categoria_financeira_id: null,
          centro_custo_id: centroCusto.id,
          departamento_id: departamento.id,
          projeto_id: null,
          filial_id: filial.id,
          unidade_negocio_id: filial.unidade_negocio_id || pick(masters.unidades).id,
          observacao: `Despesa demo ${kind} para DRE SaaS Jan-Jun/2026.`,
          criado_em: createdAt,
          atualizado_em: createdAt,
          criado_por: null,
          categoria_despesa_id: categoria.id,
          lancamento_contabil_id: lcId,
          conta_financeira_id: contaFinanceira.id,
          compra_id: null,
        })
        contasPagarLinhas.push({
          id: nextId('contas_pagar_linhas'),
          conta_pagar_id: cpId,
          tipo_linha: 'despesa',
          produto_id: null,
          servico_id: null,
          descricao: categoria.nome,
          quantidade: 1,
          valor_unitario: value,
          valor_bruto: value,
          desconto: 0,
          impostos: 0,
          valor_liquido: value,
          categoria_financeira_id: null,
          centro_custo_id: centroCusto.id,
          departamento_id: departamento.id,
          projeto_id: null,
          criado_em: createdAt,
          categoria_despesa_id: categoria.id,
          unidade_negocio_id: filial.unidade_negocio_id || pick(masters.unidades).id,
        })
        lancamentos.push({
          id: lcId,
          data_lancamento: date,
          historico: `${categoria.nome} - ${fornecedor.nome}`,
          cliente_id: null,
          fornecedor_id: fornecedor.id,
          criado_em: createdAt,
          atualizado_em: createdAt,
          conta_financeira_id: contaFinanceira.id,
          total_debitos: value,
          total_creditos: value,
          origem: 'conta_a_pagar',
          tenant_id: TENANT_ID,
          lancamento_financeiro_id: null,
          origem_modulo: 'financeiro',
          origem_tabela: 'financeiro.contas_pagar',
          origem_id: cpId,
          origem_numero: numero,
        })
        lancamentoLinhas.push({
          id: nextId('lancamentos_contabeis_linhas'),
          lancamento_id: lcId,
          conta_id: debitAccountId,
          debito: value,
          credito: 0,
          historico: `Reconhecimento de ${categoria.nome} - ${numero}`,
          criado_em: createdAt,
          lancamento_contabil_id: lcId,
        })
        lancamentoLinhas.push({
          id: nextId('lancamentos_contabeis_linhas'),
          lancamento_id: lcId,
          conta_id: creditAccountId,
          debito: 0,
          credito: value,
          historico: `Obrigacao reconhecida - ${numero}`,
          criado_em: createdAt,
          lancamento_contabil_id: lcId,
        })
      })
    }
  }

  return { contasReceber, contasReceberLinhas, contasPagar, contasPagarLinhas, lancamentos, lancamentoLinhas }
}

async function syncSequence(client, table, column = 'id') {
  if (!/^[a-z_]+\.[a-z_]+$/.test(table) || !/^[a-z_]+$/.test(column)) {
    throw new Error(`identificador invalido para sequence: ${table}.${column}`)
  }
  const sequenceRows = await queryRows(client, 'SELECT pg_get_serial_sequence($1, $2) AS sequence_name', [table, column])
  const sequenceName = sequenceRows[0]?.sequence_name
  if (!sequenceName) return
  await client.query(
    `SELECT setval($1::regclass, COALESCE((SELECT MAX(${column}) FROM ${table}), 1), true)`,
    [sequenceName],
  )
}

async function validate(client) {
  const monthly = await queryRows(client, `
WITH base AS (
  SELECT
    date_trunc('month', lc.data_lancamento)::date AS mes,
    COALESCE(pc.codigo, '') AS codigo,
    LOWER(COALESCE(pc.nome, '')) AS nome,
    LOWER(COALESCE(cd.nome, cre.nome, '')) AS categoria_nome,
    COALESCE(ll.credito, 0)::numeric AS credito,
    COALESCE(ll.debito, 0)::numeric AS debito
  FROM contabilidade.lancamentos_contabeis lc
  JOIN contabilidade.lancamentos_contabeis_linhas ll ON ll.lancamento_id = lc.id
  LEFT JOIN contabilidade.plano_contas pc ON pc.id = ll.conta_id
  LEFT JOIN financeiro.contas_pagar cp ON cp.lancamento_contabil_id = lc.id
  LEFT JOIN financeiro.contas_receber cr ON cr.lancamento_contabil_id = lc.id
  LEFT JOIN financeiro.categorias_despesa cd ON cd.id = cp.categoria_despesa_id
  LEFT JOIN financeiro.categorias_receita cre ON cre.id = cr.categoria_receita_id
  WHERE lc.tenant_id = $1
    AND lc.data_lancamento::date BETWEEN '2026-01-01'::date AND '2026-06-30'::date
    AND (pc.codigo LIKE '4.%' OR pc.codigo LIKE '5.%' OR pc.codigo LIKE '6.%')
),
classified AS (
  SELECT
    mes,
    CASE
      WHEN codigo LIKE '4.%' THEN 'receita'
      WHEN codigo LIKE '5.%' THEN 'custos'
      WHEN categoria_nome LIKE '%imposto%' OR nome LIKE '%imposto%' OR nome LIKE '%tribut%' THEN 'impostos'
      WHEN categoria_nome LIKE '%folha%' OR categoria_nome LIKE '%encargo%' OR nome LIKE '%salario%' OR nome LIKE '%salário%' THEN 'funcionarios'
      WHEN codigo LIKE '6.3.%' OR nome LIKE '%banc%' OR nome LIKE '%tarifa%' OR nome LIKE '%juros%' THEN 'bancarias'
      WHEN codigo LIKE '6.2.%' THEN 'comerciais'
      ELSE 'admin'
    END AS grupo,
    CASE WHEN codigo LIKE '4.%' THEN credito - debito ELSE debito - credito END AS valor
  FROM base
)
SELECT
  to_char(mes, 'YYYY-MM') AS mes,
  ROUND(SUM(CASE WHEN grupo = 'receita' THEN valor ELSE 0 END), 2) AS receita,
  ROUND(SUM(CASE WHEN grupo = 'custos' THEN valor ELSE 0 END), 2) AS custos,
  ROUND(SUM(CASE WHEN grupo IN ('admin', 'funcionarios', 'comerciais', 'bancarias', 'impostos') THEN valor ELSE 0 END), 2) AS opex,
  ROUND(SUM(CASE WHEN grupo = 'receita' THEN valor ELSE -valor END), 2) AS resultado,
  ROUND(100 * SUM(CASE WHEN grupo = 'receita' THEN valor ELSE -valor END) / NULLIF(SUM(CASE WHEN grupo = 'receita' THEN valor ELSE 0 END), 0), 2) AS margem_liquida_pct
FROM classified
GROUP BY 1
ORDER BY 1
  `, [TENANT_ID])

  const counts = await queryRows(client, `
SELECT 'contas_receber' AS tabela, COUNT(*)::int AS total FROM financeiro.contas_receber WHERE tenant_id = $1 AND data_lancamento BETWEEN '2026-01-01' AND '2026-06-30'
UNION ALL
SELECT 'contas_pagar', COUNT(*)::int FROM financeiro.contas_pagar WHERE tenant_id = $1 AND data_lancamento BETWEEN '2026-01-01' AND '2026-06-30'
UNION ALL
SELECT 'lancamentos_contabeis', COUNT(*)::int FROM contabilidade.lancamentos_contabeis WHERE tenant_id = $1 AND data_lancamento BETWEEN '2026-01-01' AND '2026-06-30'
  `, [TENANT_ID])

  return { monthly, counts }
}

async function main() {
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    query_timeout: 120000,
    statement_timeout: 120000,
  })

  await client.connect()
  try {
    await client.query('BEGIN')
    const masters = await loadMasters(client)
    for (const [kind, categories] of Object.entries(masters.categories)) {
      if (!categories.length) throw new Error(`categoria ausente para ${kind}`)
    }
    await resetDemoData(client)
    const nextId = await nextIds(client)
    const rows = buildRows(masters, nextId)

    await insertRows(client, 'contabilidade.lancamentos_contabeis', [
      'id', 'data_lancamento', 'historico', 'cliente_id', 'fornecedor_id', 'criado_em', 'atualizado_em',
      'conta_financeira_id', 'total_debitos', 'total_creditos', 'origem', 'tenant_id', 'lancamento_financeiro_id',
      'origem_modulo', 'origem_tabela', 'origem_id', 'origem_numero',
    ], rows.lancamentos)
    await insertRows(client, 'contabilidade.lancamentos_contabeis_linhas', [
      'id', 'lancamento_id', 'conta_id', 'debito', 'credito', 'historico', 'criado_em', 'lancamento_contabil_id',
    ], rows.lancamentoLinhas)
    await insertRows(client, 'financeiro.contas_receber', [
      'id', 'tenant_id', 'numero_documento', 'serie_documento', 'tipo_documento', 'moeda', 'cliente_id',
      'nome_cliente_snapshot', 'data_documento', 'data_lancamento', 'data_vencimento', 'valor_bruto',
      'valor_desconto', 'valor_impostos', 'valor_liquido', 'status', 'categoria_financeira_id', 'centro_custo_id',
      'departamento_id', 'projeto_id', 'filial_id', 'unidade_negocio_id', 'observacao', 'lancamento_contabil_id',
      'criado_em', 'atualizado_em', 'criado_por', 'centro_lucro_id', 'categoria_receita_id', 'pedido_id',
    ], rows.contasReceber)
    await insertRows(client, 'financeiro.contas_receber_linhas', [
      'id', 'conta_receber_id', 'tipo_linha', 'produto_id', 'servico_id', 'descricao', 'quantidade', 'valor_unitario',
      'valor_bruto', 'desconto', 'impostos', 'valor_liquido', 'categoria_financeira_id', 'centro_custo_id',
      'departamento_id', 'projeto_id', 'unidade_negocio_id', 'criado_em',
    ], rows.contasReceberLinhas)
    await insertRows(client, 'financeiro.contas_pagar', [
      'id', 'tenant_id', 'numero_documento', 'serie_documento', 'tipo_documento', 'moeda', 'fornecedor_id',
      'nome_fornecedor_snapshot', 'data_documento', 'data_lancamento', 'data_vencimento', 'valor_bruto',
      'valor_desconto', 'valor_impostos', 'valor_liquido', 'status', 'categoria_financeira_id', 'centro_custo_id',
      'departamento_id', 'projeto_id', 'filial_id', 'unidade_negocio_id', 'observacao', 'criado_em', 'atualizado_em',
      'criado_por', 'categoria_despesa_id', 'lancamento_contabil_id', 'conta_financeira_id', 'compra_id',
    ], rows.contasPagar)
    await insertRows(client, 'financeiro.contas_pagar_linhas', [
      'id', 'conta_pagar_id', 'tipo_linha', 'produto_id', 'servico_id', 'descricao', 'quantidade', 'valor_unitario',
      'valor_bruto', 'desconto', 'impostos', 'valor_liquido', 'categoria_financeira_id', 'centro_custo_id',
      'departamento_id', 'projeto_id', 'criado_em', 'categoria_despesa_id', 'unidade_negocio_id',
    ], rows.contasPagarLinhas)

    for (const table of [
      'contabilidade.lancamentos_contabeis',
      'contabilidade.lancamentos_contabeis_linhas',
      'financeiro.contas_receber',
      'financeiro.contas_receber_linhas',
      'financeiro.contas_pagar',
      'financeiro.contas_pagar_linhas',
    ]) {
      await syncSequence(client, table)
    }

    const validation = await validate(client)
    await client.query('COMMIT')
    console.log(JSON.stringify({
      inserted: {
        contas_receber: rows.contasReceber.length,
        contas_pagar: rows.contasPagar.length,
        lancamentos_contabeis: rows.lancamentos.length,
        lancamentos_contabeis_linhas: rows.lancamentoLinhas.length,
      },
      validation,
    }, null, 2))
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error.message || String(error))
  process.exit(1)
})
