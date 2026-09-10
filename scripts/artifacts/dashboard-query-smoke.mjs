import { spawnSync } from 'node:child_process'
const result = spawnSync(process.execPath, ['node_modules/tsx/dist/cli.mjs', 'scripts/artifacts/dashboard-inline-smoke.ts'], { stdio: 'inherit' })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
