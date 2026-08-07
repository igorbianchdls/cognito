import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { assertErpTenantScopedQuery } from '../src/lib/postgres'
import { getErpModuleCapability } from '../src/products/erp/server/erpModuleRegistry'
import { getErpOperationCapability } from '../src/products/erp/server/erpOperationAccess'
import { getAiTool, listAiTools } from '../src/products/ai-platform/tools/toolRegistry'

assert.equal(getErpModuleCapability('clientes', 'read'), 'erp.cadastros.visualizar')
assert.equal(getErpModuleCapability('pedidos', 'manage'), 'erp.vendas.gerenciar')
assert.equal(getErpModuleCapability('contas-a-receber', 'read'), 'erp.financeiro.visualizar')
assert.equal(getErpOperationCapability('movimentacoes', true), 'erp.estoque.movimentar')
assert.equal(getErpOperationCapability('dre', false), 'erp.relatorios.visualizar')

assert.doesNotThrow(() => assertErpTenantScopedQuery(
  'SELECT id FROM erp.entidades WHERE tenant_id = $1',
  [10],
))
assert.throws(
  () => assertErpTenantScopedQuery('SELECT id FROM erp.entidades', []),
  /tenant/,
)
assert.throws(
  () => assertErpTenantScopedQuery('SELECT id FROM erp.entidades WHERE tenant_id = $2', [10, 20]),
  /tenant/,
)

const saleTool = getAiTool('erp_save_sale_draft')
assert(saleTool, 'Tool de venda ausente.')
assert.equal(saleTool.inputSchema.safeParse({ values: {} }).success, false)
assert.equal(saleTool.inputSchema.safeParse({
  values: {
    cliente_id: 1,
    tipo_documento: 'venda',
    itens: [{ tipo: 'produto', item_id: 2, quantidade: 1, valor_unitario: 100 }],
  },
}).success, true)

const settlementTool = getAiTool('erp_settle_receivable_prepare')
assert(settlementTool, 'Tool de baixa ausente.')
assert.equal(settlementTool.inputSchema.safeParse({ id: 1, values: {}, idempotencyKey: '12345678' }).success, true)
assert.equal(settlementTool.inputSchema.safeParse({ id: 1, values: {} }).success, false)

const toolNames = new Set(listAiTools().map((tool) => tool.name))
assert(toolNames.has('erp_search_sellers'), 'Busca de vendedores ausente.')
assert(toolNames.has('erp_save_seller'), 'Cadastro de vendedores ausente.')
for (const tool of listAiTools().filter((entry) => entry.risk === 'write-critical')) {
  assert(tool.name.endsWith('_commit'), `Tool critica sem contrato prepare/commit: ${tool.name}`)
  assert(tool.outputSchema, `Tool critica sem schema de saida: ${tool.name}`)
}

const genericRoute = readFileSync('src/app/api/erp/[entityId]/route.ts', 'utf8')
assert.match(genericRoute, /resolveErpAccess/)
assert.doesNotMatch(genericRoute, /resolveAuthTenant/)

const approvalRepository = readFileSync('src/products/ai-platform/approvals/aiApprovalRepository.ts', 'utf8')
assert.match(approvalRepository, /requested_by = \$5/)
assert.match(approvalRepository, /connection_id IS NOT DISTINCT FROM/)
assert.match(approvalRepository, /processing_attempts < 3/)

process.stdout.write('ERP security smoke: tenant, capabilities e AI contracts validos.\n')
