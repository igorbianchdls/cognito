import { resolveErpSession } from '../../server/erpAccess'
import type { ErpCapability } from '../../shared/professionalContracts'
import { ErpDomainError } from '../../shared/erpErrors'
import { erpHttpContext } from './context'

export async function resolveErpApiSession() {
  return erpHttpContext.getStore()?.session ?? await resolveErpSession()
}

export async function resolveErpApiAccess(capability: ErpCapability) {
  const session = await resolveErpApiSession()
  if (!session) throw new ErpDomainError('AUTH_REQUIRED', 'Entre na sua conta para acessar o ERP.', 401)
  if (!session.capabilities.includes(capability)) throw new ErpDomainError('ACCESS_DENIED', 'Seu perfil não permite esta operação.', 403)
  return session
}
