import { ensureClerkTenantBootstrap } from '@/products/auth/server/clerkTenantBootstrap'
import type {
  AuthTenantContext,
  AuthTenantMembership,
  AuthTenantRole,
} from '@/products/auth/shared/authContracts'

type AccessKind = 'read' | 'manage'

function normalizeTenantId(value: unknown): number | null {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function authRoleCanAccess(role: AuthTenantRole | string, access: AccessKind) {
  if (access === 'read') return ['owner', 'admin', 'member', 'viewer'].includes(role)
  return ['owner', 'admin'].includes(role)
}

export async function resolveAuthTenant(options?: {
  requestedTenantId?: unknown
  access?: AccessKind
}): Promise<AuthTenantContext | null> {
  const bootstrap = await ensureClerkTenantBootstrap()
  if (!bootstrap) return null

  const requestedTenantId = normalizeTenantId(options?.requestedTenantId)
  const membership: AuthTenantMembership | undefined = requestedTenantId
    ? bootstrap.memberships.find((item) => item.tenantId === requestedTenantId)
    : bootstrap.memberships[0]

  if (!membership) return null
  if (!authRoleCanAccess(membership.role, options?.access || 'read')) return null

  return {
    authMode: 'clerk',
    clerkUserId: bootstrap.clerkUserId,
    sharedUserId: bootstrap.sharedUserId,
    email: bootstrap.email,
    fullName: bootstrap.fullName,
    avatarUrl: bootstrap.avatarUrl,
    clerkMembershipId: membership.clerkMembershipId,
    clerkOrganizationId: membership.clerkOrganizationId,
    clerkOrganizationSlug: membership.clerkOrganizationSlug,
    tenantId: membership.tenantId,
    tenantName: membership.tenantName,
    tenantSlug: membership.tenantSlug,
    role: membership.role,
  }
}

export async function getClerkTenantBootstrapState() {
  return ensureClerkTenantBootstrap()
}
