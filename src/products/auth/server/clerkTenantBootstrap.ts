import { auth, clerkClient } from '@clerk/nextjs/server'

import { withTransaction, type SQLClient } from '@/lib/postgres'
import type {
  AuthTenantMembership,
  ClerkTenantBootstrapResult,
} from '@/products/auth/shared/authContracts'

type SharedUserRow = {
  id: string | number
  email: string
  full_name: string | null
  avatar_url: string | null
  clerk_user_id: string | null
}

type TenantMembershipRow = {
  tenant_id: string | number
  tenant_name: string
  tenant_slug: string | null
  role: string
}

type TenantRow = {
  id: string | number
  name: string
  slug: string | null
}

type ClerkProfile = {
  clerkUserId: string
  email: string
  fullName: string | null
  avatarUrl: string | null
}

function toText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function slugify(value: string) {
  const slug = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || 'tenant'
}

function getEmailDomain(email: string) {
  const domain = email.split('@')[1]?.trim().toLowerCase()
  return domain && domain !== 'gmail.com' && domain !== 'hotmail.com' && domain !== 'outlook.com'
    ? domain.split('.')[0]
    : ''
}

function getTenantName(profile: ClerkProfile) {
  const domain = getEmailDomain(profile.email)
  if (domain) return domain.replace(/(^|-)([a-z])/g, (_, prefix: string, letter: string) => `${prefix}${letter.toUpperCase()}`)
  return profile.fullName ? `${profile.fullName} Workspace` : `${profile.email} Workspace`
}

function normalizeMembership(row: TenantMembershipRow): AuthTenantMembership {
  const role = toText(row.role)
  return {
    tenantId: Number(row.tenant_id),
    tenantName: row.tenant_name,
    tenantSlug: row.tenant_slug,
    role: role === 'admin' || role === 'member' || role === 'viewer' ? role : 'owner',
  }
}

async function getCurrentClerkProfile(): Promise<ClerkProfile | null> {
  const authState = await auth()
  if (!authState.userId) return null

  const client = await clerkClient()
  const user = await client.users.getUser(authState.userId)
  const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || ''
  if (!email) {
    throw new Error('Usuario Clerk sem email principal.')
  }

  const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ') || null
  return {
    clerkUserId: authState.userId,
    email,
    fullName,
    avatarUrl: user.imageUrl || null,
  }
}

async function findUserByClerkId(
  client: Pick<SQLClient, 'query'>,
  clerkUserId: string,
): Promise<SharedUserRow | null> {
  const result = await client.query(
    `SELECT id, email, full_name, avatar_url, clerk_user_id
     FROM shared.users
     WHERE clerk_user_id = $1
     LIMIT 1`,
    [clerkUserId],
  )
  return (result.rows[0] as SharedUserRow | undefined) || null
}

async function linkUserByEmail(
  client: Pick<SQLClient, 'query'>,
  profile: ClerkProfile,
): Promise<SharedUserRow | null> {
  const result = await client.query(
    `UPDATE shared.users
     SET
       clerk_user_id = $1,
       email = $2,
       full_name = COALESCE(NULLIF($3, ''), full_name),
       avatar_url = COALESCE(NULLIF($4, ''), avatar_url),
       metadata = metadata || jsonb_build_object('linkedBy', 'clerk', 'linkedAt', now()),
       updated_at = now()
     WHERE clerk_user_id IS NULL
       AND lower(email::text) = lower($2::text)
     RETURNING id, email, full_name, avatar_url, clerk_user_id`,
    [profile.clerkUserId, profile.email, profile.fullName || '', profile.avatarUrl || ''],
  )
  return (result.rows[0] as SharedUserRow | undefined) || null
}

async function createSharedUser(
  client: Pick<SQLClient, 'query'>,
  profile: ClerkProfile,
): Promise<SharedUserRow> {
  const result = await client.query(
    `INSERT INTO shared.users
       (email, password_hash, full_name, avatar_url, clerk_user_id, metadata, updated_at)
     VALUES
       ($1, '', $2, $3, $4, $5::jsonb, now())
     RETURNING id, email, full_name, avatar_url, clerk_user_id`,
    [
      profile.email,
      profile.fullName,
      profile.avatarUrl,
      profile.clerkUserId,
      JSON.stringify({ createdBy: 'clerk_bootstrap', source: 'clerk' }),
    ],
  )
  return result.rows[0] as SharedUserRow
}

async function touchSharedUser(
  client: Pick<SQLClient, 'query'>,
  user: SharedUserRow,
  profile: ClerkProfile,
) {
  await client.query(
    `UPDATE shared.users
     SET
       email = $2,
       full_name = COALESCE(NULLIF($3, ''), full_name),
       avatar_url = COALESCE(NULLIF($4, ''), avatar_url),
       updated_at = now()
     WHERE id = $1`,
    [user.id, profile.email, profile.fullName || '', profile.avatarUrl || ''],
  )
}

async function listMemberships(
  client: Pick<SQLClient, 'query'>,
  sharedUserId: number,
): Promise<AuthTenantMembership[]> {
  const result = await client.query(
    `SELECT
       tenants.id::text AS tenant_id,
       tenants.name::text AS tenant_name,
       tenants.slug::text AS tenant_slug,
       memberships.role::text AS role
     FROM shared.tenant_memberships AS memberships
     JOIN shared.tenants AS tenants
       ON tenants.id = memberships.tenant_id
     WHERE memberships.user_id = $1
       AND memberships.status = 'active'
       AND tenants.status = 'active'
     ORDER BY
       CASE memberships.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'member' THEN 3
         WHEN 'viewer' THEN 4
         ELSE 5
       END,
       tenants.id ASC`,
    [sharedUserId],
  )
  return (result.rows as TenantMembershipRow[]).map(normalizeMembership)
}

async function createInitialTenant(
  client: Pick<SQLClient, 'query'>,
  sharedUserId: number,
  profile: ClerkProfile,
): Promise<AuthTenantMembership> {
  const tenantName = getTenantName(profile)
  const baseSlug = slugify(tenantName)
  const suffix = profile.clerkUserId.slice(-8).toLowerCase().replace(/[^a-z0-9]+/g, '')
  const slug = `${baseSlug}-${suffix || sharedUserId}`

  const tenantResult = await client.query(
    `INSERT INTO shared.tenants (name, slug, status, metadata, updated_at)
     VALUES ($1, $2, 'active', $3::jsonb, now())
     ON CONFLICT (slug)
     DO UPDATE SET
       updated_at = now()
     RETURNING id, name, slug`,
    [
      tenantName,
      slug,
      JSON.stringify({
        createdBy: 'clerk_bootstrap',
        source: 'clerk',
        ownerClerkUserId: profile.clerkUserId,
      }),
    ],
  )
  const tenant = tenantResult.rows[0] as TenantRow

  await client.query(
    `INSERT INTO shared.tenant_memberships (tenant_id, user_id, role, status, metadata)
     VALUES ($1, $2, 'owner', 'active', $3::jsonb)
     ON CONFLICT (tenant_id, user_id)
     DO UPDATE SET
       role = CASE
         WHEN shared.tenant_memberships.role IN ('owner', 'admin') THEN shared.tenant_memberships.role
         ELSE EXCLUDED.role
       END,
       status = 'active',
       metadata = shared.tenant_memberships.metadata || EXCLUDED.metadata`,
    [
      tenant.id,
      sharedUserId,
      JSON.stringify({ createdBy: 'clerk_bootstrap', source: 'clerk' }),
    ],
  )

  return {
    tenantId: Number(tenant.id),
    tenantName: tenant.name,
    tenantSlug: tenant.slug,
    role: 'owner',
  }
}

export async function ensureClerkTenantBootstrap(): Promise<ClerkTenantBootstrapResult | null> {
  const profile = await getCurrentClerkProfile()
  if (!profile) return null

  return withTransaction(async (client) => {
    let user = await findUserByClerkId(client, profile.clerkUserId)
    if (!user) user = await linkUserByEmail(client, profile)
    if (!user) user = await createSharedUser(client, profile)
    else await touchSharedUser(client, user, profile)

    const sharedUserId = Number(user.id)
    let memberships = await listMemberships(client, sharedUserId)
    if (!memberships.length) {
      memberships = [await createInitialTenant(client, sharedUserId, profile)]
    }

    return {
      clerkUserId: profile.clerkUserId,
      sharedUserId,
      email: profile.email,
      fullName: profile.fullName,
      avatarUrl: profile.avatarUrl,
      memberships,
    }
  })
}
