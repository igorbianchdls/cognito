import assert from 'node:assert/strict'

import {
  PLUGIN_DOMAIN_TOOL_DEFINITIONS,
  PLUGIN_DOMAIN_TOOL_NAMES,
  callPluginDomainTool,
  isPluginDomainTool,
  listPluginDomainToolDefinitions,
} from '../../src/products/plugin/server/domainTools'
import { callCognitoPluginTool, listCognitoPluginTools } from '../../src/products/plugin/server/appTools'

async function main() {
  const retired = [
    'connected_erp', 'connected_erp_bigquery', 'connected_erp_api', 'connected_erp_actions',
    'connected_crm', 'connected_crm_actions', 'ecommerce_connected', 'ecommerce_connected_actions',
    'paid_media', 'social', 'analytics', 'connectors',
  ]
  const local = ['erp', 'erp_acoes', 'crm', 'ecommerce', 'sql', 'financial_statement', 'marketing', 'data_catalog']
  const definitions = listPluginDomainToolDefinitions()
  assert.deepEqual(definitions, [...PLUGIN_DOMAIN_TOOL_DEFINITIONS])
  assert.deepEqual(definitions.map(tool => tool.name).sort(), [...local].sort())
  assert.equal(new Set(definitions.map(tool => tool.name)).size, local.length)
  const publicTools = listCognitoPluginTools().tools
  for (const name of [...local, 'artifact_authoring', 'open_artifact', 'dashboards']) {
    assert(publicTools.some(tool => tool.name === name), `Ferramenta mantida ausente: ${name}`)
  }
  assert(isPluginDomainTool('sql_execution'), 'Alias local existente deve permanecer.')
  for (const name of retired) {
    assert(!publicTools.some(tool => tool.name === name), `Ferramenta retirada ainda anunciada: ${name}`)
    assert(!Object.values(PLUGIN_DOMAIN_TOOL_NAMES).includes(name as never))
    assert(!isPluginDomainTool(name))
    // Chamada direta não pode alcançar banco ou provedor, mesmo fora da listagem.
    await assert.rejects(() => callPluginDomainTool(name, {}), /Tool de dominio desconhecida/)
    const result = await callCognitoPluginTool(name, {})
    assert.equal(result.isError, true, `Dispatcher público aceitou ferramenta retirada: ${name}`)
  }
  process.stdout.write(`Plugin local: ${local.length} ferramentas mantidas; ${retired.length} ferramentas externas rejeitadas.\n`)
}

main().catch(error => { console.error(error); process.exitCode = 1 })
