import type { AuthTenantRole } from '../shared/authContracts'
import { ERP_CAPABILITIES, type ErpCapability } from '@/products/erp/shared/professionalContracts'

export function effectiveCapabilities(role: AuthTenantRole | string, capabilities: readonly string[]): ErpCapability[] {
  if (role === 'owner' || role === 'admin') return [...ERP_CAPABILITIES]
  return ERP_CAPABILITIES.filter(capability => capabilities.includes(capability)
    && (role !== 'viewer' || capability.endsWith('.visualizar')))
}
