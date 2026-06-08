import type { IntegrationConnection } from '@/products/integracoes/shared/contracts/connectionContracts'
import type { IntegrationProviderMcpCapabilities } from '@/products/integracoes/shared/providers/mcpProviderCapabilities'
import type {
  ConnectedProviderActionResult,
  ConnectedProviderApiAdapter,
} from '@/products/mcp-apps/server/domain-adapters/shared/connectedProviderApiAdapter'

function hasCredentialReference(connection: IntegrationConnection) {
  const metadata = connection.metadata || {}
  return Boolean(
    connection.secretRef ||
      metadata.secretRef ||
      metadata.oauthSecretRef ||
      metadata.credentialsSecretRef ||
      metadata.accessTokenSecretRef,
  )
}

function assertCredentials(connection: IntegrationConnection, provider: string) {
  if (hasCredentialReference(connection)) return
  throw new Error(`Credencial ausente para ${provider}. OAuth/API key deve preencher secret_ref antes de usar leitura live ou escrita.`)
}

function pendingImplementation(provider: string): never {
  throw new Error(`Adapter API de ${provider} ainda esta em skeleton pre-OAuth.`)
}

export function createCredentialPendingApiAdapter<Resource extends string, Action extends string>(
  capability: IntegrationProviderMcpCapabilities,
): ConnectedProviderApiAdapter<Resource, Action> {
  const resources = new Map(capability.resources.map((resource) => [resource.resource, resource] as const))

  return {
    provider: capability.provider,
    supportsLiveRead(resource) {
      return Boolean(resources.get(resource)?.liveRead)
    },
    supportsAction(resource, action) {
      return Boolean(resources.get(resource)?.actions.includes(action))
    },
    async listLive(input) {
      assertCredentials(input.connection, capability.provider)
      return pendingImplementation(capability.provider)
    },
    async readLive(input) {
      assertCredentials(input.connection, capability.provider)
      return pendingImplementation(capability.provider)
    },
    async executeAction(input): Promise<ConnectedProviderActionResult> {
      assertCredentials(input.connection, capability.provider)
      return {
        ok: false,
        message: `Adapter API de ${capability.provider} ainda esta em skeleton pre-OAuth.`,
        id: input.id || null,
        metadata: {
          provider: capability.provider,
          resource: input.resource,
          action: input.action,
        },
      }
    },
  }
}
