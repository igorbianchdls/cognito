import { PluginError } from '../../shared/contracts'
import type { PluginConfig } from '../../shared/config'

// RFC 9728. Hosts use only the first authorization server and require resource equal to the connector URL.
export function resourceMetadataFor(config: () => PluginConfig) {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
  try {
    const c = config()
    return Response.json({ resource: c.resource, authorization_servers: [c.issuer], scopes_supported: [c.scope, 'erp:write'], bearer_methods_supported: ['header'], resource_name: 'Cognito ERP' }, { headers })
  } catch (error) {
    const failure = error instanceof PluginError ? error : new PluginError('CONFIGURATION_REQUIRED', 'Configure o MCP.', 503)
    return Response.json({ error: failure.code, message: failure.message }, { status: failure.status, headers })
  }
}
export function metadataOptions() {
  return new Response(null, { status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, MCP-Protocol-Version' } })
}
