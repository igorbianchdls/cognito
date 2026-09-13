import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'

const requireExternal = process.argv.includes('--require-external')
const commands = [
  ['interface', 'node', ['scripts/erp/interface-foundation-smoke.mjs']],
  ['evolucao', 'node', ['scripts/erp/evolution-smoke.mjs']],
  ['integridade', 'node', ['scripts/erp/integrity-smoke.mjs']],
  ['servicos', 'node', ['scripts/erp/service-integrity-smoke.mjs']],
  ['regressoes', 'node', ['scripts/erp/service-integrity-regression.mjs']],
  ['views', 'node', ['scripts/erp/retire-views-smoke.mjs']],
  ['interface-estatica', 'node', ['scripts/erp/stage6-static-smoke.mjs']],
  ['tipos', process.execPath, ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.erp.json', '--pretty', 'false']],
  ['plugin', process.execPath, ['scripts/plugin/build-widget.mjs']],
]

function run(command, args) {
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd: process.cwd(), env: process.env, shell: false })
    let output = ''
    child.stdout.on('data', chunk => { output += chunk })
    child.stderr.on('data', chunk => { output += chunk })
    child.on('close', code => resolve({ code: code ?? 1, output: output.trim().slice(-4000) }))
  })
}

const results = []
for (const [name, command, args] of commands) {
  const result = await run(command, args)
  results.push({ name, status: result.code === 0 ? 'passed' : 'failed', output: result.output })
  process.stdout.write(`${name}: ${result.code === 0 ? 'aprovado' : 'reprovado'}\n`)
}

if (process.env.ERP_STAGE6_DATABASE_URL) {
  const result = await run(process.execPath, ['scripts/erp/stage6-two-connections.mjs'])
  results.push({ name: 'duas-conexoes-postgresql', status: result.code === 0 ? 'passed' : 'failed', output: result.output })
} else {
  results.push({ name: 'duas-conexoes-postgresql', status: 'blocked', command: 'pnpm erp:stage6:concurrency' })
}

results.push({
  name: 'armazenamento-anexos',
  status: process.env.ERP_STAGE6_STORAGE_PASSED === 'true' ? 'passed' : 'blocked',
})
results.push({
  name: 'navegador-autenticado',
  status: process.env.ERP_STAGE6_BROWSER_PASSED === 'true' ? 'passed' : 'blocked',
})
if (requireExternal) {
  const result = process.platform === 'win32'
    ? await run('cmd.exe', ['/d', '/s', '/c', 'pnpm build'])
    : await run('pnpm', ['build'])
  results.push({ name: 'compilacao-producao', status: result.code === 0 ? 'passed' : 'failed', output: result.output })
} else {
  const buildId = '.next/BUILD_ID'
  const built = existsSync(buildId) && Date.now() - statSync(buildId).mtimeMs < 24 * 60 * 60 * 1000
  results.push({
    name: 'compilacao-producao',
    status: built ? 'passed' : 'blocked',
    evidence: built ? buildId : undefined,
    command: built ? undefined : 'pnpm erp:stage6:strict',
  })
}

const failed = results.some(item => item.status === 'failed')
const blocked = results.some(item => item.status === 'blocked')
const status = failed ? 'failed' : blocked ? 'partial' : 'passed'
const report = { status, generatedAt: new Date().toISOString(), fictitiousDataOnly: true, requireExternal, results }
mkdirSync('docs/erp-interface', { recursive: true })
writeFileSync('docs/erp-interface/etapa-6-testes.json', `${JSON.stringify(report, null, 2)}\n`)
console.log(JSON.stringify({ status, failed, blocked, checks: results.length }))
if (failed || (requireExternal && blocked)) process.exitCode = 1
