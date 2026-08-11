import { readFileSync } from 'node:fs'

import pg from 'pg'

function loadLocalEnv() {
  const source = readFileSync('.env.local', 'utf8')
  for (const line of source.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match || process.env[match[1]]) continue
    process.env[match[1]] = match[2].trim().replace(/^['"]|['"]$/g, '')
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

loadLocalEnv()
assert(process.env.SUPABASE_DB_URL, 'SUPABASE_DB_URL nao configurada.')

const connection = new URL(process.env.SUPABASE_DB_URL)
for (const key of ['sslmode', 'sslrootcert', 'sslcert', 'sslkey']) connection.searchParams.delete(key)
const client = new pg.Client({
  connectionString: connection.toString(),
  ssl: { ca: readFileSync('certificates/supabase-prod-ca-2021.crt', 'utf8'), rejectUnauthorized: true },
})
await client.connect()

try {
  await client.query('BEGIN')
  const structure = await client.query(`
    SELECT
      to_regclass('erp.fornecedores_produtos') IS NOT NULL AS fornecedores_produtos,
      to_regclass('erp.notas_fiscais_totais') IS NOT NULL AS notas_fiscais_totais,
      to_regclass('erp.cadastros_eventos') IS NOT NULL AS cadastros_eventos,
      to_regclass('erp.vendas_eventos') IS NOT NULL AS vendas_eventos,
      EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'erp' AND indexname = 'fornecedores_produtos_codigo_unico_idx'
      ) AS vinculo_unico
  `)
  for (const [name, present] of Object.entries(structure.rows[0])) {
    assert(present, `Estrutura ausente: ${name}`)
  }

  const tenant = await client.query('SELECT id FROM shared.tenants ORDER BY id LIMIT 1')
  assert(tenant.rows[0], 'Nenhum tenant disponivel para o smoke test.')
  const tenantId = tenant.rows[0].id
  const category = await client.query(`
    INSERT INTO erp.categorias (tenant_id, nome, tipo, ativo)
    VALUES ($1, $2, 'geral', true)
    RETURNING id, versao
  `, [tenantId, `SMOKE-${Date.now()}`])
  assert(Number(category.rows[0].versao) === 1, 'Versao inicial da categoria invalida.')

  const updated = await client.query(`
    UPDATE erp.categorias SET nome = nome || '-EDITADA', versao = versao + 1
    WHERE tenant_id = $1 AND id = $2 AND versao = 1
    RETURNING versao
  `, [tenantId, category.rows[0].id])
  assert(Number(updated.rows[0]?.versao) === 2, 'Atualizacao otimista nao incrementou a versao.')

  const stale = await client.query(`
    UPDATE erp.categorias SET nome = nome || '-INVALIDA', versao = versao + 1
    WHERE tenant_id = $1 AND id = $2 AND versao = 1
    RETURNING id
  `, [tenantId, category.rows[0].id])
  assert(stale.rows.length === 0, 'Uma versao obsoleta conseguiu sobrescrever o registro.')

  console.log('ERP foundation smoke: OK')
} finally {
  await client.query('ROLLBACK').catch(() => undefined)
  await client.end()
}
