import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import { fileHash } from './service'
import { storage, type PackageStore } from './storage'

// Daily cleanup of what only grows, run after the cron bearer check with the privileged pool.
// Files of any kept version stay: only contents no version and no build points to are removed.
let pool: InstanceType<typeof Pool> | undefined
type Client = { query: (sql: string, values?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>; release?: () => void }

export async function maintainApps(connect?: () => Promise<Client>, store: PackageStore = storage) {
  if (!connect) {
    if (!process.env.SUPABASE_DB_URL) throw new Error('Apps database unavailable')
    pool ??= new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL))
    connect = () => pool!.connect()
  }
  const client = await connect()
  try {
    const count = async (sql: string) => (await client.query(sql)).rows.length
    const convertidas = await convertLegacy(client, store)
    return {
      status: 'completed',
      versoes_convertidas: convertidas,
      envios_publicos: await count("DELETE FROM apps.envios_publicos WHERE criado_em < now()-interval '1 day' RETURNING id"),
      erros_execucao: await count("DELETE FROM apps.erros_execucao WHERE ultima_em < now()-interval '90 days' RETURNING id"),
      // A day of grace: a draft being saved right now may not reference its new contents yet.
      conteudos_sem_uso: await count(`DELETE FROM apps.conteudos c WHERE c.criado_em < now()-interval '1 day'
        AND NOT EXISTS(SELECT 1 FROM apps.versao_arquivos f WHERE f.empresa_id=c.empresa_id AND f.hash=c.hash)
        AND NOT EXISTS(SELECT 1 FROM apps.versoes v WHERE v.empresa_id=c.empresa_id AND c.hash IN (v.build_js,v.build_css)) RETURNING c.hash`),
    }
  } finally { client.release?.() }
}

/** Moves packages of old versions (one JSON in Storage) to one row per file, a few per run. */
async function convertLegacy(client: Client, store: PackageStore) {
  const legacy = (await client.query(`SELECT v.empresa_id,v.app_id,v.id,a.caminho_storage,a.hash_conteudo FROM apps.versoes v JOIN apps.arquivos a ON a.empresa_id=v.empresa_id AND a.app_id=v.app_id AND a.versao_id=v.id AND a.finalidade='pacote' AND a.estado_upload='confirmado'
    WHERE v.versao_formato=1 ORDER BY v.criado_em,v.id LIMIT 5`)).rows
  let converted = 0
  for (const v of legacy) {
    const pacote = await store.get(String(v.caminho_storage), String(v.hash_conteudo)).catch(() => null)
    if (!pacote) continue
    await client.query('BEGIN')
    try {
      for (const [position, file] of pacote.arquivos.entries()) {
        const digest = fileHash(file)
        await client.query('INSERT INTO apps.conteudos(empresa_id,hash,codificacao,conteudo,tamanho) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING', [v.empresa_id, digest, file.codificacao, file.conteudo, Buffer.byteLength(file.conteudo)])
        await client.query('INSERT INTO apps.versao_arquivos(empresa_id,app_id,versao_id,caminho,posicao,hash) VALUES($1,$2,$3,$4,$5,$6)', [v.empresa_id, v.app_id, v.id, file.caminho, position, digest])
      }
      await client.query('UPDATE apps.versoes SET versao_formato=2 WHERE empresa_id=$1 AND id=$2 AND versao_formato=1', [v.empresa_id, v.id])
      await client.query('COMMIT'); converted++
    } catch { await client.query('ROLLBACK').catch(() => undefined) }
  }
  return converted
}
