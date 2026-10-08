import { PluginError } from '@/products/mcpcore/shared/contracts'
import { getClaudePluginConfig } from '../shared/config'

// RFC 9728: o Claude usa só o primeiro authorization_server e exige resource igual à URL do conector.
export function resourceMetadata() {
  const headers = { 'Access-Control-Allow-Origin':'*','Cache-Control':'no-store' }
  try {
    const config = getClaudePluginConfig()
    return Response.json({ resource:config.resource,authorization_servers:[config.issuer],
      scopes_supported:[config.scope,'erp:write'],bearer_methods_supported:['header'],resource_name:'Cognito ERP' },{headers})
  } catch (error) {
    const failure = error instanceof PluginError ? error : new PluginError('CONFIGURATION_REQUIRED','Configure o MCP.',503)
    return Response.json({error:failure.code,message:failure.message},{status:failure.status,headers})
  }
}
export function metadataOptions() {
  return new Response(null,{ status:204,headers:{ 'Access-Control-Allow-Origin':'*',
    'Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Headers':'Content-Type, MCP-Protocol-Version' } })
}
