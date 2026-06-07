import { executeGenericConnectedTool } from '@/products/mcp-apps/server/domain-adapters/shared/connectedDomainService'
import {
  getSocialAdapter,
  listSocialAdapterProviders,
} from '@/products/mcp-apps/server/domain-adapters/social/socialAdapterRegistry'
import { SOCIAL_RESOURCES } from '@/products/mcp-apps/server/domain-adapters/social/socialTypes'
import type { CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'

export function executeSocialTool(args: unknown, context: CognitoMcpServerContext = {}) {
  return executeGenericConnectedTool(args, context, {
    tool: 'social',
    integrationDomain: 'social',
    resources: SOCIAL_RESOURCES,
    getAdapter: getSocialAdapter,
    listAdapterProviders: listSocialAdapterProviders,
  })
}
