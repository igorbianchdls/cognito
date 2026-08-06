import { runQuery } from '@/lib/postgres'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import type { AuthTenantContext } from '@/products/auth/shared/authContracts'
import { ERP_CAPABILITIES, type ErpAccessProfile, type ErpCapability } from '@/products/erp/shared/professionalContracts'

export type ErpAccessContext = AuthTenantContext & {
  erpProfile: ErpAccessProfile
  capabilities: ErpCapability[]
}

export async function resolveErpSession(): Promise<ErpAccessContext | null> {
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return null

  const rows = await runQuery<{ erp_profile_id: ErpAccessProfile; capabilities: ErpCapability[] | null }>(
    `SELECT memberships.erp_profile_id,
       COALESCE(array_agg(permissions.capability) FILTER (WHERE permissions.capability IS NOT NULL), ARRAY[]::text[]) AS capabilities
     FROM shared.tenant_memberships AS memberships
     LEFT JOIN shared.erp_profile_permissions AS permissions
       ON permissions.profile_id = memberships.erp_profile_id
     WHERE memberships.tenant_id = $1 AND memberships.user_id = $2 AND memberships.status = 'active'
     GROUP BY memberships.erp_profile_id`,
    [tenant.tenantId, tenant.sharedUserId],
  )
  const profile = rows[0]?.erp_profile_id || (tenant.role === 'owner' || tenant.role === 'admin' ? 'administrador' : 'consulta')
  const capabilities = tenant.role === 'owner' || tenant.role === 'admin'
    ? [...ERP_CAPABILITIES]
    : rows[0]?.capabilities || []
  return { ...tenant, erpProfile: profile, capabilities }
}

export async function resolveErpAccess(capability: ErpCapability): Promise<ErpAccessContext | null> {
  const session = await resolveErpSession()
  return session?.capabilities.includes(capability) ? session : null
}
