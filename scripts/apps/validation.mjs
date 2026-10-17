import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
const commands = [
 ['types', ['node_modules/typescript/bin/tsc', '-p', 'tsconfig.apps.json', '--pretty', 'false']],
 ['lint', ['node_modules/eslint/bin/eslint.js', 'src/products/apps', 'src/app/apps', 'src/app/api/apps', 'scripts/apps', 'src/proxy.ts', 'src/components/navigation/SidebarShadcn.tsx']],
 ['apps-domain', ['--import', 'tsx', 'scripts/apps/smoke.ts']],
 ['browser', ['--import', 'tsx', 'scripts/apps/ui-smoke.mjs']],
 ['tables', ['scripts/tables/smoke.mjs']],
 ['whatsapp', ['--import', 'tsx', 'scripts/whatsapp/smoke.ts']],
 ['chatgpt-package', ['scripts/chatgptplugin-package-smoke.mjs']],
 ['claude-package', ['scripts/claudeplugin-package-smoke.mjs']],
]
mkdirSync('.cache/apps', { recursive: true }); const checks = []
try { for (const [name, args] of commands) { console.log('Checking ' + name); const r = spawnSync(process.execPath, args, { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 }); if (r.status !== 0) { console.error(r.stdout); console.error(r.stderr); throw Error(name + ' failed') } checks.push(name); console.log('Passed ' + name) } const report = { status: 'passed', checks, generatedAt: new Date().toISOString() }; writeFileSync('.cache/apps/regression.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report)) }
catch (e) { writeFileSync('.cache/apps/regression.json', JSON.stringify({ status: 'failed', checks, error: e.message })); process.exitCode = 1 }
