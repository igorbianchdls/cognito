import assert from 'node:assert/strict'

import { assertErpTenantScopedQuery } from '../src/lib/postgres'
import { runWithErpDatabaseContext } from '../src/lib/erpDatabaseContext'
import { getErpModuleCapability } from '../src/products/erp/server/erpModuleRegistry'
import { getErpOperationCapability } from '../src/products/erp/server/erpOperationAccess'

assert.equal(getErpModuleCapability('clientes', 'read'), 'erp.cadastros.visualizar')
assert.equal(getErpModuleCapability('pedidos', 'manage'), 'erp.vendas.gerenciar')
assert.equal(getErpModuleCapability('contas-a-receber', 'read'), 'erp.financeiro.visualizar')
assert.equal(getErpOperationCapability('movimentacoes', true), 'erp.estoque.movimentar')
assert.equal(getErpOperationCapability('dre', false), 'erp.relatorios.visualizar')

assert.doesNotThrow(() => runWithErpDatabaseContext({ tenantId: 10, userId: 20 }, () => assertErpTenantScopedQuery(
  'SELECT id FROM erp.entidades WHERE empresa_id = $1', [10],
)))
assert.throws(
  () => runWithErpDatabaseContext({ tenantId: 10, userId: 20 }, () => assertErpTenantScopedQuery('SELECT id FROM erp.entidades', [])),
  /empresa/,
)
assert.throws(
  () => runWithErpDatabaseContext({ tenantId: 10, userId: 20 }, () => assertErpTenantScopedQuery('SELECT id FROM erp.entidades WHERE empresa_id = $2', [10, 20])),
  /empresa/,
)
assert.throws(
  () => runWithErpDatabaseContext({ tenantId: 10, userId: 20 }, () => assertErpTenantScopedQuery('SELECT id FROM erp.entidades WHERE empresa_id = $1', [11])),
  /diferente/,
)

process.stdout.write('ERP security smoke: isolamento de tenant e permissoes validos.\n')
