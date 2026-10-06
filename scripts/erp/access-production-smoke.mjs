import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import dotenv from 'dotenv'
import { connection } from './evolution-db.mjs'

const config = dotenv.parse(readFileSync('.env.local'))
const require = createRequire(import.meta.url)
const clerk = require('@clerk/backend').createClerkClient({ secretKey: config.CLERK_SECRET_KEY })
const project = 'prj_mXGm0J5InfGNAR2lO4cHGLCrgoex', team = 'team_fI5lF5U1UZOCEfHWdB4QNpua'
const arg = process.argv.slice(2)
assert(arg.length <= 2 && new Set(arg).size === arg.length && arg.every(value => value === '--repeat' || /^--deployment=dpl_[A-Za-z0-9]+$/.test(value)), 'Use only a deployment ID from this project and optional --repeat')
const deploymentArg = arg.find(value => value.startsWith('--deployment='))
const target = deploymentArg?.slice('--deployment='.length) || 'cognito-seven.vercel.app'
const db = connection()
let stage = 'deployment'
try {
  const metaResponse = await fetch('https://api.vercel.com/v13/deployments/' + target + '?teamId=' + team, { headers: { Authorization: 'Bearer ' + config.VERCEL_TOKEN }, signal: AbortSignal.timeout(20000) })
  assert(metaResponse.ok, 'Deployment metadata unavailable')
  const meta = await metaResponse.json()
  assert.equal(meta.projectId, project)
  assert.equal(meta.readyState, 'READY')
  const origin = deploymentArg ? 'https://' + meta.url : 'https://cognito-seven.vercel.app'
  stage = 'verified_owner'
  await db.connect()
  const owner = (await db.query("SELECT u.clerk_user_id,e.clerk_organization_id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'")).rows[0]
  assert(owner?.clerk_user_id && owner.clerk_organization_id, 'Owner missing')
  stage = 'existing_clerk_session'
  const sessions = await clerk.sessions.getSessionList({ userId: owner.clerk_user_id, status: 'active', limit: 100 })
  const session = sessions.data.find(session => session.userId === owner.clerk_user_id && session.lastActiveOrganizationId === owner.clerk_organization_id)
    || sessions.data.find(session => session.userId === owner.clerk_user_id && !session.lastActiveOrganizationId)
  assert(session, 'No compatible active owner session')
  // Token exists only in memory for this read test; do not save or print it.
  const token = await clerk.sessions.getToken(session.id, undefined, 60)
  const claims = JSON.parse(Buffer.from(token.jwt.split('.')[1], 'base64url').toString())
  assert.equal(claims.sub, owner.clerk_user_id)
  assert(!claims.org_id || claims.org_id === owner.clerk_organization_id)
  assert(!claims.o?.id || claims.o.id === owner.clerk_organization_id)
  stage = 'authenticated_access'
  const response = await fetch(origin + '/api/erp/acesso', { headers: { Authorization: 'Bearer ' + token.jwt }, signal: AbortSignal.timeout(25000) })
  const body = await response.json()
  console.log(JSON.stringify({ stage, http: response.status, code: body.error?.code, capabilities: body.capabilities?.length, correlationId: response.headers.get('x-correlation-id') }))
  assert.equal(response.status, 200)
  assert.equal(body.profile, 'administrador')
  assert.equal(body.capabilities.length, 15)
  assert(body.capabilities.includes('erp.financeiro.visualizar'))
  stage = 'anonymous_access'
  const anonymous = await fetch(origin + '/api/erp/acesso', { signal: AbortSignal.timeout(25000), redirect: 'manual' })
  assert.equal(anonymous.status, 401)
  assert.equal((await anonymous.json()).error.code, 'AUTH_REQUIRED')
  const repeated = []
  if (arg.includes('--repeat')) {
    stage = 'parallel_and_repeated_reads'
    // Exercise more than the previous 15 session slots, including simultaneous
    // menu/dashboard loads, then another wave after completion.
    for (const wave of [1, 2]) {
      const paths = Array.from({ length: 16 }, () => '/api/erp/acesso').concat([
        '/api/erp/dashboards/visao-geral?from=2026-09-01&to=2026-09-30',
        '/api/erp/dashboards/financeiro?from=2026-09-01&to=2026-09-30',
      ])
      const waveToken = await clerk.sessions.getToken(session.id, undefined, 60)
      const results = await Promise.all(paths.map(async path => {
        const result = await fetch(origin + path, { headers: { Authorization: 'Bearer ' + waveToken.jwt }, signal: AbortSignal.timeout(45000) })
        const payload = await result.json()
        if (path === '/api/erp/acesso' && result.ok) assert.equal(payload.capabilities.length, 15)
        return { path, http: result.status, code: payload.error?.code }
      }))
      repeated.push({ wave, results })
      console.log(JSON.stringify({ wave, requests: results.length, statuses: [...new Set(results.map(result => result.http))] }))
      assert(results.every(result => result.http === 200), JSON.stringify(results.filter(result => result.http !== 200)))
    }
  }
  const report = { status: 'passed', deploymentId: meta.id, origin, authenticatedStatus: response.status, anonymousStatus: anonymous.status, capabilities: body.capabilities.length, realClerkSession: true, noBusinessMutations: true, repeated }
  mkdirSync('.cache/erp-access', { recursive: true })
  writeFileSync('.cache/erp-access/' + (deploymentArg ? 'staged' : 'production') + '-smoke.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify({ ...report, repeated: repeated.map(wave => ({ wave: wave.wave, requests: wave.results.length })) }))
} catch (error) {
  console.error(JSON.stringify({ status: 'failed', stage, name: error.name, code: error.code, clerkStatus: error.status, clerkCodes: error.errors?.map(value => value.code) }))
  process.exitCode = 1
} finally {
  await db.end().catch(() => {})
}
