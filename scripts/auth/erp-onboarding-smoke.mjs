import assert from 'node:assert/strict'
import { build } from 'esbuild'

// Exercita o handler real com fronteiras Clerk/Postgres simuladas; não acessa contas ou banco.
const state = { event: null, calls: [], rejectSignature: false }
globalThis.__erpOnboardingSmoke = state
const mocks = {
  '@clerk/nextjs/webhooks': `export async function verifyWebhook() {
    const state = globalThis.__erpOnboardingSmoke;
    if(state.rejectSignature) throw new Error('invalid signature');
    return state.event;
  }`,
  '@/lib/postgres': `export async function withTransaction(fn) {
    globalThis.__erpOnboardingSmoke.calls.push('transaction'); return fn({});
  }`,
  '@/products/auth/server/clerkOrganizationSync': `
    export async function syncClerkOrganization(client, data) { globalThis.__erpOnboardingSmoke.calls.push('organization:' + data.id); return 42; }
    export async function syncClerkOrganizationMembership(client, data, options) { globalThis.__erpOnboardingSmoke.calls.push(options.deleted ? 'membership:deleted' : 'membership:synced'); return true; }
    export async function syncClerkOrganizationInvitation() { globalThis.__erpOnboardingSmoke.calls.push('invitation'); return true; }
    export async function markClerkOrganizationDeleted(id) { globalThis.__erpOnboardingSmoke.calls.push('organization:deleted:' + id); }
  `,
  '@/products/auth/server/clerkTenantBootstrap': `
    export async function syncClerkProfile(profile) { globalThis.__erpOnboardingSmoke.calls.push('profile'); return { ...profile, sharedUserId: 7, memberships: [1] }; }
    export async function markClerkUserDeleted(id) { globalThis.__erpOnboardingSmoke.calls.push('user:deleted:' + id); }
  `,
}

const result = await build({
  entryPoints: ['src/app/api/clerk/webhooks/route.ts'],
  bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{ name: 'isolated-auth-boundaries', setup(builder) {
    builder.onResolve({ filter: /integracoes|bigquery/i }, args => {
      throw new Error('Dependência externa indevida no webhook: ' + args.path)
    })
    builder.onResolve({ filter: /.*/ }, args => mocks[args.path] ? { path: args.path, namespace: 'mock' } : undefined)
    builder.onLoad({ filter: /.*/, namespace: 'mock' }, args => ({ contents: mocks[args.path], loader: 'js' }))
  } }],
})
const { POST } = await import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'))

async function send(type, data) {
  state.calls = []
  state.event = { type, data }
  const response = await POST(new Request('https://example.test/api/clerk/webhooks', { method: 'POST' }))
  return { status: response.status, body: await response.json() }
}

for (const type of ['organization.created', 'organization.updated']) {
  const result = await send(type, { id: 'org_test' })
  assert.equal(result.status, 200)
  assert.deepEqual(result.body, { ok: true, tenantId: 42 })
  assert.deepEqual(state.calls, ['transaction', 'organization:org_test'])
}
for(const type of ['organizationMembership.created', 'organizationMembership.deleted']) {
  const result = await send(type, { id: 'membership_test' })
  assert.equal(result.body.synced, true)
  assert(state.calls.includes(type.endsWith('deleted') ? 'membership:deleted' : 'membership:synced'))
}
assert.equal((await send('organizationInvitation.created', { id: 'invite_test' })).body.synced, true)
assert(state.calls.includes('invitation'))
assert.equal((await send('organization.deleted', { id: 'org_test' })).body.ok, true)
assert.deepEqual(state.calls, ['organization:deleted:org_test'])
assert.equal((await send('user.created', { id: 'user_test', email_addresses: [{ email_address: 'test@example.test' }] })).body.memberships, 1)
assert.deepEqual(state.calls, ['profile'])
assert.equal((await send('user.deleted', { id: 'user_test' })).body.ok, true)
assert.deepEqual(state.calls, ['user:deleted:user_test'])
state.rejectSignature = true
assert.equal((await send('organization.created', { id: 'org_test' })).status, 400)
assert.deepEqual(state.calls, [])

// Compila a árvore real do onboarding e impede reintrodução de dependências de integrações.
const bootstrap = await build({
  entryPoints: ['src/products/auth/server/clerkTenantBootstrap.ts'],
  bundle: true, write: false, platform: 'node', format: 'esm', packages: 'external', metafile: true,
})
assert(!Object.keys(bootstrap.metafile.inputs).some(file => /products\/integracoes|bigquery/i.test(file)))
delete globalThis.__erpOnboardingSmoke
console.log('Auth ERP: organização, vínculos, convites e usuários preservados; assinatura inválida rejeitada; onboarding sem Integrações/BigQuery.')
