import { executeGenericConnectedTool } from '@/products/mcp-apps/server/domain-adapters/shared/connectedDomainService'
import {
  getAnalyticsAdapter,
  listAnalyticsAdapterProviders,
} from '@/products/mcp-apps/server/domain-adapters/analytics/analyticsAdapterRegistry'
import { ANALYTICS_RESOURCES } from '@/products/mcp-apps/server/domain-adapters/analytics/analyticsTypes'
import type { CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'

export function executeAnalyticsTool(args: unknown, context: CognitoMcpServerContext = {}) {
  return executeGenericConnectedTool(args, context, {
    tool: 'analytics',
    integrationDomain: 'analytics',
    resources: ANALYTICS_RESOURCES,
    getAdapter: getAnalyticsAdapter,
    listAdapterProviders: listAnalyticsAdapterProviders,
  })
}
