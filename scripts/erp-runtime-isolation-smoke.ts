import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

import { config } from 'dotenv'
import { Client } from 'pg'

import { buildPostgresPoolConfig, closePool, runQuery } from '../src/lib/postgres'
import { runWithErpDatabaseContext } from '../src/lib/erpDatabaseContext'
import { listManagementOperation, searchErpOperationsCatalog } from '../src/products/erp/server/erpManagementRepository'
import { listStockOperation } from '../src/products/erp/server/erpStockRepository'

config({ path: '.env.local' })
assert(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL nao configurada.')

const poolConfig = buildPostgresPoolConfig(process.env.SUPABASE_DB_URL)
assert.equal(poolConfig.ssl && typeof poolConfig.ssl === 'object' && 'rejectUnauthorized' in poolConfig.ssl
  ? poolConfig.ssl.rejectUnauthorized
  : false, true, 'TLS precisa validar o certificado do Supabase.')

async function main() {
  const client = new Client(poolConfig)
  await client.connect()
  try {
  const role = await client.query(`SELECT rolbypassrls FROM pg_roles WHERE rolname = 'erp_runtime'`)
  assert.equal(role.rows[0]?.rolbypassrls, false, 'erp_runtime nao pode ignorar RLS.')

  const membership = await client.query(`
    SELECT memberships.tenant_id, memberships.user_id
    FROM shared.tenant_memberships AS memberships
    WHERE memberships.status = 'active'
    ORDER BY memberships.tenant_id, memberships.user_id
    LIMIT 1
  `)
  assert(membership.rows[0], 'Nenhuma associacao ativa para testar o isolamento.')
  const tenantId = Number(membership.rows[0].tenant_id)
  const userId = Number(membership.rows[0].user_id)

  await client.query('BEGIN')
  await client.query('SET LOCAL ROLE erp_runtime')
  await client.query(`SELECT set_config('app.erp_tenant_id', $1, true), set_config('app.erp_user_id', $2, true)`, [String(tenantId), String(userId)])
  const ownRows = await client.query(`SELECT count(*)::int AS total FROM erp.entidades WHERE tenant_id = $1`, [tenantId])
  assert(Number.isInteger(ownRows.rows[0]?.total), 'Consulta do tenant autenticado falhou.')

  const crossTenantId = tenantId + 1_000_000_000
  const crossRows = await client.query(`SELECT count(*)::int AS total FROM erp.entidades WHERE tenant_id = $1`, [crossTenantId])
  assert.equal(crossRows.rows[0]?.total, 0, 'RLS permitiu leitura fora do tenant configurado.')
  await client.query('ROLLBACK')

  await runWithErpDatabaseContext({ tenantId, userId }, async () => {
    const appRows = await runQuery(`SELECT id::text FROM erp.entidades WHERE tenant_id = $1 LIMIT 1`, [tenantId])
    assert(Array.isArray(appRows), 'Pipeline restrito da aplicacao nao conseguiu consultar o tenant.')
    await assert.rejects(
      () => runQuery(`SELECT id::text FROM erp.entidades WHERE tenant_id = $1 LIMIT 1`, [crossTenantId]),
      /diferente/,
    )
    const managementResources = ['contratos', 'fluxo-de-caixa', 'dre', 'conciliacao-bancaria', 'transferencias-financeiras', 'importacoes', 'aging-receber', 'aging-pagar', 'giro-estoque']
    const stockResources = ['posicao-estoque', 'movimentacoes', 'locais-estoque', 'inventarios', 'transferencias', 'kits', 'conversoes-unidades']
    const catalogSources = ['products', 'services', 'customers', 'accounts', 'locations', 'payments'] as const
    const pages = await Promise.all([
      ...managementResources.map((resource) => listManagementOperation(tenantId, resource, { page: 1, pageSize: 10, query: '' })),
      ...stockResources.map((resource) => listStockOperation(tenantId, resource, { page: 1, pageSize: 10, query: '' })),
    ])
    assert(pages.every((page) => page.pageSize === 10))
    const catalogs = await Promise.all(catalogSources.map((source) => searchErpOperationsCatalog({ tenantId, source, query: '', limit: 10 })))
    assert(catalogs.every((records) => records.length <= 10))
  })

  const migration = readFileSync('supabase/migrations/20260811123000_separate_sale_fulfillment_and_fiscal_status.sql', 'utf8')
  assert.match(migration, /atendimento_status/)
  assert.match(migration, /fiscal_status/)
  assert.doesNotMatch(migration, /status IN \([^)]*faturada/)
  process.stdout.write('ERP runtime isolation smoke: TLS, RLS e estados separados validos.\n')
  } finally {
    await closePool()
    await client.query('ROLLBACK').catch(() => undefined)
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
