import type { ErpCapability, ErpAccessProfile } from '@/products/erp/shared/professionalContracts'

export type PluginCompany = {
  id: number
  name: string
  profile: ErpAccessProfile
  capabilities: ErpCapability[]
}
export type PluginPrincipal = {
  userId: number
  clerkUserId: string
  clientId: string
  scopes: string[]
  companies: PluginCompany[]
}
export class PluginError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 400) {
    super(message)
  }
}
export function selectCompany(principal: PluginPrincipal, requested?: number): PluginCompany {
  if (requested !== undefined) {
    const company = principal.companies.find(item => item.id === requested)
    if (!company) throw new PluginError('ACCESS_DENIED', 'Voce nao tem acesso a esta empresa.', 403)
    return company
  }
  if (principal.companies.length !== 1) {
    throw new PluginError('COMPANY_REQUIRED', 'Consulte meu_acesso e informe empresa_id para escolher uma das suas empresas.')
  }
  return principal.companies[0]
}

