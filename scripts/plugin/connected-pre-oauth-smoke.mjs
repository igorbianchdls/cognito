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
  const capabilities = read('src/products/integracoes/shared/providers/pluginProviderCapabilities.ts')
  for (const provider of ['omie', 'conta_azul', 'bling', 'hubspot', 'pipedrive', 'salesforce', 'bitrix24', 'rd_station_crm']) {
    assert(capabilities.includes(`provider: '${provider}'`) || capabilities.includes(`'${provider}'`), `capability ausente: ${provider}`)
  }
  for (const resource of ['contas-a-receber', 'pedidos-venda', 'oportunidades', 'atividades']) {
    assert(capabilities.includes(resource), `resource Plugin ausente nas capabilities: ${resource}`)
  }
  for (const action of ['baixar', 'estornar', 'mover_estagio', 'ganhar', 'perder']) {
    assert(capabilities.includes(action), `action Plugin ausente nas capabilities: ${action}`)
  }

  const erpRegistry = read('src/products/plugin/server/domain-adapters/erp/erpApiAdapterRegistry.ts')
  const crmRegistry = read('src/products/plugin/server/domain-adapters/crm/crmApiAdapterRegistry.ts')
  assert(erpRegistry.includes('providers/omieErpApiAdapter'), 'registry API ERP deve usar adapter real do Omie')
  assert(erpRegistry.includes('providers/blingErpApiAdapter'), 'registry API ERP deve usar adapter real do Bling')
  assert(erpRegistry.includes('providers/contaAzulErpApiAdapter'), 'registry API ERP deve usar adapter real da Conta Azul')
  assert(crmRegistry.includes('preOAuthCrmApiAdapters'), 'registry API CRM nao usa skeleton pre-OAuth')

  const domainTools = read('src/products/plugin/server/domainTools.ts')
  assert(domainTools.includes('createIntegrationPluginActionAudit'), 'actions Plugin nao gravam audit')
  assert(domainTools.includes('listar_live') && domainTools.includes('ler_live'), 'actions live nao estao expostas')

  const bigQueryReader = read('src/products/plugin/server/domain-adapters/shared/connectedBigQueryReader.ts')
  assert(!bigQueryReader.includes('readResources.length > 0'), 'connected_erp leitura BigQuery nao deve liberar qualquer recurso quando ha permissoes parciais')

  const bigQueryErpAdapter = read('src/products/plugin/server/domain-adapters/erp/providers/createBigQueryErpAdapter.ts')
  assert(bigQueryErpAdapter.includes("resource: 'pedidos-venda',\n      table: 'vendas'"), 'connected_erp pedidos-venda deve ler tabela normalized vendas')
  assert(bigQueryErpAdapter.includes("resource: 'estoque-atual',\n      table: 'estoque_atual'"), 'connected_erp estoque-atual deve ler tabela normalized estoque_atual')
  assert(bigQueryErpAdapter.includes("resource: 'servicos',\n      table: 'servicos'"), 'connected_erp servicos deve mapear tabela normalized servicos')
  assert(bigQueryErpAdapter.includes("resource: 'contratos',\n      table: 'contratos'"), 'connected_erp contratos deve mapear tabela normalized contratos')

  const normalizationContracts = read('src/products/integracoes/datawarehouse/normalization/contracts.ts')
  assert(normalizationContracts.includes("| 'servicos'"), 'normalizacao deve declarar tabela servicos')
  assert(normalizationContracts.includes("| 'contratos'"), 'normalizacao deve declarar tabela contratos')
  const contaAzulNormalizer = read('src/products/integracoes/datawarehouse/normalization/providers/contaAzulNormalizer.ts')
  assert(contaAzulNormalizer.includes("servicos: 'servicos'"), 'normalizer Conta Azul deve normalizar servicos')
  assert(contaAzulNormalizer.includes("contratos: 'contratos'"), 'normalizer Conta Azul deve normalizar contratos')
  const omieNormalizer = read('src/products/integracoes/datawarehouse/normalization/providers/omieNormalizer.ts')
  assert(omieNormalizer.includes("departamentos: 'centros_custo'"), 'normalizer Omie deve normalizar departamentos como centros_custo')
  assert(omieNormalizer.includes("servicos: 'servicos'"), 'normalizer Omie deve normalizar servicos')
  assert(omieNormalizer.includes("contratos: 'contratos'"), 'normalizer Omie deve normalizar contratos')

  const omieApiAdapter = read('src/products/plugin/server/domain-adapters/erp/providers/omieErpApiAdapter.ts')
  assert(omieApiAdapter.includes("provider: 'omie'"), 'adapter API real Omie deve declarar provider')
  assert(omieApiAdapter.includes('IncluirCliente'), 'adapter API real Omie deve implementar criar cliente')
  assert(omieApiAdapter.includes('LancarPagamento'), 'adapter API real Omie deve implementar baixa de conta a pagar')
  assert(omieApiAdapter.includes('LancarRecebimento'), 'adapter API real Omie deve implementar baixa de conta a receber')
  const blingNormalizer = read('src/products/integracoes/datawarehouse/normalization/providers/blingNormalizer.ts')
  assert(blingNormalizer.includes("servicos: 'servicos'"), 'normalizer Bling deve normalizar servicos')
  assert(blingNormalizer.includes("notas_fiscais: 'notas_fiscais'"), 'normalizer Bling deve normalizar notas_fiscais')
  assert(blingNormalizer.includes("notas_servico: 'notas_fiscais_servico'"), 'normalizer Bling deve normalizar notas_servico')
  const blingApiAdapter = read('src/products/plugin/server/domain-adapters/erp/providers/blingErpApiAdapter.ts')
  assert(blingApiAdapter.includes("provider: 'bling'"), 'adapter API real Bling deve declarar provider')
  assert(blingApiAdapter.includes("'/contas/receber'"), 'adapter API real Bling deve mapear contas a receber')
  assert(blingApiAdapter.includes("'/pedidos/vendas'"), 'adapter API real Bling deve mapear pedidos de venda')

  const route = read('src/app/api/integracoes/connections/[id]/plugin-permissions/route.ts')
  assert(route.includes('assertCanManageIntegrationConnection'), 'rota de permissoes sem authz')
  assert(route.includes('liveReadResources'), 'rota de permissoes sem liveReadResources')

  const migration38 = read('scripts/sql/38_integracoes_plugin_live_read_permissions.sql')
  const migration39 = read('scripts/sql/39_integracoes_plugin_action_audit.sql')
  assert(migration38.includes('live_read_resources'), 'migration 38 sem live_read_resources')
  assert(migration39.includes('plugin_action_audit'), 'migration 39 sem plugin_action_audit')

  console.log('connected pre-oauth smoke ok')
}

main()
