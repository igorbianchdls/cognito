#!/usr/bin/env node
// Imports sound effects from Epidemic Sound into the Marketing library: the MP3 goes to the private bucket
// "sound-effects" (<category>/<Epidemic title>.mp3) and a row to marketing.sound_effects, with the Epidemic title
// and tags exactly as Epidemic has them. Running it again only adds what is missing (dedupe by the Epidemic id).
//
//   EPIDEMIC_SOUND_MCP_API_KEY=… SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=… \
//     node scripts/marketing/import-sound-effects.mjs [--apply] [--only=transicoes,impactos]
//
// Without --apply it only lists what it would import.

const MCP_URL = 'https://www.epidemicsound.com/a/mcp-service/mcp'
const BUCKET = 'sound-effects'

/** Category (bucket folder) → how many effects, longest duration, and the Epidemic searches that fill it. */
export const CATEGORIES = {
  transicoes: { count: 100, maxMs: 3000, terms: ['whoosh', 'swoosh', 'swipe transition', 'short riser', 'reverse transition', 'glitch transition', 'whoosh transition fast', 'swish', 'zoom transition', 'tape rewind', 'air whoosh', 'cinematic whoosh', 'digital transition', 'flyby'] },
  impactos: { count: 60, maxMs: 3000, terms: ['hit impact', 'boom', 'punch', 'bass drop', 'cinematic impact', 'thud', 'slam', 'sub drop', 'braam', 'drum hit', 'stomp'] },
  interface: { count: 60, maxMs: 3000, terms: ['click', 'tap', 'pop', 'notification', 'typing', 'camera shutter', 'user interface swipe', 'scroll', 'button', 'message sent', 'bubble pop', 'toggle', 'beep'] },
  texto: { count: 60, maxMs: 3000, terms: ['pop up', 'ding', 'sparkle', 'bling', 'text whoosh', 'title reveal', 'shimmer', 'magic', 'pluck', 'chime', 'stinger', 'appear'] },
  comicos: { count: 60, maxMs: 5000, terms: ['boing', 'record scratch', 'fail trombone', 'slide whistle', 'cartoon', 'laugh', 'crowd ohh', 'crowd aww', 'cartoon run', 'squeak', 'gasp', 'crickets', 'bonk', 'honk'] },
  risers: { count: 40, maxMs: 8000, terms: ['riser', 'build up', 'suspense', 'drumroll', 'countdown', 'tension', 'uplifter', 'ticking clock', 'heartbeat'] },
  sucesso: { count: 40, maxMs: 5000, terms: ['cash register', 'coin', 'level up', 'success chime', 'applause', 'crowd cheer', 'win', 'achievement', 'money', 'celebration'] },
  erro: { count: 25, maxMs: 3000, terms: ['buzzer', 'wrong answer', 'alarm', 'glitch', 'error beep', 'warning', 'denied'] },
  ambientes: { count: 25, minMs: 10000, maxMs: 30000, terms: ['office ambience', 'cafe ambience', 'city street ambience', 'nature ambience', 'rain', 'restaurant ambience', 'beach waves', 'crowd ambience'] },
  objetos: { count: 30, maxMs: 5000, terms: ['footsteps', 'door', 'paper', 'phone vibrate', 'keyboard typing', 'zipper', 'glass clink', 'pen writing', 'bag', 'water splash'] },
}

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const only = args.find(a => a.startsWith('--only='))?.slice(7).split(',')

const env = name => { const v = process.env[name]; if (!v) throw new Error(`${name} ausente`); return v }
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ---------- Epidemic Sound (MCP over streamable HTTP) ----------

const epidemicKey = env('EPIDEMIC_SOUND_MCP_API_KEY')
let session = null, nextId = 1
async function rpc(method, params, notification = false) {
  const body = notification ? { jsonrpc: '2.0', method, params } : { jsonrpc: '2.0', id: nextId++, method, params }
  const response = await fetch(MCP_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${epidemicKey}`, 'content-type': 'application/json', accept: 'application/json, text/event-stream',
      'mcp-protocol-version': '2025-06-18', ...(session ? { 'mcp-session-id': session } : {}),
    },
    body: JSON.stringify(body),
  })
  if (!response.ok) throw new Error(`Epidemic ${method}: HTTP ${response.status}`)
  session ??= response.headers.get('mcp-session-id')
  if (notification) return null
  const text = await response.text()
  const line = text.split('\n').filter(l => l.startsWith('data: ') && l.length > 6).pop()
  const message = JSON.parse(line ? line.slice(6) : text)
  if (message.error) throw new Error(`Epidemic ${method}: ${message.error.message}`)
  return message.result
}
async function connect() {
  await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'cognito-import', version: '1.0' } })
  await rpc('notifications/initialized', undefined, true)
}
/** Calls an Epidemic tool and returns its GraphQL data; waits and retries when Epidemic says RETRY_LATER. */
async function tool(name, args, attempt = 0) {
  const result = await rpc('tools/call', { name, arguments: args })
  const payload = JSON.parse(result.content[0].text)
  const error = payload.errors?.[0]
  if (error) {
    if (error.extensions?.code === 'RETRY_LATER' && attempt < 5) { await sleep(1000 * (error.extensions.retryAfterSeconds ?? 10)); return tool(name, args, attempt + 1) }
    throw new Error(`Epidemic ${name}: ${error.message}`)
  }
  return payload.data
}

// ---------- Supabase (service role: storage + marketing.sound_effects) ----------

const supabaseUrl = env('SUPABASE_URL'), serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')
const sbHeaders = { apikey: serviceKey, authorization: `Bearer ${serviceKey}` }
async function existingRows() {
  const response = await fetch(`${supabaseUrl}/rest/v1/sound_effects?select=storage_path,category,source_id`, { headers: { ...sbHeaders, 'accept-profile': 'marketing' } })
  if (!response.ok) throw new Error(`Supabase: HTTP ${response.status} ${await response.text()}`)
  return response.json()
}
const objectUrl = path => `${supabaseUrl}/storage/v1/object/${BUCKET}/${path.split('/').map(encodeURIComponent).join('/')}`
async function upload(path, bytes) {
  const response = await fetch(objectUrl(path), { method: 'POST', headers: { ...sbHeaders, 'content-type': 'audio/mpeg', 'x-upsert': 'true' }, body: bytes })
  if (!response.ok) throw new Error(`Storage ${path}: HTTP ${response.status} ${await response.text()}`)
}
async function insertRow(row) {
  const response = await fetch(`${supabaseUrl}/rest/v1/sound_effects?on_conflict=source,source_id`, {
    method: 'POST',
    headers: { ...sbHeaders, 'content-type': 'application/json', 'content-profile': 'marketing', prefer: 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(row),
  })
  if (!response.ok) throw new Error(`Supabase ${row.storage_path}: HTTP ${response.status} ${await response.text()}`)
}

// ---------- selection ----------

/** A file name the bucket accepts: the Epidemic title as is, only characters Storage refuses become "-". */
const fileName = title => title.replace(/[^\p{L}\p{N} _.,;:!@$&'()=+-]/gu, '-').replace(/\s+/g, ' ').trim()

async function candidates(term, minMs, maxMs, after) {
  const data = await tool('SearchSoundEffects', { query: { term }, filter: { duration: { min: minMs ?? null, max: maxMs } }, first: 50, after: after ?? null })
  return { items: data.soundEffects.nodes.map(n => n.soundEffect), next: data.soundEffects.pageInfo.hasNextPage ? data.soundEffects.pageInfo.endCursor : null }
}

/** Picks the effects of a category: takes the best results of each search in turn, skipping ones already imported. */
async function pick(slug, config, taken) {
  const have = [...taken.values()].filter(t => t.category === slug).length
  const want = Math.max(0, config.count - have)
  const picked = []
  const queues = config.terms.map(term => ({ term, items: [], next: undefined, done: false }))
  while (picked.length < want && queues.some(q => !q.done)) {
    for (const q of queues) {
      if (picked.length >= want || q.done) continue
      if (!q.items.length) {
        if (q.next === null) { q.done = true; continue }
        const page = await candidates(q.term, config.minMs, config.maxMs, q.next)
        q.items = page.items; q.next = page.next
        if (!q.items.length) { q.done = true; continue }
      }
      while (q.items.length) {
        const effect = q.items.shift()
        if (taken.has(effect.id)) continue
        taken.set(effect.id, { category: slug })
        picked.push({ ...effect, term: q.term })
        break
      }
    }
  }
  return picked
}

// ---------- run ----------

await connect()
const rows = await existingRows()
const taken = new Map(rows.filter(r => r.source_id).map(r => [r.source_id, { category: r.category }]))
const paths = new Set(rows.map(r => r.storage_path))
let imported = 0, failed = 0
for (const [slug, config] of Object.entries(CATEGORIES)) {
  if (only && !only.includes(slug)) continue
  const picked = await pick(slug, config, taken)
  console.log(`\n== ${slug}: ${picked.length} novos (meta ${config.count})`)
  for (const effect of picked) {
    let path = `${slug}/${fileName(effect.title)}.mp3`
    if (paths.has(path)) path = `${slug}/${fileName(effect.title)} (${effect.id.slice(0, 8)}).mp3`
    paths.add(path)
    const tags = effect.tags.map(t => t.displayName)
    console.log(`  ${(effect.audioFile.durationInMilliseconds / 1000).toFixed(1).padStart(5)} s  ${effect.title}  [${tags.join(', ')}]  ← "${effect.term}"`)
    if (!apply) continue
    try {
      const { soundEffectDownload } = await tool('DownloadSoundEffect', { id: effect.id, options: { fileType: 'MP3' } })
      const file = await fetch(soundEffectDownload.assetUrl)
      if (!file.ok) throw new Error(`download HTTP ${file.status}`)
      const bytes = new Uint8Array(await file.arrayBuffer())
      await upload(path, bytes)
      await insertRow({
        storage_path: path, title: effect.title, category: slug, duration_ms: effect.audioFile.durationInMilliseconds,
        size_bytes: bytes.length, mime: 'audio/mpeg', tags, source: 'epidemic_sound', source_id: effect.id,
      })
      imported++
    } catch (error) {
      failed++
      console.error(`    falhou: ${error.message}`)
    }
  }
}
console.log(apply ? `\nImportados: ${imported}. Falhas: ${failed}.` : '\nModo de teste: nada foi baixado. Use --apply para importar.')
if (failed) process.exitCode = 1
