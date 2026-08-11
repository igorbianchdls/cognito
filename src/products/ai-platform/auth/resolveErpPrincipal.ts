import { runQuery } from '@/lib/postgres'
import { setErpDatabaseContext } from '@/lib/erpDatabaseContext'
import type { AiPrincipal } from '@/products/ai-platform/shared/types'
import { ERP_CAPABILITIES, type ErpCapability } from '@/products/erp/shared/professionalContracts'

type PrincipalRow = {
  tenant_id: string | number
  tenant_name: string
  tenant_slug: string | null
  user_id: string | number
  role: string
  erp_profile_id: string
  capabilities: ErpCapability[] | null
}

async function loadPrincipal(input: {
  clerkUserId?: string
  clerkOrganizationId?: string
  email?: string
  organizationSlug?: string
}) {
  const rows = await runQuery<PrincipalRow>(
    `SELECT tenants.id AS tenant_id, tenants.name AS tenant_name, tenants.slug AS tenant_slug,
       users.id AS user_id, memberships.role, memberships.erp_profile_id,
       COALESCE(array_agg(permissions.capability) FILTER (WHERE permissions.capability IS NOT NULL), ARRAY[]::text[]) AS capabilities
     FROM shared.users AS users
     JOIN shared.tenant_memberships AS memberships
       ON memberships.user_id = users.id AND memberships.status = 'active'
     JOIN shared.tenants AS tenants
       ON tenants.id = memberships.tenant_id AND tenants.status = 'active'
     LEFT JOIN shared.erp_profile_permissions AS permissions
       ON permissions.profile_id = memberships.erp_profile_id
     WHERE ($1::text IS NULL OR users.clerk_user_id = $1)
       AND ($2::text IS NULL OR tenants.clerk_organization_id = $2)
       AND ($3::text IS NULL OR lower(users.email::text) = lower($3))
       AND ($4::text IS NULL OR tenants.slug = $4 OR tenants.clerk_organization_slug = $4)
     GROUP BY tenants.id, users.id, memberships.role, memberships.erp_profile_id
     LIMIT 2`,
    [input.clerkUserId || null, input.clerkOrganizationId || null, input.email || null, input.organizationSlug || null],
  )
  if (rows.length !== 1) return null
  return rows[0]
}

function normalizePrincipal(
  row: PrincipalRow,
  input: {
    clerkUserId: string
    clerkOrganizationId: string
    scopes?: string[]
    clientId?: string
    connectionId?: number | null
    writeEnabled?: boolean
  },
): AiPrincipal {
  const capabilities = row.role === 'owner' || row.role === 'admin'
    ? [...ERP_CAPABILITIES]
    : row.capabilities || []
  const principal = {
    tenantId: Number(row.tenant_id),
    tenantName: row.tenant_name,
    tenantSlug: row.tenant_slug,
    userId: Number(row.user_id),
    clerkUserId: input.clerkUserId,
    clerkOrganizationId: input.clerkOrganizationId,
    role: row.role,
    capabilities,
    scopes: input.scopes || [],
    clientId: input.clientId || 'internal-cli',
    connectionId: input.connectionId || null,
    writeEnabled: input.writeEnabled ?? false,
  }
  setErpDatabaseContext({ tenantId: principal.tenantId, userId: principal.userId })
  return principal
}

export async function resolveErpPrincipal(input: {
  clerkUserId: string
  clerkOrganizationId: string
  scopes?: string[]
  clientId?: string
  connectionId?: number | null
  writeEnabled?: boolean
}) {
  const row = await loadPrincipal(input)
  return row ? normalizePrincipal(row, input) : null
}

export async function resolveInternalCliPrincipal(input: { email: string; organizationSlug: string }) {
  if (process.env.NODE_ENV === 'production') throw new Error('A CLI interna nao pode ser usada em producao.')
  const row = await loadPrincipal(input)
  if (!row) return null
  return normalizePrincipal(row, {
    clerkUserId: `cli:${input.email}`,
    clerkOrganizationId: `cli:${input.organizationSlug}`,
    scopes: ['internal:cli'],
    clientId: 'otto-cli-internal',
    writeEnabled: true,
  })
}
