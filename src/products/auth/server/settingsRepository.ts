import { runQuery, withTransaction } from '@/lib/postgres'
import type {
  SettingsMember,
  SettingsProfile,
  SettingsState,
  SettingsWorkspace,
  UpdateMemberInput,
  UpdateWorkspaceInput,
  WorkspaceMemberStatus,
} from '@/products/auth/shared/settingsContracts'
import type { AuthTenantRole } from '@/products/auth/shared/authContracts'

type SettingsRow = {
  avatar_url: string | null
  clerk_user_id: string | null
  email: string
  full_name: string | null
  role: string
  status: string
  tenant_id: string | number
  tenant_name: string
  tenant_slug: string | null
  tenant_status: string
  user_id: string | number
}

function normalizeRole(value: unknown): AuthTenantRole {
  return value === 'admin' || value === 'member' || value === 'viewer' ? value : 'owner'
}

function normalizeStatus(value: unknown): WorkspaceMemberStatus {
  return value === 'invited' || value === 'suspended' ? value : 'active'
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeWorkspaceSlug(value: string) {
  const slug = slugify(value)
  if (slug.length < 2) throw new Error('Slug deve ter pelo menos 2 caracteres.')
  if (slug.length > 80) throw new Error('Slug deve ter no maximo 80 caracteres.')
  return slug
}

export function normalizeWorkspaceName(value: string) {
  const name = String(value || '').trim().replace(/\s+/g, ' ')
  if (name.length < 2) throw new Error('Nome deve ter pelo menos 2 caracteres.')
  if (name.length > 120) throw new Error('Nome deve ter no maximo 120 caracteres.')
  return name
}

export function normalizeFullName(value: string) {
  const name = String(value || '').trim().replace(/\s+/g, ' ')
  if (name.length < 2) throw new Error('Nome deve ter pelo menos 2 caracteres.')
  if (name.length > 120) throw new Error('Nome deve ter no maximo 120 caracteres.')
  return name
}

function toMember(row: SettingsRow): SettingsMember {
  return {
    avatarUrl: row.avatar_url,
    email: row.email,
    fullName: row.full_name,
    role: normalizeRole(row.role),
    status: normalizeStatus(row.status),
    userId: Number(row.user_id),
  }
}

export async function getSettingsState(input: {
  sharedUserId: number
  tenantId: number
}): Promise<SettingsState> {
  const rows = await runQuery<SettingsRow>(
    `SELECT
       users.id::text AS user_id,
       users.email::text AS email,
       users.full_name::text AS full_name,
       users.avatar_url::text AS avatar_url,
       users.clerk_user_id::text AS clerk_user_id,
       tenants.id::text AS tenant_id,
       tenants.name::text AS tenant_name,
       tenants.slug::text AS tenant_slug,
       tenants.status::text AS tenant_status,
       memberships.role::text AS role,
       memberships.status::text AS status
     FROM shared.tenant_memberships AS memberships
     JOIN shared.users AS users
       ON users.id = memberships.user_id
     JOIN shared.tenants AS tenants
       ON tenants.id = memberships.tenant_id
     WHERE memberships.tenant_id = $1
     ORDER BY
       CASE memberships.role
         WHEN 'owner' THEN 1
         WHEN 'admin' THEN 2
         WHEN 'member' THEN 3
         WHEN 'viewer' THEN 4
         ELSE 5
       END,
       users.full_name ASC NULLS LAST,
       users.email ASC`,
    [input.tenantId],
  )

  const current = rows.find((row) => Number(row.user_id) === input.sharedUserId)
  if (!current) throw new Error('Usuario nao tem acesso ao workspace.')

  const profile: SettingsProfile = {
    avatarUrl: current.avatar_url,
    clerkUserId: current.clerk_user_id || '',
    email: current.email,
    fullName: current.full_name,
    sharedUserId: Number(current.user_id),
  }

  const workspace: SettingsWorkspace = {
    id: Number(current.tenant_id),
    name: current.tenant_name,
    slug: current.tenant_slug,
    status: current.tenant_status,
  }

  return {
    currentUserRole: normalizeRole(current.role),
    members: rows.map(toMember),
    profile,
    workspace,
  }
}

export async function updateSharedUserProfile(input: {
  avatarUrl?: string | null
  fullName: string
  sharedUserId: number
}): Promise<SettingsProfile> {
  const fullName = normalizeFullName(input.fullName)
  const rows = await runQuery<SettingsRow>(
    `UPDATE shared.users
     SET
       full_name = $2,
       avatar_url = COALESCE($3, avatar_url),
       metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('updatedBy', 'settings_profile', 'updatedAt', now()),
       updated_at = now()
     WHERE id = $1
     RETURNING
       id::text AS user_id,
       email::text AS email,
       full_name::text AS full_name,
       avatar_url::text AS avatar_url,
       clerk_user_id::text AS clerk_user_id,
       0::text AS tenant_id,
       ''::text AS tenant_name,
       NULL::text AS tenant_slug,
       ''::text AS tenant_status,
       'owner'::text AS role,
       'active'::text AS status`,
    [input.sharedUserId, fullName, input.avatarUrl || null],
  )
  const row = rows[0]
  if (!row) throw new Error('Usuario nao encontrado.')
  return {
    avatarUrl: row.avatar_url,
    clerkUserId: row.clerk_user_id || '',
    email: row.email,
    fullName: row.full_name,
    sharedUserId: Number(row.user_id),
  }
}

export async function updateWorkspace(input: {
  tenantId: number
  values: UpdateWorkspaceInput
}): Promise<SettingsWorkspace> {
  const name = normalizeWorkspaceName(input.values.name)
  const slug = normalizeWorkspaceSlug(input.values.slug)
  const rows = await runQuery<{
    id: string | number
    name: string
    slug: string | null
    status: string
  }>(
    `UPDATE shared.tenants
     SET
       name = $2,
       slug = $3,
       metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('updatedBy', 'settings_workspace', 'updatedAt', now()),
       updated_at = now()
     WHERE id = $1
     RETURNING id, name, slug, status`,
    [input.tenantId, name, slug],
  )
  const row = rows[0]
  if (!row) throw new Error('Workspace nao encontrado.')
  return {
    id: Number(row.id),
    name: row.name,
    slug: row.slug,
    status: row.status,
  }
}

export async function updateWorkspaceMember(input: {
  actorUserId: number
  tenantId: number
  values: UpdateMemberInput
}): Promise<SettingsMember> {
  const role = input.values.role ? normalizeRole(input.values.role) : undefined
  const status = input.values.status ? normalizeStatus(input.values.status) : undefined
  if (!role && !status) throw new Error('Nada para atualizar.')

  return withTransaction(async (client) => {
    if (role && input.values.userId === input.actorUserId && role !== 'owner') {
      const ownerCount = await client.query(
        `SELECT count(*)::int AS total
         FROM shared.tenant_memberships
         WHERE tenant_id = $1
           AND role = 'owner'
           AND status = 'active'`,
        [input.tenantId],
      )
      if (Number(ownerCount.rows[0]?.total || 0) <= 1) {
        throw new Error('Workspace precisa manter pelo menos um owner ativo.')
      }
    }

    const result = await client.query(
      `UPDATE shared.tenant_memberships
       SET
         role = COALESCE($3, role),
         status = COALESCE($4, status),
         metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('updatedBy', 'settings_members', 'updatedAt', now()),
         updated_at = now()
       WHERE tenant_id = $1
         AND user_id = $2
       RETURNING tenant_id`,
      [input.tenantId, input.values.userId, role || null, status || null],
    )
    if (!result.rows[0]) throw new Error('Membro nao encontrado.')

    const memberRows = await client.query(
      `SELECT
         users.id::text AS user_id,
         users.email::text AS email,
         users.full_name::text AS full_name,
         users.avatar_url::text AS avatar_url,
         users.clerk_user_id::text AS clerk_user_id,
         memberships.tenant_id::text AS tenant_id,
         ''::text AS tenant_name,
         NULL::text AS tenant_slug,
         ''::text AS tenant_status,
         memberships.role::text AS role,
         memberships.status::text AS status
       FROM shared.tenant_memberships AS memberships
       JOIN shared.users AS users
         ON users.id = memberships.user_id
       WHERE memberships.tenant_id = $1
         AND memberships.user_id = $2
       LIMIT 1`,
      [input.tenantId, input.values.userId],
    )
    return toMember(memberRows.rows[0] as SettingsRow)
  })
}
