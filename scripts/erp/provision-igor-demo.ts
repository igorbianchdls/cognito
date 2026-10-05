import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { config } from 'dotenv'
import { connection, project } from './evolution-db.mjs'
import { syncSharedUser } from '@/products/auth/server/clerkTenantBootstrap'
import { syncClerkOrganization, syncClerkOrganizationMembership } from '@/products/auth/server/clerkOrganizationSync'
import { updateClerkOrganizationMetadata } from '@/products/auth/server/clerkOrganizationClient'
import { enqueueClerkOperation, processClerkOperation } from '@/products/auth/server/clerkOutbox'
import { closePool } from '@/lib/postgres'

config({ path: '.env.local', quiet: true })
const userId = 'user_3EyO1rFYG4ysjCm0aeJf34NOxv1'
const reference = '2026-10-06'
const apply = process.argv.includes('--apply')
assert(process.argv.slice(2).every(value => ['--check', '--apply'].includes(value)))
const client = connection()
let committed = false
async function clerk(path: string) {
  const response = await fetch('https://api.clerk.com/v1' + path, {
    headers: { authorization: 'Bearer ' + process.env.CLERK_SECRET_KEY }, signal: AbortSignal.timeout(10000),
  })
  assert(response.ok, 'CLERK_READ_HTTP_' + response.status)
  return response.json()
}
async function main() {
  const user = await clerk('/users/' + userId)
  assert.equal(user.id, userId)
  const email = user.email_addresses.find((value: { id: string }) => value.id === user.primary_email_address_id)
  assert.equal(email?.verification?.status, 'verified', 'Verified primary email required')
  const memberships = await clerk('/users/' + userId + '/organization_memberships?limit=100')
  assert.equal(memberships.total_count, 1, 'Identify a single existing organization before provisioning')
  const membership = memberships.data[0]
  assert.equal(membership.role, 'org:admin')
  const organization = await clerk('/organizations/' + membership.organization.id)
  assert.equal(organization.name, 'Igor Bianch Workspace')
  await client.connect()
  await client.query('BEGIN')
  await client.query("SELECT pg_advisory_xact_lock(73009,hashtext($1))", [userId])
  const old = (await client.query('SELECT id FROM shared.empresas WHERE clerk_organization_id=$1', [organization.id])).rows[0]
  const organizationMetadata = { ...organization.private_metadata, ownerClerkUserId: userId }
  if (!old && organizationMetadata.tenantId) {
    const previous = (await client.query('SELECT id,name,clerk_organization_id FROM shared.empresas WHERE id=$1', [organizationMetadata.tenantId])).rows[0]
    assert(!previous || (previous.name==='CLI ERP Test' && !previous.clerk_organization_id), 'Existing Clerk company mapping needs review')
    // The approved new company replaces a stale onboarding reference; never adopt
    // the unrelated legacy test company. Original Clerk metadata is backed up.
    delete organizationMetadata.tenantId
  }
  if (old) {
    const access = (await client.query(`SELECT m.role,m.status,u.status AS user_status,e.status AS company_status
      FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id
      WHERE m.empresa_id=$1 AND u.clerk_user_id=$2 AND NOT m.suspenso_localmente`, [old.id, userId])).rows[0]
    assert(access && access.role === 'owner' && access.status === 'active' && access.user_status === 'active' && access.company_status === 'active', 'Existing company access requires explicit review')
  }
  if (!apply) {
    await client.query('ROLLBACK')
    console.log(JSON.stringify({ status: 'checked', project, user: 'Igor Bianch', organization: organization.name, reference, existingCompany: old?.id || null }))
    return
  }
  const before: Record<string, unknown> = { project, reference, createdAt: new Date().toISOString(), clerk: { user, organization, membership }, shared: {} }
  for (const { tablename } of (await client.query("SELECT tablename FROM pg_tables WHERE schemaname='shared' ORDER BY tablename")).rows) {
    (before.shared as Record<string, unknown>)[tablename] = (await client.query('SELECT * FROM shared."' + tablename + '" ORDER BY 1')).rows
  }
  mkdirSync('credentials/backups/erp-demo', { recursive: true })
  const backupPath = 'credentials/backups/erp-demo/identity-before-' + Date.now() + '.json'
  const bytes = JSON.stringify(before)
  writeFileSync(backupPath, bytes, { flag: 'wx' })
  assert.equal(readFileSync(backupPath, 'utf8'), bytes)
  await client.query("SELECT set_config('app.shared_source','demo_provisioning',true),set_config('app.shared_reason','Cadastro autorizado para demonstracao de 06/10/2026',true)")
  const localUser = await syncSharedUser(client, {
    clerkUserId: userId, clerkOrganizationId: organization.id, email: email.email_address,
    emailVerified: true, fullName: [user.first_name, user.last_name].filter(Boolean).join(' '), avatarUrl: user.image_url || null,
  })
  await client.query("SELECT set_config('app.shared_actor_id',$1,true)", [String(localUser.id)])
  const empresaId = await syncClerkOrganization(client, { ...organization,
    private_metadata: organizationMetadata,
  })
  assert(empresaId)
  assert(await syncClerkOrganizationMembership(client, { ...membership,
    organization_id: organization.id, user_id: userId,
    private_metadata: { ...membership.private_metadata, appRole: 'owner' },
  }))
  await client.query(`UPDATE shared.usuarios_empresas SET metadata=metadata||jsonb_build_object('accessRoleManaged',true,'source','demo_provisioning')
    WHERE empresa_id=$1 AND usuario_id=$2`, [empresaId, localUser.id])
  await client.query(`UPDATE shared.empresas SET metadata=metadata||jsonb_build_object('demoReference',$2::text,'onboardingCompletedAt',now()) WHERE id=$1`, [empresaId, reference])
  const operationId = await enqueueClerkOperation(client, { type: 'membership', organizationId: organization.id, clerkUserId: userId, appRole: 'owner' })
  await client.query('COMMIT'); committed = true
  const report = { status: 'local_committed_external_pending', project, reference, empresaId, usuarioId: Number(localUser.id), clerkUserId: userId,
    clerkOrganizationId: organization.id, clerkMembershipId: membership.id, role: 'owner', backupPath,
    backupDigest: createHash('sha256').update(bytes).digest('hex'), clerkVerified: false }
  mkdirSync('.cache/erp-demo', { recursive: true })
  writeFileSync('.cache/erp-demo/identity.json', JSON.stringify(report, null, 2))
  assert(await processClerkOperation(operationId), 'Clerk role sync pending; local identity preserved')
  await updateClerkOrganizationMetadata({ organizationId: organization.id,
    privateMetadata: { ownerClerkUserId: userId, tenantId: empresaId, source: 'cognito_onboarding' }, publicMetadata: { app: 'cognito' } })
  const afterOrganization = await clerk('/organizations/' + organization.id)
  const afterMemberships = await clerk('/users/' + userId + '/organization_memberships?limit=100')
  const afterMembership = afterMemberships.data.find((value: { id: string }) => value.id === membership.id)
  assert.equal(afterOrganization.private_metadata.ownerClerkUserId, userId)
  assert.equal(Number(afterOrganization.private_metadata.tenantId), empresaId)
  assert.equal(afterMembership.private_metadata.appRole, 'owner')
  report.status = 'provisioned'; report.clerkVerified = true
  writeFileSync('.cache/erp-demo/identity.json', JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
}
main().catch(async error => {
  if (!committed) await client.query('ROLLBACK').catch(() => undefined)
  console.error(JSON.stringify({ status: committed ? 'local_committed_external_needs_retry' : 'rolled_back', code: error.code || error.name, message: error.message }))
  process.exitCode = 1
}).finally(async () => { await client.end().catch(() => undefined); await closePool() })
