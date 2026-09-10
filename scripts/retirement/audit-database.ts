import { writeFileSync } from 'node:fs'
import { config } from 'dotenv'
import { Client } from 'pg'
import { buildPostgresPoolConfig } from '../../src/lib/postgres'
import { inspectRetirementCatalog } from './catalog.mjs'

config({ path: '.env.local', quiet: true })
async function main() {
  const url = process.env.SUPABASE_DB_URL
  if (!url) throw new Error('SUPABASE_DB_URL ausente')
  const client = new Client({ ...buildPostgresPoolConfig(url), connectionTimeoutMillis: 10000, statement_timeout: 15000 })
  try {
    await client.connect()
    await client.query('BEGIN READ ONLY')
    const report = await inspectRetirementCatalog(client)
    await client.query('ROLLBACK')
    writeFileSync('docs/retirada-integracoes/etapa-6/verificacoes/database-inventory.json', JSON.stringify(report, null, 2) + '\n')
    console.log('Inventario de catalogo concluido em transacao somente leitura.')
  } finally { await client.end() }
}
main().catch(error => {
  // Do not print connection strings or SQL payloads in diagnostics.
  console.error('Auditoria indisponivel:', error.code || error.name || 'unknown')
  process.exitCode = 1
})
