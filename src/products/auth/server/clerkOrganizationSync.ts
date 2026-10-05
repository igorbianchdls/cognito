import { withTransaction, type SQLClient } from '@/lib/postgres'
import { clerkClient } from '@clerk/nextjs/server'
import { syncSharedUser } from './clerkTenantBootstrap'
import type { AuthTenantRole } from '@/products/auth/shared/authContracts'

type JsonRecord = Record<string, unknown>

type ClerkOrganizationMirror = {
  id: string
  name: string
  slug: string | null
  metadata: JsonRecord
}

type ClerkMembershipMirror = {
  clerkMembershipId: string | null
  clerkOrganizationId: string
  clerkRole: string | null
  clerkUserId: string
  email: string | null
  fullName: string | null
  avatarUrl: string | null
  role: AuthTenantRole
  status: 'active' | 'suspended'
}

type ClerkInvitationMirror = {
  clerkInvitationId: string
  clerkOrganizationId: string
  email: string
  role: AuthTenantRole
  status: 'pending' | 'accepted' | 'revoked' | 'expired'
  metadata: JsonRecord
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function asRecordOrNull(value: unknown): JsonRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : null
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
  return slug || 'workspace'
}

function normalizeRole(value: unknown, metadata: JsonRecord = {}): AuthTenantRole {
  const appRole = toText(metadata.appRole)
  if (appRole === 'owner' || appRole === 'admin' || appRole === 'member' || appRole === 'viewer') return appRole

  const role = toText(value)
  if (role === 'org:admin' || role === 'admin') return 'admin'
  if (role === 'org:member' || role === 'member') return 'member'
  if (role === 'viewer') return 'viewer'
  if (role === 'owner') return 'owner'
  return 'member'
}

function normalizeInvitationStatus(value: unknown): ClerkInvitationMirror['status'] {
  const status = toText(value).toLowerCase()
  if (status === 'accepted' || status === 'revoked' || status === 'expired') return status
  return 'pending'
}

function getOrganizationFromPayload(data: JsonRecord) {
  return asRecordOrNull(data.organization) || asRecordOrNull(data.public_organization_data) || data
}

function normalizeOrganization(data: JsonRecord): ClerkOrganizationMirror | null {
  const org = getOrganizationFromPayload(data)
  if (!org) return null

  const id = toText(org.id) || toText(data.organization_id)
  const name = toText(org.name) || toText(data.name) || 'Workspace'
  if (!id) return null

  const publicMetadata = asRecord(org.public_metadata)
  const privateMetadata = asRecord(org.private_metadata)
  return {
    id,
    name,
    slug: toText(org.slug) || null,
    metadata: {
      clerkOrganizationId: id,
      clerkOrganizationSlug: toText(org.slug) || null,
      clerkPublicMetadata: publicMetadata,
      clerkPrivateMetadata: privateMetadata,
      source: 'clerk_organization',
    },
  }
}

function getPublicUserData(data: JsonRecord) {
  return asRecord(data.public_user_data)
}

function normalizeMembership(data: JsonRecord, deleted = false): ClerkMembershipMirror | null {
  const org = getOrganizationFromPayload(data)
  const metadata = asRecord(data.public_metadata)
  const privateMetadata = asRecord(data.private_metadata)
  const publicUser = getPublicUserData(data)
  const organizationId = toText(data.organization_id) || toText(org?.id)
  const clerkUserId = toText(data.user_id) || toText(publicUser.user_id)
  if (!organizationId || !clerkUserId) return null

  const firstName = toText(publicUser.first_name)
  const lastName = toText(publicUser.last_name)
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || toText(publicUser.name) || null

  return {
    avatarUrl: toText(publicUser.image_url) || toText(publicUser.profile_image_url) || null,
    clerkMembershipId: toText(data.id) || null,
    clerkOrganizationId: organizationId,
    clerkRole: toText(data.role) || null,
    clerkUserId,
    email: toText(publicUser.identifier) || toText(publicUser.email_address) || null,
    fullName,
    role: normalizeRole(data.role, { ...metadata, ...privateMetadata }),
    status: deleted ? 'suspended' : 'active',
  }
}

function normalizeInvitation(data: JsonRecord): ClerkInvitationMirror | null {
  const org = getOrganizationFromPayload(data)
  const organizationId = toText(data.organization_id) || toText(org?.id)
  const invitationId = toText(data.id)
  const email = toText(data.email_address) || toText(data.email)
  if (!organizationId || !invitationId || !email) return null

  const metadata = asRecord(data.public_metadata)
  return {
    clerkInvitationId: invitationId,
    clerkOrganizationId: organizationId,
    email,
    metadata: {
      clerkPublicMetadata: metadata,
      source: 'clerk_organization_invitation',
    },
    role: normalizeRole(data.role, metadata),
    status: normalizeInvitationStatus(data.status),
  }
}

export async function syncClerkOrganization(
  client: Pick<SQLClient, 'query'>,
  data: JsonRecord,
): Promise<number | null> {
  const organization = normalizeOrganization(data)
  if (!organization) return null

  const tenantId = Number(organization.metadata.clerkPrivateMetadata && asRecord(organization.metadata.clerkPrivateMetadata).tenantId)
  if (Number.isFinite(tenantId) && tenantId > 0) {
    const updated = await client.query(
      `UPDATE shared.empresas
       SET
         name = $2,
         slug = COALESCE($3, slug),
         clerk_organization_id = $4,
         clerk_organization_slug = $3,
         metadata = COALESCE(metadata, '{}'::jsonb) || $5::jsonb,
         updated_at = now()
       WHERE id = $1 AND (clerk_organization_id IS NULL OR clerk_organization_id=$4)
       RETURNING id`,
      [tenantId, organization.name, organization.slug, organization.id, JSON.stringify(organization.metadata)],
    )
    if (updated.rows[0]?.id) return Number(updated.rows[0].id)
    throw new Error('Referencia de empresa no Clerk invalida ou em conflito.')
  }

  const result = await client.query(
    `INSERT INTO shared.empresas
       (name, slug, status, clerk_organization_id, clerk_organization_slug, metadata, updated_at)
     VALUES
       ($1, $2, 'active', $3, $4, $5::jsonb, now())
     ON CONFLICT (clerk_organization_id)
     DO UPDATE SET
       name = EXCLUDED.name,
       slug = COALESCE(EXCLUDED.slug, shared.empresas.slug),
       status = shared.empresas.status,
       clerk_organization_slug = EXCLUDED.clerk_organization_slug,
       metadata = COALESCE(shared.empresas.metadata, '{}'::jsonb) || EXCLUDED.metadata,
       updated_at = now()
     RETURNING id`,
    [
      organization.name,
      organization.slug || `${slugify(organization.name)}-${organization.id.slice(-8).toLowerCase()}`,
      organization.id,
      organization.slug,
      JSON.stringify(organization.metadata),
    ],
  )
  return Number(result.rows[0]?.id || 0) || null
}

async function ensureWebhookUser(
  client: Pick<SQLClient, 'query'>,
  membership: ClerkMembershipMirror,
): Promise<number | null> {
  const existing = await client.query(
    `SELECT id
     FROM shared.usuarios
     WHERE clerk_user_id = $1
     LIMIT 1`,
    [membership.clerkUserId],
  )
  if (existing.rows[0]?.id) return Number(existing.rows[0].id)
  // Membership identifiers are not proof of a verified primary email.
  const user = await (await clerkClient()).users.getUser(membership.clerkUserId)
  const email = user.primaryEmailAddress || user.emailAddresses[0]
  if (!email) throw new Error('Usuario Clerk sem email principal.')
  const row = await syncSharedUser(client,{
    clerkUserId: user.id,clerkOrganizationId: null,email: email.emailAddress,
    emailVerified: email.verification?.status==='verified',fullName: user.fullName || null,avatarUrl: user.imageUrl || null,
  })
  return Number(row.id)
}

export async function syncClerkOrganizationMembership(
  client: Pick<SQLClient, 'query'>,
  data: JsonRecord,
  options: { deleted?: boolean } = {},
): Promise<boolean> {
  const membership = normalizeMembership(data, options.deleted)
  if (!membership) return false

  const tenantResult = await client.query(
    `SELECT id,metadata,proprietario_definido
     FROM shared.empresas
     WHERE clerk_organization_id = $1
     LIMIT 1`,
    [membership.clerkOrganizationId],
  )
  const tenantId = Number(tenantResult.rows[0]?.id || 0)
  if (!tenantId) return false
  // Onboarding can race the default org:admin membership webhook. The owner
  // supplied by our Backend API establishes ownership once; stale metadata
  // must never restore ownership after a later, explicit local transfer.
  const company=tenantResult.rows[0]
  const metadata=asRecord(company.metadata)
  const firstOwner=toText(metadata.ownerClerkUserId)||toText(asRecord(metadata.clerkPrivateMetadata).ownerClerkUserId)
  if(!company.proprietario_definido && firstOwner===membership.clerkUserId)membership.role='owner'

  const userId = await ensureWebhookUser(client, membership)
  if (!userId) return false

  if (options.deleted) {
    await client.query(`UPDATE shared.empresas e SET status='suspended',updated_at=now()
      WHERE e.id=$1 AND e.status='active' AND EXISTS(SELECT 1 FROM shared.usuarios_empresas WHERE empresa_id=$1 AND usuario_id=$2 AND role='owner' AND status='active')
      AND NOT EXISTS(SELECT 1 FROM shared.usuarios_empresas WHERE empresa_id=$1 AND usuario_id<>$2 AND role='owner' AND status='active')`,[tenantId,userId])
  }

  await client.query(
    `INSERT INTO shared.usuarios_empresas
       (empresa_id, usuario_id, role, status, clerk_organization_id, clerk_membership_id, clerk_role, metadata, updated_at)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, now())
     ON CONFLICT (empresa_id, usuario_id)
     DO UPDATE SET
       role = CASE
         WHEN shared.usuarios_empresas.metadata->>'accessRoleManaged'='true' THEN shared.usuarios_empresas.role
         WHEN shared.usuarios_empresas.role = 'owner'
           AND EXCLUDED.role <> 'owner'
           THEN shared.usuarios_empresas.role
         ELSE EXCLUDED.role
       END,
       status = CASE WHEN shared.usuarios_empresas.suspenso_localmente THEN 'suspended' ELSE EXCLUDED.status END,
       perfil_acesso_id = CASE WHEN EXCLUDED.role NOT IN ('owner','admin') AND shared.usuarios_empresas.role NOT IN ('owner','admin')
         THEN shared.usuarios_empresas.perfil_acesso_id
         WHEN EXCLUDED.role NOT IN ('owner','admin') AND shared.usuarios_empresas.metadata->>'accessRoleManaged' IS DISTINCT FROM 'true' THEN 'consulta'
         ELSE shared.usuarios_empresas.perfil_acesso_id END,
       clerk_organization_id = EXCLUDED.clerk_organization_id,
       clerk_membership_id = COALESCE(EXCLUDED.clerk_membership_id, shared.usuarios_empresas.clerk_membership_id),
       clerk_role = EXCLUDED.clerk_role,
       metadata = COALESCE(shared.usuarios_empresas.metadata, '{}'::jsonb) || EXCLUDED.metadata,
       updated_at = now()`,
    [
      tenantId,
      userId,
      membership.role,
      membership.status,
      membership.clerkOrganizationId,
      membership.clerkMembershipId,
      membership.clerkRole,
      JSON.stringify({
        clerkMembershipId: membership.clerkMembershipId,
        clerkRole: membership.clerkRole,
        source: 'clerk_organization_membership',
      }),
    ],
  )
  return true
}

export async function syncClerkOrganizationInvitation(
  client: Pick<SQLClient, 'query'>,
  data: JsonRecord,
): Promise<boolean> {
  const invitation = normalizeInvitation(data)
  if (!invitation) return false

  const tenantResult = await client.query(
    `SELECT id
     FROM shared.empresas
     WHERE clerk_organization_id = $1
     LIMIT 1`,
    [invitation.clerkOrganizationId],
  )
  const tenantId = Number(tenantResult.rows[0]?.id || 0) || null
  if (!tenantId) throw new Error('Empresa do convite nao encontrada.')

  await client.query(
    `INSERT INTO shared.convites_empresa
       (empresa_id, clerk_organization_id, clerk_invitation_id, email, role, status, metadata, updated_at,perfil_acesso_id,expira_em,convidado_por)
     VALUES
       ($1, $2, $3, $4, $5, $6, $7::jsonb, now(),$8,$9,
        (SELECT id FROM shared.usuarios WHERE clerk_user_id=$10))
     ON CONFLICT (clerk_invitation_id)
     DO UPDATE SET
       empresa_id = COALESCE(EXCLUDED.empresa_id, shared.convites_empresa.empresa_id),
       email = EXCLUDED.email,
       role = EXCLUDED.role,
       status = EXCLUDED.status,
       expira_em = EXCLUDED.expira_em,
       perfil_acesso_id = EXCLUDED.perfil_acesso_id,
       metadata = COALESCE(shared.convites_empresa.metadata, '{}'::jsonb) || EXCLUDED.metadata,
       updated_at = now()`,
    [
      tenantId,
      invitation.clerkOrganizationId,
      invitation.clerkInvitationId,
      invitation.email.trim().toLowerCase(),
      invitation.role,
      invitation.status,
      JSON.stringify(invitation.metadata),
      ['owner','admin'].includes(invitation.role) ? 'administrador' : 'consulta',
      Number.isFinite(Number(data.expires_at)) && Number(data.expires_at)>0 ? new Date(Number(data.expires_at)).toISOString() : null,
      toText(data.inviter_id),
    ],
  )
  return true
}

export async function markClerkOrganizationDeleted(clerkOrganizationId: string): Promise<boolean> {
  return withTransaction(client=>markClerkOrganizationDeletedWithClient(client,clerkOrganizationId))
}

export async function markClerkOrganizationDeletedWithClient(client: Pick<SQLClient,'query'>,clerkOrganizationId: string): Promise<boolean> {
  const id = toText(clerkOrganizationId)
  if (!id) return false

  {
    const result = await client.query(
      `UPDATE shared.empresas
       SET
         status = 'disabled',
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('clerkDeleted', true, 'clerkDeletedAt', now()),
         updated_at = now()
       WHERE clerk_organization_id = $1
       RETURNING id`,
      [id],
    )
    const tenantId = result.rows[0]?.id
    if (!tenantId) return false

    await client.query(
      `UPDATE shared.usuarios_empresas
       SET
         status = 'suspended',
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('suspendedBy', 'clerk_organization_deleted', 'suspendedAt', now()),
         updated_at = now()
       WHERE empresa_id = $1`,
      [tenantId],
    )
    return true
  }
}
