#!/usr/bin/env node

import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { build } from 'esbuild'
import dotenv from 'dotenv'

import { loadIntegrationCliEnv } from '../../src/products/integracoes/cli/shared/env.mjs'
import { printError } from '../../src/products/integracoes/cli/shared/output.mjs'

const root = process.cwd()
const cacheDir = path.join(root, '.next/cache/plugin-cli')
const runnerPath = path.join(cacheDir, 'tool-call-runner.cjs')
const booleanFlags = new Set([
  '--allow-error',
  '--confirm',
  '--execute',
  '--help',
  '--include-provider-fields',
  '--no-gcloud-adc',
  '--no-vercel-env',
])

function usage() {
  return [
    'Uso:',
    '  node scripts/plugin/tool-call.mjs --tenant <id> --tool <tool> [opcoes]',
    '',
    'Exemplos:',
    '  node scripts/plugin/tool-call.mjs --tenant 3 --tool connected_erp --provider conta_azul --action listar --resource produtos --limit 2',
    '  node scripts/plugin/tool-call.mjs --tenant 3 --tool connected_erp --provider conta_azul --action listar_live --resource produtos --limit 2 --allow-error',
    '  node scripts/plugin/tool-call.mjs --tenant 3 --tool connected_erp_actions --provider conta_azul --action criar --resource clientes --payload-json \'{"nome":"Cliente Teste CLI"}\'',
    '',
    'Opcoes:',
    '  --tenant <id>                  Tenant usado no contexto da tool.',
    '  --tool <nome>                  Tool do plugin, ex: connected_erp ou connected_erp_actions.',
    '  --args <json>                  Args completos da tool. Alias: --args-json.',
    '  --provider <slug>              Provider conectado, ex: conta_azul.',
    '  --action <acao>                Acao da tool.',
    '  --resource <resource>          Resource da tool.',
    '  --id <id>                      ID do registro para leitura/atualizacao.',
    '  --limit <n>                    Limite de linhas.',
    '  --params-json <json>           Define args.params.',
    '  --filters-json <json>          Define args.filters.',
    '  --payload-json <json>          Define args.payload.',
    '  --idempotency-key <key>        Chave de idempotencia para acoes.',
    '  --include-provider-fields      Inclui campos brutos/provider quando suportado.',
    '  --vercel-env <env>             Ambiente Vercel para carregar envs quando faltarem credenciais. Default: production.',
    '  --vercel-env-file <path>       Arquivo .env ja baixado do Vercel/cache para carregar.',
    '  --no-vercel-env                Nao tenta puxar envs do Vercel automaticamente.',
    '  --gcloud-adc-file <path>       Arquivo ADC explicitamente usado em GOOGLE_APPLICATION_CREDENTIALS.',
    '  --no-gcloud-adc                Nao tenta detectar ADC local do gcloud.',
    '  --execute --confirm           Permite dry_run=false em connected_erp_actions.',
    '  --allow-error                  Retorna exit code 0 mesmo quando a tool falhar.',
    '  --help                        Mostra esta ajuda.',
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

function hasBigQueryCredentials() {
  return Boolean(
    process.env.BIGQUERY_CREDENTIALS_JSON?.trim()
      || process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim()
      || process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
  )
}

function resolvePath(value) {
  if (!value) return value
  return path.isAbsolute(value) ? value : path.join(root, value)
}

function tryRun(command, args) {
  try {
    return execFileSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  } catch {
    return ''
  }
}

async function loadVercelEnv(parsed) {
  if (parsed.flags.has('--no-vercel-env') || hasBigQueryCredentials()) return

  const explicitFile = parsed.values.get('--vercel-env-file')
  if (explicitFile) {
    loadEnvFileIfExists(resolvePath(explicitFile))
    return
  }

  const environment = parsed.values.get('--vercel-env') || process.env.PLUGIN_TOOL_VERCEL_ENV || 'production'
  const envFile = path.join(cacheDir, `vercel-${environment}.env`)
  await mkdir(cacheDir, { recursive: true })

  if (existsSync(envFile)) {
    loadEnvFileIfExists(envFile)
    if (hasBigQueryCredentials()) return
  }

  const output = tryRun('vercel', ['env', 'pull', envFile, '--environment', environment, '--yes'])
  if (output || existsSync(envFile)) {
    loadEnvFileIfExists(envFile)
  }
}

function windowsPathToWslPath(value) {
  if (!value) return ''
  const converted = tryRun('wslpath', ['-u', value])
  return converted || value
}

function detectWindowsGcloudAdcFile() {
  const configDir = tryRun('cmd.exe', ['/c', 'gcloud', 'info', '--format=value(config.paths.global_config_dir)'])
  if (!configDir) return ''
  return path.join(windowsPathToWslPath(configDir), 'application_default_credentials.json')
}

function detectGcloudAdcFile() {
  const candidates = [
    process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim(),
    path.join(process.env.HOME || '', '.config/gcloud/application_default_credentials.json'),
    detectWindowsGcloudAdcFile(),
  ].filter(Boolean)

  return candidates.find((candidate) => existsSync(candidate)) || ''
}

function loadGcloudAdc(parsed) {
  if (parsed.flags.has('--no-gcloud-adc') || hasBigQueryCredentials()) return

  const explicitFile = resolvePath(parsed.values.get('--gcloud-adc-file'))
  const adcFile = explicitFile || detectGcloudAdcFile()
  if (adcFile && existsSync(adcFile)) {
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||= adcFile
  }
}

async function loadRuntimeCredentials(parsed) {
  await loadVercelEnv(parsed)
  loadGcloudAdc(parsed)
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
  assignIfPresent(toolArgs, 'provider', parsed.values.get('--provider'))
  assignIfPresent(toolArgs, 'action', parsed.values.get('--action'))
  assignIfPresent(toolArgs, 'resource', parsed.values.get('--resource'))
  assignIfPresent(toolArgs, 'id', parsed.values.get('--id'))
  assignIfPresent(toolArgs, 'limit', optionalPositiveInt(parsed, '--limit'))
  assignIfPresent(toolArgs, 'params', optionalJson(parsed, '--params-json'))
  assignIfPresent(toolArgs, 'filters', optionalJson(parsed, '--filters-json'))
  assignIfPresent(toolArgs, 'payload', optionalJson(parsed, '--payload-json'))
  assignIfPresent(toolArgs, 'idempotency_key', parsed.values.get('--idempotency-key'))

  if (parsed.flags.has('--include-provider-fields')) {
    toolArgs.include_provider_fields = true
  }

  return toolArgs
}

function prepareActionSafety(tool, toolArgs, parsed) {
  if (tool !== 'connected_erp_actions') return

  const wantsExecute = parsed.flags.has('--execute')
  const confirmed = parsed.flags.has('--confirm')
  if (wantsExecute && !confirmed) {
    throw new Error('Use --confirm junto com --execute para executar connected_erp_actions com dry_run=false.')
  }

  if (wantsExecute && confirmed) {
    toolArgs.dry_run = false
    toolArgs.confirmed = true
    return
  }

  if (toolArgs.dry_run === false) {
    throw new Error('dry_run=false exige --execute --confirm em connected_erp_actions.')
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

  loadIntegrationCliEnv()
  await loadRuntimeCredentials(parsed)

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
  printError(error)
  process.exit(1)
}
