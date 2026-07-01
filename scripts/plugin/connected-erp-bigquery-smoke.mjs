#!/usr/bin/env node

import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import dotenv from 'dotenv'

import { loadIntegrationCliEnv } from '../../src/products/integracoes/cli/shared/env.mjs'

const root = process.cwd()
const cacheDir = path.join(root, '.next/cache/plugin-cli')
const runnerPath = path.join(cacheDir, `connected-erp-bigquery-smoke-${process.pid}.cjs`)

const CONTA_AZUL_RESOURCES = [
  'clientes',
  'fornecedores',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'venda-detalhes',
  'venda-proximo-numero',
  'itens-venda',
  'notas-fiscais',
  'notas-fiscais-servico',
  'centros-custo',
  'contas-financeiras',
  'saldos-contas-financeiras',
  'transferencias',
  'eventos-financeiros-alteracoes',
  'saldos-iniciais',
  'contrato-proximo-numero',
  'vendedores',
  'categorias',
  'categorias-dre',
  'produtos',
  'produto-categorias',
  'produto-cest',
  'produto-ecommerce-marcas',
  'produto-ncm',
  'produto-unidades-medida',
  'servicos',
  'contratos',
  'empresa-conectada',
]

const AGGREGATE_CHECKS = [
  {
    name: 'vendas_por_mes',
    resource: 'pedidos-venda',
    params: {
      mode: 'aggregate',
      metric: 'sum',
      value_field: 'valor_total',
      granularity: 'month',
      date_from: '2026-05-01',
      date_to: '2026-07-31',
    },
  },
  {
    name: 'receber_por_status',
    resource: 'contas-a-receber',
    params: {
      mode: 'aggregate',
      metric: 'sum',
      value_field: 'valor',
      group_by: 'status',
    },
  },
  {
    name: 'pagar_por_status',
    resource: 'contas-a-pagar',
    params: {
      mode: 'aggregate',
      metric: 'sum',
      value_field: 'valor',
      group_by: 'status',
    },
  },
]

function usage() {
  return [
    'Uso:',
    '  node scripts/plugin/connected-erp-bigquery-smoke.mjs --tenant 3 --provider conta_azul',
    '',
    'Opcoes:',
    '  --tenant <id>             Tenant a testar. Default: 3.',
    '  --provider <slug>         Provider ERP. Default: conta_azul.',
    '  --vercel-env <env>        Carrega .next/cache/plugin-cli/vercel-<env>.env quando existir. Default: preview.',
    '  --vercel-env-file <path>  Carrega um arquivo env especifico.',
    '  --help                   Mostra esta ajuda.',
  ].join('\n')
}

function parseArgs(argv) {
  const values = new Map()
  const flags = new Set()
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (item === '--help') {
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
    import { callPluginDomainTool } from './src/products/plugin/server/domainTools'

    export async function run(input) {
      return callPluginDomainTool('connected_erp_bigquery', input.args, { tenantId: input.tenantId })
    }
  `
  const result = await build({
    stdin: {
      contents: runnerSource,
      loader: 'ts',
      resolveDir: root,
      sourcefile: 'connected-erp-bigquery-smoke-runner.ts',
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

function structured(result) {
  return result?.structuredContent || result || {}
}

async function call(runner, tenantId, provider, resource, params = undefined) {
  const startedAt = Date.now()
  const result = await runner.run({
    tenantId,
    args: {
      provider,
      action: 'listar',
      resource,
      limit: 1,
      ...(params ? { params } : {}),
    },
  })
  const output = structured(result)
  const freshness = Array.isArray(output.freshness) ? output.freshness : []
  const warnings = Array.isArray(output.warnings) ? output.warnings : []
  const errors = Array.isArray(output.errors) ? output.errors : []
  return {
    resource,
    success: output.success === true,
    count: Number(output.count || 0),
    ms: Date.now() - startedAt,
    hasFreshness: freshness.length > 0 && warnings.some((warning) => String(warning).includes('Freshness:')),
    errors,
    warnings,
    freshness,
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
  const provider = parsed.values.get('--provider') || 'conta_azul'
  const resources = provider === 'conta_azul' ? CONTA_AZUL_RESOURCES : []
  if (!resources.length) throw new Error(`Provider sem smoke definido: ${provider}`)

  await buildRunner()
  const require = createRequire(import.meta.url)
  const runner = require(runnerPath)

  const resourceResults = []
  for (const resource of resources) {
    resourceResults.push(await call(runner, tenantId, provider, resource))
  }

  const aggregateResults = []
  for (const check of AGGREGATE_CHECKS) {
    const result = await call(runner, tenantId, provider, check.resource, check.params)
    aggregateResults.push({ name: check.name, ...result })
  }

  const failures = [
    ...resourceResults.filter((item) => !item.success || !item.hasFreshness),
    ...aggregateResults.filter((item) => !item.success || !item.hasFreshness),
  ]

  const summary = {
    tenantId,
    provider,
    resources: {
      total: resourceResults.length,
      ok: resourceResults.filter((item) => item.success).length,
      withRows: resourceResults.filter((item) => item.success && item.count > 0).length,
      emptyOk: resourceResults.filter((item) => item.success && item.count === 0).length,
      withFreshness: resourceResults.filter((item) => item.hasFreshness).length,
    },
    aggregates: {
      total: aggregateResults.length,
      ok: aggregateResults.filter((item) => item.success).length,
      withFreshness: aggregateResults.filter((item) => item.hasFreshness).length,
    },
    failures: failures.map((item) => ({
      name: item.name,
      resource: item.resource,
      success: item.success,
      hasFreshness: item.hasFreshness,
      errors: item.errors,
    })),
  }

  console.log(JSON.stringify({ summary, resourceResults, aggregateResults }, null, 2))
  return failures.length ? 1 : 0
}

try {
  const code = await main()
  process.exit(code)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
