#!/usr/bin/env node

import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import dotenv from 'dotenv'


const root = process.cwd()
const cacheDir = path.join(root, '.next/cache/plugin-cli')
const runnerPath = path.join(cacheDir, `tool-call-runner-${process.pid}.cjs`)
const booleanFlags = new Set([
  '--allow-error',
  '--confirm',
  '--execute',
  '--help',
])

function usage() {
  return [
    'Uso: node scripts/plugin/tool-call.mjs --tenant <id> --tool <nome> --args <json>',
    'Ferramentas locais: erp, erp_acoes, crm, ecommerce, marketing, sql, sql_execution, financial_statement.',
    'Credenciais: ambiente atual, .env.local ou .env; nenhum carregamento remoto.',
    'Opcoes: --action, --resource, --id, --limit, --params-json, --filters-json, --payload-json, --idempotency-key.',
    'Escritas erp_acoes usam dry_run por padrao; --execute --confirm permite executar.',
    '--allow-error aceita resposta de erro; --help mostra esta ajuda.',
  ].join('\n')
}

function readValue(argv, index, name) {
  const value = argv[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`Valor ausente para ${name}.`)
  }
  return value
}

function parseArgs(argv) {
  const parsed = {
    flags: new Set(),
    values: new Map(),
  }

  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index]
    if (!item.startsWith('--')) {
      throw new Error(`Argumento invalido: ${item}`)
    }

    const equalsIndex = item.indexOf('=')
    if (equalsIndex > -1) {
      const name = item.slice(0, equalsIndex)
      const value = item.slice(equalsIndex + 1)
      if (booleanFlags.has(name)) {
        if (value && value !== 'true') throw new Error(`${name} nao aceita valor.`)
        parsed.flags.add(name)
      } else {
        if (!value) throw new Error(`Valor ausente para ${name}.`)
        parsed.values.set(name, value)
      }
      continue
    }

    if (booleanFlags.has(item)) {
      parsed.flags.add(item)
      continue
    }

    parsed.values.set(item, readValue(argv, index, item))
    index += 1
  }

  return parsed
}

function requiredValue(args, name) {
  const value = args.values.get(name)
  if (!value) throw new Error(`${name} e obrigatorio.`)
  return value
}

function optionalJson(args, name) {
  const value = args.values.get(name)
  if (!value) return undefined
  try {
    return JSON.parse(value)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`${name} deve ser JSON valido: ${message}`)
  }
}

function optionalPositiveInt(args, name) {
  const value = args.values.get(name)
  if (value == null || value === '') return undefined
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} deve ser um inteiro positivo.`)
  }
  return parsed
}

function parseEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  return dotenv.parse(readFileSync(filePath, 'utf8'))
}

function loadEnvFileIfExists(filePath) {
  const values = parseEnvFile(filePath)
  for (const [key, value] of Object.entries(values)) {
    process.env[key] ||= value
  }
  return Object.keys(values).length
}

function requiredPositiveInt(args, name) {
  const parsed = optionalPositiveInt(args, name)
  if (!parsed) throw new Error(`${name} deve ser um inteiro positivo.`)
  return parsed
}

function assignIfPresent(target, key, value) {
  if (value !== undefined && value !== null && value !== '') target[key] = value
}

function buildToolArgs(parsed) {
  const baseArgs = optionalJson(parsed, '--args') ?? optionalJson(parsed, '--args-json') ?? {}
  if (!baseArgs || typeof baseArgs !== 'object' || Array.isArray(baseArgs)) {
    throw new Error('--args/--args-json deve ser um objeto JSON.')
  }

  const toolArgs = { ...baseArgs }
  assignIfPresent(toolArgs, 'action', parsed.values.get('--action'))
  assignIfPresent(toolArgs, 'resource', parsed.values.get('--resource'))
  assignIfPresent(toolArgs, 'id', parsed.values.get('--id'))
  assignIfPresent(toolArgs, 'limit', optionalPositiveInt(parsed, '--limit'))
  assignIfPresent(toolArgs, 'params', optionalJson(parsed, '--params-json'))
  assignIfPresent(toolArgs, 'filters', optionalJson(parsed, '--filters-json'))
  assignIfPresent(toolArgs, 'payload', optionalJson(parsed, '--payload-json'))
  assignIfPresent(toolArgs, 'idempotency_key', parsed.values.get('--idempotency-key'))


  return toolArgs
}

function requiresWriteSafety(tool) { return tool === 'erp_acoes' }

function prepareActionSafety(tool, toolArgs, parsed) {
  if (!requiresWriteSafety(tool)) return

  const wantsExecute = parsed.flags.has('--execute')
  const confirmed = parsed.flags.has('--confirm')
  if (wantsExecute && !confirmed) {
    throw new Error(`Use --confirm junto com --execute para executar ${tool} com dry_run=false.`)
  }

  if (wantsExecute && confirmed) {
    toolArgs.dry_run = false
    toolArgs.confirmed = true
    return
  }

  if (toolArgs.dry_run === false) {
    throw new Error(`dry_run=false exige --execute --confirm em ${tool}.`)
  }
  toolArgs.dry_run = true
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
        const resolvedPath = candidates.find((candidate) => existsSync(candidate)) || basePath
        return { path: resolvedPath }
      })
    },
  }
}

async function buildRunner() {
  const runnerSource = `
    import { callPluginDomainTool, isPluginDomainTool } from './src/products/plugin/server/domainTools'

    export async function runPluginToolCall(input) {
      if (!isPluginDomainTool(input.tool)) {
        throw new Error('Tool de dominio desconhecida: ' + input.tool)
      }
      return callPluginDomainTool(input.tool, input.args, { tenantId: input.tenantId })
    }
  `

  const result = await build({
    stdin: {
      contents: runnerSource,
      loader: 'ts',
      resolveDir: root,
      sourcefile: 'plugin-tool-call-runner.ts',
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
  if (!output) throw new Error('esbuild nao retornou o runner da tool.')
  await mkdir(cacheDir, { recursive: true })
  await writeFile(runnerPath, output)
}

async function loadRunner() {
  await buildRunner()
  const require = createRequire(import.meta.url)
  delete require.cache[runnerPath]
  return require(runnerPath)
}

async function main(argv = process.argv.slice(2)) {
  const parsed = parseArgs(argv)
  if (parsed.flags.has('--help')) {
    console.log(usage())
    return 0
  }

  loadEnvFileIfExists(path.join(root, '.env.local'))
  loadEnvFileIfExists(path.join(root, '.env'))

  const tenantId = requiredPositiveInt(parsed, '--tenant')
  const tool = requiredValue(parsed, '--tool')
  const toolArgs = buildToolArgs(parsed)
  prepareActionSafety(tool, toolArgs, parsed)

  const runner = await loadRunner()
  const result = await runner.runPluginToolCall({ tenantId, tool, args: toolArgs })
  console.log(JSON.stringify(result, null, 2))

  const structured = result?.structuredContent
  const failed = result?.isError === true || structured?.success === false
  return failed && !parsed.flags.has('--allow-error') ? 1 : 0
}

try {
  const code = await main()
  process.exit(code)
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
}
