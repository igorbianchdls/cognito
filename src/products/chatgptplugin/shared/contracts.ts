import type { ErpCapability, ErpAccessProfile } from '@/products/erp/shared/professionalContracts'

export type PluginCompany = {
  id: number
  name: string
  profile: ErpAccessProfile
  capabilities: ErpCapability[]
  /** Fuso IANA da empresa; ausente em principais de teste (usa America/Sao_Paulo). */
  timeZone?: string
}
export type PluginPrincipal = {
  userId: number
  clerkUserId: string
  clientId: string
  scopes: string[]
  companies: PluginCompany[]
  // Exibidos no perfil da conexão (openai/profile); ausentes em principais de teste.
  name?: string | null
  email?: string | null
}
export class PluginError extends Error {
  // reason vai somente para os logs do servidor; a resposta pública usa code e message.
  // fields vai na resposta para o modelo corrigir os argumentos sozinho.
  constructor(public readonly code: string, message: string, public readonly status = 400, public readonly reason?: string,
    public readonly fields?: { campo: string; motivo: string }[]) {
    super(message)
  }
}
export function selectCompany(principal: PluginPrincipal, requested?: number): PluginCompany {
  if (requested !== undefined) {
    const company = principal.companies.find(item => item.id === requested)
    if (!company) throw new PluginError('ACCESS_DENIED', 'Você não tem acesso a esta empresa.', 403)
    return company
  }
  if (principal.companies.length !== 1) {
    throw new PluginError('COMPANY_REQUIRED', 'Consulte meu_acesso e informe empresa_id para escolher uma das suas empresas.')
  }
  return principal.companies[0]
}

