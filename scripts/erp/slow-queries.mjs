// Consultas do ERP mais lentas no banco configurado (pg_stat_statements). Somente leitura: não lê dados de
// clientes, só o texto normalizado das consultas (sem valores) e os tempos. Uso: pnpm erp:slow-queries [limite]
import { readFileSync, existsSync } from 'node:fs'
import pg from 'pg'

const env = existsSync('.env.local') ? Object.fromEntries(readFileSync('.env.local', 'utf8').split(/\r?\n/)
  .map(line => /^([A-Z0-9_]+)=(.*)$/.exec(line)).filter(Boolean).map(m => [m[1], m[2].replace(/^"|"$/g, '')])) : {}
const url = process.env.SUPABASE_DB_URL || env.SUPABASE_DB_URL
if (!url) { console.error('Configure SUPABASE_DB_URL.'); process.exit(1) }
const limit = Math.min(50, Math.max(1, Number(process.argv[2]) || 15))
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, statement_timeout: 15000 })
await client.connect()
try {
  await client.query('BEGIN READ ONLY')
  const { rows } = await client.query(`SELECT calls, round(mean_exec_time::numeric, 1) AS media_ms, round(max_exec_time::numeric) AS max_ms,
      round(total_exec_time::numeric) AS total_ms, left(regexp_replace(query, '\\s+', ' ', 'g'), 180) AS consulta
    FROM pg_stat_statements WHERE query ~* '\\merp\\.' AND query !~* 'pg_stat_statements'
    ORDER BY mean_exec_time DESC LIMIT $1`, [limit])
  console.log(JSON.stringify({ geradoEm: new Date().toISOString(), acimaDe1s: rows.filter(r => Number(r.media_ms) > 1000).length, consultas: rows }, null, 2))
} finally { await client.query('ROLLBACK').catch(() => {}); await client.end() }
