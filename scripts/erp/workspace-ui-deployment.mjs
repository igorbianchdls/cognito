import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import dotenv from 'dotenv'

const cfg = dotenv.parse(readFileSync('.env.local'))
const project = 'prj_mXGm0J5InfGNAR2lO4cHGLCrgoex', team = 'team_fI5lF5U1UZOCEfHWdB4QNpua'
const headers = { Authorization: 'Bearer ' + cfg.VERCEL_TOKEN, 'Content-Type': 'application/json' }
const cache = '.cache/workspace-ui/', mode = process.argv[2], json = path => JSON.parse(readFileSync(path))
assert(['snapshot', 'status', 'promote'].includes(mode))
mkdirSync(cache, { recursive: true })
async function get(target) {
  const response = await fetch('https://api.vercel.com/v13/deployments/' + target + '?teamId=' + team, { headers, signal: AbortSignal.timeout(25000) })
  assert(response.ok, 'Deployment HTTP ' + response.status)
  const result = await response.json(); assert.equal(result.projectId, project); return result
}
if (mode === 'snapshot') {
  const live = await get('cognito-seven.vercel.app')
  writeFileSync(cache + 'previous-production.json', JSON.stringify({ id: live.id, url: live.url }))
  console.log(JSON.stringify({ previous: live.id }))
} else {
  const staged = json('.cache/shared/deployment.json'), meta = await get(staged.id)
  if (mode === 'status') {
    console.log(JSON.stringify({ id: meta.id, state: meta.readyState, url: meta.url }))
    if (meta.readyState === 'ERROR') {
      const response = await fetch('https://api.vercel.com/v3/deployments/' + staged.id + '/events?teamId=' + team, { headers })
      const events = await response.json()
      console.log(JSON.stringify({ errors: events.filter(event => event.type === 'stderr' || /error|failed/i.test(event.payload?.text || '')).map(event => event.payload?.text) }))
      process.exitCode = 1
    }
  } else {
    assert.equal(meta.readyState, 'READY'); assert.equal(meta.target, 'production')
    assert.equal(json(cache + 'smoke.json').status, 'passed')
    const proof = json(cache + 'staged-http.json'); assert.equal(proof.status, 'passed'); assert.equal(proof.deploymentId, staged.id)
    const manifest = json('.cache/shared/deploy-manifest.json')
    assert.equal(manifest.sourceDigest, staged.sourceDigest); assert.equal(meta.meta.sharedSourceDigest, staged.sourceDigest)
    for (const file of manifest.files) assert.equal(createHash('sha1').update(readFileSync(file.file)).digest('hex'), file.sha, 'Staged source changed: ' + file.file)
    const live = await get('cognito-seven.vercel.app'); assert.equal(live.id, json(cache + 'previous-production.json').id, 'Production changed during validation')
    const response = await fetch('https://api.vercel.com/v10/projects/' + project + '/promote/' + staged.id + '?teamId=' + team, { method: 'POST', headers, body: '{}', signal: AbortSignal.timeout(30000) })
    assert(response.ok, 'Promotion HTTP ' + response.status)
    const report = { status: 'published', previous: live.id, deploymentId: staged.id, http: response.status }
    writeFileSync(cache + 'promotion.json', JSON.stringify(report, null, 2)); console.log(JSON.stringify(report))
  }
}
