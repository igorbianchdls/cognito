#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

function main() {
  const capabilities = read('src/products/integracoes/shared/providers/mcpProviderCapabilities.ts')
  for (const provider of ['omie', 'conta_azul', 'bling', 'hubspot', 'pipedrive', 'salesforce', 'bitrix24', 'rd_station_crm']) {
    assert(capabilities.includes(`provider: '${provider}'`) || capabilities.includes(`'${provider}'`), `capability ausente: ${provider}`)
  }
  for (const resource of ['contas-a-receber', 'pedidos-venda', 'oportunidades', 'atividades']) {
    assert(capabilities.includes(resource), `resource MCP ausente nas capabilities: ${resource}`)
  }
  for (const action of ['baixar', 'estornar', 'mover_estagio', 'ganhar', 'perder']) {
    assert(capabilities.includes(action), `action MCP ausente nas capabilities: ${action}`)
  }

  const erpRegistry = read('src/products/mcp-apps/server/domain-adapters/erp/erpApiAdapterRegistry.ts')
  const crmRegistry = read('src/products/mcp-apps/server/domain-adapters/crm/crmApiAdapterRegistry.ts')
  assert(erpRegistry.includes('preOAuthErpApiAdapters'), 'registry API ERP nao usa skeleton pre-OAuth')
  assert(crmRegistry.includes('preOAuthCrmApiAdapters'), 'registry API CRM nao usa skeleton pre-OAuth')

  const domainTools = read('src/products/mcp-apps/server/domainTools.ts')
  assert(domainTools.includes('createIntegrationMcpActionAudit'), 'actions MCP nao gravam audit')
  assert(domainTools.includes('listar_live') && domainTools.includes('ler_live'), 'actions live nao estao expostas')

  const route = read('src/app/api/integracoes/connections/[id]/mcp-permissions/route.ts')
  assert(route.includes('assertCanManageIntegrationConnection'), 'rota de permissoes sem authz')
  assert(route.includes('liveReadResources'), 'rota de permissoes sem liveReadResources')

  const migration38 = read('scripts/sql/38_integracoes_mcp_live_read_permissions.sql')
  const migration39 = read('scripts/sql/39_integracoes_mcp_action_audit.sql')
  assert(migration38.includes('live_read_resources'), 'migration 38 sem live_read_resources')
  assert(migration39.includes('mcp_action_audit'), 'migration 39 sem mcp_action_audit')

  console.log('connected pre-oauth smoke ok')
}

main()
