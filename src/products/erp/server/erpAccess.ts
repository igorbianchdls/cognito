import { runQuery } from '@/lib/postgres'
import { setErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import type { AuthTenantContext } from '@/products/auth/shared/authContracts'
import { type ErpAccessProfile, type ErpCapability } from '@/products/erp/shared/professionalContracts'
import { effectiveCapabilities } from '@/products/auth/server/accessPolicy'

export type ErpAccessContext = AuthTenantContext & {
  erpProfile: ErpAccessProfile
  capabilities: ErpCapability[]
}

export async function resolveErpSession(): Promise<ErpAccessContext | null> {
  const tenant = await resolveAuthTenant({ access: 'read' })
  if (!tenant) return null

  const rows = await runQuery<{ perfil_acesso_id: ErpAccessProfile; capabilities: ErpCapability[] | null }>(
    `SELECT memberships.perfil_acesso_id,
       COALESCE(array_agg(permissions.capability) FILTER (WHERE permissions.capability IS NOT NULL), ARRAY[]::text[]) AS capabilities
     FROM shared.usuarios_empresas AS memberships
     LEFT JOIN shared.permissoes_perfil AS permissions
       ON permissions.perfil_acesso_id = memberships.perfil_acesso_id
     WHERE memberships.empresa_id = $1 AND memberships.usuario_id = $2 AND memberships.status = 'active'
     GROUP BY memberships.perfil_acesso_id`,
    [tenant.tenantId, tenant.sharedUserId],
  )
  const profile = rows[0]?.perfil_acesso_id || (tenant.role === 'owner' || tenant.role === 'admin' ? 'administrador' : 'consulta')
  if (!rows[0]) return null
  const capabilities = effectiveCapabilities(tenant.role, rows[0].capabilities || [])
  setErpDatabaseContext({ tenantId: tenant.tenantId, userId: tenant.sharedUserId })
  return { ...tenant, erpProfile: profile, capabilities }
}

export async function resolveErpAccess(capability: ErpCapability): Promise<ErpAccessContext | null> {
  const session = await resolveErpSession()
  return session?.capabilities.includes(capability) ? session : null
}
