// Guardar o que os sites mandam: eventos (no Postgres por enquanto; o BigQuery entra depois atrás desta mesma função)
// e a ligação visitante → usuário quando o site chama otto.identify.
import type { EventRow } from './bigquery'
import { doServidor } from './pg'

const COLS = ['event_id uuid', 'property_id uuid', 'workspace_id text', 'event text', '"timestamp" timestamptz', 'received_at timestamptz', 'distinct_id text', 'user_id text',
  'session_id text', 'url text', 'host text', 'path text', 'title text', 'referrer text', 'referrer_host text', 'utm_source text', 'utm_medium text', 'utm_campaign text',
  'utm_content text', 'utm_term text', 'device text', 'browser text', 'os text', 'country text', 'region text', 'screen_width int', 'language text', 'properties jsonb']
const NOMES = COLS.map(c => c.split(' ')[0]).join(', ')

export async function gravarEventos(rows: EventRow[]) {
  if (!rows.length) return
  const json = JSON.stringify(rows.map(r => ({ ...r, timestamp: r.timestamp, properties: r.properties ? JSON.parse(String(r.properties)) : null })))
  await doServidor(async db => {
    await db.query(`INSERT INTO analytics.events (${NOMES}) SELECT ${NOMES} FROM jsonb_to_recordset($1::jsonb) AS x(${COLS.join(', ')}) ON CONFLICT (event_id) DO NOTHING`, [json])
    const ids = rows.filter(r => r.user_id).map(r => ({ property_id: r.property_id, workspace_id: r.workspace_id, distinct_id: r.distinct_id, user_id: r.user_id }))
    const unicos = [...new Map(ids.map(i => [`${i.property_id}:${i.distinct_id}`, i])).values()]
    if (unicos.length) await db.query(`INSERT INTO analytics.identities (property_id, workspace_id, distinct_id, user_id)
      SELECT property_id, workspace_id, distinct_id, user_id FROM jsonb_to_recordset($1::jsonb) AS x(property_id uuid, workspace_id text, distinct_id text, user_id text)
      ON CONFLICT (property_id, distinct_id) DO UPDATE SET user_id = excluded.user_id, updated_at = now()`, [JSON.stringify(unicos)])
  })
}
