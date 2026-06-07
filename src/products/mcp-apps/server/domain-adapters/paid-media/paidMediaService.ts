import { executeGenericConnectedTool } from '@/products/mcp-apps/server/domain-adapters/shared/connectedDomainService'
import {
  getPaidMediaAdapter,
  listPaidMediaAdapterProviders,
} from '@/products/mcp-apps/server/domain-adapters/paid-media/paidMediaAdapterRegistry'
import { PAID_MEDIA_RESOURCES } from '@/products/mcp-apps/server/domain-adapters/paid-media/paidMediaTypes'
import type { CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'

export function executePaidMediaTool(args: unknown, context: CognitoMcpServerContext = {}) {
  return executeGenericConnectedTool(args, context, {
    tool: 'paid_media',
    integrationDomain: 'advertising',
    resources: PAID_MEDIA_RESOURCES,
    getAdapter: getPaidMediaAdapter,
    listAdapterProviders: listPaidMediaAdapterProviders,
  })
}
