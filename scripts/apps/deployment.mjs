import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import dotenv from 'dotenv'
import { assertDeploymentSchedules } from '../erp/deployment-schedules.mjs'

const folder = '.cache/apps/deployment/', json = file => JSON.parse(readFileSync(file)), staged = json(folder + 'deployment.json'), env = dotenv.parse(readFileSync('.env.local'))
const headers = { Authorization: 'Bearer ' + env.VERCEL_TOKEN, 'Content-Type': 'application/json' }, team = 'team_fI5lF5U1UZOCEfHWdB4QNpua', mode = process.argv[2] || 'status'
assert(['status', 'promote'].includes(mode))
async function get(id) {
  const r = await fetch(`https://api.vercel.com/v13/deployments/${id}?teamId=${team}`, { headers, signal: AbortSignal.timeout(25000) })
  assert(r.ok, 'Deployment HTTP ' + r.status); const d = await r.json(); assert.equal(d.projectId, staged.project); return d
}
const deployment = await get(staged.id)
if (mode === 'status') {
  console.log(JSON.stringify({ id: deployment.id, state: deployment.readyState, url: deployment.url }))
  if (deployment.readyState === 'ERROR') {
    const r = await fetch(`https://api.vercel.com/v3/deployments/${staged.id}/events?teamId=${team}`, { headers }); const events = await r.json()
    console.log(JSON.stringify({ errors: events.filter(e => e.type === 'stderr' || /error|failed/i.test(e.text || e.payload?.text || '')).map(e => e.text || e.payload?.text) })); process.exitCode = 1
  }
} else {
  assert.equal(deployment.readyState, 'READY'); assert.equal(deployment.target, 'production'); assertDeploymentSchedules(deployment)
  const manifest = json(folder + 'deploy-manifest.json'); assert.equal(deployment.meta.appsSourceDigest, manifest.sourceDigest)
  for (const file of manifest.files.filter(f => !f.file.startsWith('scripts/') && !f.file.endsWith('.md') && f.file !== 'tsconfig.apps.json')) assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'), file.sha, file.file)
  for (const file of ['.cache/apps/smoke.json', '.cache/apps/regression.json', '.cache/apps/ui.json']) assert.equal(json(file).status, 'passed')
  const http = json(folder + 'staged-http.json'); assert.equal(http.status, 'passed'); assert.equal(http.deploymentId, staged.id); assert(Date.now() - Date.parse(http.generatedAt) < 3600000)
  assert.equal(json('.cache/apps/database.json').digest, staged.migrationDigest)
  const live = await get('cognito-seven.vercel.app'); assert.equal(live.id, json(folder + 'previous-production.json').id, 'Production changed while validating')
  const r = await fetch(`https://api.vercel.com/v10/projects/${staged.project}/promote/${staged.id}?teamId=${team}`, { method: 'POST', headers, body: '{}', signal: AbortSignal.timeout(30000) }); assert(r.ok, 'Promotion HTTP ' + r.status)
  const proof = { status: 'promotion_requested', deploymentId: staged.id, previous: live.id, generatedAt: new Date().toISOString() }
  writeFileSync(folder + 'promotion.json', JSON.stringify(proof, null, 2)); console.log(JSON.stringify(proof))
}
