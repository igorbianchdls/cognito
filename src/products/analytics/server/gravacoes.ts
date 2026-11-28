// Gravações de sessão (rrweb): os sites mandam pedaços numerados; guardamos comprimidos e devolvemos inteiros para o
// reprodutor. A gravação só começa se o site ligou e o sorteio da amostra escolheu a sessão.
import { gunzipSync, gzipSync } from 'node:zlib'
import { z } from 'zod'
import { AnalyticsError, doServidor, type Db } from './pg'

export const MAX_PEDACO = 1024 * 1024
export const pedacoSchema = z.object({
  k: z.string().regex(/^otto_[0-9a-f]{32}$/),
  d: z.string().min(1).max(100),
  s: z.string().min(1).max(100),
  seq: z.number().int().min(0).max(5000),
  url: z.string().max(2000).optional(),
  eventos: z.array(z.object({ type: z.number().int(), timestamp: z.number() }).passthrough()).min(1).max(5000),
}).strict()
export type Pedaco = z.infer<typeof pedacoSchema>

/** Grava um pedaço (o servidor: a chave pública e o domínio já foram conferidos). */
export async function gravarPedaco(p: { id: string; workspace_id: string }, pedaco: Pedaco) {
  const dados = gzipSync(Buffer.from(JSON.stringify(pedaco.eventos)))
  const ts = pedaco.eventos.map(e => e.timestamp).filter(Number.isFinite)
  const inicio = new Date(Math.min(...ts)), fim = new Date(Math.max(...ts))
  await doServidor(async db => {
    await db.query(`INSERT INTO analytics.recordings (session_id, property_id, workspace_id, distinct_id, started_at, ended_at, first_url, chunks, bytes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 1, $8)
      ON CONFLICT (property_id, session_id) DO UPDATE SET started_at = LEAST(analytics.recordings.started_at, excluded.started_at),
        ended_at = GREATEST(analytics.recordings.ended_at, excluded.ended_at), chunks = analytics.recordings.chunks + 1, bytes = analytics.recordings.bytes + excluded.bytes,
        first_url = COALESCE(analytics.recordings.first_url, excluded.first_url)
      WHERE analytics.recordings.bytes < 50000000`, [pedaco.s, p.id, p.workspace_id, pedaco.d, inicio.toISOString(), fim.toISOString(), pedaco.url ?? null, dados.length])
    await db.query(`INSERT INTO analytics.recording_chunks (property_id, session_id, seq, data) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`, [p.id, pedaco.s, pedaco.seq, dados])
  })
}

/** As gravações do site (como a pessoa), com quem e quantas páginas e cliques teve a sessão. */
export async function listarGravacoes(db: Db, propertyId: string, o: { pessoa?: string; pagina?: number }) {
  const limite = 30, pagina = Math.max(0, o.pagina ?? 0)
  const rows = await db.query(`SELECT r.session_id AS sessao, r.distinct_id AS visitante, COALESCE(i.user_id, r.distinct_id) AS pessoa, r.started_at AS inicio, r.ended_at AS fim,
      extract(epoch FROM r.ended_at - r.started_at)::int AS duracao_s, r.first_url AS url, r.chunks AS pedacos, r.bytes,
      (SELECT count(*) FROM analytics.events e WHERE e.property_id = r.property_id AND e.session_id = r.session_id AND e.event = '$pageview')::int AS paginas,
      (SELECT count(*) FROM analytics.events e WHERE e.property_id = r.property_id AND e.session_id = r.session_id AND e.event IN ('$autocapture', '$rageclick'))::int AS cliques,
      (SELECT count(*) FROM analytics.events e WHERE e.property_id = r.property_id AND e.session_id = r.session_id AND e.event = '$rageclick')::int AS raiva,
      (SELECT e.device FROM analytics.events e WHERE e.property_id = r.property_id AND e.session_id = r.session_id LIMIT 1) AS aparelho,
      (SELECT e.country FROM analytics.events e WHERE e.property_id = r.property_id AND e.session_id = r.session_id LIMIT 1) AS pais
    FROM analytics.recordings r LEFT JOIN analytics.identities i ON i.property_id = r.property_id AND i.distinct_id = r.distinct_id
    WHERE r.property_id = $1 AND ($2::text IS NULL OR COALESCE(i.user_id, r.distinct_id) = $2)
    ORDER BY r.started_at DESC LIMIT ${limite + 1} OFFSET ${pagina * limite}`, [propertyId, o.pessoa ?? null])
  return { gravacoes: rows.slice(0, limite), mais: rows.length > limite }
}

/** Todos os eventos de uma gravação, em ordem, mais os eventos do Analytics da mesma sessão (para a linha do tempo). */
export async function lerGravacao(db: Db, propertyId: string, sessao: string) {
  const [r] = await db.query('SELECT session_id, distinct_id, started_at, ended_at, first_url FROM analytics.recordings WHERE property_id = $1 AND session_id = $2', [propertyId, sessao])
  if (!r) throw new AnalyticsError('Gravação não encontrada.', 404)
  const pedacos = await db.query<{ data: Buffer }>('SELECT data FROM analytics.recording_chunks WHERE property_id = $1 AND session_id = $2 ORDER BY seq', [propertyId, sessao])
  const eventos = pedacos.flatMap(p => { try { return JSON.parse(gunzipSync(p.data).toString()) as { timestamp: number }[] } catch { return [] } }).sort((a, b) => a.timestamp - b.timestamp)
  const marcos = await db.query(`SELECT e."timestamp" AS quando, e.event AS evento, e.path AS pagina, e.properties ->> 'texto' AS texto FROM analytics.events e
    WHERE e.property_id = $1 AND e.session_id = $2 AND e.event <> '$pageleave' ORDER BY e."timestamp" LIMIT 500`, [propertyId, sessao])
  return { gravacao: r, eventos, marcos }
}

export async function apagarGravacao(db: Db, propertyId: string, sessao: string) {
  const r = await db.query('DELETE FROM analytics.recordings WHERE property_id = $1 AND session_id = $2 RETURNING session_id', [propertyId, sessao])
  if (!r.length) throw new AnalyticsError('Gravação não encontrada (ou seu perfil só pode visualizar).', 404)
  return { ok: true }
}

/** Limpeza diária: eventos com mais de ~2 anos e gravações com mais de 30 dias. */
export const limpar = () => doServidor(db => db.query('SELECT analytics.limpar() AS r'))
