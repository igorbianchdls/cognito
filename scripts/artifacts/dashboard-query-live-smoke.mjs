#!/usr/bin/env node

import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import dotenv from 'dotenv'

import { loadIntegrationCliEnv } from '../../src/products/integracoes/cli/shared/env.mjs'

const root = process.cwd()
const cacheDir = path.join(root, '.next/cache/artifacts')
const runnerPath = path.join(cacheDir, `dashboard-query-live-smoke-${process.pid}.cjs`)

const SMOKE_DASHBOARD_SOURCE = `
<Dashboard id="dashboard-query-live-smoke" title="Dashboard Query Live Smoke">
  <KPI
    id="kpi-smoke"
    label="Smoke"
    dataQuery={{ query: "SELECT COUNT(*) AS value FROM vendas", limit: 1 }}
  />
</Dashboard>
`.trim()

const POSITIVE_QUERIES = [
  {
    name: 'kpi_vendas_total',
    query: 'SELECT COALESCE(SUM(valor_total), 0) AS value FROM vendas',
    limit: 1,
    expectColumns: ['value'],
  },
  {
    name: 'serie_vendas_mes',
    query: `
SELECT
  FORMAT_DATE('%Y-%m', DATE(data_pedido)) AS label,
  COALESCE(SUM(valor_total), 0) AS value
FROM vendas
GROUP BY 1
ORDER BY 1
    `.trim(),
    limit: 12,
    expectColumns: ['label', 'value'],
  },
  {
    name: 'receber_por_status',
    query: `
SELECT
  status AS label,
  COALESCE(SUM(valor), 0) AS value
FROM contas_receber
GROUP BY 1
ORDER BY 1
    `.trim(),
    limit: 10,
    expectColumns: ['label', 'value'],
  },
  {
    name: 'pagar_por_status',
    query: `
SELECT
  status AS label,
  COALESCE(SUM(valor), 0) AS value
FROM contas_pagar
GROUP BY 1
ORDER BY 1
    `.trim(),
    limit: 10,
    expectColumns: ['label', 'value'],
  },
  {
    name: 'top_clientes',
    query: `
SELECT
  nome,
  email,
  status
FROM clientes
ORDER BY normalized_at DESC
    `.trim(),
    limit: 5,
    expectColumns: ['nome', 'email', 'status'],
  },
  {
    name: 'join_vendas_clientes',
    query: `
SELECT
  COALESCE(c.nome, 'Sem cliente') AS cliente,
  COALESCE(SUM(v.valor_total), 0) AS value
FROM vendas v
LEFT JOIN clientes c
  ON CAST(v.cliente_id AS STRING) = CAST(c.external_id AS STRING)
GROUP BY 1
ORDER BY value DESC
    `.trim(),
    limit: 10,
    expectColumns: ['cliente', 'value'],
  },
  {
    name: 'cte_ticket_medio',
    query: `
WITH base AS (
  SELECT valor_total
  FROM vendas
  WHERE valor_total IS NOT NULL
)
SELECT
  COALESCE(AVG(valor_total), 0) AS value,
  COUNT(*) AS pedidos
FROM base
    `.trim(),
    limit: 1,
    expectColumns: ['value', 'pedidos'],
  },
  {
    name: 'date_filter_placeholder',
    query: `
SELECT
  COALESCE(SUM(valor_total), 0) AS value
FROM vendas
WHERE 1 = 1 {{filters}}
    `.trim(),
    filters: {
      de: '2026-05-01',
      ate: '2026-07-31',
      __date: {
        table: 'vendas',
        field: 'data_pedido',
      },
    },
    limit: 1,
    expectColumns: ['value'],
  },
  {
    name: 'array_filter_placeholder',
    query: `
SELECT
  status AS label,
  COALESCE(SUM(valor), 0) AS value
FROM contas_receber
WHERE 1 = 1 {{filters}}
GROUP BY 1
ORDER BY 1
    `.trim(),
    filters: {
      status: ['pending', 'overdue'],
      __fields: {
        status: {
          table: 'contas_receber',
          field: 'status',
        },
      },
    },
    limit: 10,
    expectColumns: ['label', 'value'],
  },
  {
    name: 'history_table',
    query: 'SELECT COUNT(*) AS value FROM vendas_history',
    limit: 1,
    expectColumns: ['value'],
  },
  {
    name: 'empty_table_ok',
    query: 'SELECT COUNT(*) AS value FROM notas_fiscais',
    limit: 1,
    expectColumns: ['value'],
  },
]

const NEGATIVE_QUERIES = [
  {
    name: 'reject_delete',
    query: 'DELETE FROM vendas WHERE TRUE',
    code: 'dashboard_query_read_only',
  },
  {
    name: 'reject_multiple_statements',
    query: 'SELECT 1 AS value; SELECT 2 AS value',
    code: 'dashboard_query_multiple_statements',
  },
  {
    name: 'reject_qualified_table',
    query: 'SELECT COUNT(*) AS value FROM `creatto-463117.org_3_normalized.vendas`',
    code: 'dashboard_query_qualified_table',
  },
  {
    name: 'reject_information_schema',
    query: 'SELECT COUNT(*) AS value FROM INFORMATION_SCHEMA.TABLES',
    code: 'dashboard_query_external_source',
  },
  {
    name: 'reject_unknown_placeholder',
    query: 'SELECT COUNT(*) AS value FROM vendas WHERE 1 = 1 {{tenant}}',
    code: 'dashboard_query_placeholder_not_supported',
  },
  {
    name: 'reject_unknown_table',
    query: 'SELECT COUNT(*) AS value FROM tabela_inexistente',
    code: 'dashboard_query_table_not_allowed',
  },
]

function usage() {
  return [
    'Uso:',
    '  node scripts/artifacts/dashboard-query-live-smoke.mjs --tenant 3 --vercel-env preview',
    '',
    'Opcoes:',
    '  --tenant <id>             Tenant a testar. Default: 3.',
    '  --artifact-id <uuid>      Dashboard existente. Se omitido, cria um artifact temporario e remove ao final.',
    '  --vercel-env <env>        Carrega .next/cache/plugin-cli/vercel-<env>.env quando existir. Default: preview.',
    '  --vercel-env-file <path>  Carrega um arquivo env especifico.',
    '  --keep-artifact          Mantem o artifact temporario criado pelo smoke.',
    '  --help                   Mostra esta ajuda.',
  ].join('\n')
}

function parseArgs(argv) {
  const values = new Map()
  const flags = new Set()
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (item === '--help' || item === '--keep-artifact') {
      flags.add(item)
      continue
    }
    if (!item.startsWith('--')) throw new Error(`Argumento invalido: ${item}`)
    const value = argv[index + 1]
    if (!value || value.startsWith('--')) throw new Error(`Valor ausente para ${item}`)
    values.set(item, value)
    index += 1
  }
  return { values, flags }
}

function loadEnvFile(filePath) {
  const resolved = path.isAbsolute(filePath) ? filePath : path.join(root, filePath)
  if (!existsSync(resolved)) return false
  const parsed = dotenv.parse(readFileSync(resolved, 'utf8'))
  for (const [key, value] of Object.entries(parsed)) process.env[key] ||= value
  return true
}

function hasBigQueryCredentials() {
  return Boolean(
    process.env.BIGQUERY_CREDENTIALS_JSON?.trim()
      || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim()
      || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  )
}

function aliasPlugin() {
  return {
    name: 'cognito-root-alias',
    setup(buildContext) {
      buildContext.onResolve({ filter: /^@\// }, (args) => {
        const basePath = path.join(root, 'src', args.path.slice(2))
        const candidates = [
          basePath,
          `${basePath}.tsx`,
          `${basePath}.ts`,
          `${basePath}.jsx`,
          `${basePath}.js`,
          path.join(basePath, 'index.tsx'),
          path.join(basePath, 'index.ts'),
        ]
        return { path: candidates.find((candidate) => existsSync(candidate)) || basePath }
      })
    },
  }
}

async function buildRunner() {
  const runnerSource = `
    import { runQuery } from './src/lib/postgres'
    import { writeDashboardArtifact } from './src/products/artifacts/dashboard/persistence/dashboardArtifactsService'
    import { preflightDashboardQueries } from './src/products/artifacts/dashboard/query/dashboardQueryPreflight'
    import { executeDashboardQuery } from './src/products/artifacts/dashboard/query/dashboardQueryService'

    export async function createArtifact(input) {
      const artifact = await writeDashboardArtifact({
        tenantId: input.tenantId,
        title: input.title,
        source: input.source,
        slug: input.slug,
        metadata: input.metadata,
        changeSummary: input.changeSummary,
      })
      return artifact.artifact_id || artifact.id
    }

    export async function deleteArtifact(input) {
      await runQuery(
        'DELETE FROM artifacts.artifacts WHERE id = $1::uuid AND tenant_id = $2::bigint',
        [input.artifactId, input.tenantId],
      )
    }

    export async function executeQuery(input) {
      return executeDashboardQuery(input)
    }

    export async function preflightQueries(input) {
      return preflightDashboardQueries(input)
    }
  `
  const result = await build({
    stdin: {
      contents: runnerSource,
      loader: 'ts',
      resolveDir: root,
      sourcefile: 'dashboard-query-live-smoke-runner.ts',
    },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: ['node22'],
    packages: 'external',
    write: false,
    logLevel: 'silent',
    plugins: [aliasPlugin()],
  })
  const output = result.outputFiles?.[0]?.text
  if (!output) throw new Error('esbuild nao retornou runner.')
  await mkdir(cacheDir, { recursive: true })
  await writeFile(runnerPath, output)
}

function assertColumns(actual, expected) {
  const missing = expected.filter((column) => !actual.includes(column))
  if (missing.length) throw new Error(`colunas ausentes: ${missing.join(', ')}`)
}

async function runPositive(runner, input) {
  const startedAt = Date.now()
  try {
    const result = await runner.executeQuery(input)
    assertColumns(result.columns || [], input.expectColumns || [])
    if (!result.metadata || typeof result.metadata.bytesProcessed !== 'number') {
      throw new Error('metadata.bytesProcessed ausente')
    }
    return {
      name: input.name,
      ok: true,
      count: result.count,
      columns: result.columns,
      bytesProcessed: result.metadata.bytesProcessed,
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    return {
      name: input.name,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      code: error?.code || null,
      durationMs: Date.now() - startedAt,
    }
  }
}

async function runNegative(runner, input) {
  const startedAt = Date.now()
  try {
    await runner.executeQuery(input)
    return {
      name: input.name,
      ok: false,
      expectedCode: input.expectedCode,
      error: 'query deveria falhar, mas passou',
      durationMs: Date.now() - startedAt,
    }
  } catch (error) {
    const code = error?.code || error?.details?.code || null
    const message = error instanceof Error ? error.message : String(error)
    return {
      name: input.name,
      ok: code === input.expectedCode,
      expectedCode: input.expectedCode,
      code,
      error: message,
      durationMs: Date.now() - startedAt,
    }
  }
}

async function main(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv)
  if (parsed.flags.has('--help')) {
    console.log(usage())
    return 0
  }

  loadIntegrationCliEnv(root)
  const vercelEnvFile = parsed.values.get('--vercel-env-file')
  if (vercelEnvFile) {
    loadEnvFile(vercelEnvFile)
  } else {
    const vercelEnv = parsed.values.get('--vercel-env') || 'preview'
    loadEnvFile(path.join('.next/cache/plugin-cli', `vercel-${vercelEnv}.env`))
  }
  if (!hasBigQueryCredentials()) {
    throw new Error('Credenciais BigQuery ausentes. Defina BIGQUERY_CREDENTIALS_JSON/GOOGLE_APPLICATION_CREDENTIALS_JSON ou use --vercel-env-file.')
  }

  const tenantId = Number(parsed.values.get('--tenant') || 3)
  if (!Number.isInteger(tenantId) || tenantId <= 0) throw new Error('--tenant deve ser inteiro positivo.')

  await buildRunner()
  const require = createRequire(import.meta.url)
  const runner = require(runnerPath)

  let artifactId = parsed.values.get('--artifact-id') || ''
  let createdArtifact = false
  if (!artifactId) {
    artifactId = await runner.createArtifact({
      tenantId,
      title: 'Dashboard Query Live Smoke',
      source: SMOKE_DASHBOARD_SOURCE,
      slug: `dashboard-query-live-smoke-${Date.now()}`,
      metadata: { created_by: 'dashboard_query_live_smoke' },
      changeSummary: 'Artifact temporario para smoke de query do dashboard',
    })
    createdArtifact = true
  }

  const positiveResults = []
  const negativeResults = []
  try {
    const queryPreflight = await runner.preflightQueries({
      artifactId,
      tenantId,
      source: SMOKE_DASHBOARD_SOURCE,
    })
    if (!queryPreflight.ok || queryPreflight.total !== 1 || queryPreflight.success !== 1) {
      throw new Error(`query_preflight falhou: ${JSON.stringify(queryPreflight)}`)
    }

    for (const check of POSITIVE_QUERIES) {
      positiveResults.push(await runPositive(runner, {
        ...check,
        artifactId,
        tenantId,
        filters: check.filters || {},
      }))
    }
    for (const check of NEGATIVE_QUERIES) {
      negativeResults.push(await runNegative(runner, {
        name: check.name,
        artifactId,
        tenantId,
        query: check.query,
        filters: {},
        limit: 1,
        expectedCode: check.code,
      }))
    }
  } finally {
    if (createdArtifact && !parsed.flags.has('--keep-artifact')) {
      await runner.deleteArtifact({ artifactId, tenantId }).catch(() => undefined)
    }
  }

  const failures = [
    ...positiveResults.filter((result) => !result.ok),
    ...negativeResults.filter((result) => !result.ok),
  ]
  const summary = {
    tenantId,
    artifactId,
    createdArtifact,
    queryPreflight: {
      total: 1,
      ok: true,
    },
    positive: {
      total: positiveResults.length,
      ok: positiveResults.filter((result) => result.ok).length,
    },
    negative: {
      total: negativeResults.length,
      ok: negativeResults.filter((result) => result.ok).length,
    },
    failures,
  }

  console.log(JSON.stringify({ summary, positiveResults, negativeResults }, null, 2))
  return failures.length ? 1 : 0
}

try {
  const code = await main()
  process.exit(code)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
