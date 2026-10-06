import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import ts from 'typescript'
import dotenv from 'dotenv'
import { connection } from './evolution-db.mjs'

dotenv.config({ path: '.env.local', quiet: true })
const root = resolve('.'), require = createRequire(import.meta.url), modules = new Map()
const db = connection()
let clerkIdentity, postgres, stage = 'database'
const clerk = require('@clerk/backend').createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
function load(name, parent = resolve(root, 'entry.ts')) {
  if (name === '@clerk/nextjs/server') return {
    auth: async () => ({ userId: clerkIdentity.clerk_user_id, orgId: clerkIdentity.clerk_organization_id }),
    clerkClient: async () => clerk,
  }
  if (!name.startsWith('.') && !name.startsWith('@/') && !name.startsWith(root)) return require(name)
  let file = name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(dirname(parent), name)
  if (!existsSync(file)) file = ['.ts', '.tsx', '/index.ts'].map(s => file + s).find(existsSync)
  assert(file && existsSync(file), 'Missing module ' + name)
  if (modules.has(file)) return modules.get(file).exports
  const record = { exports: {} }; modules.set(file, record)
  const compiled = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText
  vm.runInThisContext('(function(require,module,exports){' + compiled + '\n})', { filename: file })(dep => load(dep, file), record, record.exports)
  return record.exports
}
try {
  await db.connect()
  clerkIdentity = (await db.query("SELECT u.clerk_user_id,e.clerk_organization_id FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.role='owner' AND m.status='active' AND u.status='active' AND e.status='active'")).rows[0]
  assert(clerkIdentity?.clerk_user_id && clerkIdentity?.clerk_organization_id, 'Verified owner missing')
  postgres = load('@/lib/postgres')
  // Execute the actual bootstrap SQL, including profile updates, then roll back.
  // No user, organization, membership or business data is committed by this test.
  postgres.withTransaction = async fn => {
    await db.query('BEGIN')
    try { return await fn({ query: (sql, params) => db.query(sql, params), release() {} }) }
    finally { await db.query('ROLLBACK') }
  }
  stage = 'clerk_profile_and_bootstrap'
  const session = await load('@/products/erp/server/erpAccess').resolveErpSession()
  assert(session, 'Owner session was not resolved')
  assert.equal(session.tenantId, 2)
  assert.equal(session.sharedUserId, 3)
  assert.deepEqual(session.capabilities, load('@/products/erp/shared/professionalContracts').ERP_CAPABILITIES)
  stage = 'static_route_parameters'
  const { validateErpHttpParams } = load('@/products/erp/api/contracts/request')
  for (const context of [undefined, {}, { params: undefined }, { params: Promise.resolve(undefined) }, { params: Promise.resolve({}) }, { params: Promise.resolve({ id: '1' }) }]) await validateErpHttpParams(context)
  for (const id of ['0', '-1', 'abc', '9007199254740992']) await assert.rejects(validateErpHttpParams({ params: Promise.resolve({ id }) }))
  stage = 'access_http_handler'
  const response = await load('@/products/erp/api/handlers/acesso/index').GET(
    new Request('http://localhost/api/erp/acesso'), { params: undefined },
  )
  assert.equal(response.status, 200)
  assert.deepEqual((await response.json()).capabilities, session.capabilities)
  console.log(JSON.stringify({ status: 'passed', stage, capabilities: session.capabilities.length, scope: 'Real Clerk profile and Supabase bootstrap/access queries and HTTP handler; verified session claims fixture; static Next route context; bootstrap transactions rolled back.' }))
} catch (error) {
  // Diagnostics contain no SQL parameters, profiles or credentials.
  const message = String(error.message || '').replace(/postgres(?:ql)?:\/\/[^\s"']+/gi, '[DB_URL]').replace(/(?:sk_test_|sk_live_|vcp_)[A-Za-z0-9_]+/g, '[SECRET]')
  console.error(JSON.stringify({ status: 'failed', stage, name: error.name, code: error.code, message, stack: String(error.stack || '').split('\n').slice(1, 5), clerkStatus: error.status, clerkCodes: error.errors?.map(e => e.code) }))
  process.exitCode = 1
} finally {
  await db.end().catch(() => {})
  if (postgres) await postgres.closePool()
}
