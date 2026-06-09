import { executeGenericConnectedTool } from '@/products/plugin/server/domain-adapters/shared/connectedDomainService'
import {
  getEcommerceConnectedAdapter,
  listEcommerceConnectedAdapterProviders,
} from '@/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedAdapterRegistry'
import { ECOMMERCE_CONNECTED_RESOURCES } from '@/products/plugin/server/domain-adapters/ecommerce-connected/ecommerceConnectedTypes'
import type { CognitoMcpServerContext } from '@/products/mcp/server/cognitoMcpServer'

export function executeEcommerceConnectedTool(args: unknown, context: CognitoMcpServerContext = {}) {
  return executeGenericConnectedTool(args, context, {
    tool: 'ecommerce_connected',
    integrationDomain: 'ecommerce',
    resources: ECOMMERCE_CONNECTED_RESOURCES,
    getAdapter: getEcommerceConnectedAdapter,
    listAdapterProviders: listEcommerceConnectedAdapterProviders,
  })
}
